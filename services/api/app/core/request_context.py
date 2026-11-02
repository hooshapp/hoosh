"""Pure ASGI context/exception boundaries; preserve cancellation and streaming."""

import asyncio
import json
import logging
import time
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.diagnostics import logger as diagnostics_logger
from app.core.diagnostics import request_id_context
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
        token = request_id_context.set(request_id)
        started_at = time.monotonic()
        status, completion = 0, "aborted"

        async def send_with_context(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                headers = MutableHeaders(scope=message)
                headers["X-Request-ID"] = request_id
                if scope["path"] == "/v1" or scope["path"].startswith("/v1/"):
                    headers["Cache-Control"] = "no-store"
            await send(message)

        try:
            await self.app(scope, receive, send_with_context)
        except asyncio.CancelledError:
            completion = "cancelled"
            raise
        else:
            completion = "completed" if status else "disconnected"
        finally:
            # Values are fixed enums/literals or server-generated, never raw target,
            # query, headers, account identifiers, body, exception or SQL text.
            paths = {"/healthz", "/v1/me", "/v1/profile", "/openapi.json", "/docs"}
            method = (
                scope.get("method", "OTHER")
                if scope.get("method")
                in {"GET", "PATCH", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"}
                else "OTHER"
            )
            code = scope["state"].get("diagnostic_error_code")
            if code not in {item.value for item in ErrorCode}:
                code = "HTTP_ERROR" if status >= 400 else "none"
            try:
                diagnostics_logger.info(
                    json.dumps(
                        {
                            "event": "request",
                            "request_id": request_id,
                            "endpoint": scope["path"] if scope["path"] in paths else "other",
                            "method": method,
                            "status": status,
                            "completion": completion,
                            "duration_ms": round(max(0, time.monotonic() - started_at) * 1000, 3),
                            "error_category": code,
                        },
                        separators=(",", ":"),
                    )
                )
            finally:
                request_id_context.reset(token)


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
