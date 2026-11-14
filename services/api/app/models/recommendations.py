"""One bounded decision receipt per account; offers themselves are transient."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.managed_auth import auth_users


class RecommendationDecision(Base):
    __tablename__ = "recommendation_decisions"
    __table_args__ = (
        CheckConstraint("decision IN ('accepted', 'skipped')", name="decision_choice"),
        CheckConstraint("next_offer_at > decided_at", name="cooldown_positive"),
        CheckConstraint(
            "(decision = 'accepted' AND quest_id IS NOT NULL AND quest_id = offer_id) OR "
            "(decision = 'skipped' AND quest_id IS NULL)",
            name="quest_coherent",
        ),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    offer_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    decision: Mapped[str] = mapped_column(String(8), nullable=False)
    quest_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_offer_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
