import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Numeric,
    Float,
    ForeignKey,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class WishlistItem(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "wishlist_items"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="HOTEL",
    )
    location: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    price: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0.0,
    )
    rating: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    image: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    badge: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User", backref="wishlist_items")

    __table_args__ = (
        UniqueConstraint("user_id", "item_key", name="uq_user_wishlist_item"),
        Index("ix_wishlist_user_created", "user_id", "created_at"),
    )
