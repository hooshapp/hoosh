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


@pytest.mark.parametrize(
    "stamp", ["2026-11-15T04:59:30+00:00", "2026-11-01T06:50:00+00:00", "2026-03-08T06:50:00+00:00"]
)
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
    assert times[1] - times[0] == timedelta(minutes=value.duration_minutes)
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


def test_nudge_copy_requires_auth_and_preserves_offline_fallback(monkeypatch):
    app, headers = authenticated_app(monkeypatch, settings())
    endpoint = "/v1/recommendations/nudge-copy?activity=reading&tone=Playful"
    with TestClient(app) as client:
        assert client.get(endpoint).status_code == 401
        response = client.get(endpoint, headers=headers)
        assert response.status_code == 200 and response.json() is None


def test_nudge_generation_is_shared_and_bounded_to_known_preferences(monkeypatch):
    from app.core.config import Settings
    from app.domain import ai_nudges

    config = Settings(_env_file=None, openai_api_key="synthetic", openai_nudge_model="example")
    calls = []

    def generate(client, *, api_key, model, activity_id, tone):
        calls.append((activity_id, tone))
        return ai_nudges.NudgeCopy(
            quarter="Set your book nearby.",
            halfway="Put your phone down and open your book.",
            three_quarters="Read the first paragraph.",
            quest_title="Read one page",
        )

    monkeypatch.setattr(ai_nudges, "generate_nudge_copy", generate)
    ai_nudges._daily_pack.cache_clear()
    try:
        first = ai_nudges.cached_nudge_copy(config, "reading", "Playful")
        assert first is not None and first.quest_title == "Read one page"
        assert ai_nudges.cached_nudge_copy(config, "reading", "Playful") == first
        assert ai_nudges.cached_nudge_copy(config, "unsupported", "Playful") is None
        assert calls == [("reading", "Playful")]
    finally:
        ai_nudges._daily_pack.cache_clear()


def test_holiday_prompt_combines_public_label_with_goal_and_tone():
    import json

    from app.domain.ai_nudges import TEMPLATES, nudge_request

    request = nudge_request("example", "reading", "Playful", "New Year's Day")
    assert json.loads(request["input"]) == {
        "activity": TEMPLATES["reading"][1],
        "tone": "Playful",
        "holiday": "New Year's Day",
    }
    assert "Mention the holiday" in request["instructions"]


def test_quest_prompt_uses_a_bounded_duration_and_no_personal_calendar_text(monkeypatch):
    import json

    from app.domain.ai_nudges import nudge_request

    body = nudge_request("example", "reading", "Playful", quest_minutes=10, quest_task=True)
    assert "within 10 minutes" in body["instructions"]
    assert "add the task name locally" in body["instructions"]
    assert json.loads(body["input"]) == {"activity": "an unfinished task", "tone": "Playful"}
    app, headers = authenticated_app(monkeypatch, settings())
    endpoint = "/v1/recommendations/nudge-copy?activity=reading&tone=Playful&quest_task=true"
    with TestClient(app) as client:
        response = client.get(endpoint + "&quest_minutes=10", headers=headers)
        assert response.status_code == 200 and response.json() is None
        assert client.get(endpoint + "&quest_minutes=60", headers=headers).status_code == 422
