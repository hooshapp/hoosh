"""Safe public exceptions; never serialize request input or exception text."""

from uuid import UUID

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

from app.schemas.errors import (
    ConflictDetails,
    ErrorBody,
    ErrorCode,
    ErrorEnvelope,
    ValidationDetails,
    ValidationField,
)

# Server-owned copy and status. Caller messages, tokens and arbitrary detail cannot enter it.
ERRORS = {
    ErrorCode.AUTH_REQUIRED: (401, "Sign in to continue."),
    ErrorCode.INVALID_TOKEN: (401, "The credentials could not be verified."),
    ErrorCode.TOKEN_EXPIRED: (401, "The access token has expired."),
    ErrorCode.FORBIDDEN: (403, "This operation is not available to this account."),
    ErrorCode.PROFILE_CONFLICT: (409, "Your profile changed. Review the latest version."),
    ErrorCode.REQUEST_TOO_LARGE: (413, "The request body is too large."),
    ErrorCode.VALIDATION_ERROR: (422, "Check the highlighted fields."),
    ErrorCode.AUTH_UNAVAILABLE: (503, "Identity verification is temporarily unavailable."),
    ErrorCode.DEPENDENCY_UNAVAILABLE: (503, "A required service is temporarily unavailable."),
    ErrorCode.INTERNAL_ERROR: (500, "The request could not be completed."),
    ErrorCode.NOT_FOUND: (404, "The requested resource was not found."),
    ErrorCode.METHOD_NOT_ALLOWED: (405, "This method is not allowed."),
    ErrorCode.HTTP_ERROR: (400, "The request could not be completed."),
}


class ApiError(Exception):
    def __init__(
        self, code: ErrorCode, *, details: ValidationDetails | ConflictDetails | None = None
    ) -> None:
        super().__init__(code.value)
        self.code = code
        self.details = details


def error_response(request: Request, error: ApiError, *, status: int | None = None) -> JSONResponse:
    code = error.code
    default_status, message = ERRORS[code]
    envelope = ErrorEnvelope(
        error=ErrorBody(
            code=code,
            message=message,
            retryable=code in (ErrorCode.AUTH_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE),
            request_id=UUID(request.state.request_id),
            details=error.details,
        )
    )
    headers = {"Cache-Control": "no-store"}
    if (status or default_status) == 401:
        headers["WWW-Authenticate"] = "Bearer"
    return JSONResponse(
        envelope.model_dump(mode="json", exclude_none=True),
        status_code=status or default_status,
        headers=headers,
    )


def safe_validation_details(errors: list[dict]) -> ValidationDetails:
    """Whitelist field names/codes, not Pydantic input/msg/ctx or attacker key names."""
    fields = []
    for error in errors[:10]:
        kind = error.get("type", "")
        loc = error.get("loc", ())
        field = loc[1] if len(loc) > 1 and loc[0] == "body" else "body"
        if field not in ("expected_revision", "display_name"):
            field = "body"
        if kind in ("json_invalid", "model_attributes_type", "model_type"):
            field, code = "body", "invalid_json"
        elif kind == "extra_forbidden":
            field, code = "body", "extra_field"
        elif kind == "missing":
            code = "required"
        elif kind in ("greater_than_equal", "greater_than", "less_than_equal", "less_than"):
            code = "out_of_range"
        elif kind == "string_too_long":
            code = "too_long"
        else:
            code = "invalid_type"
        fields.append(ValidationField(field=field, code=code))
    return ValidationDetails(fields=fields or [ValidationField(field="body", code="invalid_type")])


def install_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(ApiError)
    async def handle_api_error(request: Request, error: ApiError) -> JSONResponse:
        return error_response(request, error)

    @application.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, error: RequestValidationError) -> JSONResponse:
        return error_response(
            request,
            ApiError(ErrorCode.VALIDATION_ERROR, details=safe_validation_details(error.errors())),
        )

    @application.exception_handler(HTTPException)
    async def handle_http_error(request: Request, error: HTTPException) -> JSONResponse:
        if error.status_code == 422:
            return error_response(
                request,
                ApiError(
                    ErrorCode.VALIDATION_ERROR,
                    details=ValidationDetails(
                        fields=[ValidationField(field="body", code="invalid_type")]
                    ),
                ),
            )
        code = {
            401: ErrorCode.AUTH_REQUIRED,
            403: ErrorCode.FORBIDDEN,
            404: ErrorCode.NOT_FOUND,
            405: ErrorCode.METHOD_NOT_ALLOWED,
            413: ErrorCode.REQUEST_TOO_LARGE,
            500: ErrorCode.INTERNAL_ERROR,
            503: ErrorCode.DEPENDENCY_UNAVAILABLE,
        }.get(error.status_code, ErrorCode.HTTP_ERROR)
        # Framework routing headers (Allow) are safe; arbitrary exception headers are not echoed.
        response = error_response(request, ApiError(code), status=error.status_code)
        if error.status_code == 405 and error.headers and "Allow" in error.headers:
            response.headers["Allow"] = error.headers["Allow"]
        return response
