# Personal Finance & US Relocation Tracker

A Java 21 / Spring Boot backend built as a feature-based modular monolith.
Phase 1 provides infrastructure and an API status endpoint. Financial features
and authentication will be added in later phases.

## Requirements

- JDK 21
- Maven 3.6.3 or newer
- Docker with Compose v2 (for local PostgreSQL and integration tests)

## Local development

1. Copy `.env.example` to `.env` and set a non-empty local `DB_PASSWORD`.
2. Run `docker compose config --quiet` to validate Compose configuration.
3. Run `docker compose up -d --wait` to start PostgreSQL.
4. Set `DB_USERNAME` and `DB_PASSWORD` in your terminal or IDE environment,
   matching `.env`. If you changed the database name or port, set `DB_NAME`
   and `DB_PORT` there too.
5. Run `mvn spring-boot:run`.
6. Request `GET http://localhost:8080/api/v1/health`.

Expected response:

```json
{"status":"UP","service":"finance-api"}
```

Compose reads `.env` automatically; Spring Boot does not. Supply application
variables through the process environment or your IDE's run configuration.
There are deliberately no fallback database credentials. Environment variables
keep credentials out of source control and allow the same artifact to run in
different environments. `.env` is ignored; `.env.example` contains no password.

The endpoint reports HTTP application liveness, not a continuous database
readiness check. Normal application startup requires PostgreSQL because Flyway
and JPA initialize against it.

PostgreSQL is bound only to localhost and persists data in a named volume.
`docker compose down` stops it while preserving data. Changing credentials in
`.env` does not change credentials inside an already initialized database volume.

## Build and tests

```sh
mvn clean verify
mvn test
mvn -Pintegration verify
```

The default build runs the MVC endpoint test without a database or Docker.
The integration profile additionally runs `FinanceApplicationIT`, which starts
a disposable PostgreSQL container, loads the full application, checks Flyway
and database connectivity, and calls the real HTTP endpoint. It requires Docker
and fails if Docker is unavailable; it is not silently skipped.

The packaged application is `target/finance-0.0.1-SNAPSHOT.jar` and can be run
with `java -jar target/finance-0.0.1-SNAPSHOT.jar` using the same environment.

## Structure and decisions

```text
src/main/java/com/example/finance/
  FinanceApplication.java        Application entry point and component-scan root
  health/                        Controller and response DTO
src/main/resources/
  application.yml                Environment-based application configuration
  db/migration/                  Future versioned Flyway SQL migrations
src/test/java/com/example/finance/
  health/HealthControllerTest.java
  FinanceApplicationIT.java
```

Future features (`auth`, `user`, `account`, `category`, `transaction`, `budget`,
`recurring`, `subscription`, `savings`, `importing`, `analytics`) will each own
their controllers, services, repositories, DTOs, and entities where appropriate.
Shared code and configuration packages will be introduced when needed.
The health endpoint has no business logic, so it needs no service or repository.

Flyway records ordered schema migrations so database changes are reproducible
and reviewable alongside code. Hibernate uses `ddl-auto: validate`, so it checks
entity/schema compatibility instead of creating or altering tables. No domain
tables exist yet, so Phase 1 needs no SQL migration. Flyway manages its schema
history; Phase 2 will introduce the first real migration. Applied migrations
must not be rewritten.

Open Session in View is disabled: later services must fetch the data needed for
response DTOs within their transaction boundaries. Database timestamps use UTC
for Hibernate JDBC operations. Spring Boot manages compatible dependency
versions, including JUnit 5, Mockito, and Testcontainers.

Before Phase 2, establish a working local PostgreSQL connection and run the
integration profile. Authentication, Spring Security, users, JWT, OpenAPI,
application Docker packaging, and CI are not implemented in this phase.
