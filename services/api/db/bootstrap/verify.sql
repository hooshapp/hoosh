-- Read-only catalog evidence. No Auth rows, password hashes or secrets are read.
SELECT r.rolname, r.rolcanlogin, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
    r.rolinherit, r.rolreplication, r.rolbypassrls, r.rolconnlimit,
    has_database_privilege(r.oid, current_database(), 'CONNECT') AS can_connect,
    has_database_privilege(r.oid, current_database(), 'CREATE') AS can_create_schema,
    has_database_privilege(r.oid, current_database(), 'TEMP') AS can_use_temporary_tables,
    has_schema_privilege(r.oid, 'public', 'USAGE') AS public_usage,
    has_schema_privilege(r.oid, 'public', 'CREATE') AS public_create,
    (SELECT count(*) FROM pg_catalog.pg_auth_members WHERE member = r.oid) AS memberships,
    (SELECT count(*) FROM pg_catalog.pg_class WHERE relowner = r.oid) AS owned_relations,
    (SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspowner = r.oid) AS owned_schemas,
    (SELECT count(*) FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'auth' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
            AND (has_table_privilege(r.oid, c.oid, 'SELECT')
                OR has_table_privilege(r.oid, c.oid, 'INSERT')
                OR has_table_privilege(r.oid, c.oid, 'UPDATE')
                OR has_table_privilege(r.oid, c.oid, 'DELETE'))) AS accessible_auth_relations
FROM pg_catalog.pg_roles r WHERE r.rolname = 'disconnect_api';
