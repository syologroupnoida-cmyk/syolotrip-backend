from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class PaymentCreateRequest(BaseModel):
    booking_id: str
    payment_method: str = "DEMO_SIMULATION"  # CARD, UPI, APPLEPAY, DEMO_SIMULATION
    simulate_failure: bool = False
    card_last_four: Optional[str] = "4242"


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
