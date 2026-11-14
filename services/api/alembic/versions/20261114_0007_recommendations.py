"""Private bounded recommendation decision receipt; frozen additive DDL."""

from alembic import op

revision = "20261114_0007"
down_revision = "20261114_0006"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE public.recommendation_decisions (
    user_id UUID NOT NULL,
    offer_id UUID NOT NULL,
    decision VARCHAR(8) NOT NULL,
    quest_id UUID,
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_offer_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_recommendation_decisions PRIMARY KEY (user_id),
    CONSTRAINT ck_recommendation_decisions_decision_choice
        CHECK (decision IN ('accepted', 'skipped')),
    CONSTRAINT ck_recommendation_decisions_cooldown_positive CHECK (next_offer_at > decided_at),
    CONSTRAINT ck_recommendation_decisions_quest_coherent
        CHECK ((decision = 'accepted' AND quest_id IS NOT NULL AND quest_id = offer_id)
        OR (decision = 'skipped' AND quest_id IS NULL)),
    CONSTRAINT fk_recommendation_decisions_user_id_users
        FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE
)""")
    op.execute("ALTER TABLE public.recommendation_decisions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE public.recommendation_decisions FORCE ROW LEVEL SECURITY")
    op.execute(
        "REVOKE ALL ON public.recommendation_decisions FROM "
        "PUBLIC, anon, authenticated, service_role, disconnect_api"
    )
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    for command in ("SELECT", "INSERT", "UPDATE"):
        using = f" USING ({predicate})" if command != "INSERT" else ""
        check = f" WITH CHECK ({predicate})" if command != "SELECT" else ""
        op.execute(
            f"CREATE POLICY recommendation_decisions_{command.lower()}_own "
            "ON public.recommendation_decisions "
            f"FOR {command} TO disconnect_api{using}{check}"
        )
    op.execute("GRANT SELECT, INSERT, UPDATE ON public.recommendation_decisions TO disconnect_api")


def downgrade():
    op.drop_table("recommendation_decisions", schema="public")
