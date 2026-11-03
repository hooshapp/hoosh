"""Production portable mobile client -> real HTTP process -> isolated PostgreSQL.

No hosted configuration or Auth SDK is consumed. Ephemeral signed credentials are
passed only in the child process environment, never command arguments or files.
"""

import json
import os
import subprocess
from pathlib import Path

import pytest

from tests.auth.support import LocalSigner, settings
from tests.support import database
from tests.support.http import running_process, signed_headers
from tests.support.profiles import snapshot as profile_snapshot

pytestmark = pytest.mark.database
ROOT = Path(__file__).resolve().parents[4]


def mobile_checks(origin, accounts, phase, report):
    environment = {
        key: value
        for key, value in os.environ.items()
        if key in {"PATH", "HOME", "TMPDIR", "SYSTEMROOT"}
    }
    environment["HOOSH_SETTINGS_ACCEPTANCE"] = json.dumps(
        {
            "marker": "RN09L_HTTP_ACCEPTANCE_ONLY",
            "origin": origin,
            "accounts": accounts,
            "phase": phase,
        }
    )
    # Never print raw subprocess output, JWTs or inherited provider configuration.
    result = subprocess.run(
        [
            "node",
            str(ROOT / "node_modules/vitest/vitest.mjs"),
            "run",
            "--config",
            "dev/profile/acceptance/vitest.config.mts",
            "--reporter=json",
            "--outputFile",
            str(report),
        ],
        cwd=ROOT / "apps/mobile",
        env=environment,
        capture_output=True,
        text=True,
        timeout=90,
        check=False,
    )
    if result.returncode or not report.exists():
        # JSON assertion names are fixed source text; raw failures can contain credentials.
        failed = []
        if report.exists():
            payload = json.loads(report.read_text())
            failed = [
                item["title"]
                for suite in payload.get("testResults", [])
                for item in suite.get("assertionResults", [])
                if item.get("status") == "failed"
            ]
        pytest.fail(f"Mobile {phase} acceptance failed: {failed or 'fixture/tool startup'}")
    payload = json.loads(report.read_text())
    assert payload["success"] and payload["numFailedTests"] == 0
    assert payload["numPassedTests"] == (7 if phase == "write" else 1)


def test_mobile_settings_over_real_http_and_postgres_restart(
    db_settings, db_environment, profile_accounts, tmp_path
):
    signer = LocalSigner()
    config = settings(**db_settings.model_dump(exclude_none=True))
    accounts = [
        {
            "user_id": str(identity.user_id),
            "token": signed_headers(signer, {"sub": str(identity.user_id)})["Authorization"][7:],
        }
        for identity in profile_accounts
    ]
    profiles_before = profile_snapshot(db_environment, profile_accounts)
    reports = [tmp_path / "mobile-write.json", tmp_path / "mobile-restart.json"]
    try:
        with running_process(config, signer.jwk) as (client, first_pid):
            mobile_checks(str(client.base_url), accounts, "write", reports[0])
        with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
            persisted = admin.execute(
                "SELECT user_id, revision, activities, plan_draft FROM public.user_settings "
                "WHERE user_id=ANY(%s) ORDER BY user_id",
                ([identity.user_id for identity in profile_accounts],),
            ).fetchall()
        assert len(persisted) == 2
        owner = next(row for row in persisted if row[0] == profile_accounts[0].user_id)
        assert owner[1] == 9 and owner[2]["custom_text"] == "RN09L final 🦖"
        assert owner[3]["hours"]["end_local"] is None
        with running_process(config, signer.jwk) as (client, second_pid):
            assert first_pid != second_pid
            mobile_checks(str(client.base_url), accounts, "restart", reports[1])
        with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
            after = admin.execute(
                "SELECT user_id, revision, activities, plan_draft FROM public.user_settings "
                "WHERE user_id=ANY(%s) ORDER BY user_id",
                ([identity.user_id for identity in profile_accounts],),
            ).fetchall()
        assert after == persisted
        assert profile_snapshot(db_environment, profile_accounts) == profiles_before
    finally:
        # JSON failure payloads are disposable too; retain only sanitized acceptance evidence.
        for report in reports:
            report.unlink(missing_ok=True)
