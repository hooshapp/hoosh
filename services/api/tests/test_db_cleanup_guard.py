import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("db_test_cli", ROOT / "scripts/db-test.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


@pytest.mark.parametrize(
    "labels",
    [
        {},
        {"com.disconnect.scope": "production"},
        {"com.disconnect.scope": "isolated-test", "com.disconnect.database": "postgres"},
        {
            "com.disconnect.scope": "isolated-test",
            "com.disconnect.database": "disconnect_test",
            "com.docker.compose.project": "another-project",
        },
    ],
)
def test_reset_refuses_unverified_volumes_without_compose_cleanup(monkeypatch, labels):
    def inspect(arguments, **kwargs):
        assert arguments == ["docker", "volume", "inspect", "disconnect_db_test_data"]
        return subprocess.CompletedProcess(arguments, 0, json.dumps([{"Labels": labels}]))

    def forbidden(arguments):
        pytest.fail("Unsafe volume reached destructive cleanup")

    monkeypatch.setattr(module.subprocess, "run", inspect)
    monkeypatch.setattr(module, "run", forbidden)
    monkeypatch.setattr(sys, "argv", ["db-test.py", "reset"])
    with pytest.raises(SystemExit, match="refusing destructive cleanup"):
        module.main()


def test_verified_reset_uses_only_fixed_compose_target(monkeypatch):
    labels = {
        "com.disconnect.scope": "isolated-test",
        "com.disconnect.database": "disconnect_test",
        "com.docker.compose.project": "disconnect-db-tests",
    }
    monkeypatch.setattr(
        module.subprocess,
        "run",
        lambda *a, **kw: subprocess.CompletedProcess(a[0], 0, json.dumps([{"Labels": labels}])),
    )
    calls = []
    monkeypatch.setattr(module, "run", calls.append)
    monkeypatch.setattr(sys, "argv", ["db-test.py", "reset"])
    module.main()
    assert calls == [module.COMPOSE + ["down", "--volumes"]]
