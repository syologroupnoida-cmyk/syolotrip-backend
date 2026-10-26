from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.payment import (
    PaymentCreateRequest,
    PaymentResponse,
    RazorpayOrderCreateRequest,
    RazorpayOrderResponse,
    RazorpayPaymentVerifyRequest,
    RazorpayPaymentVerifyResponse,
    RazorpayTestAuthorizeRequest,
)
from backend.app.services.payment_service import PaymentService
from backend.app.api.v1.deps import get_optional_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/demo", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_200_OK)
async def process_demo_payment(
    req: PaymentCreateRequest,
    token: Optional[str] = Query(None, description="Guest booking access token"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    guest_token = req.guest_token or token or x_booking_token
    payment = await service.process_demo_payment(req, current_user=current_user, guest_token=guest_token)
    await db.commit()
    msg = (
        "Demo payment approved and booking confirmed."
        if payment.status == "SUCCESS"
        else "Demo payment failed as requested (simulation)."
    )
    return ApiResponse(
        success=payment.status == "SUCCESS",
        data=payment,
        message=msg,
    )


@router.post("/razorpay/order", response_model=ApiResponse[RazorpayOrderResponse], status_code=status.HTTP_200_OK)
async def create_razorpay_order(
    req: RazorpayOrderCreateRequest,
    token: Optional[str] = Query(None, description="Guest booking access token"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a Razorpay Order for a pending booking.
    Calculates exact amount on server and returns the public Key ID and Order ID for client checkout.
    """
    service = PaymentService(db)
    guest_token = req.guest_token or token or x_booking_token
    order = await service.create_razorpay_order(req, current_user=current_user, guest_token=guest_token)
    await db.commit()
    return ApiResponse(
        success=True,
        data=order,
        message="Razorpay order created successfully.",
    )


@router.post("/razorpay/verify", response_model=ApiResponse[RazorpayPaymentVerifyResponse], status_code=status.HTTP_200_OK)
async def verify_razorpay_payment(
    req: RazorpayPaymentVerifyRequest,
    token: Optional[str] = Query(None, description="Guest booking access token"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies Razorpay payment signature via server-side HMAC-SHA256 constant-time comparison.
    Transitions booking to CONFIRMED upon verified authenticity.
    """
    service = PaymentService(db)
    guest_token = req.guest_token or token or x_booking_token
    result = await service.verify_razorpay_payment(req, current_user=current_user, guest_token=guest_token)
    await db.commit()
    return ApiResponse(
        success=result.success,
        data=result,
        message=result.message,
    )


@router.post("/razorpay/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Asynchronous webhook endpoint for Razorpay payment notifications.
    Validates signature on raw request body against RAZORPAY_WEBHOOK_SECRET.
    """
    body_bytes = await request.body()
    service = PaymentService(db)
    result = await service.process_razorpay_webhook(body_bytes, x_razorpay_signature)
    await db.commit()
    return ApiResponse(
        success=True,
        data=result,
        message="Webhook processed successfully.",
    )


@router.post("/razorpay/test-authorize", status_code=status.HTTP_200_OK)
async def razorpay_test_authorize(
    req: RazorpayTestAuthorizeRequest,
    token: Optional[str] = Query(None, description="Guest booking access token"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Guest-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Test Mode helper strictly for mobile sandbox environments.
    Enables mobile test checkouts without placing the secret key in client bundles.
    Produces valid signature that must subsequently be verified via /razorpay/verify.
    """
    service = PaymentService(db)
    guest_token = req.guest_token or token or x_booking_token
    result = await service.create_test_payment_signature(
        booking_id=req.booking_id,
        razorpay_order_id=req.razorpay_order_id,
        current_user=current_user,
        guest_token=guest_token,
    )
    return ApiResponse(
        success=True,
        data=result,
        message="Test payment signature generated for mobile test checkout.",
    )

