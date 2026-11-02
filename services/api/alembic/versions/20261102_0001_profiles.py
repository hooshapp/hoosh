"""Minimal profiles with explicit privileges, transaction-local RLS and server clocks."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20261102_0001"
down_revision = None
branch_labels = None
depends_on = None

# Immutable historical policy; never import mutable application models here.
STRIP_CHARACTERS = (
    "\t\n\v\f\r\x1c\x1d\x1e\x1f \x85\xa0\u1680\u2000\u2001\u2002\u2003\u2004"
    "\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000"
)


def upgrade():
    op.create_table(
        "profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=True),
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
        sa.PrimaryKeyConstraint("user_id", name="pk_profiles"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="fk_profiles_user_id_users"
        ),
        sa.CheckConstraint("revision >= 1", name=op.f("ck_profiles_revision_positive")),
        sa.CheckConstraint(
            "display_name IS NULL OR (char_length(display_name) BETWEEN 1 AND 80 "
            "AND display_name = pg_catalog.btrim(display_name, E'"
            + "".join(f"\\u{ord(char):04x}" for char in STRIP_CHARACTERS)
            + "'))",
            name=op.f("ck_profiles_display_name_valid"),
        ),
        schema="public",
    )
    op.execute("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY")
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    op.execute(
        "CREATE POLICY profiles_select_own ON public.profiles FOR SELECT "
        "TO disconnect_api USING (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT "
        "TO disconnect_api WITH CHECK (" + predicate + ")"
    )
    op.execute(
        "CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE "
        "TO disconnect_api USING (" + predicate + ") WITH CHECK (" + predicate + ")"
    )
    op.execute("""
        CREATE FUNCTION public.disconnect_profiles_server_times() RETURNS trigger
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
        "CREATE TRIGGER profiles_server_times BEFORE INSERT OR UPDATE ON public.profiles "
        "FOR EACH ROW EXECUTE FUNCTION public.disconnect_profiles_server_times()"
    )
    # Revoke ALL ambient grantees, not just currently-known mobile roles. Leave
    # shared default privileges unchanged; every new migration must do this too.
    op.execute("""
        DO $acl$
        DECLARE entry record; target text;
        BEGIN
            FOREACH target IN ARRAY ARRAY['public.profiles', 'public.alembic_version'] LOOP
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
                WHERE p.oid = 'public.disconnect_profiles_server_times()'::regprocedure
                    AND a.grantee <> p.proowner
            LOOP
                EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION '
                    'public.disconnect_profiles_server_times() FROM %s',
                    CASE WHEN entry.grantee = 0 THEN 'PUBLIC'
                         ELSE pg_catalog.quote_ident(
                                 pg_catalog.pg_get_userbyid(entry.grantee)) END);
            END LOOP;
        END
        $acl$;
    """)
    op.execute("GRANT SELECT, INSERT, UPDATE ON public.profiles TO disconnect_api")


def downgrade():
    # Only the guarded disposable runner exposes downgrade. Never use it as an
    # automatic rollback on a populated shared/production database.
    op.drop_table("profiles", schema="public")
    op.execute("DROP FUNCTION public.disconnect_profiles_server_times()")
