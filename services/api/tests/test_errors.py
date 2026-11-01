import asyncio
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict

from app.application import create_app
from app.core.errors import ApiError, safe_validation_details
from app.core.request_context import RequestContextMiddleware, UnexpectedErrorMiddleware
from app.schemas.errors import ErrorCode

SECRET = "sensitive-token-and-arbitrary-submitted-key"


def error_app():
    app = create_app(cors_origins=["http://localhost:8081"])

    @app.get("/v1/unavailable")
    def unavailable():
        raise ApiError(ErrorCode.AUTH_UNAVAILABLE)

    @app.get("/v1/fail")
    def fail():
        raise RuntimeError(SECRET)

    @app.get("/v1/http")
    def http_error():
        raise HTTPException(status_code=401, detail=SECRET, headers={"X-Secret": SECRET})

    class Body(BaseModel):
        model_config = ConfigDict(extra="forbid")
        display_name: str

    @app.post("/v1/validate")
    def validate(body: Body):
        return body

    return app


def assert_error(response, code):
    data = response.json()["error"]
    assert data["code"] == code
    assert str(UUID(response.headers["X-Request-ID"])) == data["request_id"]
    assert response.headers["Cache-Control"] == "no-store"
    assert SECRET not in response.text
    assert SECRET not in str(response.headers)
    return data


def test_caller_ids_are_replaced_and_unconfigured_requests_never_succeed():
    with TestClient(error_app()) as client:
        first = client.get("/v1/unavailable", headers={"X-Request-ID": SECRET})
        second = client.get(
            "/v1/unavailable", headers={"X-Request-ID": first.headers["X-Request-ID"]}
        )
    assert first.status_code == second.status_code == 503
    assert assert_error(first, "AUTH_UNAVAILABLE")["retryable"] is True
    assert first.headers["X-Request-ID"] != second.headers["X-Request-ID"]


def test_unexpected_errors_do_not_echo_or_log_secrets_and_cors_survives(caplog):
    with TestClient(error_app()) as client:
        response = client.get("/v1/fail", headers={"Origin": "http://localhost:8081"})
    assert response.status_code == 500
    assert_error(response, "INTERNAL_ERROR")
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"
    assert response.headers["access-control-expose-headers"] == "X-Request-ID"
    assert SECRET not in caplog.text
    assert response.headers["X-Request-ID"] in caplog.text


def test_http_errors_strip_details_and_headers_but_send_bearer_challenge():
    with TestClient(error_app()) as client:
        response = client.get("/v1/http")
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert "details" not in assert_error(response, "AUTH_REQUIRED")


def test_validation_rejects_values_and_unknown_key_names_without_echo():
    with TestClient(error_app()) as client:
        response = client.post(
            "/v1/validate", json={"display_name": {SECRET: SECRET}, SECRET: SECRET}
        )
        malformed = client.post(
            "/v1/validate", content="{", headers={"Content-Type": "application/json"}
        )
    assert response.status_code == malformed.status_code == 422
    details = assert_error(response, "VALIDATION_ERROR")["details"]["fields"]
    assert details == [
        {"field": "display_name", "code": "invalid_type"},
        {"field": "body", "code": "extra_field"},
    ]
    assert assert_error(malformed, "VALIDATION_ERROR")["details"] == {
        "fields": [{"field": "body", "code": "invalid_json"}]
    }


def test_safe_validation_is_bounded_and_never_copies_context():
    details = safe_validation_details(
        [{"type": "extra_forbidden", "loc": ["body", SECRET], "input": SECRET, "ctx": SECRET}] * 20
    )
    assert len(details.fields) == 10
    assert SECRET not in details.model_dump_json()


def test_unknown_routes_methods_and_preflights_have_correlation():
    with TestClient(error_app()) as client:
        missing = client.get("/v1/missing")
        method = client.post("/healthz")
        preflight = client.options(
            "/v1/unavailable",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
    assert missing.status_code == 404
    assert_error(missing, "NOT_FOUND")
    assert method.status_code == 405
    assert_error(method, "METHOD_NOT_ALLOWED")
    assert "GET" in method.headers["Allow"]
    assert preflight.status_code == 200
    assert UUID(preflight.headers["X-Request-ID"])


def test_side_effect_free_assembly_does_not_read_invalid_environment(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SUPABASE_PROJECT_URL", SECRET)
    with TestClient(create_app()) as client:
        assert client.get("/healthz").status_code == 200


def test_asgi_boundaries_preserve_non_http_and_cancellation():
    async def run():
        async def noop(*args):
            pass

        observed = []

        async def other(scope, receive, send):
            observed.append(scope["type"])

        await RequestContextMiddleware(UnexpectedErrorMiddleware(other))(
            {"type": "lifespan"}, noop, noop
        )
        assert observed == ["lifespan"]

        async def cancelled(scope, receive, send):
            raise asyncio.CancelledError

        try:
            await RequestContextMiddleware(UnexpectedErrorMiddleware(cancelled))(
                {"type": "http", "path": "/v1/test"}, noop, noop
            )
        except asyncio.CancelledError:
            pass
        else:
            raise AssertionError("Request cancellation was swallowed")

    asyncio.run(run())
