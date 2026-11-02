"""Sign in to one approved disposable account; save only its access token privately."""

import argparse
import asyncio
import getpass
import sys
import warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services/api"))
import httpx2
from app.core.auth import SupabaseTokenVerifier
from app.core.jwks import JwksResolver
from tools.acceptance import (
    AcceptanceError,
    development_settings,
    private_values,
    save_token,
)


async def verify(config, token):
    resolver = JwksResolver(config)
    try:
        await SupabaseTokenVerifier(config, resolver).verify(token)
    finally:
        await resolver.aclose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--account", choices=["A", "B"], required=True)
    args = parser.parse_args()
    try:
        config = development_settings(args.project)
        key = private_values().get("API_ACCEPTANCE_PUBLISHABLE_KEY") or ""
        if not key.startswith("sb_publishable_"):
            raise AcceptanceError(
                "Configure the development publishable key in the private file"
            )
        if not sys.stdin.isatty():
            raise AcceptanceError(
                "Run this helper in an interactive terminal for hidden prompts"
            )
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            email = getpass.getpass("Approved test account email (hidden): ")
            password = getpass.getpass("Account password (hidden): ")
        with httpx2.Client(
            timeout=10, verify=True, trust_env=False, follow_redirects=False
        ) as client:
            with client.stream(
                "POST",
                f"{config.supabase_project_url}/auth/v1/token?grant_type=password",
                headers={"apikey": key},
                json={"email": email, "password": password},
            ) as response:
                if response.status_code != 200:
                    raise AcceptanceError(
                        "Sign-in failed; confirm this account with Anisha"
                    )
                content = bytearray()
                for chunk in response.iter_bytes():
                    if len(content) + len(chunk) > 65536:
                        raise AcceptanceError("Unexpected sign-in response size")
                    content.extend(chunk)
            import json

            result = json.loads(content)
        token = result.get("access_token") if isinstance(result, dict) else None
        if not isinstance(token, str):
            raise AcceptanceError(
                "No access token returned; use Anisha's existing sign-in flow"
            )
        asyncio.run(verify(config, token))
        save_token(args.account, token)
        print(
            f"Account {args.account} access token verified and saved privately. No password/refresh token saved."
        )
    except AcceptanceError as error:
        raise SystemExit(str(error)) from None
    except (Exception, KeyboardInterrupt):  # noqa: BLE001 - never expose private auth/driver text
        raise SystemExit(
            "Sign-in stopped; private details withheld and no automatic retry"
        ) from None


if __name__ == "__main__":
    main()
