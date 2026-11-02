-- Run through a REAL disconnect_api login, not SET ROLE from an admin session.
-- On an unexpected permission, the transaction rolls back any probe object.
BEGIN;
DO $check$
BEGIN
    IF session_user <> 'disconnect_api' OR current_user <> 'disconnect_api' THEN
        RAISE EXCEPTION 'Permission checks require an actual runtime login';
    END IF;
    BEGIN
        CREATE TABLE public.__disconnect_permission_probe (id integer);
        RAISE EXCEPTION 'Runtime unexpectedly created a persistent table';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        CREATE SCHEMA __disconnect_permission_probe;
        RAISE EXCEPTION 'Runtime unexpectedly created a schema';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        PERFORM 1 FROM auth.users LIMIT 0;
        RAISE EXCEPTION 'Runtime unexpectedly accessed managed Auth users';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        SET LOCAL ROLE postgres;
        RAISE EXCEPTION 'Runtime unexpectedly assumed the migration/admin role';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END
$check$;
ROLLBACK;
