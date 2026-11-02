"""Expose middleware wire headers in the executable OpenAPI authority."""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

REQUEST_ID_HEADER = {
    "description": "Server-generated UUID; matches error.request_id on failures.",
    "required": True,
    "schema": {"type": "string", "format": "uuid"},
}
NO_STORE_HEADER = {"required": True, "schema": {"type": "string", "const": "no-store"}}
BEARER_HEADER = {"required": True, "schema": {"type": "string", "const": "Bearer"}}


def install_openapi(application: FastAPI) -> None:
    def build_schema():
        if application.openapi_schema is None:
            schema = get_openapi(
                title=application.title,
                version=application.version,
                description=application.description,
                openapi_version=application.openapi_version,
                routes=application.routes,
            )
            for path, operations in schema["paths"].items():
                for method, operation in operations.items():
                    if method not in {"get", "post", "patch", "put", "delete", "options", "head"}:
                        continue
                    for status, response in operation.get("responses", {}).items():
                        headers = response.setdefault("headers", {})
                        headers["X-Request-ID"] = REQUEST_ID_HEADER
                        if path.startswith("/v1/") or int(status) >= 400:
                            headers["Cache-Control"] = NO_STORE_HEADER
                        if status == "401":
                            headers["WWW-Authenticate"] = BEARER_HEADER
            application.openapi_schema = schema
        return application.openapi_schema

    application.openapi = build_schema
