-- Docker-only prerequisites, not a managed Auth migration or product schema.
DO $fixture$
BEGIN
    IF current_database() <> 'disconnect_test' THEN
        RAISE EXCEPTION 'Fixture refuses a non-test database';
    END IF;
END
$fixture$;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
-- Test-only Data API role/unsafe-default prerequisites, not real Auth emulation.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
CREATE SCHEMA test_support;
CREATE TABLE test_support.environment (scope text PRIMARY KEY);
INSERT INTO test_support.environment VALUES ('disconnect-isolated-postgres-v1');
-- No user/account rows or product tables are pre-created.
