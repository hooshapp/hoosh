"""Pure target/credential-hygiene checks; actual PostgreSQL checks live in SB-05."""

import importlib.util
import sys
from pathlib import Path

import psycopg
import pytest
from psycopg.conninfo import conninfo_to_dict

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location(
    "db_configuration", ROOT / "scripts/configure-db-access.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
PROJECT = "eaisvwqfbgdkzdfmxkvm"
URI = f"postgresql://postgres.{PROJECT}:synthetic-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"


def test_target_validation_pins_tls_role_project_and_session_mode(tmp_path):
    ca = tmp_path / "local-ca.pem"
    ca.write_text("fixture only; driver checks real CA contents on connect")
    parameters = module.connection_parameters(
        URI + "?sslmode=disable", PROJECT, runtime=False, root_cert=str(ca)
    )
    assert parameters["sslmode"] == "verify-full"
    assert parameters["sslrootcert"] == str(ca)
    assert parameters["connect_timeout"] == 5
    assert (
        module.connection_parameters(
            module.private_uri(parameters), PROJECT, runtime=False, root_cert=str(ca)
        )["host"]
        == parameters["host"]
    )


@pytest.mark.parametrize(
    "uri",
    [
        URI.replace(":5432/", ":6543/"),
        URI.replace("/postgres", "/disconnect_test"),
        URI.replace(f"postgres.{PROJECT}", "postgres.wrongproject"),
        URI.replace("aws-0-us-east-1.pooler.supabase.com", "attacker.example"),
        URI + "?hostaddr=127.0.0.1",
        URI + "?options=-c%20role=postgres",
        URI + "?service=unexpected",
        URI.replace("synthetic-password", "[YOUR-PASSWORD]"),
        URI.replace("postgresql://", "postgresql+psycopg://"),
        URI.replace(f"postgres.{PROJECT}", f"disconnect_api.{PROJECT}"),
    ],
)
def test_unsafe_targets_are_rejected_before_connect(uri, tmp_path):
    ca = tmp_path / "ca.pem"
    ca.touch()
    with pytest.raises(ValueError):
        module.connection_parameters(uri, PROJECT, runtime=False, root_cert=str(ca))


def test_uri_encodes_reserved_password_and_ca_path_characters():
    values = {
        "user": "disconnect_api",
        "password": "fixture:@/#$?% with spaces",
        "host": f"db.{PROJECT}.supabase.co",
        "sslrootcert": "/fixture path/ca.pem",
    }
    parsed = conninfo_to_dict(module.private_uri(values))
    assert parsed["password"] == values["password"]
    assert parsed["sslrootcert"] == values["sslrootcert"]
    assert parsed["sslmode"] == "verify-full"


def test_cli_does_not_echo_credential_bearing_driver_errors(monkeypatch):
    def fail(*args):
        raise RuntimeError("synthetic-secret-in-driver-message")

    monkeypatch.setattr(module, "configure", fail)
    monkeypatch.setattr(
        sys, "argv", ["configure-db-access.py", "--project", PROJECT, "--root-cert", "/fixture"]
    )
    with pytest.raises(SystemExit) as error:
        module.main()
    assert "RuntimeError" in str(error.value)
    assert "synthetic-secret" not in str(error.value)


@pytest.mark.parametrize(
    "driver_message,category",
    [
        ("synthetic-secret password authentication failed", "rejected the database password"),
        ("synthetic-secret certificate verify failed", "TLS verification failed"),
        ("synthetic-secret timeout expired", "timed out"),
        ("synthetic-secret unexpected failure", "review target and credentials privately"),
    ],
)
def test_driver_failures_become_safe_actionable_categories(monkeypatch, driver_message, category):
    def fail(**kwargs):
        raise psycopg.OperationalError(driver_message)

    monkeypatch.setattr(module.psycopg, "connect", fail)
    with pytest.raises(module.HandoffError) as error:
        module.connect({})
    assert category in str(error.value)
    assert "synthetic-secret" not in str(error.value)
