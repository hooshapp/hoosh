import asyncio
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.application import create_app
from app.core.errors import safe_validation_details
from app.core.profile_body import PROFILE_BODY_LIMIT
from app.repositories.profiles import save_own_profile
from app.schemas.profiles import ProfilePatch
from tests.auth.support import USER_A, settings
from tests.support.http import authenticated_app
from tests.support.schema import ROOT, validate_observed_response

NAME_CASES = json.loads((ROOT / "packages/contracts/fixtures/display-name.json").read_text())[
    "cases"
]


@pytest.mark.parametrize("case", NAME_CASES, ids=lambda value: value["case"])
def test_canonical_patch_names_match_shared_unicode_contract(case):
    body = {"expected_revision": 0, "display_name": case["input"]}
    if case["expected"]["valid"]:
        assert ProfilePatch.model_validate(body).display_name == case["expected"]["normalized"]
    else:
        with pytest.raises(ValidationError) as error:
            ProfilePatch.model_validate(body)
        details = safe_validation_details(
            [{**e, "loc": ("body", *e["loc"])} for e in error.value.errors()]
        )
        assert details.fields[0].code == case["expected"]["code"]


INVALID_FIELDS = [
    ({}, "expected_revision", "required"),
    ({"expected_revision": 0}, "display_name", "required"),
    ({"display_name": None}, "expected_revision", "required"),
    *[
        ({"expected_revision": value, "display_name": "x"}, "expected_revision", code)
        for value, code in [
            (-1, "out_of_range"),
            (True, "invalid_type"),
            (1.0, "invalid_type"),
            ("1", "invalid_type"),
            (None, "invalid_type"),
        ]
    ],
    *[
        ({"expected_revision": 0, "display_name": value}, "display_name", code)
        for value, code in [
            (False, "invalid_type"),
            (3, "invalid_type"),
            ([], "invalid_type"),
            ({}, "invalid_type"),
            (" ", "blank"),
            ("x" * 81, "too_long"),
            ("a\x00", "invalid_text"),
            ("\ud800", "invalid_text"),
            ("\udfff", "invalid_text"),
        ]
    ],
    *[
        (
            {"expected_revision": 0, "display_name": "x", field: "private-marker"},
            "body",
            "extra_field",
        )
        for field in ("user_id", "email", "revision", "created_at", "private-key")
    ],
]


@pytest.mark.parametrize("body,field,code", INVALID_FIELDS)
def test_invalid_patch_fields_are_safe_before_any_database_access(monkeypatch, body, field, code):
    class ForbiddenDatabase:
        @property
        def closed(self):
            raise AssertionError("Validation touched the database")

    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        response = client.patch(
            "/v1/profile",
            headers={**auth, "Content-Type": "application/json"},
            content=json.dumps(body, ensure_ascii=True).encode(),
        )
        app.state.database = None
    assert response.status_code == 422
    validate_observed_response(response)
    assert {"field": field, "code": code} in response.json()["error"]["details"]["fields"]
    assert "private-marker" not in response.text and "private-key" not in response.text


async def asgi_request(chunks, *, content_type=b"application/json", length=None, method="PATCH"):
    app = create_app(cors_origins=["http://localhost:8081"])
    messages, consumed = [], []
    request_headers = [
        (b"content-type", content_type),
        (b"authorization", b"Bearer opaque"),
        (b"origin", b"http://localhost:8081"),
    ]
    if length is not None:
        request_headers.append((b"content-length", str(length).encode()))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": "/v1/profile",
        "raw_path": b"/v1/profile",
        "query_string": b"",
        "root_path": "",
        "headers": request_headers,
        "client": ("127.0.0.1", 1),
        "server": ("test", 80),
    }
    iterator = iter(chunks)

    async def receive():
        chunk = next(iterator)
        consumed.append(chunk)
        return chunk

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)
    status = messages[0]["status"]
    headers = dict(messages[0]["headers"])
    body = json.loads(b"".join(m.get("body", b"") for m in messages[1:]))
    assert headers[b"cache-control"] == b"no-store"
    assert headers[b"access-control-allow-origin"] == b"http://localhost:8081"
    assert headers[b"x-request-id"].decode() == body["error"]["request_id"]
    return status, body["error"], consumed


@pytest.mark.parametrize("length", [None, 0, PROFILE_BODY_LIMIT + 1])
def test_streamed_body_bound_counts_actual_bytes_not_content_length(length):
    chunks = [
        {"type": "http.request", "body": b"x" * PROFILE_BODY_LIMIT, "more_body": True},
        {"type": "http.request", "body": b"y", "more_body": True},
    ]
    status, error, consumed = asyncio.run(asgi_request(chunks, length=length))
    assert status == 413 and error["code"] == "REQUEST_TOO_LARGE"
    assert len(consumed) == 2  # Reject immediately without draining more attacker-controlled input.


def test_exact_limit_valid_json_and_empty_chunks_reach_auth_without_rejecting_false_length():
    body = b'{"expected_revision":0,"display_name":"x"}'
    body += b" " * (PROFILE_BODY_LIMIT - len(body))
    chunks = [
        {"type": "http.request", "body": b"", "more_body": True},
        {"type": "http.request", "body": body[:8000], "more_body": True},
        {"type": "http.request", "body": body[8000:], "more_body": False},
    ]
    status, error, _ = asyncio.run(asgi_request(chunks, length=PROFILE_BODY_LIMIT + 100))
    assert status == 503 and error["code"] == "AUTH_UNAVAILABLE"


@pytest.mark.parametrize(
    "body,content_type",
    [
        (b"{", b"application/json"),
        (b"", b"application/json"),
        (b"\xff", b"application/json"),
        (b"{}", b"text/plain"),
        (b'{"expected_revision": NaN}', b"application/json"),
        (b'{"display_name": Infinity}', b"application/json"),
        (b'{"expected_revision":0,"expected_revision":1}', b"application/json"),
        (b"{}", b""),
        (b"[" * 1500 + b"]" * 1500, b"application/json"),
    ],
)
def test_non_json_malformed_unicode_and_nonobject_bodies_are_safe_422(body, content_type):
    status, error, _ = asyncio.run(
        asgi_request(
            [{"type": "http.request", "body": body, "more_body": False}], content_type=content_type
        )
    )
    assert status == 422 and error["details"] == {
        "fields": [{"field": "body", "code": "invalid_json"}]
    }


def test_body_boundary_preserves_disconnect_and_cancellation_and_other_methods():
    from app.core.profile_body import ProfileBodyMiddleware

    async def run():
        called = []

        async def downstream(scope, receive, send):
            called.append(scope["type"])

        async def disconnected():
            return {"type": "http.disconnect"}

        async def cancelled():
            raise asyncio.CancelledError

        async def no_send(message):
            pytest.fail("Disconnected request must not start a response")

        app = ProfileBodyMiddleware(downstream)
        scope = {"type": "http", "method": "PATCH", "path": "/v1/profile"}
        await app(scope, disconnected, no_send)
        assert not called
        with pytest.raises(asyncio.CancelledError):
            await app(scope, cancelled, no_send)
        await app({"type": "lifespan"}, disconnected, no_send)
        await app(scope | {"method": "GET"}, disconnected, no_send)
        assert called == ["lifespan", "http"]

    asyncio.run(run())


@pytest.mark.parametrize(
    "part,value",
    [
        ("sqlstate", "23514"),
        ("schema_name", "other"),
        ("table_name", "other"),
        ("constraint_name", "other_foreign_key"),
    ],
)
def test_only_the_specific_owner_fk_is_mapped_to_forbidden(monkeypatch, part, value):
    diagnostic = dict(
        schema_name="public", table_name="profiles", constraint_name="fk_profiles_user_id_users"
    )
    state = "23503"
    if part == "sqlstate":
        state = value
    else:
        diagnostic[part] = value
    original = Exception("private-marker")
    original.sqlstate = state
    original.diag = SimpleNamespace(**diagnostic)
    failure = IntegrityError("private-sql", {}, original)

    class FailedSession:
        def scalars(self, statement):
            raise failure

    monkeypatch.setattr("app.repositories.profiles.require_user_context", lambda session: USER_A)
    with pytest.raises(IntegrityError) as error:
        save_own_profile(FailedSession(), ProfilePatch(expected_revision=0, display_name="x"))
    assert error.value is failure


def test_patch_schema_is_strict_raw_name_has_no_misleading_maximum_and_success_is_nonnull():
    schema = create_app().openapi()
    operation = schema["paths"]["/v1/profile"]["patch"]
    assert operation["security"] == [{"SupabaseAccessToken": []}]
    assert not operation.get("parameters")
    assert set(operation["responses"]) == {"200", "401", "403", "409", "413", "422", "503", "500"}
    body = schema["components"]["schemas"]["ProfilePatch"]
    assert set(body["required"]) == {"expected_revision", "display_name"}
    assert body["additionalProperties"] is False
    assert "maxLength" not in str(body["properties"]["display_name"])
    saved = schema["components"]["schemas"]["ProfileSavedResponse"]
    assert saved["properties"]["profile"] == {"$ref": "#/components/schemas/ProfileView"}


def test_multibyte_body_limit_counts_utf8_bytes():
    status, error, _ = asyncio.run(
        asgi_request(
            [
                {
                    "type": "http.request",
                    "body": "é".encode() * (PROFILE_BODY_LIMIT // 2 + 1),
                    "more_body": False,
                }
            ]
        )
    )
    assert status == 413 and error["code"] == "REQUEST_TOO_LARGE"


def test_write_repository_rejects_unscoped_entry_without_connecting():
    from app.db.session import DatabaseContextError, UserSession

    with UserSession(autobegin=False) as session:
        with pytest.raises(DatabaseContextError), session.begin():
            save_own_profile(session, ProfilePatch(expected_revision=0, display_name=None))
