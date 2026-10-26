import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from backend.app.models.wishlist import WishlistItem


class WishlistRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_user(self, user_id: uuid.UUID) -> List[WishlistItem]:
        query = (
            select(WishlistItem)
            .where(WishlistItem.user_id == user_id)
            .order_by(WishlistItem.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_item(self, user_id: uuid.UUID, item_key: str) -> Optional[WishlistItem]:
        query = select(WishlistItem).where(
            and_(
                WishlistItem.user_id == user_id,
                WishlistItem.item_key == item_key.strip(),
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_item(self, item: WishlistItem) -> WishlistItem:
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete_item(self, user_id: uuid.UUID, item_key: str) -> bool:
        stmt = delete(WishlistItem).where(
            and_(
                WishlistItem.user_id == user_id,
                WishlistItem.item_key == item_key.strip(),
            )
        )
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    async def clear_user_wishlist(self, user_id: uuid.UUID) -> int:
        stmt = delete(WishlistItem).where(WishlistItem.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.rowcount
