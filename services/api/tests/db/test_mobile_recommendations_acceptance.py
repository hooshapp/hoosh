"""Actual portable recommendations client, verified JWT TCP API, PG17 and API restart."""

import json
import os
import subprocess
from pathlib import Path

import pytest

from tests.auth.support import LocalSigner, settings
from tests.support.http import running_process, signed_headers

pytestmark = pytest.mark.database
ROOT = Path(__file__).resolve().parents[4]


def test_mobile_recommendations_http_restart_and_isolation(
    db_settings, resource, profile_accounts, tmp_path
):
    signer = LocalSigner()
    config = settings(**db_settings.model_dump(exclude_none=True))
    accounts = [
        {
            "user_id": str(i.user_id),
            "token": signed_headers(signer, {"sub": str(i.user_id)})["Authorization"][7:],
        }
        for i in profile_accounts
    ]
    pids = []
    for phase, expected in (("write", 4), ("restart", 1)):
        report = tmp_path / f"recommendations-{phase}.json"
        try:
            with running_process(config, signer.jwk) as (client, pid):
                pids.append(pid)
                environment = {
                    k: v
                    for k, v in os.environ.items()
                    if k in {"PATH", "HOME", "TMPDIR", "SYSTEMROOT"}
                }
                environment["HOOSH_RECOMMENDATIONS_ACCEPTANCE"] = json.dumps(
                    {
                        "marker": "RN09_RECOMMENDATIONS_HTTP_ACCEPTANCE_ONLY",
                        "origin": str(client.base_url),
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
                        "dev/profile/acceptance/recommendations-vitest.config.mts",
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
                    failure = failed or "tool startup"
                    pytest.fail(f"Isolated recommendations {phase} failed: {failure}")
                assert payload["numPassedTests"] == expected
        finally:
            report.unlink(missing_ok=True)
    assert pids[0] != pids[1]
