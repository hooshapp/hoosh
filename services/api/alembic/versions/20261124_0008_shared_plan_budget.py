"""Add an explicit shared selected-app scope; legacy plans keep per-app meaning."""
from alembic import op

revision = "20261124_0008"
down_revision = "20261114_0007"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint(
        op.f("ck_user_settings_plan_draft_shape"), "user_settings", schema="public", type_="check"
    )
    op.create_check_constraint(
        op.f("ck_user_settings_plan_draft_shape"), "user_settings",
        "plan_draft IS NULL OR (jsonb_typeof(plan_draft) = 'object' AND "
        "plan_draft ?& ARRAY['weekdays','hours','timezone_id','session_count',"
        "'session_minutes'] AND "
        "plan_draft - ARRAY['weekdays','hours','timezone_id','session_count','session_minutes',"
        "'budget_scope'] = '{}'::jsonb AND "
        "(NOT plan_draft ? 'budget_scope' OR (jsonb_typeof(plan_draft->'budget_scope') = 'string' "
        "AND plan_draft->>'budget_scope' = 'all_selected_apps')))",
        schema="public",
    )


def downgrade():
    # Never silently discard a stored shared budget or reinterpret it as per-app.
    op.execute(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.user_settings "
        "WHERE plan_draft ? 'budget_scope') "
        "THEN RAISE EXCEPTION 'Remove shared plans explicitly before downgrading'; END IF; END $$"
    )
    op.drop_constraint(
        op.f("ck_user_settings_plan_draft_shape"), "user_settings", schema="public", type_="check"
    )
    op.create_check_constraint(
        op.f("ck_user_settings_plan_draft_shape"), "user_settings",
        "plan_draft IS NULL OR (jsonb_typeof(plan_draft) = 'object' AND "
        "plan_draft ?& ARRAY['weekdays','hours','timezone_id','session_count',"
        "'session_minutes'] AND "
        "plan_draft - ARRAY['weekdays','hours','timezone_id','session_count','session_minutes'] "
        "= '{}'::jsonb)",
        schema="public",
    )
