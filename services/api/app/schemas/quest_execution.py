"""Explicit scheduling and self-reported outcomes, separate from definition saves."""

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import AwareDatetime, Field, StrictBool, StrictInt, field_validator

from app.schemas.errors import WireModel
from app.schemas.quests import QuestDefinition
from app.schemas.settings import MAX_REVISION


class QuestSchedulePut(WireModel):
    expected_revision: StrictInt = Field(ge=0, le=MAX_REVISION - 1)
    quest_revision: StrictInt = Field(ge=1, le=MAX_REVISION)
    first_date: date
    enabled: StrictBool

    @field_validator("first_date", mode="before")
    @classmethod
    def calendar_date(cls, value):
        if not isinstance(value, str) or len(value) != 10:
            raise ValueError("Use YYYY-MM-DD")
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value or not 2020 <= parsed.year <= 2100:
            raise ValueError("Unsupported date")
        return parsed


class QuestScheduleVersionView(WireModel):
    revision: int
    quest_revision: int
    first_date: date
    definition: QuestDefinition
    effective_from: AwareDatetime
    effective_until: AwareDatetime | None
    enabled: bool


class QuestOccurrenceView(WireModel):
    schedule_revision: int
    local_date: date
    starts_at: AwareDatetime
    ends_at: AwareDatetime
    title: str
    state: Literal["upcoming", "active", "ended", "missed", "completed", "cancelled"]
    can_confirm: bool
    credits: int


class QuestExecutionView(WireModel):
    user_id: UUID
    quest_id: UUID
    observed_at: AwareDatetime
    revision: int
    enabled: bool
    versions: list[QuestScheduleVersionView]
    occurrences: list[QuestOccurrenceView]
    credits: int
    completed_count: int


class QuestOutcomePut(WireModel):
    state: Literal["completed", "cancelled"]


class QuestOutcomeView(WireModel):
    user_id: UUID
    quest_id: UUID
    schedule_revision: int
    local_date: date
    state: Literal["completed", "cancelled"]
    credits: int
