# Phase 4: Accounts and categories

## Model and ownership

`financial_account` belongs to exactly one `app_user` through a required foreign
key. It stores a UUID, name, account type, three-letter uppercase currency,
`NUMERIC(19,4)` opening balance, active flag, and creation/update timestamps.
Names are labels, not identifiers: duplicate account names are allowed both
within a user and across users. UUIDs distinguish the accounts. Owner queries
use an index on `user_id`.

`category` also has a required owner. It stores a name, INCOME/EXPENSE type,
active flag, timestamps, and an immutable `defaultCategory` provenance flag.
A unique index on `(user_id, type, lower(name))` prevents case-insensitive
name duplicates, including archived names. A user can have the same name once
for income and once for expense; different users can use the same names.
Names are trimmed at the API boundary. Database constraints provide a second
line of defense and protect simultaneous duplicate writes.

Controllers obtain the UUID from Spring Security's verified JWT subject.
DTOs contain no owner field. Extra client-supplied ownership fields cannot
assign or transfer a record. Every item query uses both resource ID and owner
ID; foreign and nonexistent IDs return the same 404. This applies equally to
normal and admin roles; there is no cross-user admin financial API.
Repositories and JPA entities never leave the service boundary as API results.
The existing security filter chain requires authentication for all these routes.

## Default categories

Each new user gets 3 income and 13 expense categories, including
**Moving / Relocation**. They are private copies, not shared system rows.
Owners may rename, change type, archive, or restore their copies without
changing another user's defaults. The provenance flag is not client-editable.

Registration creates the user and all defaults in the same transaction.
`DefaultCategoryService` requires that transaction. V2 backfills existing users
once. It is not a startup reseeding job: renamed/archived defaults stay that way.
Tests compare the migration's defaults with the registration seed definitions.

## API contract

All routes require `Authorization: Bearer <token>` when called directly.

| Method | Accounts                | Categories                | Result                            |
| ------ | ----------------------- | ------------------------- | --------------------------------- |
| GET    | `/api/v1/accounts`      | `/api/v1/categories`      | Owned records, including archived |
| GET    | `/api/v1/accounts/{id}` | `/api/v1/categories/{id}` | One owned record                  |
| POST   | `/api/v1/accounts`      | `/api/v1/categories`      | 201 and Location header           |
| PATCH  | `/api/v1/accounts/{id}` | `/api/v1/categories/{id}` | Updated DTO                       |
| DELETE | `/api/v1/accounts/{id}` | `/api/v1/categories/{id}` | Archive; 204, no body             |

Account creation:

```json
{
  "name": "Checking",
  "accountType": "CHECKING",
  "currency": "USD",
  "openingBalance": "1200.5000"
}
```

Category creation:

```json
{ "name": "Pets", "type": "EXPENSE" }
```

PATCH changes only supplied fields. Explicit nulls, blank names, invalid types,
and invalid financial formats return 400. An empty PATCH is a no-op. Set
`{"active":true}` to restore an archived item. Repeated DELETE remains 204
while keeping the record. Missing/foreign IDs return 404, duplicates return 409,
and unauthenticated calls return 401. Lists currently return all owned records;
pagination is unnecessary for this phase's small account/category collections.

## Balances and currencies

`openingBalance` is an initial/manual value. It is **not** a synchronized bank
balance, available credit, or a total calculated from transactions. Java uses
BigDecimal throughout; the database stores up to 15 whole digits and 4 fractional
digits. Validation rejects excess precision instead of silently rounding it.
Negative balances are permitted, for example for a credit-card liability.
Amounts serialize as decimal strings and stay strings in frontend forms and
cards, preventing loss of precision through JavaScript arithmetic.

Currency accepts an ISO-style three-letter code and normalizes it to uppercase.
It does not yet validate against an external currency registry or enforce each
currency's minor-unit rules. The UI displays each amount with its currency and
does not add amounts in different currencies or perform conversions.

In Phase 5, retain `openingBalance` and derive a separate current balance from
that value plus posted signed account entries on the backend. Do not overwrite
the opening balance whenever a transaction is added. Currency changes and edits
to the opening balance will then need explicit rules once entries exist. Future
transaction foreign keys must be ownership-checked in services too; archiving
preserves identifiers for those historical references.

## Frontend

`/accounts` and `/categories` call real APIs; they do not consume dashboard mocks.
Both pages support loading, unauthenticated, retryable error, and empty states,
creation/edit forms, archive confirmation, and a Show archived toggle with restore.
The dashboard remains a public sample preview and does not aggregate live accounts.

The browser talks to `/api/finance/accounts` or `/api/finance/categories` on
Next.js. The server reads the existing HttpOnly session cookie, forwards its JWT,
allows only known resource/UUID paths and writable DTO fields, checks same-origin
headers for mutations, handles 204 responses, and disables caching. Expired
sessions clear the cookie and remove displayed data. Backend error details are
not leaked. Spring Boot remains the ownership and validation authority.

## Verification

```sh
mvn -Pintegration clean verify
cd frontend
npm run build
npm run lint
npm test
npm run test:e2e
```

Backend tests use PostgreSQL Testcontainers, not H2. Coverage includes real signed
JWTs, private reads/writes, registration seeding, upgrading a Phase 2 database,
exact decimal values, partial updates, archive/restore, invalid data, and unique
constraints. Frontend tests cover proxy authentication/CSRF/field allowlists,
exact string amounts, 204 handling, error recovery, and desktop/mobile workflows.
Browser workflow fixtures are isolated mock API responses; backend integration
tests separately exercise the real persistence and authorization boundaries.

## Interview discussion

- Owner-scoped queries prevent insecure direct object references even when a
  caller guesses another record's UUID. UUID unpredictability is not authorization.
- Database uniqueness handles races that a pre-insert lookup alone cannot stop.
- Transactional registration avoids users being created without their defaults.
- Soft deletion preserves history and makes accidental archiving reversible.
- Decimal strings and BigDecimal keep money out of floating-point calculations.
- Explicit request/response DTOs prevent client ownership or provenance changes
  and keep lazy JPA relationships away from JSON serialization.
- Flyway evolves an existing database; Hibernate only validates the resulting schema.

No transactions, budgets, recurring payments, savings logic, CSV imports,
analytics, or currency conversion are implemented by Phase 4.
