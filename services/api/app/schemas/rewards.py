"""Strict content-free native receipts and server-priced Feed commands."""

from datetime import UTC, date, datetime
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AwareDatetime, Field, StrictBool, StrictInt, field_validator, model_validator

from app.schemas.errors import WireModel


class RewardSignal(WireModel):
    event_id: UUID
    sequence: StrictInt = Field(ge=1, le=9007199254740991)
    occurred_at: AwareDatetime
    kind: Literal["quit", "allowance", "day_closed", "nudge_skipped"]
    encounter_id: UUID | None
    context: Literal["initial", "expired", "mid_session", "notification_accept"] | None
    day: date
    exhausted: StrictBool | None
    covered: StrictBool | None

    @field_validator("occurred_at")
    @classmethod
    def utc(cls, value: datetime):
        return value.astimezone(UTC)

    @model_validator(mode="after")
    def shape(self):
        if self.kind == "quit":
            valid = self.encounter_id is not None and self.context is not None
            valid = valid and self.exhausted is None and self.covered is None
        elif self.kind == "nudge_skipped":
            valid = self.encounter_id is not None and self.context is None
            valid = valid and self.exhausted is None and self.covered is None
        elif self.kind == "allowance":
            valid = self.exhausted is not None and self.context is None
            valid = valid and self.encounter_id is None and self.covered is None
        else:
            valid = self.covered is not None and self.exhausted is not None
            valid = valid and self.encounter_id is None and self.context is None
        if not valid:
            raise ValueError("Signal fields do not match kind")
        return self


class RewardBatch(WireModel):
    installation_id: UUID
    timezone_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_+/-]+$")
    discarded: StrictInt = Field(ge=0, le=9007199254740991)
    acknowledged: StrictInt = Field(default=0, ge=0, le=9007199254740991)
    events: list[RewardSignal] = Field(min_length=1, max_length=32)

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
        if self.events[0].sequence <= self.acknowledged:
            raise ValueError("Acknowledged prefix cannot include queued events")
        if len({e.event_id for e in self.events}) != len(self.events) or any(
            b.sequence <= a.sequence or b.occurred_at < a.occurred_at
            for a, b in zip(self.events, self.events[1:], strict=False)
        ):
            raise ValueError("Events must have unique IDs and increasing sequences")
        return self


class RewardView(WireModel):
    user_id: UUID
    revision: int
    balance: int
    health: int
    artwork: Literal["needsCare", "feelingLow", "doingOkay", "happy"]
    feed_cost: Literal[10] = 10
    feed_health: Literal[20] = 20
    streak_days: int | None
    recent_week_complete: bool
    observed_at: AwareDatetime
    health_warning_at: AwareDatetime | None = None
    policy_version: Literal[2] = 2


class FeedPut(WireModel):
    expected_revision: StrictInt = Field(ge=0, le=2147483646)


class FeedResult(WireModel):
    request_id: UUID
    charged_credits: Literal[10, 20] = 10
    health_added: int
    wallet: RewardView


class RewardBatchResult(WireModel):
    installation_id: UUID
    accepted_sequence: int
    wallet: RewardView


class FeedReceipt(WireModel):
    request_id: UUID
    recorded: bool
    health_added: int | None
    wallet: RewardView
