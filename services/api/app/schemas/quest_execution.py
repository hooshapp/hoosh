"""Explicit scheduling and self-reported outcomes, separate from definition saves."""

from datetime import UTC, date, datetime
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
    effective_from: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    effective_until: AwareDatetime | None = Field(json_schema_extra={"pattern": "Z$"})
    enabled: bool

    @field_validator("effective_from", "effective_until")
    @classmethod
    def utc(cls, value: datetime | None):
        return value.astimezone(UTC) if value is not None else None


class QuestOccurrenceView(WireModel):
    schedule_revision: int
    local_date: date
    starts_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    ends_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    title: str
    state: Literal["upcoming", "active", "ended", "missed", "completed", "cancelled"]
    can_confirm: bool
    credits: int

    @field_validator("starts_at", "ends_at")
    @classmethod
    def utc(cls, value: datetime):
        return value.astimezone(UTC)


class QuestExecutionView(WireModel):
    user_id: UUID
    quest_id: UUID
    observed_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    revision: int
    enabled: bool
    versions: list[QuestScheduleVersionView] = Field(max_length=128)
    occurrences: list[QuestOccurrenceView] = Field(max_length=128 * 31)
    credits: int = Field(ge=0)
    completed_count: int = Field(ge=0)

    @field_validator("observed_at")
    @classmethod
    def utc(cls, value: datetime):
        return value.astimezone(UTC)


class QuestOutcomePut(WireModel):
    state: Literal["completed", "cancelled"]


class QuestOutcomeView(WireModel):
    user_id: UUID
    quest_id: UUID
    schedule_revision: int
    local_date: date
    state: Literal["completed", "cancelled"]
    credits: int
