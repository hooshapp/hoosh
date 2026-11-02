"""Validate synthetic examples and observed responses against executable OpenAPI."""

import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

from app.application import create_app

# Explicit formats fail at setup if their optional validators are missing.
FORMAT_CHECKER = FormatChecker(formats=["date-time", "uuid"])
ROOT = Path(__file__).resolve().parents[4]
SCHEMA_PATH = ROOT / "packages/contracts/openapi/foundation.openapi.json"
FIXTURES = json.loads((ROOT / "packages/contracts/fixtures/http-v1.json").read_text())["examples"]


def wire_validator(name):
    schema = create_app().openapi()
    document = {"$ref": f"#/components/schemas/{name}", "components": schema["components"]}
    Draft202012Validator.check_schema(document)
    return Draft202012Validator(document, format_checker=FORMAT_CHECKER)


def validate_observed_response(response):
    schema = create_app().openapi()
    operation = schema["paths"][response.request.url.path][response.request.method.lower()]
    documented = operation["responses"][str(response.status_code)]
    document = {
        **documented["content"]["application/json"]["schema"],
        "components": schema["components"],
    }
    Draft202012Validator(document, format_checker=FORMAT_CHECKER).validate(response.json())
    for name, header in documented["headers"].items():
        assert header["required"] is True
        Draft202012Validator(header["schema"], format_checker=FORMAT_CHECKER).validate(
            response.headers[name]
        )
