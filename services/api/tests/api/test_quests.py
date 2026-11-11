import json
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.quests import QuestPut
from tests.auth.support import LocalSigner, settings
from tests.support.http import authenticated_app, signed_headers
from tests.support.schema import ROOT, wire_validator

FIXTURE = json.loads((ROOT / "packages/contracts/fixtures/quests-v1.json").read_text())
DEFINITION = FIXTURE["definition"]


@pytest.mark.parametrize(
    "patch",
    [
        {"title": " "},
        {"title": "x" * 121},
        {"activity": "x\x00y"},
        {"start_local": "24:00"},
        {"end_local": "08:00"},
        {"next_day": 1},
        {"weekdays": [0, 0]},
        {"weekdays": [True]},
        {"repeat": "weekly", "weekdays": []},
        {"repeat": "daily"},
        {"timezone_id": "Not/A_Zone"},
        {"native_apps": ["private"]},
    ],
)
def test_definition_rejects_unsafe_or_incoherent_fields(patch):
    with pytest.raises(ValidationError):
        QuestPut.model_validate({"expected_revision": 0, "definition": DEFINITION | patch})


def test_canonical_text_days_and_explicit_overnight():
    body = QuestPut.model_validate(
        {
            "expected_revision": 0,
            "definition": DEFINITION
            | {
                "title": "\u0085 Read 🦖 \u001c",
                "weekdays": [2, 0],
                "start_local": "23:00",
                "end_local": "01:00",
                "next_day": True,
            },
        }
    )
    assert body.definition.title == "Read 🦖" and body.definition.weekdays == [0, 2]
    wire_validator("QuestPut").validate(body.model_dump(mode="json"))


class ForbiddenDatabase:
    @property
    def closed(self):
        raise AssertionError("Must not acquire database")


@pytest.mark.parametrize("method", ["GET", "PUT", "DELETE"])
@pytest.mark.parametrize(
    "scenario,status", [("missing", 401), ("expired", 401), ("anonymous", 403)]
)
def test_quest_identity_precedes_database(monkeypatch, method, scenario, status):
    signer = LocalSigner()
    app, auth = authenticated_app(monkeypatch, settings(), signer=signer)
    if scenario == "missing":
        auth = {}
    elif scenario == "expired":
        auth = signed_headers(signer, {"iat": 100, "exp": 200})
    else:
        auth = signed_headers(signer, {"is_anonymous": True})
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        try:
            body = (
                {"expected_revision": 1}
                if method == "DELETE"
                else {
                    "expected_revision": 0,
                    "definition": DEFINITION,
                }
            )
            response = client.request(
                method,
                "/v1/quests/" + str(uuid4()),
                headers=auth,
                **({} if method == "GET" else {"json": body}),
            )
            assert response.status_code == status
        finally:
            app.state.database = None


@pytest.mark.parametrize(
    "body,status",
    [
        (b"[]", 422),
        (b'{"expected_revision":0,"expected_revision":1}', 422),
        (b"{}", 422),
        (b"x" * 16385, 413),
    ],
)
def test_bounded_strict_json_no_private_echo(monkeypatch, body, status):
    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        app.state.database = ForbiddenDatabase()
        try:
            response = client.put(
                "/v1/quests/" + str(uuid4()),
                headers={
                    **auth,
                    "Content-Type": "application/json",
                },
                content=body,
            )
            assert (
                response.status_code == status and response.headers["cache-control"] == "no-store"
            )
        finally:
            app.state.database = None


def test_unavailable_database_is_not_an_empty_quest_list(monkeypatch):
    app, auth = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        response = client.get("/v1/quests", headers=auth)
        assert response.status_code == 503 and "quests" not in response.json()
