from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.domain.quest_occurrences import occurrence
from app.domain.recommendations import offer, one_time_definition
from app.schemas.recommendations import RecommendationAction
from tests.auth.support import settings
from tests.support.http import authenticated_app


@pytest.mark.parametrize(
    "patch",
    [
        {"action": "completed"},
        {"offer_id": "bad"},
        {"credits": 50},
        {"packages": ["private.app"]},
        {"title": "untrusted advice"},
    ],
)
def test_reject_client_decision_claims(patch):
    with pytest.raises(ValidationError):
        RecommendationAction.model_validate(dict(offer_id=str(uuid4()), action="accepted") | patch)


@pytest.mark.parametrize("stamp", ["2026-11-15T04:59:30+00:00", "2026-11-01T06:50:00+00:00"])
def test_saved_zone_midnight_and_fall_back_offer(stamp):
    now = datetime.fromisoformat(stamp)
    prefs = SimpleNamespace(
        revision=1,
        activities={"selected_activity_ids": ["reading"]},
        plan_draft={"timezone_id": "America/New_York"},
    )
    value = offer(uuid4(), prefs, now)
    definition = one_time_definition(value, now)
    from zoneinfo import ZoneInfo

    local = now.astimezone(ZoneInfo(value.timezone_id))
    # Resolver chooses a valid future start even during the repeated fall-back hour.
    day = local.date()
    if definition.start_local < local.strftime("%H:%M"):
        day += timedelta(days=1)
    times = occurrence(definition, day, day)
    assert times and times[0] > now
    assert definition.repeat == "none"
    assert value.expires_at.tzinfo == UTC


def test_auth_and_bounded_json_before_database(monkeypatch):
    app, headers = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        assert client.get("/v1/recommendations/current").status_code == 401
        assert client.put("/v1/recommendations/decision", json={}).status_code == 401
        assert (
            client.put(
                "/v1/recommendations/decision", headers=headers, content="x" * 16385
            ).status_code
            == 413
        )
        assert (
            client.put(
                "/v1/recommendations/decision",
                headers=headers | {"Content-Type": "application/json"},
                content='{"action":"accepted","action":"skipped"}',
            ).status_code
            == 422
        )
