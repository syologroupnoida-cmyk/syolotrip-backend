import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    ForeignKey,
    JSON,
    Index,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class AuditLog(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g. "CREATE_LISTING", "CANCEL_BOOKING"
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)          # e.g. "FLIGHT", "BOOKING"
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_action_time", "action", "created_at"),
    )
