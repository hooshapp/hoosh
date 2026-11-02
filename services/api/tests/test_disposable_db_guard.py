import pytest

from tests.support import database

RUNTIME = "postgresql://disconnect_api:test@127.0.0.1:55432/disconnect_test?sslmode=disable"
ADMIN = "postgresql://postgres:test@127.0.0.1:55432/disconnect_test?sslmode=disable"


def environment():
    return {"APP_ENV": "test", "TEST_DATABASE_URL": RUNTIME, "TEST_MIGRATION_DATABASE_URL": ADMIN}


@pytest.mark.parametrize(
    "change",
    [
        {"APP_ENV": "development"},
        {"APP_ENV": "production"},
        {"APP_ENV": ""},
        {"TEST_DATABASE_URL": ""},
        {"TEST_MIGRATION_DATABASE_URL": ""},
        {"TEST_DATABASE_URL": RUNTIME.replace("127.0.0.1", "db.example.supabase.co")},
        {"TEST_DATABASE_URL": RUNTIME.replace("55432", "5432")},
        {"TEST_DATABASE_URL": RUNTIME.replace("/disconnect_test", "/postgres")},
        {"TEST_DATABASE_URL": RUNTIME.replace("disconnect_api:", "postgres:")},
        {"TEST_DATABASE_URL": RUNTIME.replace("disable", "prefer")},
        {"TEST_DATABASE_URL": RUNTIME + "&hostaddr=1.2.3.4"},
        {"TEST_DATABASE_URL": RUNTIME + "&options=-c%20role=postgres"},
        {"TEST_DATABASE_URL": RUNTIME + "&service=cloud"},
        {"TEST_MIGRATION_DATABASE_URL": ADMIN.replace("127.0.0.1", "localhost")},
    ],
)
def test_bad_target_fails_before_network_or_cleanup(monkeypatch, change):
    def forbidden(**kwargs):
        pytest.fail("Invalid target reached psycopg.connect")

    monkeypatch.setattr(database.psycopg, "connect", forbidden)
    with pytest.raises(ValueError):
        database.connect(environment() | change, "TEST_DATABASE_URL")


def test_no_managed_database_fallback():
    values = {"APP_ENV": "test", "DATABASE_URL": RUNTIME, "MIGRATION_DATABASE_URL": ADMIN}
    with pytest.raises(ValueError, match="no runtime/migration fallback"):
        database.parameters(values, "TEST_DATABASE_URL")


def test_missing_marker_closes_connection_and_fails(monkeypatch):
    class Result:
        def fetchall(self):
            return []

    class Connection:
        closed = False

        def execute(self, query):
            return Result()

        def close(self):
            self.closed = True

    connection = Connection()
    monkeypatch.setattr(database.psycopg, "connect", lambda **kwargs: connection)
    with pytest.raises(ValueError, match="validation failed"):
        database.connect(environment(), "TEST_DATABASE_URL")
    assert connection.closed
