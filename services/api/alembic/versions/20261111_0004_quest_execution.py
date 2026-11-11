"""Schedule version snapshots and unique own occurrence outcomes."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

from alembic import op

revision = "20261111_0004"
down_revision = "20261111_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "quest_schedule_versions",
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("quest_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("quest_revision", sa.Integer(), nullable=False),
        sa.Column("first_date", sa.Date(), nullable=False),
        sa.Column("definition", pg.JSONB(none_as_null=True), nullable=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint(
            "user_id", "quest_id", "revision", name="pk_quest_schedule_versions"
        ),
        sa.ForeignKeyConstraint(
            ["user_id", "quest_id"],
            ["public.user_quests.user_id", "public.user_quests.quest_id"],
            ondelete="CASCADE",
            name="fk_quest_schedule_versions_quest",
        ),
        sa.CheckConstraint(
            "revision > 0 AND quest_revision > 0",
            name=op.f("ck_quest_schedule_versions_positive_revisions"),
        ),
        sa.CheckConstraint(
            "effective_until IS NULL OR effective_until >= effective_from",
            name=op.f("ck_quest_schedule_versions_ordered_times"),
        ),
        sa.CheckConstraint(
            "definition IS NULL OR jsonb_typeof(definition) = 'object'",
            name=op.f("ck_quest_schedule_versions_definition_object"),
        ),
        schema="public",
    )
    op.create_table(
        "quest_occurrence_outcomes",
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("quest_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("schedule_revision", sa.Integer(), nullable=False),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("credits", sa.Integer(), nullable=False),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("statement_timestamp()"),
        ),
        sa.PrimaryKeyConstraint(
            "user_id",
            "quest_id",
            "schedule_revision",
            "local_date",
            name="pk_quest_occurrence_outcomes",
        ),
        sa.ForeignKeyConstraint(
            ["user_id", "quest_id", "schedule_revision"],
            [
                "public.quest_schedule_versions.user_id",
                "public.quest_schedule_versions.quest_id",
                "public.quest_schedule_versions.revision",
            ],
            ondelete="CASCADE",
            name="fk_quest_occurrence_outcomes_schedule",
        ),
        sa.CheckConstraint(
            "(state = 'completed' AND credits = 50) OR (state = 'cancelled' AND credits = 0)",
            name=op.f("ck_quest_occurrence_outcomes_state_credit"),
        ),
        schema="public",
    )
    # Reset inherited ACLs, including unexpected project-specific ambient roles.
    op.execute("""
        DO $acl$
        DECLARE entry record; target text;
        BEGIN
          FOREACH target IN ARRAY ARRAY[
            'public.quest_schedule_versions', 'public.quest_occurrence_outcomes'] LOOP
            FOR entry IN SELECT DISTINCT a.grantee FROM pg_catalog.pg_class c,
              LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,
                pg_catalog.acldefault('r', c.relowner))) a
              WHERE c.oid=target::regclass AND a.grantee<>c.relowner
            LOOP
              EXECUTE pg_catalog.format('REVOKE ALL ON TABLE %s FROM %s', target,
                CASE WHEN entry.grantee=0 THEN 'PUBLIC' ELSE
                  pg_catalog.quote_ident(pg_catalog.pg_get_userbyid(entry.grantee)) END);
            END LOOP;
          END LOOP;
        END $acl$;
    """)
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    for table, commands in (
        ("quest_schedule_versions", ("SELECT", "INSERT", "UPDATE")),
        ("quest_occurrence_outcomes", ("SELECT", "INSERT")),
    ):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY")
        for cmd in commands:
            using = f" USING ({predicate})" if cmd in ("SELECT", "UPDATE") else ""
            check = f" WITH CHECK ({predicate})" if cmd in ("INSERT", "UPDATE") else ""
            op.execute(
                f"CREATE POLICY {table}_{cmd.lower()}_own ON public.{table} "
                f"FOR {cmd} TO disconnect_api{using}{check}"
            )
        op.execute(f"GRANT {', '.join(commands)} ON public.{table} TO disconnect_api")


def downgrade():
    op.drop_table("quest_occurrence_outcomes", schema="public")
    op.drop_table("quest_schedule_versions", schema="public")
