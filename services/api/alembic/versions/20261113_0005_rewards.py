"""Account ledger and wallet. DDL frozen at authoring, no runtime model imports."""

from alembic import op

revision = "20261113_0005"
down_revision = "20261111_0004"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE public.reward_wallets (
    user_id UUID NOT NULL,
    balance BIGINT NOT NULL,
    health INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    health_at TIMESTAMP WITH TIME ZONE NOT NULL,
    streak_days INTEGER NOT NULL,
    streak_day DATE,
    streak_unknown BOOLEAN NOT NULL,
    last_native_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_reward_wallets PRIMARY KEY (user_id),
    CONSTRAINT ck_reward_wallets_balance_range
        CHECK (balance >= 0 AND balance <= 9007199254740991),
    CONSTRAINT ck_reward_wallets_state_range CHECK (health BETWEEN 0 AND 100 AND revision > 0),
    CONSTRAINT ck_reward_wallets_streak_range CHECK (streak_days >= 0),
    CONSTRAINT fk_reward_wallets_user_id_users
        FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE
)""")
    op.execute("""CREATE TABLE public.reward_entries (
    user_id UUID NOT NULL,
    source VARCHAR(180) NOT NULL,
    kind VARCHAR(8) NOT NULL,
    amount INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload JSONB NOT NULL,
    installation_id UUID,
    sequence BIGINT,
    CONSTRAINT pk_reward_entries PRIMARY KEY (user_id, source),
    CONSTRAINT ck_reward_entries_amount_range CHECK (amount IN (-20, 0, 5, 20, 30, 50)),
    CONSTRAINT ck_reward_entries_kind_choice CHECK (kind IN ('quest', 'feed', 'native')),
    CONSTRAINT uq_reward_delivery UNIQUE (user_id, installation_id, sequence),
    CONSTRAINT fk_reward_entries_user_id_users
        FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE
)""")
    op.execute("""CREATE TABLE public.reward_streams (
    user_id UUID NOT NULL,
    installation_id UUID NOT NULL,
    sequence BIGINT NOT NULL,
    discarded BIGINT NOT NULL,
    timezone_id VARCHAR(128) NOT NULL,
    last_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_reward_streams PRIMARY KEY (user_id, installation_id),
    CONSTRAINT ck_reward_streams_cursor_range CHECK (sequence >= 0 AND discarded >= 0),
    CONSTRAINT fk_reward_streams_user_id_users
        FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE
)""")
    op.execute("""INSERT INTO public.reward_entries
      (user_id,source,kind,amount,recorded_at,payload)
      SELECT user_id,'quest:'||quest_id||':'||schedule_revision||':'||local_date,
      'quest',50,recorded_at,'{}'::jsonb FROM public.quest_occurrence_outcomes
      WHERE state='completed'""")
    op.execute("""INSERT INTO public.reward_wallets
      (user_id,balance,health,revision,health_at,streak_days,streak_unknown)
      SELECT user_id,sum(amount),50,1,statement_timestamp(),0,true
      FROM public.reward_entries GROUP BY user_id""")
    predicate = "user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid"
    for table in ("reward_wallets", "reward_entries", "reward_streams"):
        op.execute(f"""DO $acl$ DECLARE entry record; BEGIN
          FOR entry IN SELECT DISTINCT a.grantee FROM pg_catalog.pg_class c,
            LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,
              pg_catalog.acldefault('r',c.relowner))) a
            WHERE c.oid='public.{table}'::regclass AND a.grantee<>c.relowner LOOP
            EXECUTE pg_catalog.format('REVOKE ALL ON TABLE public.{table} FROM %s',
            CASE WHEN entry.grantee=0 THEN 'PUBLIC' ELSE pg_catalog.quote_ident(
              pg_catalog.pg_get_userbyid(entry.grantee)) END);
          END LOOP; END $acl$""")
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY")
        commands = (
            ("SELECT", "INSERT") if table == "reward_entries" else ("SELECT", "INSERT", "UPDATE")
        )
        for command in commands:
            using = f" USING ({predicate})" if command in ("SELECT", "UPDATE") else ""
            check = f" WITH CHECK ({predicate})" if command in ("INSERT", "UPDATE") else ""
            op.execute(
                f"CREATE POLICY {table}_{command.lower()}_own ON public.{table} "
                f"FOR {command} TO disconnect_api{using}{check}"
            )
        op.execute(f"GRANT {', '.join(commands)} ON public.{table} TO disconnect_api")


def downgrade():
    for table in ("reward_streams", "reward_entries", "reward_wallets"):
        op.drop_table(table, schema="public")
