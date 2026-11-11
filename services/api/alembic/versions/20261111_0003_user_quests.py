"""Saved quest definitions only; content-free deletion fences stale requests."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20261111_0003"
down_revision = "20261102_0002"
branch_labels = None
depends_on = None

# Frozen storage checks; never import mutable app models here.
CHECKS = {
    "revision_positive": "revision >= 1",
    "definition_valid": "definition IS NULL OR (jsonb_typeof(definition) = 'object' AND "
    "definition ?& "
    "ARRAY['title','activity','star"
    "t_local','end_local','next_day"
    "','repeat','weekdays','timezon"
    "e_id'] "
    "AND definition - "
    "ARRAY['title','activity','star"
    "t_local','end_local','next_day"
    "','repeat','weekdays','timezon"
    "e_id'] "
    "= '{}'::jsonb AND jsonb_typeof(definition->'title') = 'string' AND "
    "char_length(definition->>'title') BETWEEN 1 AND 120 AND "
    "definition->>'title' = btrim(definition->>'title', "
    "E'\\u0009\\u000a\\u000b\\u000c\\u00"
    "0d\\u001c\\u001d\\u001e\\u001f\\u00"
    "20\\u0085\\u00a0\\u1680\\u2000\\u20"
    "01\\u2002\\u2003\\u2004\\u2005\\u20"
    "06\\u2007\\u2008\\u2009\\u200a\\u20"
    "28\\u2029\\u202f\\u205f\\u3000') "
    "AND jsonb_typeof(definition->'activity') = 'string' AND "
    "char_length(definition->>'activity') BETWEEN 1 AND 200 AND "
    "definition->>'activity' = btrim(definition->>'activity', "
    "E'\\u0009\\u000a\\u000b\\u000c\\u00"
    "0d\\u001c\\u001d\\u001e\\u001f\\u00"
    "20\\u0085\\u00a0\\u1680\\u2000\\u20"
    "01\\u2002\\u2003\\u2004\\u2005\\u20"
    "06\\u2007\\u2008\\u2009\\u200a\\u20"
    "28\\u2029\\u202f\\u205f\\u3000') "
    "AND jsonb_typeof(definition->'start_local') = 'string' AND "
    "definition->>'start_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "
    "jsonb_typeof(definition->'end_local') = 'string' AND "
    "definition->>'end_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "
    "jsonb_typeof(definition->'next_day') = 'boolean' AND "
    "((definition->'next_day' = 'true'::jsonb AND definition->>'end_local' < "
    "definition->>'start_local') OR (definition->'next_day' = 'false'::jsonb "
    "AND definition->>'end_local' > definition->>'start_local')) AND "
    "definition->>'repeat' IN ('none','daily','weekly') AND "
    "jsonb_typeof(definition->'repeat') = 'string' AND CASE WHEN "
    "jsonb_typeof(definition->'weekdays') = 'array' THEN "
    "(definition->'weekdays') <@ '[0,1,2,3,4,5,6]'::jsonb AND "
    "jsonb_array_length(definition->'weekdays') = (((definition->'weekdays') "
    "@> '[0]'::jsonb)::int + ((definition->'weekdays') @> '[1]'::jsonb)::int "
    "+ ((definition->'weekdays') @> '[2]'::jsonb)::int + "
    "((definition->'weekdays') @> '[3]'::jsonb)::int + "
    "((definition->'weekdays') @> '[4]'::jsonb)::int + "
    "((definition->'weekdays') @> '[5]'::jsonb)::int + "
    "((definition->'weekdays') @> '[6]'::jsonb)::int) AND "
    "((definition->>'repeat' = 'weekly' AND "
    "jsonb_array_length(definition->'weekdays') BETWEEN 1 AND 7) OR "
    "(definition->>'repeat' IN ('none','daily') AND "
    "jsonb_array_length(definition->'weekdays') = 0)) ELSE false END AND "
    "jsonb_typeof(definition->'timezone_id') = 'string' AND "
    "char_length(definition->>'timezone_id') BETWEEN 1 AND 128 AND "
    "definition->>'timezone_id' ~ '^[A-Za-z0-9_+/-]+$') IS TRUE",
}


def upgrade():
    op.create_table(
        "user_quests",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quest_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("definition", postgresql.JSONB(none_as_null=True), nullable=True),
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
        sa.PrimaryKeyConstraint("user_id", "quest_id", name="pk_user_quests"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="fk_user_quests_user_id_users"
        ),
        *(
            sa.CheckConstraint(value, name=op.f("ck_user_quests_" + name))
            for name, value in CHECKS.items()
        ),
        schema="public",
    )
    op.execute("ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE public.user_quests FORCE ROW LEVEL SECURITY")
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    op.execute(
        "CREATE POLICY quests_select_own ON public.user_quests FOR SELECT "
        "TO disconnect_api USING (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY quests_insert_own ON public.user_quests FOR INSERT "
        "TO disconnect_api WITH CHECK (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY quests_update_own ON public.user_quests FOR UPDATE "
        "TO disconnect_api USING (" + predicate + ") WITH CHECK (" + predicate + ")"
    )
    op.execute("""
        CREATE FUNCTION public.disconnect_quests_server_times() RETURNS trigger
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
        "CREATE TRIGGER quests_server_times BEFORE INSERT OR UPDATE ON public.user_quests "
        "FOR EACH ROW EXECUTE FUNCTION public.disconnect_quests_server_times()"
    )
    # Revoke ALL ambient grantees, not just currently-known mobile roles. Leave
    # shared default privileges unchanged; every new migration must do this too.
    op.execute("""
        DO $acl$
        DECLARE entry record; target text;
        BEGIN
            FOREACH target IN ARRAY ARRAY['public.user_quests', 'public.alembic_version'] LOOP
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
                WHERE p.oid = 'public.disconnect_quests_server_times()'::regprocedure
                    AND a.grantee <> p.proowner
            LOOP
                EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION '
                    'public.disconnect_quests_server_times() FROM %s',
                    CASE WHEN entry.grantee = 0 THEN 'PUBLIC'
                         ELSE pg_catalog.quote_ident(
                                 pg_catalog.pg_get_userbyid(entry.grantee)) END);
            END LOOP;
        END
        $acl$;
    """)
    op.execute("GRANT SELECT, INSERT, UPDATE ON public.user_quests TO disconnect_api")


def downgrade():
    # Guarded disposable test target only, never automatic hosted rollback.
    op.drop_table("user_quests", schema="public")
    op.execute("DROP FUNCTION public.disconnect_quests_server_times()")
