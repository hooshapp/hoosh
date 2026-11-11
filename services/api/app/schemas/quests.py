"""Saved quest definitions only. No occurrence, restriction or reward state."""

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    AwareDatetime,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    field_validator,
    model_validator,
)
from pydantic_core import PydanticCustomError

from app.schemas.errors import WireModel
from app.schemas.settings import MAX_REVISION, LocalTime, Weekday, _timezone_names


class QuestDefinition(WireModel):
    title: StrictStr
    activity: StrictStr
    start_local: LocalTime
    end_local: LocalTime
    next_day: StrictBool
    repeat: Literal["none", "daily", "weekly"]
    weekdays: list[Weekday] = Field(strict=True, max_length=7)
    timezone_id: StrictStr = Field(max_length=128, pattern=r"^[A-Za-z0-9_+/-]+$")

    @field_validator("title", "activity")
    @classmethod
    def bounded_text(cls, value: str, info) -> str:
        if any(c == "\x00" or 0xD800 <= ord(c) <= 0xDFFF for c in value):
            raise PydanticCustomError("invalid_text", "Invalid text")
        value = value.strip()
        if not value:
            raise PydanticCustomError("blank", "Blank text")
        if len(value) > (120 if info.field_name == "title" else 200):
            raise PydanticCustomError("too_long", "Text too long")
        return value

    @field_validator("timezone_id")
    @classmethod
    def known_zone(cls, value: str) -> str:
        if value not in _timezone_names():
            raise PydanticCustomError("invalid_timezone", "Unknown timezone")
        return value

    @field_validator("weekdays")
    @classmethod
    def ordered_days(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value):
            raise PydanticCustomError("duplicate", "Duplicate day")
        return sorted(value)

    @model_validator(mode="after")
    def coherent(self):
        if not (
            self.end_local < self.start_local
            if self.next_day
            else self.end_local > self.start_local
        ):
            raise PydanticCustomError("invalid_range", "Invalid time range")
        if (self.repeat == "weekly") != bool(self.weekdays):
            raise PydanticCustomError("invalid_range", "Days only for weekly repeat")
        return self


class QuestPut(WireModel):
    expected_revision: StrictInt = Field(ge=0, le=MAX_REVISION - 1)
    definition: QuestDefinition


class QuestDelete(WireModel):
    expected_revision: StrictInt = Field(ge=1, le=MAX_REVISION - 1)


class QuestView(WireModel):
    user_id: UUID
    quest_id: UUID
    revision: StrictInt = Field(ge=1, le=MAX_REVISION)
    definition: QuestDefinition
    created_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    updated_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)


class QuestResponse(WireModel):
    quest: QuestView | None
    revision: StrictInt = Field(ge=0, le=MAX_REVISION)


class QuestSavedResponse(WireModel):
    quest: QuestView


class QuestPage(WireModel):
    quests: list[QuestView] = Field(max_length=100)
    next_cursor: UUID | None


class QuestDeletedResponse(WireModel):
    quest_id: UUID
    revision: StrictInt = Field(ge=0, le=MAX_REVISION)
