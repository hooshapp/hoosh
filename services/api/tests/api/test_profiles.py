from datetime import UTC, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.db.session import DatabaseContextError, UserSession
from app.repositories.profiles import read_own_profile
from app.schemas.profiles import ProfileResponse, ProfileView
from tests.auth.support import USER_A, LocalSigner, settings
from tests.support.http import authenticated_app, signed_headers
from tests.support.schema import FIXTURES, wire_validator


class ForbiddenDatabase:
    @property
    def closed(self):
        raise AssertionError("Authentication failure touched the product database")


@pytest.mark.parametrize(
    "scenario,status,code",
    [
        ("missing", 401, "AUTH_REQUIRED"),
        ("syntax", 401, "AUTH_REQUIRED"),
        ("malformed", 401, "INVALID_TOKEN"),
        ("duplicate", 401, "AUTH_REQUIRED"),
        ("signature", 401, "INVALID_TOKEN"),
        ("issuer", 401, "INVALID_TOKEN"),
        ("expired", 401, "TOKEN_EXPIRED"),
        ("anonymous", 403, "FORBIDDEN"),
    ],
)
def test_profile_authentication_fails_before_database_access(monkeypatch, scenario, status, code):
    signer = LocalSigner()
    app, headers = authenticated_app(monkeypatch, settings(), signer=signer)
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        if scenario == "missing":
            headers = {}
        elif scenario == "syntax":
            headers = {"Authorization": "Basic private-marker"}
        elif scenario == "malformed":
            headers = {"Authorization": "Bearer a.b.c"}
        elif scenario == "duplicate":
            headers = list(headers.items()) * 2
        elif scenario == "signature":
            headers = signed_headers(LocalSigner())
        elif scenario == "issuer":
            headers = signed_headers(signer, {"iss": "https://other.supabase.co/auth/v1"})
        elif scenario == "expired":
            headers = signed_headers(signer, {"iat": 100, "exp": 200})
        elif scenario == "anonymous":
            headers = signed_headers(signer, {"is_anonymous": True})
        response = client.get("/v1/profile", headers=headers)
        assert response.status_code == status
        assert response.json()["error"]["code"] == code
        assert response.headers["Cache-Control"] == "no-store"
        # The real lifespan owns no Database in this deliberately unconfigured setup.
        app.state.database = None


def test_profile_unconfigured_db_is_unavailable_while_identity_and_liveness_work(monkeypatch):
    app, headers = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        response = client.get("/v1/profile", headers=headers)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "DEPENDENCY_UNAVAILABLE"
        assert "profile" not in response.json()
        assert client.get("/v1/me", headers=headers).status_code == 200
        assert client.get("/healthz").status_code == 200
        assert client.patch("/v1/profile", headers=headers, json={}).status_code == 405


def test_unconfigured_auth_fails_before_database_access():
    from app.application import create_app

    app = create_app()
    app.state.database = ForbiddenDatabase()
    with TestClient(app) as client:
        response = client.get("/v1/profile", headers={"Authorization": "Bearer opaque"})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "AUTH_UNAVAILABLE"


def test_repository_refuses_missing_and_ended_scope_without_a_database():
    with UserSession(autobegin=False) as session:
        with pytest.raises(DatabaseContextError):
            read_own_profile(session)
        with pytest.raises(DatabaseContextError), session.begin():
            read_own_profile(session)
    with pytest.raises(DatabaseContextError):
        read_own_profile(session)


@pytest.mark.parametrize(
    "case",
    [
        c for c in FIXTURES
        if c["request"]["path"] == "/v1/profile" and c["response"]["status"] == 200
    ],
    ids=lambda c: c["case"],
)
def test_shared_profile_success_examples_match_schema(case):
    body = case["response"]["body"]
    assert ProfileResponse.model_validate(body).model_dump(mode="json") == body
    wire_validator("ProfileResponse").validate(body)


def profile_body(**overrides):
    return {
        "user_id": str(USER_A),
        "display_name": None,
        "revision": 1,
        "created_at": "2026-10-28T18:00:00Z",
        "updated_at": "2026-10-28T18:00:00Z",
        **overrides,
    }


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"profile": None, "email": "private@example.invalid"},
        {"profile": {}},
        *[{"profile": profile_body(**values)} for values in [
            {"user_id": "not-a-uuid"}, {"revision": 0}, {"revision": True},
            {"revision": "1"}, {"display_name": False}, {"display_name": ""},
            {"display_name": "x" * 81}, {"created_at": "2026-10-28T18:00:00"},
            {"email": "private@example.invalid"},
        ]],
    ],
)
def test_invalid_or_private_profile_wire_shapes_are_rejected(body):
    with pytest.raises(ValidationError):
        ProfileResponse.model_validate(body)
    assert list(wire_validator("ProfileResponse").iter_errors(body))


def test_nullable_name_is_required_and_timestamps_preserve_instant_in_utc():
    body = profile_body()
    del body["display_name"]
    with pytest.raises(ValidationError):
        ProfileView.model_validate(body)
    assert list(wire_validator("ProfileView").iter_errors(body))
    instant = datetime(2026, 11, 2, 20, 10, 5, 123456, tzinfo=timezone(timedelta(hours=6)))
    value = ProfileView.model_validate(profile_body(created_at=instant, updated_at=instant))
    assert value.created_at == instant and value.created_at.tzinfo == UTC
    assert value.model_dump(mode="json")["created_at"] == "2026-11-02T14:10:05.123456Z"


def test_profile_openapi_has_only_get_and_no_owner_input():
    from app.application import create_app

    schema = create_app().openapi()
    operation = schema["paths"]["/v1/profile"]["get"]
    assert operation["operationId"] == "get_own_profile"
    assert operation["security"] == [{"SupabaseAccessToken": []}]
    assert set(schema["paths"]["/v1/profile"]) == {"get"}
    assert "requestBody" not in operation and not operation.get("parameters")
    assert set(operation["responses"]) == {"200", "401", "403", "503", "500"}
    assert set(schema["components"]["schemas"]["ProfileView"]["required"]) == {
        "user_id", "display_name", "revision", "created_at", "updated_at"
    }
