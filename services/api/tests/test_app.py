from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def make_client() -> TestClient:
    return TestClient(
        create_app(
            Settings(
                _env_file=None,
                app_env="test",
                cors_allowed_origins=["http://localhost:8081"],
            )
        )
    )


def test_service_starts_without_database_or_auth_credentials():
    with make_client() as client:
        response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "disconnect-api"}


def test_configured_web_origin_can_send_authorization_header():
    with make_client() as client:
        response = client.options(
            "/healthz",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"


def test_unknown_browser_origin_is_not_allowed():
    with make_client() as client:
        response = client.options(
            "/healthz",
            headers={
                "Origin": "https://unknown.example",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
