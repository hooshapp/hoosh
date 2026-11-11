import importlib.util
from pathlib import Path

from alembic.script import ScriptDirectory

from app.db.base import Base
from app.db.migrations import HEAD, config, offline_sql
from app.models import Profile
from app.models.profile import STRIP_CHARACTERS


def test_profile_shape_and_external_auth_reference_remain_unchanged():
    assert set(Base.metadata.tables) == {
        "public.profiles",
        "public.user_settings",
        "public.user_quests",
    }
    assert set(Profile.__table__.columns.keys()) == {
        "user_id",
        "display_name",
        "revision",
        "created_at",
        "updated_at",
    }
    foreign = next(iter(Profile.__table__.foreign_keys))
    assert foreign.target_fullname == "auth.users.id" and foreign.ondelete == "CASCADE"
    assert foreign.column.table.info == {"external": True}
    assert foreign.column.table.metadata is not Base.metadata
    assert Profile.__table__.c.display_name.nullable
    assert Profile.__table__.c.created_at.type.timezone
    assert Profile.__table__.c.updated_at.type.timezone


def test_frozen_historical_and_current_strip_rules_match_python_312():
    assert STRIP_CHARACTERS == "".join(chr(i) for i in range(0x110000) if chr(i).isspace())
    path = Path(__file__).resolve().parents[1] / "alembic/versions/20261102_0001_profiles.py"
    spec = importlib.util.spec_from_file_location("initial_profile_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.STRIP_CHARACTERS == STRIP_CHARACTERS


def test_one_offline_history_and_sql_need_no_environment_or_clients(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("Offline SQL attempted a client or runtime configuration")

    monkeypatch.setenv("MIGRATION_DATABASE_URL", "invalid-private-uri")
    monkeypatch.setattr("sqlalchemy.create_engine", forbidden)
    monkeypatch.setattr("psycopg.connect", forbidden)
    assert ScriptDirectory.from_config(config()).get_heads() == [HEAD]
    first = offline_sql()
    assert first == offline_sql()
    assert "CREATE TABLE public.profiles" in first
    assert "CREATE TABLE auth.users" not in first
    assert "SECURITY INVOKER" in first and "SECURITY DEFINER" not in first
    assert "WITH CHECK" in first and "FORCE ROW LEVEL SECURITY" in first
    assert "GRANT SELECT, INSERT, UPDATE" in first
    assert "invalid-private-uri" not in first
