"""Bounded settings JSON documents; no active policy or mobile table access."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20261102_0002"
down_revision = "20261102_0001"
branch_labels = None
depends_on = None

# Frozen reviewed storage predicates. Never import mutable app models into a migration.
CHECKS = {
    "revision_positive": "revision >= 1",
    "activities_shape": "jsonb_typeof(activities) = 'object' AND activities ?& "
    "ARRAY['selected_activity_ids','custom_text'] AND activities - "
    "ARRAY['selected_activity_ids','custom_text'] = '{}'::jsonb",
    "activity_ids_valid": "CASE WHEN jsonb_typeof(activities->'selected_activity_ids') = 'array' "
    "THEN jsonb_array_length(activities->'selected_activity_ids') <= 6 AND "
    "(activities->'selected_activity_ids') <@ "
    '\'["gym","reading","arts_and_crafts","walking","music","cooking"]\'::jsonb '
    "AND jsonb_array_length(activities->'selected_activity_ids') = "
    "(((activities->'selected_activity_ids') @> '[\"gym\"]'::jsonb)::int "
    "+ ((activities->'selected_activity_ids') @> "
    "'[\"reading\"]'::jsonb)::int + "
    "((activities->'selected_activity_ids') @> "
    "'[\"arts_and_crafts\"]'::jsonb)::int + "
    "((activities->'selected_activity_ids') @> "
    "'[\"walking\"]'::jsonb)::int + "
    "((activities->'selected_activity_ids') @> "
    "'[\"music\"]'::jsonb)::int + ((activities->'selected_activity_ids') "
    "@> '[\"cooking\"]'::jsonb)::int) ELSE false END",
    "custom_text_valid": "activities->'custom_text' = 'null'::jsonb OR "
    "(jsonb_typeof(activities->'custom_text') = 'string' AND "
    "char_length(activities->>'custom_text') BETWEEN 1 AND 200 AND "
    "activities->>'custom_text' = btrim(activities->>'custom_text', "
    "E'\\u0009\\u000a\\u000b\\u000c\\u000d\\u001c\\u001d\\u001e\\u001f\\u0020\\u0085\\u00a0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000'))",
    "plan_draft_shape": "plan_draft IS NULL OR (jsonb_typeof(plan_draft) = 'object' AND "
    "plan_draft ?& "
    "ARRAY['weekdays','hours','timezone_id','session_count','session_minutes'] "
    "AND plan_draft - "
    "ARRAY['weekdays','hours','timezone_id','session_count','session_minutes'] "
    "= '{}'::jsonb)",
    "weekdays_valid": "plan_draft IS NULL OR CASE WHEN jsonb_typeof(plan_draft->'weekdays') = "
    "'array' THEN jsonb_array_length(plan_draft->'weekdays') <= 7 AND "
    "(plan_draft->'weekdays') <@ '[0,1,2,3,4,5,6]'::jsonb AND "
    "jsonb_array_length(plan_draft->'weekdays') = (((plan_draft->'weekdays') "
    "@> '[0]'::jsonb)::int + ((plan_draft->'weekdays') @> '[1]'::jsonb)::int + "
    "((plan_draft->'weekdays') @> '[2]'::jsonb)::int + "
    "((plan_draft->'weekdays') @> '[3]'::jsonb)::int + "
    "((plan_draft->'weekdays') @> '[4]'::jsonb)::int + "
    "((plan_draft->'weekdays') @> '[5]'::jsonb)::int + "
    "((plan_draft->'weekdays') @> '[6]'::jsonb)::int) ELSE false END",
    "hours_valid": "plan_draft IS NULL OR plan_draft->'hours' = 'null'::jsonb OR "
    "(jsonb_typeof(plan_draft->'hours') = 'object' AND (plan_draft->'hours') ?& "
    "ARRAY['start_local','end_local','next_day'] AND (plan_draft->'hours') - "
    "ARRAY['start_local','end_local','next_day'] = '{}'::jsonb AND "
    "jsonb_typeof(plan_draft->'hours'->'next_day') = 'boolean' AND "
    "(plan_draft->'hours'->'start_local' = 'null'::jsonb OR "
    "(jsonb_typeof(plan_draft->'hours'->'start_local') = 'string' AND "
    "plan_draft->'hours'->>'start_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')) "
    "AND (plan_draft->'hours'->'end_local' = 'null'::jsonb OR "
    "(jsonb_typeof(plan_draft->'hours'->'end_local') = 'string' AND "
    "plan_draft->'hours'->>'end_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')) AND "
    "(plan_draft->'hours'->'start_local' = 'null'::jsonb OR "
    "plan_draft->'hours'->'end_local' = 'null'::jsonb OR "
    "(plan_draft->'hours'->'next_day' = 'true'::jsonb AND "
    "plan_draft->'hours'->>'end_local' < plan_draft->'hours'->>'start_local') OR "
    "(plan_draft->'hours'->'next_day' = 'false'::jsonb AND "
    "plan_draft->'hours'->>'end_local' > plan_draft->'hours'->>'start_local')))",
    "timezone_bounded": "plan_draft IS NULL OR plan_draft->'timezone_id' = 'null'::jsonb OR "
    "(jsonb_typeof(plan_draft->'timezone_id') = 'string' AND "
    "char_length(plan_draft->>'timezone_id') BETWEEN 1 AND 128 AND "
    "plan_draft->>'timezone_id' ~ '^[A-Za-z0-9_+/-]+$')",
    "session_count_valid": "plan_draft IS NULL OR plan_draft->'session_count' = 'null'::jsonb OR "
    "CASE WHEN jsonb_typeof(plan_draft->'session_count') = 'number' THEN "
    "(plan_draft->>'session_count') ~ '^[0-9]+$' AND "
    "(plan_draft->>'session_count')::numeric BETWEEN 1 AND 1000 ELSE "
    "false END",
    "session_minutes_valid": "plan_draft IS NULL OR plan_draft->'session_minutes' = "
    "'null'::jsonb OR CASE WHEN "
    "jsonb_typeof(plan_draft->'session_minutes') = 'number' THEN "
    "(plan_draft->>'session_minutes') ~ '^[0-9]+$' AND "
    "(plan_draft->>'session_minutes')::numeric BETWEEN 1 AND 1440 ELSE "
    "false END",
}


def upgrade():
    op.create_table(
        "user_settings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "activities",
            postgresql.JSONB(none_as_null=True),
            nullable=False,
            server_default=sa.text('\'{"selected_activity_ids":[],"custom_text": null}\'::jsonb'),
        ),
        sa.Column("plan_draft", postgresql.JSONB(none_as_null=True), nullable=True),
        sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("statement_timestamp()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("statement_timestamp()"),
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_user_settings"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["auth.users.id"],
            ondelete="CASCADE",
            name="fk_user_settings_user_id_users",
        ),
        *(
            sa.CheckConstraint(value, name=op.f("ck_user_settings_" + name))
            for name, value in CHECKS.items()
        ),
        schema="public",
    )
    op.execute("ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE public.user_settings FORCE ROW LEVEL SECURITY")
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    op.execute(
        "CREATE POLICY settings_select_own ON public.user_settings FOR SELECT "
        "TO disconnect_api USING (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY settings_insert_own ON public.user_settings FOR INSERT "
        "TO disconnect_api WITH CHECK (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY settings_update_own ON public.user_settings FOR UPDATE "
        "TO disconnect_api USING (" + predicate + ") WITH CHECK (" + predicate + ")"
    )
    op.execute("""
        CREATE FUNCTION public.disconnect_settings_server_times() RETURNS trigger
        LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $times$
        BEGIN
            IF TG_OP = 'UPDATE' THEN
                NEW.created_at := OLD.created_at;
            ELSE
                NEW.created_at := pg_catalog.statement_timestamp();
            END IF;
            NEW.updated_at := pg_catalog.statement_timestamp();
            RETURN NEW;
        END
        $times$;
    """)
    op.execute(
        "CREATE TRIGGER settings_server_times BEFORE INSERT OR UPDATE ON public.user_settings "
        "FOR EACH ROW EXECUTE FUNCTION public.disconnect_settings_server_times()"
    )
    # Revoke ALL ambient grantees, not just currently-known mobile roles. Leave
    # shared default privileges unchanged; every new migration must do this too.
    op.execute("""
        DO $acl$
        DECLARE entry record; target text;
        BEGIN
            FOREACH target IN ARRAY ARRAY['public.user_settings', 'public.alembic_version'] LOOP
                FOR entry IN
                    SELECT DISTINCT a.grantee
                    FROM pg_catalog.pg_class c,
                         LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,
                             pg_catalog.acldefault('r', c.relowner))) a
                    WHERE c.oid = target::regclass AND a.grantee <> c.relowner
                LOOP
                    EXECUTE pg_catalog.format('REVOKE ALL ON TABLE %s FROM %s', target,
                        CASE WHEN entry.grantee = 0 THEN 'PUBLIC'
                             ELSE pg_catalog.quote_ident(
                                 pg_catalog.pg_get_userbyid(entry.grantee)) END);
                END LOOP;
            END LOOP;
            FOR entry IN
                SELECT DISTINCT a.grantee FROM pg_catalog.pg_proc p,
                    LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,
                        pg_catalog.acldefault('f', p.proowner))) a
                WHERE p.oid = 'public.disconnect_settings_server_times()'::regprocedure
                    AND a.grantee <> p.proowner
            LOOP
                EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION '
                    'public.disconnect_settings_server_times() FROM %s',
                    CASE WHEN entry.grantee = 0 THEN 'PUBLIC'
                         ELSE pg_catalog.quote_ident(
                                 pg_catalog.pg_get_userbyid(entry.grantee)) END);
            END LOOP;
        END
        $acl$;
    """)
    op.execute("GRANT SELECT, INSERT, UPDATE ON public.user_settings TO disconnect_api")


def downgrade():
    # Only the guarded disposable runner exposes downgrade. Never use it as an
    # automatic rollback on a populated shared/production database.
    op.drop_table("user_settings", schema="public")
    op.execute("DROP FUNCTION public.disconnect_settings_server_times()")
