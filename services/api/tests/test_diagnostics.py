import asyncio
import json
import logging
from uuid import UUID

import httpx2
from fastapi.testclient import TestClient

from app.core.diagnostics import dependency_event, request_id_context
from app.core.jwks import JwksResolver
from app.core.request_context import RequestContextMiddleware
from tests.auth.support import LocalSigner, settings
from tests.support.http import authenticated_app

LOGGER = "uvicorn.error.disconnect"


def records(caplog):
    return [json.loads(record.getMessage()) for record in caplog.records if record.name == LOGGER]


def test_request_diagnostics_are_correlated_bounded_and_never_raw_inputs(monkeypatch, caplog):
    caplog.set_level(logging.INFO, logger=LOGGER)
    signer = LocalSigner()
    app, auth = authenticated_app(
        monkeypatch, settings(), signer=signer, claims={"email": "private-email@example.invalid"}
    )
    with TestClient(app) as client:
        first = client.get(
            "/v1/me?secret=private-query", headers=auth | {"X-Request-ID": "private-caller-id"}
        )
        second = client.get("/v1/me", headers=auth)
        failure = client.patch(
            "/v1/profile",
            headers=auth,
            json={"expected_revision": 0, "display_name": "private-display-name"},
        )
        unknown = client.request("PRIVATE-METHOD", "/private-path?secret=private-query")
    observed = records(caplog)
    assert [
        r["outcome"] for r in observed if r["event"] == "dependency" and r["dependency"] == "jwks"
    ][:3] == ["fetch_started", "fetch_succeeded", "cache_hit"]
    for response in (first, second, failure, unknown):
        request_id = response.headers["X-Request-ID"]
        row = next(r for r in observed if r["event"] == "request" and r["request_id"] == request_id)
        assert str(UUID(request_id)) == request_id and row["status"] == response.status_code
        assert row["duration_ms"] >= 0 and row["completion"] == "completed"
    row = next(r for r in observed if r["request_id"] == unknown.headers["X-Request-ID"])
    assert row["endpoint"] == "other" and row["method"] == "OTHER"
    db = [r for r in observed if r.get("dependency") == "database"]
    assert db == [
        {
            "event": "dependency",
            "request_id": failure.headers["X-Request-ID"],
            "dependency": "database",
            "outcome": "unconfigured",
        }
    ]
    encoded = json.dumps(observed)
    for private in (
        "private-email",
        "private-display-name",
        "private-query",
        "private-path",
        "private-caller-id",
        auth["Authorization"],
    ):
        assert private not in encoded
    assert request_id_context.get() is None


def test_jwks_failure_diagnostic_never_contains_provider_exception(monkeypatch, caplog):
    caplog.set_level(logging.INFO, logger=LOGGER)
    app, auth = authenticated_app(monkeypatch, settings())

    def factory(config):
        def unavailable(request):
            raise httpx2.ConnectError("private-provider-url-and-token", request=request)

        return JwksResolver(
            config, client=httpx2.AsyncClient(transport=httpx2.MockTransport(unavailable))
        )

    monkeypatch.setattr("app.runtime.JwksResolver", factory)
    with TestClient(app) as client:
        response = client.get("/v1/me", headers=auth)
    assert response.status_code == 503
    assert any(r.get("outcome") == "fetch_failed" for r in records(caplog))
    assert "private-provider" not in json.dumps(records(caplog)) + response.text


def test_diagnostic_context_isolated_across_tasks_and_cancellation(caplog):
    caplog.set_level(logging.INFO, logger=LOGGER)

    async def run():
        seen = []

        async def endpoint(scope, receive, send):
            before = request_id_context.get()
            await asyncio.sleep(0)
            assert request_id_context.get() == before
            seen.append(before)
            if scope["path"] == "/cancel":
                raise asyncio.CancelledError
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b""})

        async def request(path):
            async def noop(*args):
                pass

            try:
                await RequestContextMiddleware(endpoint)(
                    {"type": "http", "method": "GET", "path": path}, noop, noop
                )
            except asyncio.CancelledError:
                pass
            assert request_id_context.get() is None

        await asyncio.gather(request("/v1/me"), request("/cancel"))
        assert len(set(seen)) == 2

    asyncio.run(run())
    assert any(r.get("completion") == "cancelled" and r["status"] == 0 for r in records(caplog))


def test_unknown_dependency_attributes_are_dropped(caplog):
    caplog.set_level(logging.INFO, logger=LOGGER)
    token = request_id_context.set("a46e48ad-c742-4e18-b57d-2c9a56544945")
    try:
        dependency_event("private-credential", "cache_hit")
        dependency_event("jwks", "private-credential")
    finally:
        request_id_context.reset(token)
    assert not records(caplog)
