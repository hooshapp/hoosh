"""Shared safe error envelope, including the reserved M2 detail shapes."""

from enum import StrEnum
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, model_validator


class ErrorCode(StrEnum):
    AUTH_REQUIRED = "AUTH_REQUIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    FORBIDDEN = "FORBIDDEN"
    PROFILE_CONFLICT = "PROFILE_CONFLICT"
    REQUEST_TOO_LARGE = "REQUEST_TOO_LARGE"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTH_UNAVAILABLE = "AUTH_UNAVAILABLE"
    DEPENDENCY_UNAVAILABLE = "DEPENDENCY_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    HTTP_ERROR = "HTTP_ERROR"


class WireModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ValidationField(WireModel):
    field: Literal["body", "expected_revision", "display_name"]
    code: Literal[
        "required",
        "invalid_type",
        "blank",
        "too_long",
        "invalid_text",
        "out_of_range",
        "extra_field",
        "invalid_json",
    ]


class ValidationDetails(WireModel):
    fields: list[ValidationField] = Field(min_length=1, max_length=10)


class ConflictDetails(WireModel):
    current_revision: StrictInt = Field(ge=0)


class ErrorBody(WireModel):
    code: ErrorCode
    message: str
    retryable: StrictBool
    request_id: UUID
    details: ValidationDetails | ConflictDetails | None = None

    @model_validator(mode="after")
    def check_details(self) -> Self:
        if self.code == ErrorCode.VALIDATION_ERROR:
            if not isinstance(self.details, ValidationDetails):
                raise ValueError("Validation errors require bounded safe field details")
        elif self.code == ErrorCode.PROFILE_CONFLICT:
            if not isinstance(self.details, ConflictDetails):
                raise ValueError("Conflicts require the current revision")
        elif self.details is not None:
            raise ValueError("General errors have no details")
        expected_retry = self.code in (ErrorCode.AUTH_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE)
        if self.retryable != expected_retry:
            raise ValueError("Retryability must match the shared error code")
        return self


class ErrorEnvelope(WireModel):
    error: ErrorBody
