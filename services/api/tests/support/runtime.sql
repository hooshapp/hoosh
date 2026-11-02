-- Public, local-only test credential. Never use against a managed project.
ALTER ROLE disconnect_api PASSWORD 'disconnect_test_runtime_only';
GRANT USAGE ON SCHEMA test_support TO disconnect_api;
GRANT SELECT ON test_support.environment TO disconnect_api;
