BEGIN;

CREATE TABLE public.alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 20261102_0001

CREATE TABLE public.profiles (
    user_id UUID NOT NULL,
    display_name TEXT,
    revision INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT statement_timestamp() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT statement_timestamp() NOT NULL,
    CONSTRAINT pk_profiles PRIMARY KEY (user_id),
    CONSTRAINT fk_profiles_user_id_users FOREIGN KEY(user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT ck_profiles_revision_positive CHECK (revision >= 1),
    CONSTRAINT ck_profiles_display_name_valid CHECK (display_name IS NULL OR (char_length(display_name) BETWEEN 1 AND 80 AND display_name = pg_catalog.btrim(display_name, E'\u0009\u000a\u000b\u000c\u000d\u001c\u001d\u001e\u001f\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000')))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO disconnect_api USING (user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid);

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO disconnect_api WITH CHECK (user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid);

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO disconnect_api USING (user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = NULLIF(pg_catalog.current_setting('app.user_id', true), '')::uuid);

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
        $times$;;

CREATE TRIGGER profiles_server_times BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.disconnect_profiles_server_times();

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
                    EXECUTE pg_catalog.format('REVOKE ALL ON TABLE %%s FROM %%s', target,
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
                    'public.disconnect_profiles_server_times() FROM %%s',
                    CASE WHEN entry.grantee = 0 THEN 'PUBLIC'
                         ELSE pg_catalog.quote_ident(
                                 pg_catalog.pg_get_userbyid(entry.grantee)) END);
            END LOOP;
        END
        $acl$;;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO disconnect_api;

INSERT INTO public.alembic_version (version_num) VALUES ('20261102_0001') RETURNING public.alembic_version.version_num;

COMMIT;
