"""Server-owned templates and explicit, replay-safe decisions; no client reward claims."""

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import AwareDatetime, Field, field_validator

from app.schemas.errors import WireModel


class RecommendationOffer(WireModel):
    offer_id: UUID
    title: str
    activity: str
    duration_minutes: int = Field(ge=5, le=30)
    completion_credits: Literal[50] = 50
    source: Literal["activity_template", "generic_template"]
    timezone_id: str
    expires_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})


class RecommendationView(WireModel):
    user_id: UUID
    policy_version: Literal[1] = 1
    observed_at: AwareDatetime = Field(json_schema_extra={"pattern": "Z$"})
    state: Literal["offered", "accepted", "skipped"]
    offer: RecommendationOffer | None
    accepted_quest_id: UUID | None
    next_offer_at: AwareDatetime | None = Field(json_schema_extra={"pattern": "Z$"})

    @field_validator("observed_at", "next_offer_at")
    @classmethod
    def utc(cls, value: datetime | None):
        return value.astimezone(UTC) if value else None


class RecommendationAction(WireModel):
    offer_id: UUID
    action: Literal["accepted", "skipped"]
