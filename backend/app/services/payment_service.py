import uuid
import secrets
import hmac
import hashlib
import json
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.models.user import User, UserRole
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.payment import Payment, PaymentStatus, PaymentMethod
from backend.app.repositories.booking_repo import BookingRepository
from backend.app.schemas.payment import (
    PaymentCreateRequest,
    PaymentResponse,
    RazorpayOrderCreateRequest,
    RazorpayOrderResponse,
    RazorpayPaymentVerifyRequest,
    RazorpayPaymentVerifyResponse,
)

logger = logging.getLogger("uvicorn.error")


def generate_payment_reference() -> str:
    suffix = ''.join(secrets.choice("0123456789ABCDEF") for _ in range(10))
    return f"DEMO-PAY-{suffix}"


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)

    def _authorize_booking_payment(
        self,
        booking: Booking,
        current_user: Optional[User],
        guest_token: Optional[str],
    ) -> None:
        """
        Enforce strict authorization for booking payment operations (SEC-04).
        - Admins are authorized.
        - Account-linked bookings require authenticated caller owning the booking.
        - Guest bookings require matching cancellation/access token.
        """
        is_admin = current_user and current_user.role == UserRole.ADMIN.value
        if is_admin:
            return

        if booking.user_id is not None:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required to pay for this account-linked booking",
                )
            if booking.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to pay for another user's booking",
                )
        else:
            if not guest_token or guest_token != booking.cancellation_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Valid guest booking access token required to process payment",
                )

    def _map_payment_response(self, p: Payment) -> PaymentResponse:
        return PaymentResponse(
            id=str(p.id),
            booking_id=str(p.booking_id),
            payment_reference=p.payment_reference,
            payment_method=p.payment_method,
            amount=float(p.amount),
            currency=p.currency,
            status=p.status,
            is_demo=p.is_demo,
            gateway_response=p.gateway_response or {},
            created_at=p.created_at.isoformat(),
        )

    async def process_demo_payment(
        self,
        req: PaymentCreateRequest,
        current_user: Optional[User] = None,
        guest_token: Optional[str] = None,
    ) -> PaymentResponse:
        try:
            b_uuid = uuid.UUID(req.booking_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid booking ID format")

        booking = await self.booking_repo.get_by_id(b_uuid)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # SEC-04 Authorization check
        self._authorize_booking_payment(booking, current_user, req.guest_token or guest_token)
        # SEC-04 State transition and idempotency checks

        if booking.status == BookingStatus.CANCELLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay for a cancelled booking",
            )

        if booking.status == BookingStatus.REFUNDED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay for a refunded booking",
            )

        if booking.status == BookingStatus.CONFIRMED.value:
            # Cannot retroactively fail an already confirmed booking
            if req.simulate_failure:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot simulate failure on an already confirmed booking",
                )
            # Idempotent replay: return existing successful payment
            for p in booking.payments:
                if p.status == PaymentStatus.SUCCESS.value:
                    return self._map_payment_response(p)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already confirmed",
            )

        pay_ref = generate_payment_reference()

        if req.simulate_failure:
            payment = Payment(
                booking_id=booking.id,
                payment_reference=pay_ref,
                payment_method=req.payment_method,
                amount=booking.total_amount,
                currency=booking.currency,
                status=PaymentStatus.FAILED.value,
                is_demo=True,
                gateway_response={
                    "simulator": "SS_JOURNEY_DEMO_GATEWAY",
                    "reason": "Card declined (simulated)",
                    "card_last_four": req.card_last_four,
                },
            )
            saved_pay = await self.booking_repo.create_payment(payment)
            await self.booking_repo.update_status(
                booking=booking,
                new_status=BookingStatus.FAILED.value,
                reason="Simulated payment failure",
                changed_by_user_id=current_user.id if current_user else None,
            )
            return self._map_payment_response(saved_pay)

        # Success path
        payment = Payment(
            booking_id=booking.id,
            payment_reference=pay_ref,
            payment_method=req.payment_method,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentStatus.SUCCESS.value,
            is_demo=True,
            gateway_response={
                "simulator": "SS_JOURNEY_DEMO_GATEWAY",
                "message": "Demo transaction approved successfully",
                "card_last_four": req.card_last_four,
            },
        )
        saved_pay = await self.booking_repo.create_payment(payment)

        # Confirm the booking
        await self.booking_repo.update_status(
            booking=booking,
            new_status=BookingStatus.CONFIRMED.value,
            reason=f"Payment verified via demo gateway: {pay_ref}",
            changed_by_user_id=current_user.id if current_user else None,
        )

        return self._map_payment_response(saved_pay)

    async def create_razorpay_order(
        self,
        req: RazorpayOrderCreateRequest,
        current_user: Optional[User] = None,
        guest_token: Optional[str] = None,
    ) -> RazorpayOrderResponse:
        """
        Creates a Razorpay Order for a verified booking.
        - Enforces SEC-04 ownership & authorization.
        - Calculates exact amount strictly from server booking records (never trusting client).
        - Converts INR rupees to paise without floating point issues.
        - Returns public Key ID, Order ID, and safe fields (never Key Secret).
        """
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            )

        try:
            b_uuid = uuid.UUID(req.booking_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking ID format")

        booking = await self.booking_repo.get_by_id(b_uuid)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        # SEC-04 Authorization check
        self._authorize_booking_payment(booking, current_user, req.guest_token or guest_token)

        # State eligibility check
        if booking.status == BookingStatus.CONFIRMED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already confirmed",
            )
        if booking.status == BookingStatus.CANCELLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create payment order for a cancelled booking",
            )
        if booking.status == BookingStatus.REFUNDED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create payment order for a refunded booking",
            )

        # Server-side pricing: Convert INR to paise safely
        amount_paise = int(round(float(booking.total_amount) * 100))
        if amount_paise <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking total amount",
            )

        # Idempotency check: reuse pending order if one exists with Razorpay order ID
        for p in booking.payments:
            if p.payment_method == PaymentMethod.RAZORPAY.value and p.status == PaymentStatus.PENDING.value:
                existing_order_id = (p.gateway_response or {}).get("order_id")
                if existing_order_id:
                    return RazorpayOrderResponse(
                        key_id=settings.RAZORPAY_KEY_ID,
                        order_id=existing_order_id,
                        amount=amount_paise,
                        currency=booking.currency,
                        booking_id=str(booking.id),
                        booking_reference=booking.booking_reference,
                        service_type=booking.service_type,
                        customer_name=booking.guest_name,
                        customer_email=booking.contact_email,
                        customer_phone=booking.contact_phone,
                    )

        # Call Razorpay REST API
        auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        payload = {
            "amount": amount_paise,
            "currency": booking.currency,
            "receipt": booking.booking_reference,
            "notes": {
                "booking_id": str(booking.id),
                "booking_reference": booking.booking_reference,
                "service_type": booking.service_type,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=auth,
                    json=payload,
                )
        except httpx.HTTPError as e:
            logger.error(f"Network error calling Razorpay API: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway connection error. Please try again later.",
            )

        if resp.status_code != 200:
            logger.error(f"Razorpay order creation returned {resp.status_code}: {resp.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway rejected order creation. Please verify booking details and retry.",
            )

        data = resp.json()
        order_id = data.get("id")
        if not order_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway did not return a valid order ID.",
            )

        is_test_mode = "test" in (settings.RAZORPAY_KEY_ID or "").lower()
        payment = Payment(
            booking_id=booking.id,
            payment_reference=f"RZP-ORD-{order_id}",
            payment_method=PaymentMethod.RAZORPAY.value,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentStatus.PENDING.value,
            is_demo=is_test_mode,
            gateway_response={"order_id": order_id, "amount_paise": amount_paise},
        )
        await self.booking_repo.create_payment(payment)

        return RazorpayOrderResponse(
            key_id=settings.RAZORPAY_KEY_ID,
            order_id=order_id,
            amount=amount_paise,
            currency=booking.currency,
            booking_id=str(booking.id),
            booking_reference=booking.booking_reference,
            service_type=booking.service_type,
            customer_name=booking.guest_name,
            customer_email=booking.contact_email,
            customer_phone=booking.contact_phone,
        )

    async def verify_razorpay_payment(
        self,
        req: RazorpayPaymentVerifyRequest,
        current_user: Optional[User] = None,
        guest_token: Optional[str] = None,
    ) -> RazorpayPaymentVerifyResponse:
        """
        Server-side payment verification using HMAC-SHA256 constant-time comparison.
        Prevents client-side spoofing, verifies order ID match, and confirms booking.
        """
        if not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay payment gateway is not configured. Key secret is missing.",
            )

        try:
            b_uuid = uuid.UUID(req.booking_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking ID format")

        booking = await self.booking_repo.get_by_id(b_uuid)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        self._authorize_booking_payment(booking, current_user, req.guest_token or guest_token)

        # Idempotent replay if already confirmed with matching payment
        if booking.status == BookingStatus.CONFIRMED.value:
            for p in booking.payments:
                if (p.gateway_response or {}).get("payment_id") == req.razorpay_payment_id:
                    return RazorpayPaymentVerifyResponse(
                        success=True,
                        payment_id=req.razorpay_payment_id,
                        order_id=req.razorpay_order_id,
                        booking_id=str(booking.id),
                        booking_reference=booking.booking_reference,
                        status="CONFIRMED",
                        amount=float(booking.total_amount),
                        currency=booking.currency,
                        message="Booking is already confirmed with this payment.",
                    )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already confirmed under another payment transaction.",
            )

        if booking.status in (BookingStatus.CANCELLED.value, BookingStatus.REFUNDED.value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify payment for a {booking.status.lower()} booking",
            )

        # Verify order matches our stored payment record
        matched_payment = None
        for p in booking.payments:
            p_order_id = (p.gateway_response or {}).get("order_id")
            if p_order_id == req.razorpay_order_id or p.payment_reference == f"RZP-ORD-{req.razorpay_order_id}":
                matched_payment = p
                break

        if not matched_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order ID mismatch: This order does not match any payment attempt for this booking.",
            )

        # Constant-time signature verification
        msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, req.razorpay_signature):
            matched_payment.status = PaymentStatus.FAILED.value
            matched_payment.gateway_response = {
                **(matched_payment.gateway_response or {}),
                "error": "Invalid Razorpay payment signature",
                "attempted_payment_id": req.razorpay_payment_id,
            }
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature. Verification failed.",
            )

        # Update payment and confirm booking atomically
        matched_payment.status = PaymentStatus.SUCCESS.value
        matched_payment.payment_reference = f"RZP-PAY-{req.razorpay_payment_id}"
        matched_payment.gateway_response = {
            **(matched_payment.gateway_response or {}),
            "payment_id": req.razorpay_payment_id,
            "order_id": req.razorpay_order_id,
            "signature": req.razorpay_signature,
        }

        await self.booking_repo.update_status(
            booking=booking,
            new_status=BookingStatus.CONFIRMED.value,
            reason=f"Payment verified via Razorpay: {req.razorpay_payment_id}",
            changed_by_user_id=current_user.id if current_user else None,
        )

        return RazorpayPaymentVerifyResponse(
            success=True,
            payment_id=req.razorpay_payment_id,
            order_id=req.razorpay_order_id,
            booking_id=str(booking.id),
            booking_reference=booking.booking_reference,
            status="CONFIRMED",
            amount=float(booking.total_amount),
            currency=booking.currency,
            message="Payment verified successfully and booking confirmed.",
        )

    async def process_razorpay_webhook(
        self,
        raw_body: bytes,
        signature: Optional[str],
    ) -> Dict[str, Any]:
        """
        Asynchronous webhook processing for Razorpay events.
        Verifies raw body against HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
        """
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay webhook secret is not configured.",
            )

        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing X-Razorpay-Signature header.",
            )

        expected_sig = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature.",
            )

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON webhook payload")

        event = payload.get("event")
        payment_entity = (payload.get("payload") or {}).get("payment", {}).get("entity", {})
        order_entity = (payload.get("payload") or {}).get("order", {}).get("entity", {})

        order_id = payment_entity.get("order_id") or order_entity.get("id")
        payment_id = payment_entity.get("id")
        notes = payment_entity.get("notes") or order_entity.get("notes") or {}
        booking_id_str = notes.get("booking_id")

        if not booking_id_str:
            if order_id:
                query = select(Payment).where(
                    Payment.payment_reference.in_([f"RZP-ORD-{order_id}", f"RZP-PAY-{payment_id}"])
                )
                res = await self.db.execute(query)
                p = res.scalar_one_or_none()
                if p:
                    booking_id_str = str(p.booking_id)

        if not booking_id_str:
            return {"status": "ignored", "event": event, "reason": "No matching booking found in notes"}

        try:
            b_uuid = uuid.UUID(booking_id_str)
        except ValueError:
            return {"status": "ignored", "event": event, "reason": "Invalid booking ID in webhook"}

        booking = await self.booking_repo.get_by_id(b_uuid)
        if not booking:
            return {"status": "ignored", "event": event, "reason": "Booking not found"}

        if event in ("payment.captured", "order.paid"):
            if booking.status == BookingStatus.CONFIRMED.value:
                return {"status": "idempotent_ok", "event": event, "message": "Booking already confirmed"}

            if booking.status in (BookingStatus.CANCELLED.value, BookingStatus.REFUNDED.value):
                return {"status": "ignored", "event": event, "reason": f"Booking already {booking.status}"}

            matched_payment = None
            for p in booking.payments:
                if (p.gateway_response or {}).get("order_id") == order_id or p.payment_reference == f"RZP-ORD-{order_id}":
                    matched_payment = p
                    break

            if matched_payment:
                matched_payment.status = PaymentStatus.SUCCESS.value
                matched_payment.payment_reference = f"RZP-PAY-{payment_id}" if payment_id else matched_payment.payment_reference
                matched_payment.gateway_response = {
                    **(matched_payment.gateway_response or {}),
                    "webhook_event": event,
                    "payment_id": payment_id,
                    "order_id": order_id,
                }
            else:
                matched_payment = Payment(
                    booking_id=booking.id,
                    payment_reference=f"RZP-PAY-{payment_id}" if payment_id else f"RZP-ORD-{order_id}",
                    payment_method=PaymentMethod.RAZORPAY.value,
                    amount=booking.total_amount,
                    currency=booking.currency,
                    status=PaymentStatus.SUCCESS.value,
                    is_demo=True if "test" in (settings.RAZORPAY_KEY_ID or "").lower() else False,
                    gateway_response={"webhook_event": event, "order_id": order_id, "payment_id": payment_id},
                )
                self.db.add(matched_payment)

            await self.booking_repo.update_status(
                booking=booking,
                new_status=BookingStatus.CONFIRMED.value,
                reason=f"Payment captured via Razorpay webhook ({event}): {payment_id}",
            )
            return {"status": "confirmed", "event": event, "booking_reference": booking.booking_reference}

        elif event == "payment.failed":
            for p in booking.payments:
                if (p.gateway_response or {}).get("order_id") == order_id:
                    p.status = PaymentStatus.FAILED.value
                    p.gateway_response = {
                        **(p.gateway_response or {}),
                        "webhook_event": event,
                        "payment_id": payment_id,
                        "error_description": payment_entity.get("error_description"),
                    }
            return {"status": "recorded_failure", "event": event}

        return {"status": "unhandled_event", "event": event}

    async def create_test_payment_signature(
        self,
        booking_id: str,
        razorpay_order_id: str,
        current_user: Optional[User] = None,
        guest_token: Optional[str] = None,
    ) -> dict:
        """
        Helper strictly for Razorpay Test Mode mobile and sandbox environments.
        Allows mobile sandbox clients to complete test payments without embedding
        the secret key in native bundles. Produces a real HMAC-SHA256 signature
        for the given order, which must subsequently pass standard server verification.
        """
        if not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay payment gateway is not configured. Key secret is missing.",
            )
        is_test_mode = "test" in (settings.RAZORPAY_KEY_ID or "").lower()
        if not is_test_mode:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Test authorization is only permitted in Razorpay Test Mode",
            )

        try:
            b_uuid = uuid.UUID(booking_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking ID format")

        booking = await self.booking_repo.get_by_id(b_uuid)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        self._authorize_booking_payment(booking, current_user, guest_token)

        matched = False
        for p in booking.payments:
            if (p.gateway_response or {}).get("order_id") == razorpay_order_id or p.payment_reference == f"RZP-ORD-{razorpay_order_id}":
                matched = True
                break
        if not matched:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order ID mismatch for this booking")

        fake_pay_id = f"pay_test_{uuid.uuid4().hex[:14]}"
        msg = f"{razorpay_order_id}|{fake_pay_id}".encode("utf-8")
        sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        return {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": fake_pay_id,
            "razorpay_signature": sig,
        }

