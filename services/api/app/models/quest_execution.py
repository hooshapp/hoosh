"""Immutable schedule snapshots and unique occurrence outcomes under owner RLS."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKeyConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QuestScheduleVersion(Base):
    __tablename__ = "quest_schedule_versions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "quest_id"],
            ["public.user_quests.user_id", "public.user_quests.quest_id"],
            ondelete="CASCADE",
            name="fk_quest_schedule_versions_quest",
        ),
        CheckConstraint("revision > 0 AND quest_revision > 0", name="positive_revisions"),
        CheckConstraint(
            "effective_until IS NULL OR effective_until >= effective_from", name="ordered_times"
        ),
        CheckConstraint(
            "definition IS NULL OR jsonb_typeof(definition) = 'object'", name="definition_object"
        ),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    quest_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    revision: Mapped[int] = mapped_column(primary_key=True)
    quest_revision: Mapped[int] = mapped_column(nullable=False)
    first_date: Mapped[date] = mapped_column(Date, nullable=False)
    definition: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True), nullable=True)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enabled: Mapped[bool] = mapped_column(nullable=False)


class QuestOccurrenceOutcome(Base):
    __tablename__ = "quest_occurrence_outcomes"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "quest_id", "schedule_revision"],
            [
                "public.quest_schedule_versions.user_id",
                "public.quest_schedule_versions.quest_id",
                "public.quest_schedule_versions.revision",
            ],
            ondelete="CASCADE",
            name="fk_quest_occurrence_outcomes_schedule",
        ),
        CheckConstraint(
            "(state = 'completed' AND credits = 50) OR (state = 'cancelled' AND credits = 0)",
            name="state_credit",
        ),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    quest_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    schedule_revision: Mapped[int] = mapped_column(primary_key=True)
    local_date: Mapped[date] = mapped_column(Date, primary_key=True)
    state: Mapped[str] = mapped_column(nullable=False)
    credits: Mapped[int] = mapped_column(nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("statement_timestamp()")
    )
