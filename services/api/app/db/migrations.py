"""Explicit product migration tooling; no environment reads or runtime URL fallback."""

import re
from io import StringIO
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, text

from alembic import command
from app.models.profile import STRIP_CHARACTERS

API_ROOT = Path(__file__).resolve().parents[2]
HEAD = "20261102_0001"
LOCK_ID = 7529304120701


class MigrationSafetyError(RuntimeError):
    """Only server-owned diagnostics, never SQL/driver errors or private values."""


def config(connection: Connection | None = None, output=None) -> Config:
    value = Config(str(API_ROOT / "alembic.ini"), output_buffer=output)
    if connection is not None:
        value.attributes["connection"] = connection
    return value


def offline_sql() -> str:
    output = StringIO()
    command.upgrade(config(output=output), "head", sql=True)
    return output.getvalue()


def preflight(connection: Connection) -> dict:
    if connection.dialect.name != "postgresql" or connection.dialect.server_version_info[0] != 17:
        raise MigrationSafetyError("Review the PostgreSQL major before migrating")
    user, encoding = connection.execute(
        text("SELECT current_user, current_setting('server_encoding')")
    ).one()
    if user != "postgres" or encoding != "UTF8":
        raise MigrationSafetyError("Migrations require the explicit administrator and UTF8")
    roles = (
        connection.execute(
            text(
                "SELECT rolname FROM pg_roles WHERE rolname IN "
                "('disconnect_api','anon','authenticated','service_role')"
            )
        )
        .scalars()
        .all()
    )
    if set(roles) != {"disconnect_api", "anon", "authenticated", "service_role"}:
        raise MigrationSafetyError(
            "Required roles missing; review bootstrap or reset the local fixture"
        )
    if connection.scalar(text("SELECT to_regclass('auth.users')")) is None:
        raise MigrationSafetyError("Managed Auth UUID prerequisite is missing")
    if connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None:
        existing = (
            connection.execute(
                text(
                    "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                    "WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f','S') "
                    "AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.objid=c.oid AND d.deptype='e')"
                )
            )
            .scalars()
            .all()
        )
        if existing:
            raise MigrationSafetyError(
                "Unversioned public objects exist; review adoption, never stamp"
            )
    return {"administrator": user, "encoding": encoding}


def verify(connection: Connection) -> dict:
    row = connection.execute(
        text(
            "SELECT pg_get_userbyid(c.relowner), c.relrowsecurity, c.relforcerowsecurity "
            "FROM pg_class c WHERE c.oid=to_regclass('public.profiles')"
        )
    ).one_or_none()
    if row != ("postgres", True, True):
        raise MigrationSafetyError("Profile ownership/RLS differs from the reviewed schema")
    constraints = connection.execute(
        text(
            "SELECT conname,pg_get_constraintdef(oid),convalidated FROM pg_constraint "
            "WHERE conrelid='public.profiles'::regclass"
        )
    ).all()
    expected_constraints = {
        ("pk_profiles", "PRIMARY KEY (user_id)", True),
        (
            "fk_profiles_user_id_users",
            "FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE",
            True,
        ),
        ("ck_profiles_revision_positive", "CHECK ((revision >= 1))", True),
        (
            "ck_profiles_display_name_valid",
            "CHECK (((display_name IS NULL) OR "
            "(((char_length(display_name) >= 1) AND (char_length(display_name) <= 80)) "
            "AND (display_name = btrim(display_name, '" + STRIP_CHARACTERS + "'::text)))))",
            True,
        ),
    }
    if set(constraints) != expected_constraints:
        raise MigrationSafetyError("Profile constraints differ from the reviewed schema")
    role = (
        connection.execute(text((API_ROOT / "db/bootstrap/verify.sql").read_text()))
        .mappings()
        .one()
    )
    if any(
        role[key]
        for key in (
            "rolsuper",
            "rolcreatedb",
            "rolcreaterole",
            "rolinherit",
            "rolreplication",
            "rolbypassrls",
            "can_create_schema",
            "public_create",
            "memberships",
            "owned_relations",
            "owned_schemas",
            "accessible_auth_relations",
        )
    ) or not (role["rolcanlogin"] and 1 <= role["rolconnlimit"] <= 10):
        raise MigrationSafetyError("Runtime role differs from the least-privilege contract")
    privileges = connection.execute(
        text(
            "SELECT a.privilege_type, a.is_grantable FROM pg_class c, "
            "LATERAL aclexplode(c.relacl) a WHERE c.oid='public.profiles'::regclass "
            "AND a.grantee=(SELECT oid FROM pg_roles WHERE rolname='disconnect_api')"
        )
    ).all()
    if set(privileges) != {("SELECT", False), ("INSERT", False), ("UPDATE", False)}:
        raise MigrationSafetyError("Runtime product privileges differ from SELECT/INSERT/UPDATE")
    for table in ("public.profiles", "public.alembic_version"):
        if (
            connection.scalar(
                text(
                    "SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid=to_regclass(:table)"
                ),
                {"table": table},
            )
            != "postgres"
        ):
            raise MigrationSafetyError("Owned tables/history require the migration administrator")
        unexpected = connection.scalar(
            text(
                "SELECT count(*) FROM pg_class c, LATERAL aclexplode(c.relacl) a "
                "WHERE c.oid=to_regclass(:table) AND a.grantee<>c.relowner "
                "AND NOT (:table='public.profiles' AND a.grantee="
                "(SELECT oid FROM pg_roles WHERE rolname='disconnect_api'))"
            ),
            {"table": table},
        )
        if unexpected:
            raise MigrationSafetyError("Unexpected ambient table grants remain")
        if connection.scalar(
            text(
                "SELECT count(*) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid, "
                "LATERAL aclexplode(a.attacl) g WHERE c.oid=to_regclass(:table) "
                "AND g.grantee<>c.relowner"
            ),
            {"table": table},
        ):
            raise MigrationSafetyError("Unexpected column-level grants remain")
    policies = connection.execute(
        text(
            "SELECT policyname, cmd, roles, qual, with_check FROM pg_policies "
            "WHERE schemaname='public' AND tablename='profiles' ORDER BY policyname"
        )
    ).all()
    expected = {
        "profiles_select_own": "SELECT",
        "profiles_insert_own": "INSERT",
        "profiles_update_own": "UPDATE",
    }
    if len(policies) != 3 or any(
        expected.get(name) != cmd
        or roles != ["disconnect_api"]
        or (cmd != "INSERT" and not qual)
        or (cmd != "SELECT" and not check)
        for name, cmd, roles, qual, check in policies
    ):
        raise MigrationSafetyError("Runtime row policies differ from the reviewed commands/role")
    predicate = "(user_id = (NULLIF(current_setting('app.user_id'::text, true), ''::text))::uuid)"
    for _, _, _, qual, check in policies:
        for expression in (qual, check):
            if expression and re.sub(r"\s+", "", expression) != re.sub(r"\s+", "", predicate):
                raise MigrationSafetyError("A row policy predicate changed")
    trigger = connection.execute(
        text(
            "SELECT t.tgname, t.tgtype, t.tgenabled, p.prosecdef, p.proconfig, p.prosrc "
            "FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid "
            "WHERE t.tgrelid='public.profiles'::regclass AND NOT t.tgisinternal"
        )
    ).one_or_none()
    body = (
        "BEGIN IF TG_OP = 'UPDATE' THEN NEW.created_at := OLD.created_at; ELSE "
        "NEW.created_at := pg_catalog.statement_timestamp(); END IF; "
        "NEW.updated_at := pg_catalog.statement_timestamp(); RETURN NEW; END"
    )
    if (
        not trigger
        or trigger[:5] != ("profiles_server_times", 23, "O", False, ["search_path=pg_catalog"])
        or " ".join(trigger[5].split()) != body
    ):
        raise MigrationSafetyError("Server timestamp trigger differs from the reviewed function")
    if connection.scalar(
        text(
            "SELECT count(*) FROM pg_proc p, LATERAL aclexplode(p.proacl) a "
            "WHERE p.oid='public.disconnect_profiles_server_times()'::regprocedure "
            "AND a.grantee<>p.proowner"
        )
    ):
        raise MigrationSafetyError("Timestamp function has unintended execute grants")
    for role_name in ("anon", "authenticated", "service_role"):
        for privilege in (
            "SELECT",
            "INSERT",
            "UPDATE",
            "DELETE",
            "TRUNCATE",
            "REFERENCES",
            "TRIGGER",
        ):
            if connection.scalar(
                text("SELECT has_table_privilege(:role,'public.profiles',:privilege)"),
                {"role": role_name, "privilege": privilege},
            ):
                raise MigrationSafetyError("A Data API role has product-table privileges")
    revision = (
        connection.execute(text("SELECT version_num FROM public.alembic_version")).scalars().all()
    )
    if revision != [HEAD]:
        raise MigrationSafetyError("Expected exactly the single reviewed Alembic head")
    return {
        "revision": HEAD,
        "owner": row[0],
        "rls": True,
        "forceRls": True,
        "runtimePrivileges": ["SELECT", "INSERT", "UPDATE"],
        "mobileOrPublicCrud": False,
    }


def run(connection: Connection, action: str = "upgrade") -> dict:
    if not connection.in_transaction():
        raise MigrationSafetyError("Migration runner requires an explicit outer transaction")
    connection.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": LOCK_ID})
    observed = preflight(connection)
    cfg = config(connection)
    if ScriptDirectory.from_config(cfg).get_heads() != [HEAD]:
        raise MigrationSafetyError("Migration directory must have one reviewed head")
    if action == "upgrade":
        command.upgrade(cfg, "head")
    elif action == "check":
        command.check(cfg)
    else:
        raise MigrationSafetyError("Unsupported migration operation")
    return observed | verify(connection)
