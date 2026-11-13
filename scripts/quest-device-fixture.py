"""Disposable local HTTP accounts for physical quest UI/native acceptance only.

Uses the normal JWT verifier with an ephemeral test JWKS. Never reads hosted .env,
changes Supabase Auth, or supplies an application sign-in implementation.
"""

import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "services/api"
sys.path.insert(0, str(API))

import httpx2
from app.db.migrations import HEAD
from tests.auth.support import LocalSigner, settings
from tests.support import database

OUTPUT = API / ".local/quest-device-fixture.json"
PORT = 8765


def main(duration_minutes=45):
    if duration_minutes not in (15, 45, 90):
        raise ValueError("Use a bounded 15,45 or90 minute fixture duration")
    # Validate both explicit loopback URIs/marker/PG17 before any fixture mutation.
    values = database.environment()
    users = [uuid4(), uuid4()]
    created_users = []
    child = None
    artifact_created = False
    with database.connect(values, "TEST_MIGRATION_DATABASE_URL") as admin:
        if OUTPUT.exists() or OUTPUT.is_symlink():
            raise ValueError("Existing fixture artifact must not be overwritten")
        OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if OUTPUT.parent.resolve() != API.resolve() / ".local":
            raise ValueError("Private fixture directory must not be redirected")
        ignored = subprocess.run(
            ["git", "check-ignore", "--quiet", str(OUTPUT)], cwd=ROOT, check=False
        )
        if ignored.returncode:
            raise ValueError("Private fixture artifact must be ignored")
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            probe.bind(("127.0.0.1", PORT))
        # The existing acceptance runner owns schema upgrades. Refuse an old schema.
        head = admin.execute(
            "SELECT version_num FROM public.alembic_version"
        ).fetchall()
        if head != [(HEAD,)]:
            raise ValueError("Run the guarded database acceptance/migrations first")
        try:
            for user in users:
                admin.execute("INSERT INTO auth.users(id) VALUES (%s)", (user,))
                created_users.append(user)
            signer = LocalSigner()
            now = int(time.time())
            accounts = [
                {
                    "user_id": str(user),
                    "token": signer.token(
                        {
                            "sub": str(user),
                            "email": None,
                            "iat": now - 60,
                            "exp": now + (duration_minutes + 15) * 60,
                        }
                    ),
                }
                for user in users
            ]
            config = settings(app_env="test", database_url=values["TEST_DATABASE_URL"])
            runtime = config.model_dump(mode="json", exclude_none=True)
            runtime["database_url"] = config.database_url.get_secret_value()
            child = subprocess.Popen(
                [sys.executable, "-m", "tests.support.settings_process"],
                cwd=API,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                text=True,
            )
            child.stdin.write(
                json.dumps(
                    {"settings": runtime, "public_jwk": signer.jwk, "port": PORT}
                )
                + "\n"
            )
            child.stdin.close()
            origin = f"http://127.0.0.1:{PORT}"
            with httpx2.Client(base_url=origin, timeout=5, trust_env=False) as client:
                deadline = time.monotonic() + 10
                while time.monotonic() < deadline:
                    if child.poll() is not None:
                        raise RuntimeError("Fixture API exited before readiness")
                    try:
                        if client.get("/healthz").status_code == 200:
                            break
                    except httpx2.RequestError:
                        pass
                    time.sleep(0.05)
                else:
                    raise RuntimeError("Fixture API did not become ready")
                quest_id = str(uuid4())
                start = datetime.now(UTC) + timedelta(minutes=10)
                end = start + timedelta(minutes=2)
                for index, account in enumerate(accounts):
                    headers = {"Authorization": "Bearer " + account["token"]}
                    client.patch(
                        "/v1/settings",
                        headers=headers,
                        json={
                            "expected_revision": 0,
                            "activities": {
                                "selected_activity_ids": ["reading"],
                                "custom_text": None,
                            },
                            "plan_draft": {
                                "weekdays": [],
                                "hours": None,
                                "timezone_id": "UTC",
                                "session_count": 2,
                                "session_minutes": 1,
                            },
                        },
                    ).raise_for_status()
                    client.put(
                        f"/v1/quests/{quest_id}",
                        headers=headers,
                        json={
                            "expected_revision": 0,
                            "definition": {
                                "title": f"Device acceptance {'A' if index == 0 else 'B'}",
                                "activity": "Read a page",
                                "start_local": start.strftime("%H:%M"),
                                "end_local": end.strftime("%H:%M"),
                                "next_day": start.date() != end.date(),
                                "repeat": "none",
                                "weekdays": [],
                                "timezone_id": "UTC",
                            },
                        },
                    ).raise_for_status()
                payload = {
                    "marker": "RN09B_LOCAL_DEVICE_FIXTURE_ONLY",
                    "origin": origin,
                    "quest_id": quest_id,
                    "accounts": accounts,
                }
                descriptor = os.open(
                    OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600
                )
                artifact_created = True
                with os.fdopen(descriptor, "w") as output:
                    json.dump(payload, output)
                print(
                    "Local quest fixture ready on loopback8765; two isolated accounts, private artifact saved. No hosted Auth/SDK.",
                    flush=True,
                )
                # Bound test lifetime. KeyboardInterrupt/SIGTERM both run scoped cleanup.
                deadline = time.monotonic() + duration_minutes * 60
                while child.poll() is None and time.monotonic() < deadline:
                    time.sleep(1)
                if child.poll() is not None:
                    raise RuntimeError("Fixture API stopped unexpectedly")
        finally:
            if child is not None:
                if child.poll() is None:
                    child.terminate()
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait(timeout=5)
            if artifact_created:
                OUTPUT.unlink(missing_ok=True)
            # Only this process's newly generated users, only in the guarded test DB.
            if created_users:
                admin.execute(
                    "DELETE FROM auth.users WHERE id=ANY(%s)", (created_users,)
                )
            print(
                "Local fixture resources cleaned; private artifact removed.", flush=True
            )


def stop_fixture(_signal, _frame):
    raise KeyboardInterrupt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--duration-minutes", type=int, choices=(15, 45, 90), default=45
    )
    arguments = parser.parse_args()
    signal.signal(signal.SIGTERM, stop_fixture)
    try:
        main(arguments.duration_minutes)
    except KeyboardInterrupt:
        pass
    except Exception as error:  # noqa: BLE001 - sanitize all operator failures, including DB errors
        # Never render exception/HTTP bodies, SQL parameters, keys or credentials.
        print(
            f"Local fixture unavailable ({type(error).__name__}); details withheld.",
            file=sys.stderr,
        )
        sys.exit(1)
