# Phase 5: Transactions

This follows the revised roadmap: frontend foundation was Phase 3, accounts and categories were Phase 4, and transactions are Phase 5. The frontend is now named **Budget App**.

## Use the app

Start PostgreSQL, Spring Boot, and the Next.js frontend using the root and frontend READMEs.
Open http://localhost:3000, register or sign in, then:

1. Add an account with its currency and starting balance.
2. Open Transactions and choose Add transaction.
3. Select Income or Expense, an account, and a matching category.
4. Enter a positive amount, the date of the completed transaction, and an optional description.
5. Save, then open Accounts to see the calculated current balance.
6. Use account/type/date filters and Previous/Next to browse. Edit corrects the record; Delete asks for confirmation and permanently removes it.

Accounts, Categories, and Transactions use real authenticated APIs.
The dashboard is still explicitly sample data; it is not a summary of these transactions.
Budgets, transfers, recurring payments, imports, savings, and analytics are not implemented in this phase.

## HTTP contract

All endpoints require a valid bearer token. The user UUID comes only from its authenticated subject.

| Method | Path | Result |
| --- | --- | --- |
| GET | /api/v1/transactions | Paginated owned records |
| GET | /api/v1/transactions/{id} | Owned record |
| POST | /api/v1/transactions | Create, 201 with Location |
| PUT | /api/v1/transactions/{id} | Replace editable fields, 200 |
| DELETE | /api/v1/transactions/{id} | Permanently delete, 204 |

POST and PUT accept:
```json
{
  "accountId": "owned-account-uuid",
  "categoryId": "owned-category-uuid",
  "type": "EXPENSE",
  "amount": "12.3456",
  "date": "2026-01-01",
  "description": "Groceries"
}
```

Required fields are accountId, categoryId, type, amount, and date.
Description is optional, trimmed, and limited to 500 characters; omitted/null becomes empty.
PUT is a full edit, not a partial PATCH.
Amounts must be positive with at most 15 integer digits and 4 fractional digits.
Dates must be valid calendar dates, no later than the server's current date. There are no pending/future transactions.

List query parameters: accountId, type (INCOME/EXPENSE), from, to, page (zero-based, default 0), size (1–100, default 20).
Date boundaries are inclusive; reversed dates and invalid pagination return 400.
Results contain items, page, size, totalElements, totalPages.
Ordering is date descending, then UUID descending, giving a deterministic tie-break.
Foreign account filters and foreign/missing records return the same 404.
Invalid input returns 400; conflicting referenced currency/type changes return 409; unauthenticated requests return 401.

## Financial and persistence rules

Java BigDecimal and PostgreSQL NUMERIC(19,4) preserve amounts. Over-precision is rejected rather than rounded.
Money is returned as JSON strings, and the frontend forwards those strings without Number/float calculations.

Current balance = opening balance + sum(income) - sum(expenses).
It is derived on the server, not stored as another mutable total, so edits, moves, type changes, and deletions cannot leave a stale balance.
List balances use one grouped query, not one total query per account.
Each balance is in its own account currency. There is no global sum, exchange-rate conversion, or transfer operation.
Negative balances, including credit-card debt represented as negative balances, are allowed.
Changing an opening balance corrects the baseline and changes the current balance.
Changing a transaction's account is a correction: its amount is now denominated in the selected account's currency, not converted.

V3 adds financial_transaction and indexes for owner/date ordering and account/category lookups.
Composite foreign keys ensure the account and category belong to the transaction owner, its currency matches the account, and its type matches the category.
They also reject account currency changes and category type changes while referenced, including concurrent writes.
V1 and V2 remain unchanged. Flyway applies V3; Hibernate only validates.

Archived accounts/categories remain readable and existing transactions retain their history.
New transactions/new reference assignments require active records. An edit may retain its existing archived account/category.
Transactions use hard deletion with confirmation; no undo/audit ledger is claimed.
Concurrent edits use last-write-wins; this is a personal tracker, not an accounting ledger.

## Frontend structure and security

- components/transactions/transactions-page.tsx owns loading, errors, filters, pagination, and editing state.
- components/transactions/transaction-form.tsx reuses Input, Select, and Button.
- lib/services/transactions.ts is the typed API boundary; types/transaction.ts holds transport types.
- app/api/finance/[resource]/[[...id]]/route.ts forwards only allowlisted paths, fields, and filters.
- Existing HttpOnly session cookies remain in use. Tokens are never exposed to client JavaScript.
- Writes require a matching Origin; upstream requests carry bearer authentication; responses use no-store.
- Renaming the visible app preserves the existing internal session cookie name so branding does not invalidate sessions.

The backend retains all ownership validation and financial calculations. No client-supplied owner is trusted.
Entities are never returned as API responses, and transaction DTO toString methods redact financial contents.
Do not enable verbose request/SQL diagnostics with real financial data.

## Verification

Backend unit tests cover exact amount/currency mapping, foreign-record rejection, archived accounts, and invalid pagination.
PostgreSQL integration tests cover CRUD, recalculated balances, corrections between currencies, tenant isolation,
foreign reference injection, invalid amounts/dates, filters/pagination, archived references, constraint protection, and authentication.
The existing authentication, accounts/categories, and migration tests remain part of the build.

Frontend unit tests cover exact strings, category selection, failed-save state, filter allowlists, and session/Origin checks.
Browser tests exercise creation, editing, filtering, deletion, error retry, and expired-session handling on desktop and mobile.
Browser tests mock the API; PostgreSQL API integration tests independently verify persistence and authorization.

Commands:
```sh
mvn -Pintegration verify
cd frontend
npm run build
npm run lint
npm test
npm run test:e2e
```

Interview explanation: derive balances from the underlying records to avoid synchronization bugs;
enforce ownership at both the service and database layers; keep money exact and currencies separate;
use DTOs and an authenticated proxy to preserve the existing security boundary.
