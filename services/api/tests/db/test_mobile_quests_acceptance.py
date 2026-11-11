"""Production portable quest client -> real local API -> guarded PostgreSQL."""

import json
import os
import subprocess
from pathlib import Path

import pytest

from tests.auth.support import LocalSigner, settings
from tests.support.http import running_process, signed_headers

pytestmark = pytest.mark.database
ROOT = Path(__file__).resolve().parents[4]


def mobile(origin, accounts, phase, report):
    environment = {
        key: value
        for key, value in os.environ.items()
        if key in {"PATH", "HOME", "TMPDIR", "SYSTEMROOT"}
    }
    environment["HOOSH_QUESTS_ACCEPTANCE"] = json.dumps(
        {
            "marker": "RN09B_HTTP_ACCEPTANCE_ONLY",
            "origin": origin,
            "accounts": accounts,
            "phase": phase,
        }
    )
    result = subprocess.run(
        [
            "node",
            str(ROOT / "node_modules/vitest/vitest.mjs"),
            "run",
            "--config",
            "dev/profile/acceptance/quests-vitest.config.mts",
            "--reporter=json",
            "--outputFile",
            str(report),
        ],
        cwd=ROOT / "apps/mobile",
        env=environment,
        capture_output=True,
        text=True,
        timeout=90,
    )
    payload = json.loads(report.read_text()) if report.exists() else {}
    if result.returncode or not payload.get("success"):
        failed = [
            item["title"]
            for suite in payload.get("testResults", [])
            for item in suite.get("assertionResults", [])
            if item.get("status") == "failed"
        ]
        pytest.fail(f"Isolated mobile quest {phase} failed: {failed or 'tool startup'}")
    assert payload["numPassedTests"] == (5 if phase == "write" else 1)


def test_mobile_quests_http_restart_and_isolation(db_settings, profile_accounts, tmp_path):
    signer = LocalSigner()
    config = settings(**db_settings.model_dump(exclude_none=True))
    accounts = [
        {
            "user_id": str(identity.user_id),
            "token": signed_headers(signer, {"sub": str(identity.user_id)})["Authorization"][7:],
        }
        for identity in profile_accounts
    ]
    reports = [tmp_path / "quest-write.json", tmp_path / "quest-restart.json"]
    try:
        with running_process(config, signer.jwk) as (client, first_pid):
            mobile(str(client.base_url), accounts, "write", reports[0])
        with running_process(config, signer.jwk) as (client, second_pid):
            assert first_pid != second_pid
            mobile(str(client.base_url), accounts, "restart", reports[1])
    finally:
        for report in reports:
            report.unlink(missing_ok=True)
