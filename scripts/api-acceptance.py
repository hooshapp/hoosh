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
    transport_checks,
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
        "--write-profiles",
        action="store_true",
        help="Approved disposable accounts only; created rows remain",
    )
    args = parser.parse_args()
    try:
        config = development_settings(args.project)
        origin = base_url(args.origin)
        target = base_url(args.base_url)
        tokens, expected = {}, {}
        if args.with_accounts or args.write_profiles:
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
            if tokens:
                report.update(
                    account_checks(
                        client,
                        tokens,
                        expected,
                        write=args.write_profiles,
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
