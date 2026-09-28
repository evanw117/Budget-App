# Database migrations

Flyway applies V1__create_users.sql before Hibernate validates the schema.
Never edit an applied migration; add a new version for subsequent changes.
