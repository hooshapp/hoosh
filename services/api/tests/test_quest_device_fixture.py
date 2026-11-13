"""The optional phone fixture must not overwrite or delete resources it does not own."""

import importlib.util
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest


@pytest.fixture
def fixture_operator(monkeypatch, tmp_path):
    path = Path(__file__).resolve().parents[3] / "scripts/quest-device-fixture.py"
    spec = importlib.util.spec_from_file_location("quest_device_operator_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.API = tmp_path
    module.OUTPUT = tmp_path / ".local/quest-device-fixture.json"
    calls = []
    head = [(module.HEAD,)]
    users = [UUID(int=101), UUID(int=102)]
    module.uuid4 = iter(users).__next__

    class Admin:
        def execute(self, statement, parameters=None):
            calls.append((statement, parameters))
            if statement.startswith("INSERT") and parameters == (users[1],):
                raise ValueError("Second insert refused")
            return SimpleNamespace(fetchall=lambda: head)

    @contextmanager
    def connect(values, key):
        assert values == {"fixture": "explicit-test-only"}
        assert key == "TEST_MIGRATION_DATABASE_URL"
        yield Admin()

    class Socket:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            pass

        def setsockopt(self, *_args):
            pass

        def bind(self, address):
            assert address == ("127.0.0.1", 8765)

    module.database = SimpleNamespace(
        environment=lambda: {"fixture": "explicit-test-only"}, connect=connect
    )
    module.socket = SimpleNamespace(socket=Socket, SOL_SOCKET=1, SO_REUSEADDR=2)
    module.subprocess = SimpleNamespace(run=lambda *_args, **_kwargs: SimpleNamespace(returncode=0))
    return module, calls, head, users


def test_existing_private_artifact_is_preserved_without_resource_cleanup(fixture_operator):
    module, calls, _head, _users = fixture_operator
    module.OUTPUT.parent.mkdir()
    module.OUTPUT.write_text("owned by a different run")
    with pytest.raises(ValueError, match="must not be overwritten"):
        module.main()
    assert module.OUTPUT.read_text() == "owned by a different run"
    assert calls == []


def test_unbounded_duration_is_rejected_before_any_database_action(fixture_operator):
    module, calls, _head, _users = fixture_operator
    with pytest.raises(ValueError, match="bounded"):
        module.main(999)
    assert calls == []


def test_unknown_schema_refuses_user_creation_and_deletion(fixture_operator):
    module, calls, head, _users = fixture_operator
    head[:] = [("unknown_schema",)]
    with pytest.raises(ValueError, match="migrations first"):
        module.main()
    assert len(calls) == 1 and calls[0][0].startswith("SELECT")


def test_partial_setup_deletes_only_users_actually_created_by_this_run(fixture_operator):
    module, calls, _head, users = fixture_operator
    with pytest.raises(ValueError, match="Second insert refused"):
        module.main()
    deletions = [(sql, args) for sql, args in calls if sql.startswith("DELETE")]
    assert deletions == [("DELETE FROM auth.users WHERE id=ANY(%s)", ([users[0]],))]
    assert not module.OUTPUT.exists()
