"""Check a running development API without printing identities or credentials."""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services/api"))
import httpx2
from app.core.auth import SupabaseTokenVerifier
from app.core.jwks import JwksResolver
from tools.acceptance import (
    TOKEN_KEYS,
    AcceptanceError,
    account_checks,
    base_url,
    development_settings,
    private_values,
    settings_checks,
    transport_checks,
    unavailable_profile_checks,
)


async def identities(config, tokens):
    resolver = JwksResolver(config)
    try:
        verifier = SupabaseTokenVerifier(config, resolver)
        return {
            label: (await verifier.verify(token)).user_id
            for label, token in tokens.items()
        }
    finally:
        await resolver.aclose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--origin", default="http://localhost:8081")
    parser.add_argument("--with-accounts", action="store_true")
    parser.add_argument(
        "--with-settings", action="store_true", help="Read A/B settings without writes"
    )
    profile_mode = parser.add_mutually_exclusive_group()
    profile_mode.add_argument(
        "--write-profiles",
        action="store_true",
        help="Approved disposable accounts only; created rows remain",
    )
    profile_mode.add_argument(
        "--expect-profile-unavailable",
        action="store_true",
        help="Verify A/B identity while GET/PATCH profile fail with dependency 503; no DB setup",
    )
    profile_mode.add_argument(
        "--write-settings",
        action="store_true",
        help="Approved disposable accounts only; restore values, retain rows and advance revisions",
    )
    args = parser.parse_args()
    if args.with_settings and args.expect_profile_unavailable:
        parser.error(
            "Settings reads cannot be combined with unavailable-database acceptance"
        )
    try:
        config = development_settings(args.project)
        origin = base_url(args.origin)
        target = base_url(args.base_url)
        tokens, expected = {}, {}
        if (
            args.with_accounts
            or args.write_profiles
            or args.expect_profile_unavailable
            or args.with_settings
            or args.write_settings
        ):
            values = private_values()
            tokens = {label: values.get(key) or "" for label, key in TOKEN_KEYS.items()}
            if not all(tokens.values()):
                raise AcceptanceError(
                    "Save both approved account tokens before account acceptance"
                )
            expected = asyncio.run(identities(config, tokens))
            if len(set(expected.values())) != 2:
                raise AcceptanceError(
                    "Accounts A and B must be different verified users"
                )
        with httpx2.Client(
            base_url=target,
            timeout=15,
            verify=True,
            trust_env=False,
            follow_redirects=False,
        ) as client:
            report = transport_checks(client, origin)
            if args.expect_profile_unavailable:
                report.update(
                    unavailable_profile_checks(client, tokens, expected, origin=origin)
                )
            elif tokens:
                report.update(
                    account_checks(
                        client,
                        tokens,
                        expected,
                        write=args.write_profiles,
                        origin=origin,
                    )
                )
                if args.with_settings or args.write_settings:
                    report.update(
                        settings_checks(
                            client,
                            tokens,
                            expected,
                            write=args.write_settings,
                            origin=origin,
                        )
                    )
            else:
                report["managedAccounts"] = "not_run; no user tokens requested"
        print(json.dumps(report, indent=2))
    except AcceptanceError as error:
        raise SystemExit(str(error)) from None
    except Exception:  # noqa: BLE001 - no response/credential-bearing exceptions
        raise SystemExit(
            "Acceptance stopped; refetch after any ambiguous write; private details withheld"
        ) from None


if __name__ == "__main__":
    main()
