# Database boundary

The intended database is managed Supabase PostgreSQL; Supabase Auth owns its `auth` schema.

The backend/database owner will add SQLAlchemy models and Alembic migrations with the first approved profile/plan contract. No speculative product tables or production migrations are created by the foundation scaffold.

- Use one migration authority and coordinate migration ordering.
- Keep opaque iOS selection tokens on the device.
- Never put elevated database credentials in the mobile app.
- Test cross-user isolation; an elevated backend connection may bypass database RLS.
- Start database integration tests against an isolated local/test database, never production.
