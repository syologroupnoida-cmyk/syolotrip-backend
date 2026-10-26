import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.wishlist import WishlistItem
from backend.app.models.user import User
from backend.app.repositories.wishlist_repo import WishlistRepository
from backend.app.schemas.wishlist import (
    WishlistItemCreate,
    WishlistItemResponse,
    WishlistSyncRequest,
    WishlistResponse,
)


class WishlistService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WishlistRepository(db)

    def _map_item(self, item: WishlistItem) -> WishlistItemResponse:
        return WishlistItemResponse(
            id=item.item_key,
            title=item.title,
            category=item.category,
            location=item.location,
            price=float(item.price),
            rating=item.rating,
            image=item.image,
            badge=item.badge,
            added_at=item.created_at.isoformat() if item.created_at else "",
        )

    async def get_user_wishlist(self, user: User) -> WishlistResponse:
        items = await self.repo.list_by_user(user.id)
        mapped = [self._map_item(i) for i in items]
        return WishlistResponse(items=mapped, count=len(mapped))

    async def add_item(self, user: User, req: WishlistItemCreate) -> WishlistItemResponse:
        clean_key = req.id.strip()
        existing = await self.repo.get_item(user.id, clean_key)
        if existing:
            return self._map_item(existing)

        new_item = WishlistItem(
            user_id=user.id,
            item_key=clean_key,
            title=req.title.strip(),
            category=req.category.strip().upper(),
            location=req.location.strip(),
            price=req.price,
            rating=req.rating,
            image=req.image.strip(),
            badge=req.badge.strip() if req.badge else None,
        )
        saved = await self.repo.create_item(new_item)
        return self._map_item(saved)

    async def remove_item(self, user: User, item_key: str) -> bool:
        return await self.repo.delete_item(user.id, item_key)

    async def clear_wishlist(self, user: User) -> int:
        return await self.repo.clear_user_wishlist(user.id)

    async def sync_guest_wishlist(self, user: User, req: WishlistSyncRequest) -> WishlistResponse:
        """Safely merges guest items into the user's database wishlist without duplicates."""
        for item in req.items:
            clean_key = item.id.strip()
            if not clean_key:
                continue
            existing = await self.repo.get_item(user.id, clean_key)
            if not existing:
                new_item = WishlistItem(
                    user_id=user.id,
                    item_key=clean_key,
                    title=item.title.strip(),
                    category=item.category.strip().upper(),
                    location=item.location.strip(),
                    price=item.price,
                    rating=item.rating,
                    image=item.image.strip(),
                    badge=item.badge.strip() if item.badge else None,
                )
                await self.repo.create_item(new_item)

        return await self.get_user_wishlist(user)
