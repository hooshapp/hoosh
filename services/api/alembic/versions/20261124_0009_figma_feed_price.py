"""Figma Feed price, retaining immutable historical charges."""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "20261124_0009"
down_revision = "20261124_0008"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user_settings",
        sa.Column("personalization", JSONB(none_as_null=True), nullable=True),
        schema="public",
    )
    op.create_check_constraint(
        op.f("ck_user_settings_personalization_shape"),
        "user_settings",
        "personalization IS NULL OR (jsonb_typeof(personalization) = 'object' AND "
        "personalization ?& ARRAY['age','gender','nudge_tone'] AND personalizatio"
        "n - ARRAY['age','gender','nudge_tone'] = '{}'::jsonb AND "
        "(personalization->'age' = 'null'::jsonb OR (CASE WHEN jsonb_typeof(perso"
        "nalization->'age') = 'number' THEN "
        "(personalization->>'age')::numeric BETWEEN 18 AND 80 AND (personalizatio"
        "n->>'age')::numeric = trunc((personalization->>'age')::numeric) ELSE fal"
        "se END)) AND "
        "(personalization->'gender' = 'null'::jsonb OR personalization->>'gender'"
        " IN ('Male','Female','Other')) AND "
        "jsonb_typeof(personalization->'nudge_tone') = 'string' AND personalizati"
        "on->>'nudge_tone' IN ('Supportive','Direct','Playful','Intense'))",
        schema="public",
    )
    op.drop_constraint(
        op.f("ck_reward_entries_amount_range"), "reward_entries", schema="public", type_="check"
    )
    op.create_check_constraint(
        op.f("ck_reward_entries_amount_range"),
        "reward_entries",
        "amount IN (-20, -10, 0, 5, 20, 30, 50)",
        schema="public",
    )


def downgrade():
    op.execute(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.user_settings WHERE personal"
        "ization IS NOT NULL) THEN RAISE EXCEPTION 'Personalization must be retai"
        "ned'; END IF; END $$"
    )
    op.drop_constraint(
        op.f("ck_user_settings_personalization_shape"),
        "user_settings",
        schema="public",
        type_="check",
    )
    op.drop_column("user_settings", "personalization", schema="public")
    op.execute(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.reward_entries WHERE amount "
        "= -10) THEN RAISE EXCEPTION 'Historical Feed receipts must be preserved'"
        "; END IF; END $$"
    )
    op.drop_constraint(
        op.f("ck_reward_entries_amount_range"), "reward_entries", schema="public", type_="check"
    )
    op.create_check_constraint(
        op.f("ck_reward_entries_amount_range"),
        "reward_entries",
        "amount IN (-20, 0, 5, 20, 30, 50)",
        schema="public",
    )
