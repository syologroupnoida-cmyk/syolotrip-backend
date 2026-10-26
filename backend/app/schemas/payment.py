from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class PaymentCreateRequest(BaseModel):
    booking_id: str
    payment_method: str = "DEMO_SIMULATION"  # CARD, UPI, APPLEPAY, DEMO_SIMULATION
    simulate_failure: bool = False
    card_last_four: Optional[str] = "4242"
    guest_token: Optional[str] = Field(None, description="Access token for authorizing payment on guest bookings")


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    payment_reference: str
    payment_method: str
    amount: float
    currency: str
    status: str
    is_demo: bool
    gateway_response: Optional[Dict[str, Any]] = None
    created_at: str

    model_config = {"from_attributes": True}


class RazorpayOrderCreateRequest(BaseModel):
    booking_id: str
    guest_token: Optional[str] = Field(None, description="Access token for authorizing payment on guest bookings")


class RazorpayOrderResponse(BaseModel):
    key_id: str
    order_id: str
    amount: int  # Amount in paise (integer)
    currency: str
    booking_id: str
    booking_reference: str
    service_type: str
    customer_name: Optional[str] = None
    customer_email: str
    customer_phone: str


class RazorpayPaymentVerifyRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    guest_token: Optional[str] = Field(None, description="Access token for authorizing payment on guest bookings")


class RazorpayPaymentVerifyResponse(BaseModel):
    success: bool
    payment_id: str
    order_id: str
    booking_id: str
    booking_reference: str
    status: str
    amount: float
    currency: str
    message: str


class RazorpayTestAuthorizeRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    guest_token: Optional[str] = Field(None, description="Guest token for unauthenticated bookings")

