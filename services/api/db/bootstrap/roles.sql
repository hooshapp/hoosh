-- Infrastructure bootstrap, NOT product schema migration. No password belongs here.
-- Execute as the explicitly selected development database administrator.
DO $bootstrap$
DECLARE
    runtime pg_catalog.pg_roles%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'disconnect_api') THEN
        CREATE ROLE disconnect_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 10;
    END IF;

    SELECT * INTO STRICT runtime FROM pg_catalog.pg_roles WHERE rolname = 'disconnect_api';
    IF NOT runtime.rolcanlogin OR runtime.rolsuper OR runtime.rolcreatedb
        OR runtime.rolcreaterole OR runtime.rolinherit OR runtime.rolreplication
        OR runtime.rolbypassrls OR runtime.rolconnlimit NOT BETWEEN 1 AND 10 THEN
        RAISE EXCEPTION 'disconnect_api has unsafe role attributes; review explicitly';
    END IF;
    -- NOINHERIT alone does not prevent SET ROLE. Do not silently erase memberships.
    IF EXISTS (SELECT FROM pg_catalog.pg_auth_members WHERE member = runtime.oid) THEN
        RAISE EXCEPTION 'disconnect_api has unexpected memberships; review explicitly';
    END IF;
    IF EXISTS (SELECT FROM pg_catalog.pg_class WHERE relowner = runtime.oid)
        OR EXISTS (SELECT FROM pg_catalog.pg_namespace WHERE nspowner = runtime.oid)
        OR EXISTS (SELECT FROM pg_catalog.pg_database WHERE datdba = runtime.oid) THEN
        RAISE EXCEPTION 'disconnect_api must not own database objects';
    END IF;

    EXECUTE format('GRANT CONNECT ON DATABASE %I TO disconnect_api', current_database());
    GRANT USAGE ON SCHEMA public TO disconnect_api;
    -- Do not revoke PUBLIC/managed-role grants or alter Auth infrastructure.
    -- Reject an unsafe ambient grant instead of silently affecting other clients.
    IF has_database_privilege('disconnect_api', current_database(), 'CREATE')
        OR EXISTS (
            SELECT FROM pg_catalog.pg_namespace
            WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
                AND has_schema_privilege('disconnect_api', oid, 'CREATE')
        ) THEN
        RAISE EXCEPTION 'Ambient grants allow persistent object creation; review target';
    END IF;
    IF EXISTS (
        SELECT FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'auth' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
            AND (has_table_privilege('disconnect_api', c.oid, 'SELECT')
                OR has_table_privilege('disconnect_api', c.oid, 'INSERT')
                OR has_table_privilege('disconnect_api', c.oid, 'UPDATE')
                OR has_table_privilege('disconnect_api', c.oid, 'DELETE'))
    ) THEN
        RAISE EXCEPTION 'disconnect_api has managed Auth table access; review target';
    END IF;
END
$bootstrap$;

ALTER ROLE disconnect_api SET search_path = pg_catalog, public;
ALTER ROLE disconnect_api SET statement_timeout = '5s';
ALTER ROLE disconnect_api SET lock_timeout = '2s';
ALTER ROLE disconnect_api SET idle_in_transaction_session_timeout = '10s';
-- API-07 adds table grants/RLS in the same Alembic revision as product tables.
