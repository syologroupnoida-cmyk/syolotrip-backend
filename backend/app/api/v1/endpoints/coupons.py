from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.rate_limit import limiter
from backend.app.models.coupon import Coupon
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.coupon import (
    CouponValidateRequest,
    CouponValidateResponse,
    CouponResponse,
)

router = APIRouter(prefix="/coupons", tags=["Coupons & Offers"])


@router.post("/validate", response_model=ApiResponse[CouponValidateResponse])
@limiter.limit(settings.RATE_LIMIT_COUPON_VALIDATE)
async def validate_coupon(
    request: Request,
    req: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
):
    code = req.code.strip().upper()
    res = await db.execute(select(Coupon).where(func.upper(Coupon.code) == code))
    coupon = res.scalar_one_or_none()

    if not coupon:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type="NONE",
                discount_value=0.0,
                message=f"Coupon code '{code}' is invalid.",
            ),
            message="Invalid coupon code",
        )

    if not coupon.is_active:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Coupon code '{code}' is currently inactive.",
            ),
            message="Coupon is inactive",
        )

    now_utc = datetime.now(timezone.utc)
    if coupon.valid_from and coupon.valid_from > now_utc:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Coupon '{code}' is not yet valid.",
            ),
            message="Coupon not yet active",
        )

    if coupon.valid_until and coupon.valid_until < now_utc:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Coupon '{code}' has expired.",
            ),
            message="Coupon has expired",
        )

    if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Coupon '{code}' has reached its maximum redemption limit.",
            ),
            message="Usage limit reached",
        )

    # Check service restriction
    service = (req.service_type or "ALL").upper().strip()
    if coupon.service_type != "ALL" and coupon.service_type.upper() != service:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Coupon '{code}' is valid only for {coupon.service_type} bookings.",
            ),
            message="Service restriction mismatch",
        )

    # Check minimum order amount
    min_order = float(coupon.min_order_amount)
    if req.order_amount < min_order:
        return ApiResponse(
            success=False,
            data=CouponValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                final_amount=req.order_amount,
                discount_type=coupon.discount_type,
                discount_value=float(coupon.discount_value),
                message=f"Minimum booking amount of ₹{min_order:,.0f} required for coupon '{code}'.",
            ),
            message="Minimum order amount not met",
        )

    # Calculate real discount
    if coupon.discount_type.upper() == "PERCENTAGE":
        raw_disc = req.order_amount * (float(coupon.discount_value) / 100.0)
        if coupon.max_discount_amount:
            raw_disc = min(raw_disc, float(coupon.max_discount_amount))
        discount_amount = round(raw_disc, 2)
    else:  # FLAT
        discount_amount = min(req.order_amount, round(float(coupon.discount_value), 2))

    final_amount = max(0.0, round(req.order_amount - discount_amount, 2))

    return ApiResponse(
        success=True,
        data=CouponValidateResponse(
            valid=True,
            code=coupon.code,
            discount_amount=discount_amount,
            final_amount=final_amount,
            discount_type=coupon.discount_type,
            discount_value=float(coupon.discount_value),
            message=f"Coupon '{coupon.code}' applied successfully! Savings: ₹{discount_amount:,.0f}",
        ),
        message="Coupon applied successfully",
    )


@router.get("/active", response_model=ApiResponse[List[CouponResponse]])
async def list_active_coupons(
    service_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Coupon).where(Coupon.is_active.is_(True))
    if service_type and service_type.upper() != "ALL":
        query = query.where(Coupon.service_type.in_(["ALL", service_type.upper()]))

    query = query.order_by(Coupon.created_at.desc())
    res = await db.execute(query)
    coupons = res.scalars().all()

    return ApiResponse(
        success=True,
        data=[
            CouponResponse(
                id=str(c.id),
                code=c.code,
                discount_type=c.discount_type,
                discount_value=float(c.discount_value),
                max_discount_amount=float(c.max_discount_amount) if c.max_discount_amount else None,
                min_order_amount=float(c.min_order_amount),
                service_type=c.service_type,
                description=c.description,
                is_active=c.is_active,
                times_used=c.times_used,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
            for c in coupons
        ],
    )
