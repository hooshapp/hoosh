"""Pure ASGI context/exception boundaries; preserve cancellation and streaming."""

import logging
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import ApiError, error_response
from app.schemas.errors import ErrorCode

logger = logging.getLogger(__name__)


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = str(uuid4())
        scope.setdefault("state", {})["request_id"] = request_id

        async def send_with_context(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Request-ID"] = request_id
                if scope["path"] == "/v1" or scope["path"].startswith("/v1/"):
                    headers["Cache-Control"] = "no-store"
            await send(message)

        await self.app(scope, receive, send_with_context)


class UnexpectedErrorMiddleware:
    """Inside CORS so sanitized 500s retain browser-readable correlation headers."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        started = False

        async def track_start(message: Message) -> None:
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, receive, track_start)
        except Exception:
            # No raw exception/traceback, bearer header, claims, query or body in logs.
            logger.error("Unhandled API exception request_id=%s", scope["state"]["request_id"])
            if started:
                raise  # A begun streaming response cannot be replaced with another response.
            response = error_response(Request(scope), ApiError(ErrorCode.INTERNAL_ERROR))
            await response(scope, receive, send)
