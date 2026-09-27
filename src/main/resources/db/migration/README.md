# Database migrations

Flyway runs versioned SQL migrations here before Hibernate validates the schema.
Phase 1 has no application tables, so no artificial baseline migration is needed.
Flyway may create its own schema history table on startup.

Add the first real schema change in Phase 2 as `V1__create_users.sql`.
Never edit an already applied migration; add a new version instead.
