import builtins
import time
from uuid import UUID

import httpx2
import pytest
from fastapi.testclient import TestClient

from app.application import create_app as assemble_app
from app.core.config import Settings
from app.core.jwks import JwksResolver
from app.runtime import create_app
from tests.auth.support import USER_A, USER_B, LocalSigner, settings


@pytest.fixture(scope="module")
def signer():
    return LocalSigner()


@pytest.fixture
def context(monkeypatch, signer):
    requests = []
    provider = {"outage": False, "keys": [signer.jwk]}
    resolvers = []

    def handler(request):
        requests.append(request)
        if provider["outage"]:
            raise httpx2.ConnectError("synthetic provider failure", request=request)
        return httpx2.Response(200, json={"keys": provider["keys"]})

    def factory(config):
        resolver = JwksResolver(
            config, client=httpx2.AsyncClient(transport=httpx2.MockTransport(handler))
        )
        resolvers.append(resolver)
        return resolver

    monkeypatch.setattr("app.runtime.JwksResolver", factory)
    app = create_app(settings(cors_allowed_origins=["http://localhost:8081"]))
    # No dependency overrides, fake identity port or signature disabling in this route setup.
    assert not app.dependency_overrides
    with TestClient(app) as client:
        yield client, requests, provider
    assert resolvers[0]._client.is_closed


def token(signer, claims=None):
    now = int(time.time())
    return signer.token({"iat": now - 60, "exp": now + 300, **(claims or {})})


def headers(signer, claims=None):
    return {"Authorization": "Bearer " + token(signer, claims)}


def check_error(response, status, code):
    assert response.status_code == status
    data = response.json()["error"]
    assert data["code"] == code
    assert str(UUID(response.headers["X-Request-ID"])) == data["request_id"]
    assert response.headers["Cache-Control"] == "no-store"
    assert set(data) == {"code", "message", "retryable", "request_id"}
    if status == 401:
        assert response.headers["WWW-Authenticate"] == "Bearer"


def test_real_signed_a_b_identities_cache_and_nullable_email(context, signer):
    client, requests, _ = context
    for user, email in [(USER_A, "a@example.invalid"), (USER_B, None)]:
        response = client.get("/v1/me", headers=headers(signer, {"sub": str(user), "email": email}))
        assert response.status_code == 200
        assert response.json() == {"user_id": str(user), "email": email}
        assert response.headers["Cache-Control"] == "no-store"
        assert UUID(response.headers["X-Request-ID"])
        assert "WWW-Authenticate" not in response.headers
    assert len(requests) == 1


def test_verified_token_is_the_only_owner_authority(context, signer):
    client, _, _ = context
    response = client.request(
        "GET",
        f"/v1/me?user_id={USER_B}",
        headers={**headers(signer), "X-User-ID": str(USER_B), "X-Request-ID": "caller-text"},
        json={"user_id": str(USER_B), "email": "other@example.invalid"},
    )
    assert response.json() == {"user_id": str(USER_A), "email": "student@example.invalid"}
    assert response.headers["X-Request-ID"] != "caller-text"


@pytest.mark.parametrize(
    "value,code",
    [
        (None, "AUTH_REQUIRED"),
        ("Basic secret", "AUTH_REQUIRED"),
        ("Bearer", "AUTH_REQUIRED"),
        ("Bearer a b", "AUTH_REQUIRED"),
        ("Bearer opaque", "INVALID_TOKEN"),
        ("Bearer a.b.c", "INVALID_TOKEN"),
    ],
)
def test_missing_or_malformed_credentials_fail_without_network(context, value, code):
    client, requests, _ = context
    response = client.get("/v1/me", headers={"Authorization": value} if value is not None else {})
    check_error(response, 401, code)
    assert not requests


def test_duplicate_auth_headers_and_query_token_are_not_accepted(context, signer):
    client, requests, _ = context
    response = client.get(
        "/v1/me",
        headers=[
            ("Authorization", "Bearer " + token(signer)),
            ("Authorization", "Bearer " + token(signer)),
        ],
    )
    check_error(response, 401, "AUTH_REQUIRED")
    check_error(client.get("/v1/me", params={"access_token": token(signer)}), 401, "AUTH_REQUIRED")
    assert not requests


@pytest.mark.parametrize(
    "claims,status,code",
    [
        ({"iss": "https://other.supabase.co/auth/v1"}, 401, "INVALID_TOKEN"),
        ({"aud": "another"}, 401, "INVALID_TOKEN"),
        ({"role": "service_role"}, 401, "INVALID_TOKEN"),
        ({"sub": "supabase", "role": "anon"}, 401, "INVALID_TOKEN"),
        ({"is_anonymous": True}, 403, "FORBIDDEN"),
        ({"iat": int(time.time()) - 7200, "exp": int(time.time()) - 3600}, 401, "TOKEN_EXPIRED"),
    ],
)
def test_valid_signatures_still_require_scope_and_time(context, signer, claims, status, code):
    client, _, _ = context
    check_error(client.get("/v1/me", headers=headers(signer, claims)), status, code)


def test_bad_signature_is_not_reported_as_expiration(context, signer):
    client, _, _ = context
    forged = LocalSigner().token({"iat": int(time.time()) - 7200, "exp": int(time.time()) - 3600})
    check_error(
        client.get("/v1/me", headers={"Authorization": "Bearer " + forged}), 401, "INVALID_TOKEN"
    )


def test_discovery_outage_is_503_but_public_liveness_stays_200(context, signer):
    client, requests, provider = context
    provider["outage"] = True
    response = client.get("/v1/me", headers=headers(signer))
    check_error(response, 503, "AUTH_UNAVAILABLE")
    assert response.json()["error"]["retryable"] is True
    assert client.get("/healthz").status_code == 200
    assert len(requests) == 1
    # Proven structural failure remains a 401, even when the provider is down.
    check_error(
        client.get("/v1/me", headers={"Authorization": "Bearer invalid"}), 401, "INVALID_TOKEN"
    )
    assert len(requests) == 1


def test_unconfigured_and_schema_assembly_cannot_fabricate_identity():
    for app in [create_app(Settings(_env_file=None)), assemble_app()]:
        with TestClient(app) as client:
            check_error(client.get("/v1/me"), 401, "AUTH_REQUIRED")
            check_error(
                client.get("/v1/me", headers={"Authorization": "Bearer opaque"}),
                503,
                "AUTH_UNAVAILABLE",
            )
            assert client.get("/healthz").status_code == 200


def test_identity_imports_no_database_even_when_db_configuration_is_unusable(
    context, signer, monkeypatch
):
    original_import = builtins.__import__

    def no_db(name, *args, **kwargs):
        if name.startswith(("app.db", "sqlalchemy", "psycopg")):
            raise AssertionError("Identity must not import or connect product database code")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", no_db)
    monkeypatch.setenv("DATABASE_URL", "unavailable://not-a-database")
    client, _, _ = context
    assert client.get("/v1/me", headers=headers(signer)).json()["user_id"] == str(USER_A)


def test_identity_cors_and_safe_failure_do_not_expose_token_or_claims(context, signer, caplog):
    client, _, _ = context
    access = token(signer, {"aud": "wrong", "email": "sensitive@example.invalid"})
    response = client.get(
        "/v1/me", headers={"Authorization": "Bearer " + access, "Origin": "http://localhost:8081"}
    )
    check_error(response, 401, "INVALID_TOKEN")
    assert access not in response.text + caplog.text
    assert "sensitive@example.invalid" not in response.text + caplog.text
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"
    assert response.headers["access-control-expose-headers"] == "X-Request-ID"
    unknown = client.get(
        "/v1/me", headers={"Authorization": "Bearer " + access, "Origin": "https://unknown.example"}
    )
    assert "access-control-allow-origin" not in unknown.headers


def test_method_rejection_and_exact_identity_schema(context, signer):
    client, _, _ = context
    check_error(client.post("/v1/me", headers=headers(signer)), 405, "METHOD_NOT_ALLOWED")
    schema = client.get("/openapi.json").json()
    operation = schema["paths"]["/v1/me"]["get"]
    assert operation["operationId"] == "get_verified_identity"
    assert operation["security"] == [{"SupabaseAccessToken": []}]
    assert set(schema["components"]["schemas"]["MeResponse"]["required"]) == {"user_id", "email"}
    assert set(schema["paths"]["/v1/profile"]) == {"get", "patch"}
