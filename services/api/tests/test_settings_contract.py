import importlib.util
import json
import zoneinfo
from pathlib import Path
from typing import get_args

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker
from pydantic import ValidationError

from app.application import create_app
from app.db.base import Base
from app.db.migrations import config, offline_sql
from app.models import Profile, UserSettings
from app.models.settings import SETTINGS_CHECKS
from app.schemas.settings import (
    ActivityId,
    ActivityPreferences,
    DraftHours,
    PlanDraft,
    SettingsPatch,
    SettingsResponse,
    SettingsSavedResponse,
    _timezone_names,
)

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = json.loads((ROOT / "packages/contracts/fixtures/settings-v1.json").read_text())


@pytest.mark.parametrize("case", FIXTURES["valid_patches"], ids=lambda case: case["id"])
def test_valid_patch_fixtures_preserve_explicit_section_presence_and_canonical_values(case):
    value = SettingsPatch.model_validate_json(json.dumps(case["input"]))
    assert value.model_dump(mode="json", exclude_unset=True) == case["canonical"]
    Draft202012Validator(SettingsPatch.model_json_schema()).validate(case["canonical"])


@pytest.mark.parametrize("case", FIXTURES["invalid_patches"], ids=lambda case: case["id"])
def test_invalid_patch_fixtures_fail_without_coercion_or_unknown_policy_fields(case):
    with pytest.raises(ValidationError):
        SettingsPatch.model_validate_json(json.dumps(case["input"]))


def test_activity_ids_match_the_recorded_existing_ui_mapping_without_importing_specimens():
    choices = FIXTURES["activity_choices"]
    assert [row["id"] for row in choices] == list(get_args(ActivityId))
    assert [row["legacy_ui_id"] for row in choices] == [
        "Gym",
        "Reading",
        "Arts and crafts",
        "Walking",
        "Music",
        "Cooking",
    ]
    assert len({row["id"] for row in choices}) == 6


@pytest.mark.parametrize("text", ["🦖" * 200, "e\u0301" * 100, "\ufeffretained", "\u200b"])
def test_custom_activity_counts_codepoints_without_js_trim_or_unicode_normalization(text):
    value = ActivityPreferences(selected_activity_ids=[], custom_text="\u001c " + text + "\u0085")
    assert value.custom_text == text


@pytest.mark.parametrize("text", ["\ud800", "a\udfff", "a\x00", "🦖" * 201])
def test_invalid_unicode_or_excessive_codepoints_are_rejected(text):
    with pytest.raises(ValidationError):
        ActivityPreferences(selected_activity_ids=[], custom_text=text)


def test_partial_hours_and_independent_nullable_session_fields_do_not_invent_defaults():
    value = PlanDraft(
        **(
            FIXTURES["empty_plan_draft"]
            | {
                "hours": {"start_local": None, "end_local": "10:30", "next_day": False},
                "session_minutes": 5,
            }
        )
    )
    assert value.hours.start_local is None and value.session_count is None
    assert value.timezone_id is None and value.weekdays == []


@pytest.mark.parametrize("key", ["posix/UTC", "right/UTC"])
def test_platform_specific_timezone_trees_are_not_portable_draft_ids(key):
    with pytest.raises(ValidationError):
        PlanDraft(**(FIXTURES["empty_plan_draft"] | {"timezone_id": key}))


def test_packaged_timezone_data_works_without_a_system_database():
    previous = zoneinfo.TZPATH
    try:
        zoneinfo.reset_tzpath(())
        _timezone_names.cache_clear()
        value = PlanDraft(**(FIXTURES["empty_plan_draft"] | {"timezone_id": "America/New_York"}))
        assert value.timezone_id == "America/New_York"
    finally:
        zoneinfo.reset_tzpath(previous)
        _timezone_names.cache_clear()


@pytest.mark.parametrize("value", ["07:05", "00:00", "23:59"])
def test_local_clock_values_remain_strings_without_attaching_a_date_or_timezone(value):
    assert DraftHours(start_local=value, end_local=None, next_day=False).start_local == value


def test_patch_omission_is_not_equivalent_to_explicit_clear():
    omitted = SettingsPatch(expected_revision=2, activities=None)
    cleared = SettingsPatch(expected_revision=2, activities=None, plan_draft=None)
    assert omitted.model_dump(exclude_unset=True) == {"expected_revision": 2, "activities": None}
    assert cleared.model_dump(exclude_unset=True)["plan_draft"] is None
    assert "plan_draft" not in omitted.model_fields_set


def test_nullable_get_and_nonnullable_save_response_with_required_sections_and_utc_clocks():
    assert SettingsResponse.model_validate(FIXTURES["absent_response"]).settings is None
    with pytest.raises(ValidationError):
        SettingsSavedResponse.model_validate(FIXTURES["absent_response"])
    canonical = SettingsSavedResponse.model_validate(FIXTURES["existing_response"])
    assert canonical.model_dump(mode="json") == FIXTURES["existing_response"]
    schema = SettingsSavedResponse.model_json_schema()
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(
        canonical.model_dump(mode="json")
    )
    body = FIXTURES["existing_response"]["settings"] | {"created_at": "2026-11-02T13:00:00+01:00"}
    assert (
        SettingsSavedResponse(settings=body)
        .model_dump(mode="json")["settings"]["created_at"]
        .endswith("12:00:00Z")
    )
    with pytest.raises(ValidationError):
        SettingsSavedResponse(settings=body | {"created_at": "2026-11-02T12:00:00"})


def test_owned_metadata_and_new_migration_preserve_the_original_profile_history():
    assert set(Base.metadata.tables) == {
        "public.profiles",
        "public.user_settings",
        "public.user_quests",
    }
    assert set(UserSettings.__table__.c.keys()) == {
        "user_id",
        "activities",
        "plan_draft",
        "revision",
        "created_at",
        "updated_at",
    }
    foreign = next(iter(UserSettings.__table__.foreign_keys))
    assert foreign.target_fullname == "auth.users.id" and foreign.ondelete == "CASCADE"
    assert foreign.column is next(iter(Profile.__table__.foreign_keys)).column
    assert foreign.column.table.metadata is not Base.metadata
    from alembic.script import ScriptDirectory

    history = ScriptDirectory.from_config(config())
    assert history.get_revision("20261102_0002").down_revision == "20261102_0001"
    path = ROOT / "services/api/alembic/versions/20261102_0002_user_settings.py"
    spec = importlib.util.spec_from_file_location("frozen_settings_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.CHECKS == SETTINGS_CHECKS
    assert "CREATE TABLE public.user_settings" in offline_sql()
    assert "CREATE TABLE auth.users" not in offline_sql()


def test_settings_endpoints_publish_the_storage_contract_without_auth_bypass():
    app = create_app()
    assert set(app.openapi()["paths"]["/v1/settings"]) == {"get", "patch"}
    with TestClient(app) as client:
        assert client.get("/v1/settings").status_code == 401
        assert client.patch("/v1/settings", json={"expected_revision": 0}).status_code == 401
