import uuid
import secrets
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User, UserRole
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.payment import Payment, PaymentStatus, PaymentMethod
from backend.app.repositories.booking_repo import BookingRepository
from backend.app.schemas.payment import PaymentCreateRequest, PaymentResponse


def generate_payment_reference() -> str:
    suffix = ''.join(secrets.choice("0123456789ABCDEF") for _ in range(10))
    return f"DEMO-PAY-{suffix}"


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)

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
        is_admin = current_user and current_user.role == UserRole.ADMIN.value
        if not is_admin:
            if booking.user_id is not None:
                # 1. Account-linked booking: caller MUST be authenticated and own it
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
                # 2. Guest booking: caller MUST provide a valid guest access token
                token_to_verify = req.guest_token or guest_token
                if not token_to_verify or token_to_verify != booking.cancellation_token:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Valid guest booking access token required to process payment",
                    )

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
