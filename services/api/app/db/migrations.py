"""Explicit product migration tooling; no environment reads or runtime URL fallback."""

import re
from hashlib import sha256
from io import StringIO
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, text

from alembic import command
from app.models.profile import STRIP_CHARACTERS

API_ROOT = Path(__file__).resolve().parents[2]
HEAD = "20261124_0009"
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
    for table in (
        "public.profiles",
        "public.user_settings",
        "public.user_quests",
        "public.quest_schedule_versions",
        "public.quest_occurrence_outcomes",
        "public.reward_wallets",
        "public.reward_entries",
        "public.reward_streams",
        "public.history_records",
        "public.recommendation_decisions",
        "public.alembic_version",
    ):
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
                "AND NOT (:table IN ('public.profiles','public.user_settings',"
                "'public.user_quests','public.quest_schedule_versions',"
                "'public.quest_occurrence_outcomes','public.reward_wallets',"
                "'public.reward_entries','public.reward_streams','public.history_records',"
                "'public.recommendation_decisions') "
                "AND a.grantee="
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
    _verify_policies_and_clock(connection, "profiles", "profiles")
    _verify_settings(connection)
    _verify_quests(connection)
    _verify_execution(connection)
    for role_name in ("anon", "authenticated", "service_role"):
        for table in (
            "public.profiles",
            "public.user_settings",
            "public.user_quests",
            "public.quest_schedule_versions",
            "public.quest_occurrence_outcomes",
            "public.reward_wallets",
            "public.reward_entries",
            "public.reward_streams",
            "public.history_records",
            "public.recommendation_decisions",
        ):
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
                    text("SELECT has_table_privilege(:role,:table,:privilege)"),
                    {"role": role_name, "table": table, "privilege": privilege},
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


# PG17 deparsed check definitions are pinned after review against the frozen migration
# and model. Exact fingerprints detect weakened expressions, not merely renamed checks.
SETTINGS_CHECK_FINGERPRINTS = {
    "ck_user_settings_personalization_shape": "41b6db51cc35e7f20ed90956ead8d8446808230dfbe61035eca6884a1d394826",
    "ck_user_settings_activities_shape": (
        "ea191c017fb920c89e73fe6e014e5d9e" + "869018455ab442f322b5aa8e9e8a9c9e"
    ),
    "ck_user_settings_activity_ids_valid": (
        "74dd5a7c465be3a0597f73157627a06b" + "4f35bc5c41ee955cb3e13a45914d648e"
    ),
    "ck_user_settings_custom_text_valid": (
        "506c293b1a2b23927e17a474efab9c16" + "3afc13547ed2b75cfdab5490d6cdff34"
    ),
    "ck_user_settings_hours_valid": (
        "7db1dc90a81bce6e1b305f83b9d069bd" + "48f458f8b570150d81029a34383d735a"
    ),
    "ck_user_settings_plan_draft_shape": ("3faeac90f46457b01d881a1649b50a70dcc23e94e63e1765f8101b374c760f65"),
    "ck_user_settings_revision_positive": (
        "734367bcd98f308d31796dc121a196c4" + "4de1e0adfb565fc8f724bc6f078ca6ea"
    ),
    "ck_user_settings_session_count_valid": (
        "4e3777c2724b51ea43e6fc0d6993c3e6" + "4bc4745627d23494f47c0230c937fe80"
    ),
    "ck_user_settings_session_minutes_valid": (
        "cb0497fdaadaba646acace31fe6c902e" + "4d5796eeca1a29f5ebe7118b918a0dd1"
    ),
    "ck_user_settings_timezone_bounded": (
        "e6dd79603600fc46c9bef0586a22d4b0" + "1240572543eef47589186c478ff08c8c"
    ),
    "ck_user_settings_weekdays_valid": (
        "5c1a6e5e033f65bd8908ee7961d7253d" + "464be9cc5fd099a78bea310025077aa5"
    ),
    "fk_user_settings_user_id_users": (
        "7dffc1fe5c72443147ef9227e966626c" + "dc6e5997f36e90bcc553577512766d2a"
    ),
    "pk_user_settings": ("44756d887704fc88d8d0adc5c0c43110" + "3c555b4f8e6a4ddef6f7a7f6b4110606"),
}


def _verify_settings(connection: Connection) -> None:
    row = connection.execute(
        text(
            "SELECT pg_get_userbyid(c.relowner), c.relrowsecurity, c.relforcerowsecurity "
            "FROM pg_class c WHERE c.oid=to_regclass('public.user_settings')"
        )
    ).one_or_none()
    if row != ("postgres", True, True):
        raise MigrationSafetyError("Settings ownership/RLS differs from the reviewed schema")
    constraints = connection.execute(
        text(
            "SELECT conname,pg_get_constraintdef(oid),convalidated FROM pg_constraint "
            "WHERE conrelid='public.user_settings'::regclass"
        )
    ).all()
    observed = {
        name: sha256(definition.encode()).hexdigest()
        for name, definition, validated in constraints
        if validated
    }
    if observed != SETTINGS_CHECK_FINGERPRINTS or len(constraints) != len(observed):
        raise MigrationSafetyError("Settings constraints differ from the reviewed schema")
    privileges = connection.execute(
        text(
            "SELECT a.privilege_type,a.is_grantable FROM pg_class c, "
            "LATERAL aclexplode(c.relacl) a WHERE c.oid='public.user_settings'::regclass "
            "AND a.grantee=(SELECT oid FROM pg_roles WHERE rolname='disconnect_api')"
        )
    ).all()
    if set(privileges) != {("SELECT", False), ("INSERT", False), ("UPDATE", False)}:
        raise MigrationSafetyError("Settings privileges differ from SELECT/INSERT/UPDATE")
    _verify_policies_and_clock(connection, "user_settings", "settings")


def _verify_policies_and_clock(connection: Connection, table: str, prefix: str) -> None:
    policies = connection.execute(
        text(
            "SELECT policyname, cmd, roles, qual, with_check FROM pg_policies "
            "WHERE schemaname='public' AND tablename=:table ORDER BY policyname"
        ),
        {"table": table},
    ).all()
    expected = {
        prefix + "_select_own": "SELECT",
        prefix + "_insert_own": "INSERT",
        prefix + "_update_own": "UPDATE",
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
    triggers = connection.execute(
        text(
            "SELECT t.tgname, t.tgtype, t.tgenabled, p.prosecdef, p.proconfig, p.prosrc, "
            "p.oid=to_regprocedure(:function), pg_get_userbyid(p.proowner) "
            "FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid "
            "WHERE t.tgrelid=to_regclass(:relation) AND NOT t.tgisinternal"
        ),
        {
            "relation": "public." + table,
            "function": "public.disconnect_" + prefix + "_server_times()",
        },
    ).all()
    if len(triggers) != 1:
        raise MigrationSafetyError("Expected exactly one reviewed server timestamp trigger")
    trigger = triggers[0]
    body = (
        "BEGIN IF TG_OP = 'UPDATE' THEN NEW.created_at := OLD.created_at; ELSE "
        "NEW.created_at := pg_catalog.statement_timestamp(); END IF; "
        "NEW.updated_at := pg_catalog.statement_timestamp(); RETURN NEW; END"
    )
    if (
        trigger[:5] != (prefix + "_server_times", 23, "O", False, ["search_path=pg_catalog"])
        or " ".join(trigger[5].split()) != body
        or not trigger[6]
        or trigger[7] != "postgres"
    ):
        raise MigrationSafetyError("Server timestamp trigger differs from the reviewed function")
    if connection.scalar(
        text(
            "SELECT count(*) FROM pg_proc p, LATERAL aclexplode(p.proacl) a "
            "WHERE p.oid=to_regprocedure(:function) "
            "AND a.grantee<>p.proowner"
        ),
        {"function": "public.disconnect_" + prefix + "_server_times()"},
    ):
        raise MigrationSafetyError("Timestamp function has unintended execute grants")


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


QUEST_CONSTRAINT_FINGERPRINTS = {
    "ck_user_quests_definition_valid": (
        "e2294dda6e88ea063fb7cdfdcea257c5" + "904747d8846c181c0f8770e6ed69d2af"
    ),
    "ck_user_quests_revision_positive": (
        "734367bcd98f308d31796dc121a196c4" + "4de1e0adfb565fc8f724bc6f078ca6ea"
    ),
    "fk_user_quests_user_id_users": (
        "7dffc1fe5c72443147ef9227e966626c" + "dc6e5997f36e90bcc553577512766d2a"
    ),
    "pk_user_quests": ("84ef9ace2d2f4cbbfbf0ef634239bcc5" + "feec40d6528d67d7341a13ec3921404d"),
}


def _verify_quests(connection: Connection) -> None:
    row = connection.execute(
        text(
            "SELECT pg_get_userbyid(relowner),relrowsecurity,relforcerowsecurity "
            "FROM pg_class WHERE oid=to_regclass('public.user_quests')"
        )
    ).one_or_none()
    if row != ("postgres", True, True):
        raise MigrationSafetyError("Quest ownership/RLS differs from the reviewed schema")
    constraints = connection.execute(
        text(
            "SELECT conname,pg_get_constraintdef(oid),convalidated FROM pg_constraint "
            "WHERE conrelid='public.user_quests'::regclass"
        )
    ).all()
    observed = {
        name: sha256(value.encode()).hexdigest() for name, value, valid in constraints if valid
    }
    if observed != QUEST_CONSTRAINT_FINGERPRINTS or len(constraints) != len(observed):
        raise MigrationSafetyError("Quest constraints differ from reviewed schema")
    privileges = connection.execute(
        text(
            "SELECT a.privilege_type,a.is_grantable FROM pg_class c, "
            "LATERAL aclexplode(c.relacl) a WHERE c.oid='public.user_quests'::regclass "
            "AND a.grantee=(SELECT oid FROM pg_roles WHERE rolname='disconnect_api')"
        )
    ).all()
    if set(privileges) != {("SELECT", False), ("INSERT", False), ("UPDATE", False)}:
        raise MigrationSafetyError("Quest privileges differ from reviewed commands")
    _verify_policies_and_clock(connection, "user_quests", "quests")


# Exact PG17 constraint fingerprints are recorded after applying the frozen local migration.
EXECUTION_CONSTRAINT_FINGERPRINTS = {
    "quest_schedule_versions": {
        "ck_quest_schedule_versions_definition_object": (
            "cb71e258cb7a46b8410d8fc2524ab62f" + "5319ee925a7d809512f9a3878bf5e796"
        ),
        "ck_quest_schedule_versions_ordered_times": (
            "d3df20159f525d608e07ee948ce82c1d" + "7ae852c5c8667b3dc9e4f66dfb181c5e"
        ),
        "ck_quest_schedule_versions_positive_revisions": (
            "922510238e8a08657284325ff698bbd5" + "ba7741f5bf95ed91aaa7d03180e70fb9"
        ),
        "fk_quest_schedule_versions_quest": (
            "f7d7239119c6af9d9b0c4404d80d6d84" + "d9f2eb82a717876309d0ae1a6dce62e4"
        ),
        "pk_quest_schedule_versions": (
            "f7a84c78b133a1b12900aefc9ca16813" + "dae05864bc568761c33b06330149f328"
        ),
    },
    "quest_occurrence_outcomes": {
        "ck_quest_occurrence_outcomes_state_credit": (
            "dec6fdbfad7d25362f5c84bda34ac34b" + "6f2f611d57e1bdc9af4e0605cd914254"
        ),
        "fk_quest_occurrence_outcomes_schedule": (
            "a946d72a89766f759666293f079dc921" + "b1285f0fb38a4d26fb2da20cfb4145ad"
        ),
        "pk_quest_occurrence_outcomes": (
            "49e40f4dd47f6ebd121f4137806b337a" + "a677d8907b727958796e2467c462cc95"
        ),
    },
}


def _verify_execution(connection: Connection) -> None:
    predicate = "(user_id = (NULLIF(current_setting('app.user_id'::text, true), ''::text))::uuid)"
    for table, commands in (
        ("quest_schedule_versions", {"SELECT", "INSERT", "UPDATE"}),
        ("quest_occurrence_outcomes", {"SELECT", "INSERT"}),
        ("reward_wallets", {"SELECT", "INSERT", "UPDATE"}),
        ("reward_entries", {"SELECT", "INSERT"}),
        ("reward_streams", {"SELECT", "INSERT", "UPDATE"}),
        ("history_records", {"SELECT", "INSERT", "UPDATE"}),
        ("recommendation_decisions", {"SELECT", "INSERT", "UPDATE"}),
    ):
        qualified = "public." + table
        row = connection.execute(
            text(
                "SELECT "
                "pg_get_userbyid(relowner),relrowsecurity,relforcerowsecurity FROM "
                "pg_class WHERE oid=to_regclass(:table)"
            ),
            {"table": qualified},
        ).one_or_none()
        if row != ("postgres", True, True):
            raise MigrationSafetyError("Quest execution ownership/RLS differs")
        privileges = set(
            connection.execute(
                text(
                    "SELECT a.privilege_type,a.is_grantable FROM pg_class c, LATERAL "
                    "aclexplode(c.relacl) a WHERE c.oid=to_regclass(:table) AND "
                    "a.grantee=(SELECT oid FROM pg_roles WHERE "
                    "rolname='disconnect_api')"
                ),
                {"table": qualified},
            ).all()
        )
        if privileges != {(command, False) for command in commands}:
            raise MigrationSafetyError("Quest execution command privileges differ")
        policies = connection.execute(
            text(
                "SELECT policyname,permissive,roles,cmd,qual,with_check FROM "
                "pg_policies WHERE schemaname='public' AND tablename=:table"
            ),
            {"table": table},
        ).all()
        expected = {
            (
                f"{table}_{command.lower()}_own",
                "PERMISSIVE",
                ("disconnect_api",),
                command,
                predicate if command in {"SELECT", "UPDATE"} else None,
                predicate if command in {"INSERT", "UPDATE"} else None,
            )
            for command in commands
        }
        observed = {
            (name, permissive, tuple(roles), cmd, qual, check)
            for name, permissive, roles, cmd, qual, check in policies
        }
        if observed != expected:
            raise MigrationSafetyError("Quest execution owner policy differs")
        constraints = connection.execute(
            text(
                "SELECT conname,pg_get_constraintdef(oid),convalidated FROM "
                "pg_constraint WHERE conrelid=to_regclass(:table)"
            ),
            {"table": qualified},
        ).all()
        fingerprints = {
            name: sha256(value.encode()).hexdigest() for name, value, valid in constraints if valid
        }
        if fingerprints != EXECUTION_CONSTRAINT_FINGERPRINTS[table] or len(fingerprints) != len(
            constraints
        ):
            raise MigrationSafetyError("Quest execution constraints differ")


# Exact reviewed PostgreSQL17 constraint definitions for additive reward tables.
EXECUTION_CONSTRAINT_FINGERPRINTS.update(
    {
        "reward_wallets": {
            "ck_reward_wallets_balance_range": (
                "c5e2ffc320fe0c0eb7ab21f3816e9bb86724eb8d8b1c0ee94dbee6cf82100f4a"
            ),
            "ck_reward_wallets_state_range": (
                "d372000856d914d6150935cfdbbc167eba73fa061c0d0a32af5b1fc92b7e7061"
            ),
            "ck_reward_wallets_streak_range": (
                "9f87829c5973bf1f80acc6f908c128585696ce69ffc3156ce591770f519c618d"
            ),
            "fk_reward_wallets_user_id_users": (
                "7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a"
            ),
            "pk_reward_wallets": (
                "44756d887704fc88d8d0adc5c0c431103c555b4f8e6a4ddef6f7a7f6b4110606"
            ),
        },
        "reward_entries": {
            "ck_reward_entries_amount_range": ("d1fe3affb4c55c4538b5a77ad3ad1ba22738ef4024aca3f20dbe25e48df467a3"),
            "ck_reward_entries_kind_choice": (
                "1d409778369bf24981494358ecbb80a6070edc417bf749c66a09c644050f05c9"
            ),
            "fk_reward_entries_user_id_users": (
                "7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a"
            ),
            "pk_reward_entries": (
                "f5d4c496f0399c9788035349120eea597a122347377c64b1c0a6112382b8fbb3"
            ),
            "uq_reward_delivery": (
                "cf43a8ed4e8f1687166a50abaadd4e06cc0eeea611661d8312906a5ef2717f38"
            ),
        },
        "reward_streams": {
            "ck_reward_streams_cursor_range": (
                "47851b24b3ee2595ccb16537d203fe5450e3ead8696032f58e36c1779acd8767"
            ),
            "fk_reward_streams_user_id_users": (
                "7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a"
            ),
            "pk_reward_streams": (
                "63896590e5706c74516cffff863274fb837be30c685296e2ee54b481e2e3c53f"
            ),
        },
    }
)

EXECUTION_CONSTRAINT_FINGERPRINTS["history_records"] = {
    "ck_history_records_json_shape": (
        "b7df068bf554c1b29dc7309efaef31f44f0ad8d16a47a546a58670b5a398037c"
    ),
    "ck_history_records_revision_positive": (
        "7c0ddfd91f9bdc7bd607f558b7220a0d09efdbea0973a07402460329265b9c9f"
    ),
    "ck_history_records_selection_range": (
        "ca4484be8fb4c30d43d66ce7add4cfdc432f4054eaf07436dd62f453418bb385"
    ),
    "ck_history_records_timezone_bound": (
        "3539d723f7db0242af5b079345dba8b94b7c4b4ddd8aad6799f1c1405ffd4e26"
    ),
    "fk_history_records_user_id_users": (
        "7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a"
    ),
    "pk_history_records": ("44756d887704fc88d8d0adc5c0c431103c555b4f8e6a4ddef6f7a7f6b4110606"),
}

EXECUTION_CONSTRAINT_FINGERPRINTS["recommendation_decisions"] = {
    "ck_recommendation_decisions_cooldown_positive": (
        "3c7338763e9c4bf63d78dc80bb365110ecb49cbea13e8d4956d640e7d9238e84"
    ),
    "ck_recommendation_decisions_decision_choice": (
        "b2d49407947b2cfd1803da0f8ca945a93eaea08427cd79c59de27cc99a48c7ca"
    ),
    "ck_recommendation_decisions_quest_coherent": (
        "3669cea81e2d5f5359dbf841380cad6c9efb59cf6c96786138c82a4c4d000016"
    ),
    "fk_recommendation_decisions_user_id_users": (
        "7dffc1fe5c72443147ef9227e966626cdc6e5997f36e90bcc553577512766d2a"
    ),
    "pk_recommendation_decisions": (
        "44756d887704fc88d8d0adc5c0c431103c555b4f8e6a4ddef6f7a7f6b4110606"
    ),
}
