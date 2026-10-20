from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.payment import PaymentCreateRequest, PaymentResponse
from backend.app.services.payment_service import PaymentService
from backend.app.api.v1.deps import get_optional_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/demo", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_200_OK)
async def process_demo_payment(
    req: PaymentCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    payment = await service.process_demo_payment(req, current_user=current_user)
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
