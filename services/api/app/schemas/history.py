"""Versioned aggregate-only usage evidence; values are never accepted as rewards."""

from datetime import date
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AwareDatetime, Field, StrictInt, field_validator, model_validator

from app.schemas.errors import WireModel


class HistoryDay(WireModel):
    day: date
    usage_ms: StrictInt | None = Field(ge=0, le=90000000)
    coverage: Literal["reported", "missing", "capped", "interrupted"]

    @model_validator(mode="after")
    def coherent(self):
        if (self.coverage == "reported") != (self.usage_ms is not None):
            raise ValueError("Only reported coverage has a duration")
        return self


class HistoryPut(WireModel):
    expected_revision: StrictInt = Field(ge=0, le=2147483646)
    series_id: UUID
    timezone_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_+/-]+$")
    selected_count: StrictInt = Field(ge=1, le=512)
    started_on: date
    source: Literal["android_usage_events_v1"]
    days: list[HistoryDay] = Field(max_length=56)

    @field_validator("timezone_id")
    @classmethod
    def zone(cls, value):
        try:
            ZoneInfo(value)
        except (ValueError, ZoneInfoNotFoundError) as error:
            raise ValueError("Unsupported timezone") from error
        return value

    @model_validator(mode="after")
    def ordered(self):
        if any(b.day <= a.day for a, b in zip(self.days, self.days[1:], strict=False)):
            raise ValueError("Days must be unique and ordered")
        return self


class HistoryWindow(WireModel):
    starts_on: date
    ends_before: date
    expected_days: int
    reported_days: int
    usage_ms: int | None
    baseline_ms: int | None
    saved_ms: int | None
    reduction_percent: float | None
    eligible: bool
    reason: Literal["ready", "collecting_baseline", "baseline_overlap", "incomplete"]
    turn_offs: dict[Literal["initial", "expired", "mid_session"], int]


class HistoryView(WireModel):
    user_id: UUID
    revision: int
    series_id: UUID | None
    timezone_id: str | None
    selected_count: int | None
    started_on: date | None
    source: Literal["android_usage_events_v1"]
    policy_version: Literal[1] = 1
    observed_at: AwareDatetime
    baseline_starts_on: date | None
    baseline_ends_before: date | None
    baseline_reported_days: int
    week: HistoryWindow
    month: HistoryWindow
