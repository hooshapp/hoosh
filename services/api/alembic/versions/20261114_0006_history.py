"""Private bounded History measurement series; frozen additive DDL."""

from alembic import op

revision = "20261114_0006"
down_revision = "20261113_0005"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE public.history_records (
    user_id UUID NOT NULL,
    revision INTEGER NOT NULL,
    series_id UUID NOT NULL,
    timezone_id VARCHAR(128) NOT NULL,
    selected_count INTEGER NOT NULL,
    started_on DATE NOT NULL,
    days JSONB NOT NULL,
    baseline JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_history_records PRIMARY KEY (user_id),
    CONSTRAINT ck_history_records_revision_positive CHECK (revision > 0),
    CONSTRAINT ck_history_records_selection_range CHECK (selected_count BETWEEN 1 AND 512),
    CONSTRAINT ck_history_records_timezone_bound CHECK (char_length(timezone_id) BETWEEN 1 AND 128),
    CONSTRAINT ck_history_records_json_shape
        CHECK (jsonb_typeof(days) = 'object' AND (baseline IS NULL OR
        jsonb_typeof(baseline) = 'object')),
    CONSTRAINT fk_history_records_user_id_users
        FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE
)""")
    op.execute("ALTER TABLE public.history_records ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE public.history_records FORCE ROW LEVEL SECURITY")
    op.execute(
        "REVOKE ALL ON public.history_records FROM "
        "PUBLIC, anon, authenticated, service_role, disconnect_api"
    )
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    for command in ("SELECT", "INSERT", "UPDATE"):
        using = f" USING ({predicate})" if command != "INSERT" else ""
        check = f" WITH CHECK ({predicate})" if command != "SELECT" else ""
        op.execute(
            f"CREATE POLICY history_records_{command.lower()}_own ON public.history_records "
            f"FOR {command} TO disconnect_api{using}{check}"
        )
    op.execute("GRANT SELECT, INSERT, UPDATE ON public.history_records TO disconnect_api")


def downgrade():
    op.drop_table("history_records", schema="public")
