"""Export deterministic OpenAPI from pure assembly, without runtime configuration."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services/api"))
from app.application import create_app

OUTPUT = ROOT / "packages/contracts/openapi/foundation.openapi.json"


def schema_text() -> str:
    # No Settings(), main.app, lifespan entry, network client or success identity.
    return (
        json.dumps(create_app().openapi(), indent=2, sort_keys=True, ensure_ascii=True)
        + "\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--stdout", action="store_true")
    args = parser.parse_args()
    text = schema_text()
    if args.stdout:
        print(text, end="")
    elif args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != text:
            raise SystemExit(
                "OpenAPI drift: run npm run api:generate and review both generated files."
            )
        print("OpenAPI matches environment-free application assembly.")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(text)
        print("Exported packages/contracts/openapi/foundation.openapi.json")


if __name__ == "__main__":
    main()
