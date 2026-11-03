"""Bound the two product PATCH bodies before JSON/dependency acquisition."""

import json

from starlette.datastructures import Headers
from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import ApiError, error_response
from app.schemas.errors import ErrorCode, ValidationDetails, ValidationField

PATCH_BODY_LIMIT = 16 * 1024


def _unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError
        value[key] = item
    return value


def _reject_constant(value: str):
    raise ValueError


class JsonPatchBodyMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http"
            or scope["method"] != "PATCH"
            or scope["path"].rstrip("/") not in {"/v1/profile", "/v1/settings"}
        ):
            await self.app(scope, receive, send)
            return
        buffer = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(buffer) + len(chunk) > PATCH_BODY_LIMIT:
                response = error_response(Request(scope), ApiError(ErrorCode.REQUEST_TOO_LARGE))
                await response(scope, receive, send)
                return
            buffer.extend(chunk)
            if not message.get("more_body", False):
                break
        body = bytes(buffer)
        media_type = Headers(scope=scope).get("content-type", "").split(";", 1)[0].strip().lower()
        try:
            if not (
                media_type == "application/json"
                or (media_type.startswith("application/") and media_type.endswith("+json"))
            ):
                raise ValueError
            # Validate UTF-8/JSON syntax within the bound. FastAPI then parses the
            # replayed bytes into the public typed body; no private Request mutation.
            if not isinstance(
                json.loads(
                    body.decode("utf-8"),
                    object_pairs_hook=_unique_object,
                    parse_constant=_reject_constant,
                ),
                dict,
            ):
                raise ValueError
        except (ValueError, RecursionError):
            response = error_response(
                Request(scope),
                ApiError(
                    ErrorCode.VALIDATION_ERROR,
                    details=ValidationDetails(
                        fields=[ValidationField(field="body", code="invalid_json")]
                    ),
                ),
            )
            await response(scope, receive, send)
            return
        delivered = False

        async def replay() -> Message:
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": body, "more_body": False}
            return await receive()

        await self.app(scope, replay, send)
