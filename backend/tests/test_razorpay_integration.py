import pytest
import hmac
import hashlib
import json
import uuid
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.models.user import User, UserRole
from backend.app.models.booking import Booking, BookingItem, Passenger, BookingStatus, BookingServiceType
from backend.app.models.travel import Flight
from backend.app.models.payment import Payment, PaymentStatus, PaymentMethod
from backend.app.core.security import create_access_token, hash_password


TEST_KEY_ID = "rzp_test_SSJourney123"
TEST_KEY_SECRET = "Secr3tTestK3yForRazorpay12345"
TEST_WEBHOOK_SECRET = "WebhookSecr3tTest12345"


@pytest.fixture(autouse=True)
def setup_razorpay_test_keys():
    orig_key_id = settings.RAZORPAY_KEY_ID
    orig_key_secret = settings.RAZORPAY_KEY_SECRET
    orig_webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    settings.RAZORPAY_KEY_ID = TEST_KEY_ID
    settings.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET
    settings.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET

    yield

    settings.RAZORPAY_KEY_ID = orig_key_id
    settings.RAZORPAY_KEY_SECRET = orig_key_secret
    settings.RAZORPAY_WEBHOOK_SECRET = orig_webhook_secret


@pytest.fixture
def mock_razorpay_client():
    with patch("backend.app.services.payment_service.httpx.AsyncClient") as mock_client_cls:
        mock_instance = MagicMock()

        async def dynamic_post(*args, **kwargs):
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            order_id = f"order_test_{uuid.uuid4().hex[:8]}"
            mock_resp.json.return_value = {
                "id": order_id,
                "entity": "order",
                "amount": kwargs.get("json", {}).get("amount", 531000),
                "amount_paid": 0,
                "amount_due": kwargs.get("json", {}).get("amount", 531000),
                "currency": "INR",
                "receipt": "SSJ-REC-1",
                "status": "created",
            }
            return mock_resp

        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_instance.post = AsyncMock(side_effect=dynamic_post)
        mock_client_cls.return_value = mock_instance
        yield mock_instance



@pytest.fixture
async def sample_pending_booking(db_session: AsyncSession, test_customer: User) -> Booking:
    flight = Flight(
        airline="Air India",
        airline_code="AI",
        flight_number=f"AI-{uuid.uuid4().hex[:4].upper()}",
        aircraft="Airbus A320neo",
        origin_code="DEL",
        origin_name="Indira Gandhi Intl",
        origin_city="Delhi",
        destination_code="BOM",
        destination_name="Chhatrapati Shivaji Intl",
        destination_city="Mumbai",
        departure_time="08:00",
        arrival_time="10:15",
        duration_minutes=135,
        cabin_class="ECONOMY",
        base_fare=4500.0,
        taxes=810.0,
        total_price=5310.0,
        available_seats=10,
        is_active=True,
    )
    db_session.add(flight)
    await db_session.commit()
    await db_session.refresh(flight)

    booking_ref = f"SSJ-RZP-{uuid.uuid4().hex[:6].upper()}"
    booking = Booking(
        booking_reference=booking_ref,
        user_id=test_customer.id,
        service_type=BookingServiceType.FLIGHT.value,
        status=BookingStatus.PENDING.value,
        contact_email=test_customer.email,
        contact_phone="+91 99999 88888",
        base_amount=4500.0,
        taxes_amount=810.0,
        discount_amount=0.0,
        total_amount=5310.0,
        currency="INR",
        cancellation_token=str(uuid.uuid4()),
    )
    db_session.add(booking)
    await db_session.flush()

    item = BookingItem(
        booking_id=booking.id,
        item_type="FLIGHT",
        item_reference_id=str(flight.id),
        title="Air India (DEL -> BOM)",
        quantity=1,
        unit_price=4500.0,
        total_price=5310.0,
    )
    passenger = Passenger(
        booking_id=booking.id,
        title="Mr",
        first_name="Alice",
        last_name="Customer",
        passenger_type="ADULT",
        gender="FEMALE",
    )
    db_session.add(item)
    db_session.add(passenger)
    await db_session.commit()
    await db_session.refresh(booking)
    return booking


@pytest.fixture
async def sample_guest_booking(db_session: AsyncSession) -> Booking:
    guest_token = str(uuid.uuid4())
    booking_ref = f"SSJ-GUEST-{uuid.uuid4().hex[:6].upper()}"
    booking = Booking(
        booking_reference=booking_ref,
        user_id=None,
        guest_name="Guest Voyager",
        service_type=BookingServiceType.HOTEL.value,
        status=BookingStatus.PENDING.value,
        contact_email="guest@example.com",
        contact_phone="+91 98888 11111",
        base_amount=3000.0,
        taxes_amount=540.0,
        discount_amount=0.0,
        total_amount=3540.0,
        currency="INR",
        cancellation_token=guest_token,
    )
    db_session.add(booking)
    await db_session.commit()
    await db_session.refresh(booking)
    return booking


# -----------------------------------------------------------------------------
# 1. Successful Order Creation
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_order_creation_success(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_pending_booking: Booking,
    mock_razorpay_client: MagicMock,
):
    res = await async_client.post(
        "/api/v1/payments/razorpay/order",
        headers=customer_headers,
        json={"booking_id": str(sample_pending_booking.id)},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["order_id"].startswith("order_test_")
    assert data["key_id"] == TEST_KEY_ID
    assert data["amount"] == 531000  # 5310.0 INR -> 531000 paise
    assert data["currency"] == "INR"
    assert data["booking_id"] == str(sample_pending_booking.id)
    assert data["booking_reference"] == sample_pending_booking.booking_reference


# -----------------------------------------------------------------------------
# 2. Missing Credential Configuration -> 503
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_missing_credentials(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_pending_booking: Booking,
):
    settings.RAZORPAY_KEY_ID = None
    settings.RAZORPAY_KEY_SECRET = None

    res = await async_client.post(
        "/api/v1/payments/razorpay/order",
        headers=customer_headers,
        json={"booking_id": str(sample_pending_booking.id)},
    )
    assert res.status_code == 503
    assert "not configured" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 3. Unauthorized Booking Payment (SEC-04)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_unauthorized_payment(
    async_client: AsyncClient,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    other_user = User(
        email=f"other_{uuid.uuid4().hex[:4]}@example.com",
        full_name="Other User",
        phone="+91 97777 66666",
        hashed_password=hash_password("Pass123!"),
        role=UserRole.CUSTOMER.value,
        is_active=True,
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    token = create_access_token(subject=str(other_user.id), role=other_user.role)
    other_headers = {"Authorization": f"Bearer {token}"}

    res = await async_client.post(
        "/api/v1/payments/razorpay/order",
        headers=other_headers,
        json={"booking_id": str(sample_pending_booking.id)},
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 4. Invalid Booking State (Cannot pay for cancelled or refunded booking)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_invalid_booking_state(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    sample_pending_booking.status = BookingStatus.CANCELLED.value
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/payments/razorpay/order",
        headers=customer_headers,
        json={"booking_id": str(sample_pending_booking.id)},
    )
    assert res.status_code == 400
    assert "cancelled" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 5. Server-Enforced Amount & Currency (Client cannot tamper)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_server_enforced_amount(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_pending_booking: Booking,
    mock_razorpay_client: MagicMock,
):
    res = await async_client.post(
        "/api/v1/payments/razorpay/order",
        headers=customer_headers,
        json={"booking_id": str(sample_pending_booking.id)},
    )
    assert res.status_code == 200
    assert res.json()["data"]["amount"] == 531000
    assert res.json()["data"]["currency"] == "INR"

    call_kwargs = mock_razorpay_client.post.call_args.kwargs
    assert call_kwargs["json"]["amount"] == 531000
    assert call_kwargs["json"]["currency"] == "INR"


# -----------------------------------------------------------------------------
# 6. Valid Payment Signature Verification & Confirmation
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_valid_signature_verification(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    order_id = "order_valid_sig_1"
    payment = Payment(
        booking_id=sample_pending_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_pending_booking.total_amount,
        currency="INR",
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id, "amount_paise": 531000},
    )
    db_session.add(payment)
    await db_session.commit()

    payment_id = "pay_test_998877"
    message = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(TEST_KEY_SECRET.encode("utf-8"), message, hashlib.sha256).hexdigest()

    res = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_signature,
        },
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["success"] is True
    assert data["status"] == "CONFIRMED"
    assert data["payment_id"] == payment_id

    await db_session.refresh(sample_pending_booking)
    assert sample_pending_booking.status == BookingStatus.CONFIRMED.value


# -----------------------------------------------------------------------------
# 7. Tampered or Invalid Signature -> 400
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_tampered_signature(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    order_id = "order_tamper_sig_1"
    payment = Payment(
        booking_id=sample_pending_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_pending_booking.total_amount,
        currency="INR",
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id},
    )
    db_session.add(payment)
    await db_session.commit()

    tampered_sig = "deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678"
    res = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_test_tampered",
            "razorpay_signature": tampered_sig,
        },
    )
    assert res.status_code == 400
    assert "invalid payment signature" in res.json()["detail"].lower()

    await db_session.refresh(sample_pending_booking)
    assert sample_pending_booking.status == BookingStatus.PENDING.value


# -----------------------------------------------------------------------------
# 8. Order ID and Booking Mismatch -> 400
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_order_booking_mismatch(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_pending_booking: Booking,
):
    res = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": "order_unknown_foreign_id",
            "razorpay_payment_id": "pay_test_foreign",
            "razorpay_signature": "somesig",
        },
    )
    assert res.status_code == 400
    assert "mismatch" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 9. Duplicate Verification Requests (Idempotency)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_duplicate_verification_idempotency(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    order_id = "order_idempotent_1"
    payment_id = "pay_idempotent_1"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    sig = hmac.new(TEST_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    payment = Payment(
        booking_id=sample_pending_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_pending_booking.total_amount,
        currency="INR",
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id},
    )
    db_session.add(payment)
    await db_session.commit()

    # 1. First verification -> 200 CONFIRMED
    res1 = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        },
    )
    assert res1.status_code == 200
    assert res1.json()["data"]["status"] == "CONFIRMED"

    # 2. Duplicate verification -> 200 idempotent replay
    res2 = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        },
    )
    assert res2.status_code == 200
    assert res2.json()["data"]["status"] == "CONFIRMED"


# -----------------------------------------------------------------------------
# 10. Guest Booking Payment Authorization with Guest Token
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_guest_booking_payment(
    async_client: AsyncClient,
    db_session: AsyncSession,
    sample_guest_booking: Booking,
):
    order_id = "order_guest_1"
    payment = Payment(
        booking_id=sample_guest_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_guest_booking.total_amount,
        currency="INR",
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id},
    )
    db_session.add(payment)
    await db_session.commit()

    payment_id = "pay_guest_1"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    sig = hmac.new(TEST_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # Without token -> 403
    res_no_tok = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        json={
            "booking_id": str(sample_guest_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        },
    )
    assert res_no_tok.status_code == 403

    # With valid guest_token -> 200
    res_tok = await async_client.post(
        f"/api/v1/payments/razorpay/verify?token={sample_guest_booking.cancellation_token}",
        json={
            "booking_id": str(sample_guest_booking.id),
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        },
    )
    assert res_tok.status_code == 200
    assert res_tok.json()["data"]["status"] == "CONFIRMED"


# -----------------------------------------------------------------------------
# 11. Valid Webhook Event Processing
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_webhook_payment_captured(
    async_client: AsyncClient,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    order_id = "order_webhook_cap_1"
    payment_id = "pay_webhook_cap_1"

    payment = Payment(
        booking_id=sample_pending_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_pending_booking.total_amount,
        currency="INR",
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id},
    )
    db_session.add(payment)
    await db_session.commit()

    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "order_id": order_id,
                    "amount": 531000,
                    "currency": "INR",
                    "status": "captured",
                    "notes": {"booking_id": str(sample_pending_booking.id)},
                }
            }
        },
    }
    raw_body = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    res = await async_client.post(
        "/api/v1/payments/razorpay/webhook",
        headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"},
        content=raw_body,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "confirmed"

    await db_session.refresh(sample_pending_booking)
    assert sample_pending_booking.status == BookingStatus.CONFIRMED.value


# -----------------------------------------------------------------------------
# 12. Invalid Webhook Signature -> 400
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_webhook_invalid_signature(async_client: AsyncClient):
    body = b'{"event":"payment.captured"}'
    res = await async_client.post(
        "/api/v1/payments/razorpay/webhook",
        headers={"X-Razorpay-Signature": "invalidsignature123"},
        content=body,
    )
    assert res.status_code == 400
    assert "invalid webhook signature" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 13. Idempotent Duplicate Webhook Processing
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_webhook_duplicate_event(
    async_client: AsyncClient,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    sample_pending_booking.status = BookingStatus.CONFIRMED.value
    await db_session.commit()

    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_dup_event",
                    "order_id": "order_dup_event",
                    "notes": {"booking_id": str(sample_pending_booking.id)},
                }
            }
        },
    }
    raw_body = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    res = await async_client.post(
        "/api/v1/payments/razorpay/webhook",
        headers={"X-Razorpay-Signature": sig},
        content=raw_body,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "idempotent_ok"


# -----------------------------------------------------------------------------
# 14. Existing Demo Payment Backward Compatibility
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_existing_demo_payment_compatibility(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_pending_booking: Booking,
):
    res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={"booking_id": str(sample_pending_booking.id), "payment_method": "UPI"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "SUCCESS"
    assert data["is_demo"] is True


# -----------------------------------------------------------------------------
# 15. Mobile Test Authorize & Verify Roundtrip
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_razorpay_mobile_test_authorize_and_verify_roundtrip(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    sample_pending_booking: Booking,
):
    order_id = "order_mobile_test_rnd"
    payment = Payment(
        booking_id=sample_pending_booking.id,
        payment_reference=f"RZP-ORD-{order_id}",
        payment_method=PaymentMethod.RAZORPAY.value,
        amount=sample_pending_booking.total_amount,
        currency=sample_pending_booking.currency,
        status=PaymentStatus.PENDING.value,
        is_demo=True,
        gateway_response={"order_id": order_id},
    )
    db_session.add(payment)
    await db_session.commit()

    # Step 1: Request test authorization signature for mobile test mode
    auth_res = await async_client.post(
        "/api/v1/payments/razorpay/test-authorize",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": order_id,
        },
    )
    assert auth_res.status_code == 200
    auth_data = auth_res.json()["data"]
    assert auth_data["razorpay_order_id"] == order_id
    assert auth_data["razorpay_payment_id"].startswith("pay_test_")
    assert "razorpay_signature" in auth_data

    # Step 2: Verify the payment with the generated signature
    verify_res = await async_client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_headers,
        json={
            "booking_id": str(sample_pending_booking.id),
            "razorpay_order_id": auth_data["razorpay_order_id"],
            "razorpay_payment_id": auth_data["razorpay_payment_id"],
            "razorpay_signature": auth_data["razorpay_signature"],
        },
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()["data"]
    assert verify_data["success"] is True
    assert verify_data["status"] == "CONFIRMED"

