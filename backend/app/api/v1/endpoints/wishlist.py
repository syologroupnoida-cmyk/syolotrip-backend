from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.wishlist import (
    WishlistItemCreate,
    WishlistItemResponse,
    WishlistSyncRequest,
    WishlistResponse,
)
from backend.app.services.wishlist_service import WishlistService
from backend.app.api.v1.deps import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=ApiResponse[WishlistResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = WishlistService(db)
    res = await service.get_user_wishlist(current_user)
    return ApiResponse(success=True, data=res)


@router.post("", response_model=ApiResponse[WishlistItemResponse], status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    req: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = WishlistService(db)
    item = await service.add_item(current_user, req)
    await db.commit()
    return ApiResponse(success=True, data=item, message="Item saved to wishlist")


@router.delete("/{item_key}", response_model=ApiResponse[dict])
async def remove_from_wishlist(
    item_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = WishlistService(db)
    removed = await service.remove_item(current_user, item_key)
    await db.commit()
    return ApiResponse(
        success=True,
        data={"removed": removed, "item_key": item_key},
        message="Item removed from wishlist" if removed else "Item was not in wishlist",
    )


@router.delete("", response_model=ApiResponse[dict])
async def clear_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = WishlistService(db)
    count = await service.clear_wishlist(current_user)
    await db.commit()
    return ApiResponse(
        success=True,
        data={"cleared_count": count},
        message="Wishlist cleared successfully",
    )


@router.post("/sync", response_model=ApiResponse[WishlistResponse])
async def sync_wishlist(
    req: WishlistSyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = WishlistService(db)
    res = await service.sync_guest_wishlist(current_user, req)
    await db.commit()
    return ApiResponse(
        success=True,
        data=res,
        message=f"Synced {len(req.items)} item(s) to account wishlist",
    )
