"""Bounded server-owned telemetry; never accept arbitrary diagnostic attributes."""

import json
import logging
from contextvars import ContextVar

# Inherits the normal Uvicorn error logger/INFO configuration, not raw access logs.
logger = logging.getLogger("uvicorn.error.disconnect")
request_id_context: ContextVar[str | None] = ContextVar("disconnect_request_id", default=None)
OUTCOMES = {
    "jwks": {
        "cache_hit",
        "negative_hit",
        "refresh_suppressed",
        "fetch_started",
        "fetch_succeeded",
        "fetch_failed",
        "fetch_cancelled",
        "budget_exceeded",
        "closed",
    },
    "database": {
        "unconfigured",
        "closed",
        "pool_timeout",
        "authentication",
        "query_cancelled",
        "lock_unavailable",
        "connection_failure",
        "disconnected",
        "integrity_error",
        "query_error",
    },
}


def dependency_event(dependency: str, outcome: str) -> None:
    request_id = request_id_context.get()
    if request_id is not None and outcome in OUTCOMES.get(dependency, ()):
        logger.info(
            json.dumps(
                {
                    "event": "dependency",
                    "request_id": request_id,
                    "dependency": dependency,
                    "outcome": outcome,
                },
                separators=(",", ":"),
            )
        )
