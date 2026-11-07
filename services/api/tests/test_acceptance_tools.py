import importlib.util
import json
import sys

import httpx2
import pytest

from tests.auth.support import settings
from tools import acceptance


def script(name):
    spec = importlib.util.spec_from_file_location(
        name.replace("-", "_"), acceptance.API_ROOT.parents[1] / f"scripts/{name}.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def private_input(tmp_path, monkeypatch):
    path = tmp_path / "live.env"
    path.write_text(
        "API_ACCEPTANCE_ACCESS_TOKEN_A=\nAPI_ACCEPTANCE_ACCESS_TOKEN_B=old-b\nAPI_ACCEPTANCE_PUBLISHABLE_KEY=sb_publishable_test\n"
    )
    path.chmod(0o600)
    monkeypatch.setattr(acceptance, "PRIVATE_INPUT", path)
    return path


@pytest.mark.parametrize(
    "value",
    [
        "http://example.com",
        "https://u:p@example.com",
        "https://example.com/path",
        "https://example.com?secret=x",
        "file:///tmp/file",
    ],
)
def test_acceptance_target_rejects_plaintext_remote_or_credential_urls(value):
    with pytest.raises(acceptance.AcceptanceError):
        acceptance.base_url(value)


def test_private_input_rejects_shared_permissions_and_symlinks(
    private_input, tmp_path, monkeypatch
):
    private_input.chmod(0o644)
    with pytest.raises(acceptance.AcceptanceError):
        acceptance.private_values()
    private_input.chmod(0o600)
    link = tmp_path / "linked.env"
    link.symlink_to(private_input)
    monkeypatch.setattr(acceptance, "PRIVATE_INPUT", link)
    with pytest.raises(acceptance.AcceptanceError):
        acceptance.private_values()


def test_login_prompts_privately_verifies_and_saves_access_only(private_input, monkeypatch, capsys):
    module = script("acceptance-login")
    monkeypatch.setattr(sys.stdin, "isatty", lambda: True)
    monkeypatch.setattr(
        sys, "argv", ["acceptance-login.py", "--project", "example", "--account", "A"]
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    prompts = iter(["private-email@example.invalid", "private-password"])
    monkeypatch.setattr(module.getpass, "getpass", lambda prompt: next(prompts))
    observed = []

    def handler(request):
        assert str(request.url) == "https://example.supabase.co/auth/v1/token?grant_type=password"
        assert request.headers["apikey"] == "sb_publishable_test"
        assert json.loads(request.content) == {
            "email": "private-email@example.invalid",
            "password": "private-password",
        }
        return httpx2.Response(
            200,
            json={"access_token": "private-access-token", "refresh_token": "private-refresh-token"},
        )

    client_type = httpx2.Client
    monkeypatch.setattr(
        module.httpx2,
        "Client",
        lambda **kwargs: client_type(transport=httpx2.MockTransport(handler), **kwargs),
    )

    async def verify(config, token):
        observed.append(token)

    monkeypatch.setattr(module, "verify", verify)
    module.main()
    assert observed == ["private-access-token"]
    text = private_input.read_text()
    assert "private-access-token" in text and "old-b" in text
    assert private_input.stat().st_mode & 0o777 == 0o600
    output = capsys.readouterr().out
    for secret in (
        "private-access-token",
        "private-password",
        "private-refresh-token",
        "private-email",
    ):
        assert secret not in output
    for secret in ("private-password", "private-refresh-token", "private-email"):
        assert secret not in text


def test_login_failure_has_no_retry_or_private_response_output(private_input, monkeypatch, capsys):
    module = script("acceptance-login")
    monkeypatch.setattr(sys.stdin, "isatty", lambda: True)
    monkeypatch.setattr(
        sys, "argv", ["acceptance-login.py", "--project", "example", "--account", "A"]
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    monkeypatch.setattr(module.getpass, "getpass", lambda prompt: "private-password")
    calls = []

    def handler(request):
        calls.append(request)
        return httpx2.Response(400, json={"message": "private-password-and-server-detail"})

    client_type = httpx2.Client
    monkeypatch.setattr(
        module.httpx2,
        "Client",
        lambda **kwargs: client_type(transport=httpx2.MockTransport(handler), **kwargs),
    )
    with pytest.raises(SystemExit) as error:
        module.main()
    assert len(calls) == 1 and "private" not in str(error.value)
    assert not acceptance.private_values()["API_ACCEPTANCE_ACCESS_TOKEN_A"]


def test_requested_accounts_do_not_silently_skip_or_contact_api_when_missing(
    private_input, monkeypatch
):
    module = script("api-acceptance")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "api-acceptance.py",
            "--project",
            "example",
            "--base-url",
            "http://127.0.0.1:8000",
            "--write-profiles",
        ],
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())

    def forbidden(**kwargs):
        pytest.fail("Missing tokens must fail before network")

    monkeypatch.setattr(module.httpx2, "Client", forbidden)
    with pytest.raises(SystemExit, match="both approved"):
        module.main()


def test_non_development_or_wrong_project_is_refused(monkeypatch):
    monkeypatch.setattr(acceptance, "Settings", lambda: settings())
    with pytest.raises(acceptance.AcceptanceError):
        acceptance.development_settings("different")
    monkeypatch.setattr(acceptance, "Settings", lambda: settings(app_env="production"))
    with pytest.raises(acceptance.AcceptanceError):
        acceptance.development_settings("example")


def test_login_refuses_noninteractive_password_fallback(private_input, monkeypatch):
    module = script("acceptance-login")
    monkeypatch.setattr(
        sys, "argv", ["acceptance-login.py", "--project", "example", "--account", "A"]
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    monkeypatch.setattr(sys.stdin, "isatty", lambda: False)

    def forbidden(prompt):
        pytest.fail("Password must not be requested without a terminal")

    monkeypatch.setattr(module.getpass, "getpass", forbidden)
    with pytest.raises(SystemExit, match="interactive terminal"):
        module.main()


def test_login_aborts_if_terminal_cannot_disable_echo(private_input, monkeypatch):
    module = script("acceptance-login")
    monkeypatch.setattr(
        sys, "argv", ["acceptance-login.py", "--project", "example", "--account", "A"]
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    monkeypatch.setattr(sys.stdin, "isatty", lambda: True)

    def cannot_hide(prompt):
        import warnings

        warnings.warn("Cannot hide input", module.getpass.GetPassWarning, stacklevel=1)
        pytest.fail("Hidden-input warning must stop before fallback reads input")

    monkeypatch.setattr(module.getpass, "getpass", cannot_hide)
    with pytest.raises(SystemExit, match="private details withheld"):
        module.main()
    assert not acceptance.private_values()["API_ACCEPTANCE_ACCESS_TOKEN_A"]


def test_unavailable_profile_mode_cannot_be_combined_with_writes(monkeypatch):
    module = script("api-acceptance")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "api-acceptance.py",
            "--project",
            "example",
            "--base-url",
            "http://127.0.0.1:8000",
            "--write-profiles",
            "--expect-profile-unavailable",
        ],
    )
    with pytest.raises(SystemExit) as error:
        module.main()
    assert error.value.code == 2


def test_unavailable_profile_mode_checks_signed_identity_without_db(monkeypatch):
    from fastapi.testclient import TestClient

    from tests.auth.support import USER_A, USER_B, LocalSigner
    from tests.support.http import authenticated_app, signed_headers

    signer = LocalSigner()
    app, _ = authenticated_app(
        monkeypatch, settings(cors_allowed_origins=["http://localhost:8081"]), signer=signer
    )
    identities = {"A": USER_A, "B": USER_B}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        assert app.state.database is None
        report = acceptance.unavailable_profile_checks(
            client, tokens, identities, origin="http://localhost:8081"
        )
        assert report["managedIdentityAB"].startswith("passed")
        assert report["profileUnavailableAB"].startswith("passed")
        assert report["nativeDevice"] == "not_run"


@pytest.mark.parametrize(
    "status,body",
    [
        (200, {"profile": None}),
        (
            503,
            {
                "error": {
                    "code": "AUTH_UNAVAILABLE",
                    "message": "Safe copy",
                    "retryable": True,
                    "request_id": "a46e48ad-c742-4e18-b57d-2c9a56544945",
                }
            },
        ),
    ],
)
def test_unavailable_profile_mode_rejects_false_absence_or_auth_error(status, body):
    from tests.auth.support import USER_A, USER_B

    def handler(request):
        common = {
            "X-Request-ID": "a46e48ad-c742-4e18-b57d-2c9a56544945",
            "Cache-Control": "no-store",
        }
        if request.url.path == "/v1/me":
            return httpx2.Response(
                200, headers=common, json={"user_id": str(USER_A), "email": None}
            )
        return httpx2.Response(status, headers=common, json=body)

    with httpx2.Client(
        base_url="https://api.example", transport=httpx2.MockTransport(handler)
    ) as client:
        with pytest.raises(acceptance.AcceptanceError):
            acceptance.unavailable_profile_checks(
                client,
                {"A": "a", "B": "b"},
                {"A": USER_A, "B": USER_B},
                origin="http://localhost:8081",
            )


@pytest.mark.parametrize(
    "flags",
    [
        ["--write-settings", "--write-profiles"],
        ["--write-settings", "--expect-profile-unavailable"],
        ["--with-settings", "--expect-profile-unavailable"],
    ],
)
def test_settings_modes_reject_incompatible_acceptance(flags, monkeypatch):
    module = script("api-acceptance")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "api-acceptance.py",
            "--project",
            "example",
            "--base-url",
            "http://127.0.0.1:8000",
            *flags,
        ],
    )
    monkeypatch.setattr(
        module,
        "development_settings",
        lambda project: pytest.fail("Mode guard must precede configuration/network"),
    )
    with pytest.raises(SystemExit) as error:
        module.main()
    assert error.value.code == 2


@pytest.mark.parametrize("flag,write", [("--with-settings", False), ("--write-settings", True)])
def test_settings_cli_verifies_both_tokens_and_never_writes_profiles(
    private_input, monkeypatch, capsys, flag, write
):
    from tests.auth.support import USER_A, USER_B

    module = script("api-acceptance")
    acceptance.save_token("A", "private-a")
    monkeypatch.setattr(
        sys,
        "argv",
        ["api-acceptance.py", "--project", "example", "--base-url", "http://127.0.0.1:8000", flag],
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    seen = []

    async def identities(config, tokens):
        assert tokens == {"A": "private-a", "B": "old-b"}
        seen.append("verified")
        return {"A": USER_A, "B": USER_B}

    monkeypatch.setattr(module, "identities", identities)
    monkeypatch.setattr(module, "transport_checks", lambda *args: {})

    def accounts(client, tokens, expected, **kwargs):
        assert seen == ["verified"] and kwargs["write"] is False
        seen.append("accounts")
        return {"managedProfileWriteAB": "not_run"}

    def settings_journey(client, tokens, expected, **kwargs):
        assert seen == ["verified", "accounts"] and kwargs["write"] is write
        return {"managedSettingsWriteAB": "requested" if write else "not_run"}

    monkeypatch.setattr(module, "account_checks", accounts)
    monkeypatch.setattr(module, "settings_checks", settings_journey)
    module.main()
    output = capsys.readouterr().out
    assert "private-a" not in output and str(USER_A) not in output
    assert json.loads(output)["managedProfileWriteAB"] == "not_run"


@pytest.mark.parametrize("flag", ["--with-settings", "--write-settings"])
def test_settings_cli_missing_tokens_stops_before_api(private_input, monkeypatch, flag):
    module = script("api-acceptance")
    monkeypatch.setattr(
        sys,
        "argv",
        ["api-acceptance.py", "--project", "example", "--base-url", "http://127.0.0.1:8000", flag],
    )
    monkeypatch.setattr(module, "development_settings", lambda project: settings())
    monkeypatch.setattr(
        module.httpx2, "Client", lambda **kwargs: pytest.fail("No API without both tokens")
    )
    with pytest.raises(SystemExit, match="both approved"):
        module.main()


def test_settings_read_rejects_other_owner_without_writing():
    from tests.auth.support import USER_A, USER_B

    calls = []

    def handler(request):
        calls.append((request.method, request.url.path))
        assert request.method == "GET"
        body = (
            {"profile": None}
            if request.url.path == "/v1/profile"
            else {
                "settings": {
                    "user_id": str(USER_B),
                    "revision": 1,
                    "activities": {"selected_activity_ids": [], "custom_text": None},
                    "plan_draft": None,
                    "created_at": "2026-11-07T12:00:00Z",
                    "updated_at": "2026-11-07T12:00:00Z",
                }
            }
        )
        return httpx2.Response(
            200,
            headers={
                "X-Request-ID": "a46e48ad-c742-4e18-b57d-2c9a56544945",
                "Cache-Control": "no-store",
            },
            json=body,
        )

    with httpx2.Client(
        base_url="https://api.example", transport=httpx2.MockTransport(handler)
    ) as client:
        with pytest.raises(acceptance.AcceptanceError, match="Settings owner mismatch"):
            acceptance.settings_checks(
                client,
                {"A": "a", "B": "b"},
                {"A": USER_A, "B": USER_B},
                write=True,
                origin="https://browser.example",
            )
    assert calls == [("GET", "/v1/profile"), ("GET", "/v1/settings")]


@pytest.mark.parametrize(
    "tokens,expected",
    [
        ({}, {}),
        ({"A": "a", "B": ""}, {"A": "one", "B": "two"}),
        ({"A": "a", "B": "b"}, {"A": "same", "B": "same"}),
    ],
)
def test_settings_refuses_missing_or_same_accounts_before_requests(tokens, expected):
    with pytest.raises(acceptance.AcceptanceError, match="Two distinct"):
        acceptance.settings_checks(
            None, tokens, expected, write=True, origin="https://browser.example"
        )
