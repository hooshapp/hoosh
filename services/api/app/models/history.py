"""One bounded private measurement series. No native app identities are stored."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.managed_auth import auth_users


class HistoryRecord(Base):
    __tablename__ = "history_records"
    __table_args__ = (
        CheckConstraint("revision > 0", name="revision_positive"),
        CheckConstraint("selected_count BETWEEN 1 AND 512", name="selection_range"),
        CheckConstraint("char_length(timezone_id) BETWEEN 1 AND 128", name="timezone_bound"),
        CheckConstraint(
            "jsonb_typeof(days) = 'object' AND "
            "(baseline IS NULL OR jsonb_typeof(baseline) = 'object')",
            name="json_shape",
        ),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    revision: Mapped[int] = mapped_column(nullable=False)
    series_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    timezone_id: Mapped[str] = mapped_column(String(128), nullable=False)
    selected_count: Mapped[int] = mapped_column(nullable=False)
    started_on: Mapped[date] = mapped_column(Date, nullable=False)
    days: Mapped[dict] = mapped_column(JSONB, nullable=False)
    baseline: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
