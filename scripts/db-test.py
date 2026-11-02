"""Manage only the named disposable PostgreSQL fixture; never a cloud database."""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_ENV = ROOT / "services/api/tests/.env"
VOLUME = "disconnect_db_test_data"
COMPOSE = [
    "docker",
    "compose",
    "--project-name",
    "disconnect-db-tests",
    "--file",
    str(ROOT / "compose.test.yml"),
]


def run(arguments):
    return subprocess.run(arguments, cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["up", "check", "down", "reset"])
    action = parser.parse_args().action
    if action == "up":
        if not TEST_ENV.exists():
            fd = os.open(TEST_ENV, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w") as output:
                output.write(TEST_ENV.with_suffix(".example").read_text())
        run(COMPOSE + ["up", "--detach", "--wait", "--wait-timeout", "60"])
    elif action == "check":
        # Explicit marker selection; missing/bad DB config FAILS, never skips/SQLite.
        run(
            [
                sys.executable,
                "-m",
                "pytest",
                "services/api/tests",
                "-o",
                "addopts=",
                "-m",
                "database",
                "-q",
            ]
        )
    elif action == "down":
        run(COMPOSE + ["down"])
    else:
        result = subprocess.run(
            ["docker", "volume", "inspect", VOLUME],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            raise SystemExit("No verified test volume found; nothing was removed.")
        volume = json.loads(result.stdout)[0]
        labels = volume.get("Labels") or {}
        if (
            labels.get("com.disconnect.scope") != "isolated-test"
            or labels.get("com.disconnect.database") != "disconnect_test"
            or labels.get("com.docker.compose.project") != "disconnect-db-tests"
        ):
            raise SystemExit("Test volume labels differ; refusing destructive cleanup.")
        run(COMPOSE + ["down", "--volumes"])


if __name__ == "__main__":
    main()
