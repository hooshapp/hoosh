import asyncio
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.application import create_app
from app.core.json_body import PATCH_BODY_LIMIT
from app.db.session import DatabaseContextError, UserSession
from app.repositories.settings import read_own_settings, save_own_settings
from app.schemas.settings import SettingsPatch
from tests.auth.support import USER_A, LocalSigner, settings
from tests.support.http import authenticated_app, signed_headers
from tests.support.schema import ROOT, validate_observed_response, wire_validator

CASES = json.loads((ROOT / "packages/contracts/fixtures/settings-v1.json").read_text())


class ForbiddenDatabase:
    @property
    def closed(self):
        raise AssertionError("Database must not be acquired")


@pytest.mark.parametrize("case", CASES["invalid_patches"], ids=lambda case: case["id"])
def test_invalid_settings_fail_before_database_and_do_not_echo_inputs(monkeypatch, case):
    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        try:
            response = client.patch("/v1/settings", headers=auth, json=case["input"])
            assert response.status_code == 422
            validate_observed_response(response)
            assert "synthetic" not in response.text and "Not/A_Zone" not in response.text
        finally:
            app.state.database = None


@pytest.mark.parametrize("method", ["GET", "PATCH"])
@pytest.mark.parametrize(
    "scenario,status,code",
    [
        ("missing", 401, "AUTH_REQUIRED"),
        ("invalid", 401, "INVALID_TOKEN"),
        ("expired", 401, "TOKEN_EXPIRED"),
        ("wrong_issuer", 401, "INVALID_TOKEN"),
        ("signature", 401, "INVALID_TOKEN"),
        ("anonymous", 403, "FORBIDDEN"),
    ],
)
def test_settings_authentication_precedes_database_access(
    monkeypatch, method, scenario, status, code
):
    signer = LocalSigner()
    app, auth = authenticated_app(monkeypatch, settings(), signer=signer)
    if scenario == "missing":
        auth = {}
    elif scenario == "invalid":
        auth = {"Authorization": "Bearer a.b.c"}
    elif scenario == "expired":
        auth = signed_headers(signer, {"iat": 100, "exp": 200})
    elif scenario == "wrong_issuer":
        auth = signed_headers(signer, {"iss": "https://other.supabase.co/auth/v1"})
    elif scenario == "signature":
        auth = signed_headers(LocalSigner())
    elif scenario == "anonymous":
        auth = signed_headers(signer, {"is_anonymous": True})
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        try:
            response = client.request(
                method,
                "/v1/settings",
                headers=auth,
                **(
                    {"json": {"expected_revision": 0, "activities": None}}
                    if method == "PATCH"
                    else {}
                ),
            )
            assert response.status_code == status and response.json()["error"]["code"] == code
            validate_observed_response(response)
        finally:
            app.state.database = None


def test_missing_database_is_not_absence_and_does_not_prevent_identity(monkeypatch):
    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        for method in ("GET", "PATCH"):
            response = client.request(
                method,
                "/v1/settings",
                headers=auth,
                **(
                    {"json": {"expected_revision": 0, "activities": None}}
                    if method == "PATCH"
                    else {}
                ),
            )
            assert (
                response.status_code == 503
                and response.json()["error"]["code"] == "DEPENDENCY_UNAVAILABLE"
            )
            assert "settings" not in response.json()
            validate_observed_response(response)
        assert client.get("/v1/me", headers=auth).status_code == 200
        assert client.get("/healthz").status_code == 200


@pytest.mark.parametrize(
    "body,field,code",
    [
        ({"expected_revision": 0}, "body", "required"),
        (
            {
                "expected_revision": 0,
                "activities": {"selected_activity_ids": ["bad-private"], "custom_text": None},
            },
            "activities.selected_activity_ids",
            "invalid_choice",
        ),
        (
            {
                "expected_revision": 0,
                "activities": {"selected_activity_ids": ["gym", "gym"], "custom_text": None},
            },
            "activities.selected_activity_ids",
            "duplicate",
        ),
        (
            {
                "expected_revision": 0,
                "activities": {"selected_activity_ids": [], "custom_text": "   "},
            },
            "activities.custom_text",
            "blank",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"] | {"weekdays": [0, 0]},
            },
            "plan_draft.weekdays",
            "duplicate",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"]
                | {"hours": {"start_local": "24:00", "end_local": None, "next_day": False}},
            },
            "plan_draft.hours.start_local",
            "invalid_time",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"]
                | {"hours": {"start_local": "23:00", "end_local": "07:00", "next_day": False}},
            },
            "plan_draft.hours",
            "invalid_range",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"] | {"timezone_id": "bad-private"},
            },
            "plan_draft.timezone_id",
            "invalid_timezone",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"] | {"session_count": True},
            },
            "plan_draft.session_count",
            "invalid_type",
        ),
        (
            {
                "expected_revision": 0,
                "plan_draft": CASES["empty_plan_draft"]
                | {
                    "hours": {
                        "start_local": None,
                        "end_local": None,
                        "next_day": False,
                        "bad-private": True,
                    }
                },
            },
            "body",
            "extra_field",
        ),
    ],
)
def test_safe_nested_validation_paths_and_codes(monkeypatch, body, field, code):
    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        response = client.patch("/v1/settings", headers=auth, json=body)
    assert response.status_code == 422
    assert {"field": field, "code": code} in response.json()["error"]["details"]["fields"]
    assert "bad-private" not in response.text
    validate_observed_response(response)


async def _stream(chunks, media=b"application/json", length=b"0"):
    app = create_app(cors_origins=["http://localhost:8081"])
    messages = []
    iterator = iter(chunks)

    async def receive():
        return next(iterator)

    async def send(message):
        messages.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "PATCH",
        "scheme": "http",
        "path": "/v1/settings",
        "raw_path": b"/v1/settings",
        "query_string": b"",
        "root_path": "",
        "headers": [
            (b"content-type", media),
            (b"content-length", length),
            (b"origin", b"http://localhost:8081"),
        ],
        "client": ("127.0.0.1", 1),
        "server": ("test", 80),
    }
    await app(scope, receive, send)
    response = messages[0]
    headers = dict(response["headers"])
    body = json.loads(b"".join(m.get("body", b"") for m in messages[1:]))
    assert headers[b"cache-control"] == b"no-store"
    assert headers[b"access-control-allow-origin"] == b"http://localhost:8081"
    assert headers[b"x-request-id"].decode() == body["error"]["request_id"]
    return response["status"], body["error"]


def test_settings_streamed_bound_rejects_without_draining_or_trusting_length():
    chunks = [
        {"type": "http.request", "body": b"x" * PATCH_BODY_LIMIT, "more_body": True},
        {"type": "http.request", "body": b"x", "more_body": True},
    ]
    assert asyncio.run(_stream(chunks))[0] == 413


@pytest.mark.parametrize(
    "body,media",
    [
        (b"{", b"application/json"),
        (b"\xff", b"application/json"),
        (b"[]", b"application/json"),
        (b"{}", b"text/plain"),
        (b'{"activities":null,"activities":{}}', b"application/json"),
        (b'{"activities":{"custom_text":NaN}}', b"application/json"),
        (b'{"activities":{"custom_text":null,"custom_text":"x"}}', b"application/json"),
    ],
)
def test_settings_invalid_json_media_and_nested_duplicates(body, media):
    status, error = asyncio.run(
        _stream([{"type": "http.request", "body": body, "more_body": False}], media)
    )
    assert status == 422 and error["details"] == {
        "fields": [{"field": "body", "code": "invalid_json"}]
    }


def test_empty_and_exact_limit_chunks_and_json_suffix_reach_auth():
    body = b'{"expected_revision":0,"activities":null}'
    body += b" " * (PATCH_BODY_LIMIT - len(body))
    status, error = asyncio.run(
        _stream(
            [
                {"type": "http.request", "body": b"", "more_body": True},
                {"type": "http.request", "body": body, "more_body": False},
            ],
            b"application/merge-patch+json",
            b"99999",
        )
    )
    assert status == 401 and error["code"] == "AUTH_REQUIRED"


def test_settings_repository_requires_an_active_user_unit():
    with UserSession(autobegin=False) as session:
        for call in (
            lambda: read_own_settings(session),
            lambda: save_own_settings(session, SettingsPatch(expected_revision=0, activities=None)),
        ):
            with pytest.raises(DatabaseContextError):
                call()


@pytest.mark.parametrize(
    "part,value",
    [
        ("sqlstate", "23514"),
        ("schema_name", "other"),
        ("table_name", "other"),
        ("constraint_name", "other"),
    ],
)
def test_only_settings_owner_fk_is_mapped_to_forbidden(monkeypatch, part, value):
    diag = {
        "schema_name": "public",
        "table_name": "user_settings",
        "constraint_name": "fk_user_settings_user_id_users",
    }
    state = "23503"
    if part == "sqlstate":
        state = value
    else:
        diag[part] = value
    original = Exception("private-marker")
    original.sqlstate = state
    original.diag = SimpleNamespace(**diag)
    failure = IntegrityError("private-sql", {}, original)

    class FailingSession:
        def scalars(self, statement):
            raise failure

    monkeypatch.setattr("app.repositories.settings.require_user_context", lambda session: USER_A)
    with pytest.raises(IntegrityError) as error:
        save_own_settings(FailingSession(), SettingsPatch(expected_revision=0, activities=None))
    assert error.value is failure


def test_generated_settings_shape_requires_a_section_and_saved_response_is_nonnull():
    schema = create_app().openapi()
    for method in ("get", "patch"):
        op = schema["paths"]["/v1/settings"][method]
        assert op["security"] == [{"SupabaseAccessToken": []}]
        assert not op.get("parameters")
    validator = wire_validator("SettingsPatch")
    validator.validate({"expected_revision": 0, "activities": None})
    assert list(validator.iter_errors({"expected_revision": 0}))
    assert list(validator.iter_errors({"expected_revision": 0, "activities": None, "owner": "bad"}))
    assert schema["components"]["schemas"]["SettingsSavedResponse"]["properties"]["settings"] == {
        "$ref": "#/components/schemas/SettingsView"
    }
