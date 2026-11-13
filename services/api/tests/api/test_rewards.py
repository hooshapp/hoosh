from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.rewards import RewardBatch
from tests.auth.support import settings
from tests.support.http import authenticated_app


def body():
    return dict(
        installation_id=str(uuid4()),
        timezone_id="UTC",
        discarded=0,
        events=[
            dict(
                event_id=str(uuid4()),
                sequence=1,
                occurred_at=datetime.now(UTC).isoformat(),
                kind="quit",
                encounter_id=str(uuid4()),
                context="initial",
                day="2026-11-13",
                exhausted=None,
                covered=None,
            )
        ],
    )


@pytest.mark.parametrize(
    "patch",
    [
        dict(timezone_id="Bad/Zone"),
        dict(discarded=True),
        dict(events=[]),
        dict(native_apps=["private.package"]),
    ],
)
def test_strict_native_envelope_rejects_private_fields_and_bad_bounds(patch):
    with pytest.raises(ValidationError):
        RewardBatch.model_validate(body() | patch)


@pytest.mark.parametrize(
    "patch",
    [
        dict(sequence=True),
        dict(context="fake"),
        dict(exhausted=True),
        dict(amount=500),
        dict(occurred_at="2026-11-13T12:00:00"),
    ],
)
def test_strict_native_signal_rejects_money_and_incoherent_evidence(patch):
    b = body()
    b["events"][0].update(patch)
    with pytest.raises(ValidationError):
        RewardBatch.model_validate(b)


@pytest.mark.parametrize(
    "path,payload",
    [("", None), ("/events", {}), ("/feed/00000000-0000-4000-8000-000000000001", {})],
)
def test_auth_required_without_database_acquisition(monkeypatch, path, payload):
    app, _ = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        r = (
            client.get("/v1/rewards")
            if payload is None
            else client.put("/v1/rewards" + path, json=payload)
        )
    assert r.status_code == 401 and r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_reward_body_bound_and_duplicate_keys_before_database_acquisition(monkeypatch):
    app, _ = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        assert client.put("/v1/rewards/events", content="x" * 16385).status_code == 413
        r = client.put(
            "/v1/rewards/events",
            content='{"events":[],"events":[]}',
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 422
