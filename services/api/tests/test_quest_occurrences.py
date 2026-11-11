import json
from datetime import UTC, date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from app.domain.quest_occurrences import boundary, occurrence
from app.schemas.quest_execution import QuestExecutionView, QuestSchedulePut
from app.schemas.quests import QuestDefinition


def definition(**patch):
    return QuestDefinition.model_validate(
        {
            "title": "Read",
            "activity": "Read a book",
            "start_local": "10:00",
            "end_local": "11:00",
            "next_day": False,
            "repeat": "daily",
            "weekdays": [],
            "timezone_id": "America/New_York",
            **patch,
        }
    )


def test_non_repeating_requires_the_explicit_date():
    d = definition(repeat="none")
    assert occurrence(d, date(2026, 11, 12), date(2026, 11, 11)) is None
    assert occurrence(d, date(2026, 11, 12), date(2026, 11, 13)) is None
    assert occurrence(d, date(2026, 11, 12), date(2026, 11, 12)) == (
        datetime(2026, 11, 12, 15, tzinfo=UTC),
        datetime(2026, 11, 12, 16, tzinfo=UTC),
    )


def test_weekly_days_are_owned_by_the_start_date_in_saved_zone():
    d = definition(
        start_local="23:30", end_local="00:30", next_day=True, repeat="weekly", weekdays=[0]
    )
    assert occurrence(d, date(2026, 11, 9), date(2026, 11, 10)) is None
    assert occurrence(d, date(2026, 11, 9), date(2026, 11, 9)) == (
        datetime(2026, 11, 10, 4, 30, tzinfo=UTC),
        datetime(2026, 11, 10, 5, 30, tzinfo=UTC),
    )


def test_dst_overlap_is_one_earliest_start_latest_end_window():
    times = occurrence(
        definition(start_local="01:15", end_local="01:45"), date(2026, 11, 1), date(2026, 11, 1)
    )
    assert times == (
        datetime(2026, 11, 1, 5, 15, tzinfo=UTC),
        datetime(2026, 11, 1, 6, 45, tzinfo=UTC),
    )


def test_dst_gap_clamps_instead_of_shifting_the_nonexistent_time():
    assert boundary(date(2026, 3, 8), "02:30", ZoneInfo("America/New_York"), end=False) == datetime(
        2026, 3, 8, 7, tzinfo=UTC
    )
    assert (
        occurrence(
            definition(start_local="02:15", end_local="02:45"), date(2026, 3, 8), date(2026, 3, 8)
        )
        is None
    )


@pytest.mark.parametrize(
    "value",
    [
        None,
        True,
        20261112,
        "20261112",
        "2026-2-12",
        "2026-02-30",
        "2019-12-31",
        "2101-01-01",
        "2026-11-12\n",
        "2026-11-12T00:00:00Z",
    ],
)
def test_schedule_dates_are_explicit_canonical_and_bounded(value):
    with pytest.raises(ValidationError):
        QuestSchedulePut.model_validate(
            {"expected_revision": 0, "quest_revision": 1, "enabled": True, "first_date": value}
        )


def test_shared_execution_fixture_and_all_output_clocks_are_canonical_utc():
    path = (
        Path(__file__).resolve().parents[3] / "packages/contracts/fixtures/quest-execution-v1.json"
    )
    fixture = json.loads(path.read_text())
    assert QuestExecutionView.model_validate(fixture).model_dump(mode="json") == fixture
    fixture["versions"][0]["effective_from"] = "2026-11-11T13:00:00.000001+01:00"
    fixture["observed_at"] = "2026-11-12T10:00:00+01:00"
    fixture["occurrences"][0]["starts_at"] = "2026-11-12T11:00:00+01:00"
    result = QuestExecutionView.model_validate(fixture).model_dump(mode="json")
    assert result["versions"][0]["effective_from"] == "2026-11-11T12:00:00.000001Z"
    assert result["observed_at"] == "2026-11-12T09:00:00Z"
    assert result["occurrences"][0]["starts_at"] == "2026-11-12T10:00:00Z"
