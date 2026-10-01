# Database migrations

Flyway applies V1 (users) and V2 (accounts, categories, and defaults for existing users) before Hibernate validates the schema.
Never edit an applied migration; add a new version for subsequent changes.

V3 adds transactions, owner/reference constraints, and query indexes. Account balances are derived from these rows, not stored separately.