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
CREATE SCHEMA test_support;
CREATE TABLE test_support.environment (scope text PRIMARY KEY);
INSERT INTO test_support.environment VALUES ('disconnect-isolated-postgres-v1');
-- No user/account rows or product tables are pre-created.
