"""M2 read wire shape; absence is explicit and every nullable field is required."""

from datetime import UTC, datetime
from uuid import UUID

from pydantic import AwareDatetime, Field, StrictInt, field_validator

from app.schemas.errors import WireModel


class ProfileView(WireModel):
    user_id: UUID
    display_name: str | None = Field(min_length=1, max_length=80)
    revision: StrictInt = Field(ge=1)
    created_at: AwareDatetime = Field(
        description="Server-created UTC RFC 3339 timestamp with Z.",
        json_schema_extra={"pattern": "Z$"},
    )
    updated_at: AwareDatetime = Field(
        description="Server-updated UTC RFC 3339 timestamp with Z.",
        json_schema_extra={"pattern": "Z$"},
    )

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        # Session TimeZone may differ. Never attach a guessed zone to a naive value.
        return value.astimezone(UTC)


class ProfileResponse(WireModel):
    profile: ProfileView | None
