"""Strict settings wire shapes; drafts never imply installed native policy."""

from copy import deepcopy
from datetime import UTC, datetime
from functools import lru_cache
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import available_timezones

from pydantic import (
    AwareDatetime,
    ConfigDict,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    field_validator,
    model_validator,
)
from pydantic_core import PydanticCustomError

from app.schemas.errors import WireModel

ActivityId = Literal["gym", "reading", "arts_and_crafts", "walking", "music", "cooking"]
Weekday = Annotated[StrictInt, Field(ge=0, le=6)]
LocalTime = Annotated[StrictStr, Field(pattern=r"^(?:[01][0-9]|2[0-3]):[0-5][0-9]$")]
MAX_REVISION = 2_147_483_647


@lru_cache(maxsize=1)
def _timezone_names() -> frozenset[str]:
    # tzdata supplies the catalog on hosts without a system IANA database.
    return frozenset(available_timezones()) - {"localtime", "posixrules"}


class ActivityPreferences(WireModel):
    selected_activity_ids: list[ActivityId] = Field(
        strict=True, max_length=6, json_schema_extra={"uniqueItems": True}
    )
    custom_text: StrictStr | None = Field(
        description=(
            "Null clears custom activity. Otherwise reject invalid text, "
            "strip once, 1–200 code points."
        )
    )

    @field_validator("selected_activity_ids")
    @classmethod
    def unique_choices(cls, value: list[ActivityId]) -> list[ActivityId]:
        if len(value) != len(set(value)):
            raise PydanticCustomError("duplicate", "Repeated activity")
        return value

    @field_validator("custom_text")
    @classmethod
    def canonical_custom_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if any(char == "\x00" or 0xD800 <= ord(char) <= 0xDFFF for char in value):
            raise PydanticCustomError("invalid_text", "Invalid text")
        value = value.strip()
        if not value:
            raise PydanticCustomError("blank", "Activity is blank")
        if len(value) > 200:
            raise PydanticCustomError("too_long", "Activity is too long")
        return value


class DraftHours(WireModel):
    start_local: LocalTime | None
    end_local: LocalTime | None
    next_day: StrictBool

    @model_validator(mode="after")
    def coherent_entered_range(self):
        if self.start_local is not None and self.end_local is not None:
            valid = (
                self.end_local < self.start_local
                if self.next_day
                else self.end_local > self.start_local
            )
            if not valid:
                raise PydanticCustomError("invalid_range", "Inconsistent entered hours")
        return self


class PlanDraft(WireModel):
    weekdays: list[Weekday] = Field(
        strict=True, max_length=7, json_schema_extra={"uniqueItems": True}
    )
    hours: DraftHours | None
    timezone_id: StrictStr | None = Field(max_length=128, pattern=r"^[A-Za-z0-9_+/-]+$")
    # Storage ceilings, not allowance/reset/enforcement rules.
    session_count: StrictInt | None = Field(ge=1, le=1000)
    session_minutes: StrictInt | None = Field(ge=1, le=1440)

    @field_validator("weekdays")
    @classmethod
    def unique_sorted_days(cls, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise PydanticCustomError("duplicate", "Repeated weekday")
        return sorted(value)

    @field_validator("timezone_id")
    @classmethod
    def known_timezone(cls, value: str | None) -> str | None:
        if value is not None and value not in _timezone_names():
            raise PydanticCustomError("invalid_timezone", "Unknown timezone")
        return value


def _patch_schema(schema: dict) -> None:
    # Typed complete branches preserve at-least-one-section in JSON Schema AND
    # generated clients; required-only anyOf branches degrade to unknown in codegen.
    properties = schema.pop("properties")
    schema.pop("required", None)
    schema.pop("additionalProperties", None)
    schema["anyOf"] = [
        {
            "type": "object",
            "properties": deepcopy(properties),
            "required": ["expected_revision", section],
            "additionalProperties": False,
        }
        for section in ("activities", "plan_draft")
    ]


class SettingsPatch(WireModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra=_patch_schema,
    )
    expected_revision: StrictInt = Field(ge=0, le=MAX_REVISION - 1)
    # model_fields_set/exclude_unset distinguish omission from an explicit null.
    activities: ActivityPreferences | None = None
    plan_draft: PlanDraft | None = None

    @model_validator(mode="after")
    def section_required(self):
        if not self.model_fields_set.intersection({"activities", "plan_draft"}):
            raise PydanticCustomError("required", "Supply a settings section")
        return self


class SettingsView(WireModel):
    user_id: UUID
    revision: StrictInt = Field(ge=1, le=MAX_REVISION)
    activities: ActivityPreferences
    plan_draft: PlanDraft | None
    created_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    updated_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)


class SettingsResponse(WireModel):
    settings: SettingsView | None


class SettingsSavedResponse(WireModel):
    settings: SettingsView
