# Personal Finance & US Relocation Tracker

Java 21 / Spring Boot backend organized as a feature-based modular monolith.
Phases 1 and 2 provide PostgreSQL infrastructure, a health endpoint, and user
registration/login with JWT authentication. Financial features are not implemented.

## Local development

Requirements: JDK 21, Maven 3.6.3+, and Docker with Compose v2.

1. Copy `.env.example` to `.env` and set a local `DB_PASSWORD`.
2. Generate a signing key with `openssl rand -base64 32` and set `JWT_SECRET`.
   Alternatively, in PowerShell:
   ```powershell
   $keyBytes = New-Object byte[] 32
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($keyBytes)
   $rng.Dispose()
   [Convert]::ToBase64String($keyBytes)
   ```
   Store the output only in your local environment or `.env`, never in Git.
3. Run `docker compose config --quiet`, then `docker compose up -d --wait`.
4. Set `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` in the terminal or IDE's
   application environment, matching `.env`. Set `DB_NAME`, `DB_PORT`, and
   `DB_HOST` too if you changed their defaults.
5. Run `mvn spring-boot:run` or run `FinanceApplication` in the IDE.

Compose reads `.env` automatically; Spring Boot does not. Configuration uses
process environment variables to keep credentials out of source control.
`.env` is ignored; `.env.example` has empty password and signing-key values.
There are no fallback production credentials or signing keys.

PostgreSQL binds only to localhost and persists in a named Docker volume.
`docker compose down` preserves its data. Changing `.env` credentials does not
change credentials in an already initialized volume.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/v1/health` | Public API liveness: `{"status":"UP","service":"finance-api"}` |
| POST | `/api/v1/auth/register` | Public registration; 201 with user DTO |
| POST | `/api/v1/auth/login` | Public login; 200 with access token |
| GET | `/api/v1/users/me` | Protected current-user DTO |

Register with:

```json
{"email":"alice@example.com","password":"a-long-example-password","displayName":"Alice"}
```

Email is stripped and lowercased with `Locale.ROOT`; display name is stripped.
Email is required and limited to 254 characters; display name to 100.
Registration passwords must contain 12–128 characters and cannot be blank.
Passwords are never trimmed or lowercased.

Registration returns only `id`, `email`, `displayName`, and `role`. Every new
user receives `ROLE_USER`; submitted role fields cannot grant privileges.
`ROLE_ADMIN` exists for future controlled provisioning; no public role-management
or admin-registration endpoint exists.

Login with the email and password. Its response contains `accessToken`,
`tokenType` (`Bearer`), and `expiresIn` (seconds). Registration does not log you in.
Call the protected endpoint with:

```http
Authorization: Bearer <accessToken>
```

Validation errors return 400; duplicate email returns 409; invalid credentials
or missing/invalid bearer tokens return 401; insufficient authority returns 403.
Validation errors never echo submitted passwords. Unknown-email and wrong-password
login attempts return the same message. An unknown-email attempt still performs
password verification against a dummy hash to reduce timing differences.

## Security decisions

- PBKDF2-HMAC-SHA256 uses Spring Security's v5.8 defaults: a random 16-byte salt,
  310,000 iterations, and a 256-bit hash. `{pbkdf2}` identifies the stored encoding
  for future migration. Hashes are one-way, salted, and never returned by the API.
- Spring Security's resource-server support verifies JWT signatures, expiry,
  issuer, and audience. Tokens use HS256 and a Base64-configured key containing
  at least 32 random bytes. The application fails startup for a missing/invalid key.
- Tokens contain a UUID subject and roles, not email or password data. Default
  lifetime is 900 seconds; `JWT_TTL_SECONDS` allows 60–3600 seconds. Spring's
  default timestamp validator allows a small clock skew (60 seconds).
- HTTP sessions are disabled. CSRF protection is disabled because this API uses
  explicitly supplied bearer headers, not browser-attached authentication cookies.
  Revisit CSRF when introducing any cookie-based authentication.
- All routes except the explicit public endpoints require `ROLE_USER` or
  `ROLE_ADMIN`. Method security is enabled for future service-level restrictions.
- `/users/me` obtains its UUID from the verified Spring Security principal.
  Future financial queries must scope reads and writes to that owner, including
  referenced entities; a valid token alone does not establish resource ownership.
- Role claims remain valid until token expiry. Refresh tokens, immediate
  revocation/logout, email verification, password reset, and login rate limiting
  are not implemented. Use HTTPS when deploying. Replacing the signing key
  invalidates existing tokens. JWTs are signed, not encrypted.

## Build and tests

```sh
mvn clean verify
mvn -Pintegration clean verify
```

The default build runs MVC and service unit tests without Docker.
The integration profile additionally starts disposable PostgreSQL containers and
checks real Flyway migrations, registration/login, hashing, unique constraints,
JWT access/expiry/tampering, role enforcement, and principal-based identity.
It fails if Docker is unavailable. Test credentials and the test-only signing
key live in the test runtime; they are not packaged in the application JAR.

The packaged application is `target/finance-0.0.1-SNAPSHOT.jar`:
`java -jar target/finance-0.0.1-SNAPSHOT.jar` uses the same environment variables.

## Structure and persistence

```text
com.example.finance/
  FinanceApplication.java
  health/       Public status endpoint and DTO
  auth/         Registration/login controller, service, requests, token issuing
  user/         User entity, role, repository, current-user service and DTO
  config/       Security filter chain, password encoder, JWT configuration
  common/       Safe authentication/validation API error responses
src/main/resources/db/migration/
  V1__create_users.sql
```

Controllers deal with HTTP; services own business rules and transaction boundaries.
Repositories persist entities; explicit DTOs prevent password-hash disclosure.
The database enforces unique normalized email and valid roles. A pre-insert
lookup gives a friendly duplicate response; the unique constraint protects races.

Flyway applies versioned SQL changes before Hibernate validates entity mappings.
Hibernate remains `ddl-auto: validate`, so it cannot silently alter the schema.
Never modify an already applied migration; introduce a new version instead.
Open Session in View remains disabled and Hibernate JDBC timestamps use UTC.

Phase 2 stops at authentication and users. Accounts, transactions, budgets,
recurring payments, savings, imports, and analytics remain for later phases.
