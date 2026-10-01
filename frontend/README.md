# Budget App frontend

The frontend foundation for the Personal Finance & US Relocation Tracker.
Built with Next.js App Router, TypeScript, Tailwind CSS, and Lucide icons.
Use Node.js 24 LTS (minimum 22.12) and npm. Commit `package-lock.json` for
reproducible dependency installation.

## Run

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. The sample dashboard works without Java or Docker.
To use registration/login, start the Spring Boot backend on port 8080.
Copy `.env.example` to `.env.local` only if its default address needs changing.
`BACKEND_URL` is server-only; never give it a `NEXT_PUBLIC_` prefix.
Do not copy the backend JWT signing secret into the frontend.

```sh
npm run build
npm run start
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Browser tests run against the production build, start their own local server
if necessary, and cover desktop and mobile navigation and form validation.
Unit tests cover accessible UI states and the authentication cookie boundary.
ESLint 9 is retained for compatibility with the Next.js React lint plugins.
Its upstream deprecation warning is a tooling limitation, not suppressed.

## Structure

```text
src/app/                    Routes, metadata, loading/error/not-found boundaries
  [section]/                Explicitly allowed navigation placeholders
  api/auth/[action]/        Same-origin login/register/me/logout handlers
src/components/ui/          Card, Button, Input, loading/empty/error states
src/components/layout/      Sidebar, header, native mobile navigation dialog
src/components/dashboard/   Dashboard-specific presentation
src/components/auth/        Login/registration/session form
src/components/accounts/    Real account management and forms
src/components/categories/  Real category management and forms
src/components/finance/     Shared load/session/error handling
src/lib/mock/               Fictional, fixed September 2026 USD data
src/lib/services/           Small dashboard and auth adapters
src/lib/api/                Browser fetch client and server-only backend client
src/types/                  Dashboard and authentication response contracts
```

## Data and scope

The dashboard is deliberately public and clearly marked as sample data, even
when signed in. Nothing displayed represents the authenticated user's finances.
Accounts and Categories are real authenticated management pages. Other financial navigation destinations remain future-feature placeholders.
Dates and progress values are fixed examples; controls do not pretend to save,
filter, connect accounts, or perform unavailable financial operations.

`getDashboard()` is the single replacement point for the mock dataset. When the
backend offers a dashboard endpoint, call it from the server using the authenticated
cookie's bearer token and map its response to `DashboardData`. Keep calculations,
user ownership checks, currency conversion, and rounding in Spring Boot. Monetary
values are decimal strings; number conversion here is solely for locale formatting.
Do not turn the public demo into real data without adding a server-side session
check and handling 401/403 responses.

## Authentication foundation

The browser calls only Next.js `/api/auth/*` routes. Next.js exchanges credentials
with the existing Spring Boot endpoints and stores the returned token in an
HttpOnly, SameSite=Lax cookie. Secure is enabled in production: deploy over HTTPS.
The JWT never appears in browser JSON responses, localStorage, or sessionStorage.
No CORS changes or backend changes are necessary.

Cookie-backed POST routes reject requests without an exact same-origin `Origin`
header. If deploying behind a reverse proxy, configure it to preserve the public
origin so this check remains correct. Do not disable the origin check. The backend
continues to validate credentials, roles, token expiry, and user identity.

Registration grants only the backend's default user role. The proxy forwards an
explicit allowlist of fields and returns a safe user DTO. Backend error bodies
are not relayed. Requests have timeouts and auth responses are not cached.
The account page checks `/api/v1/users/me`; expired cookies are cleared.
Sign-out clears the browser cookie, but cannot revoke an already issued backend
token before its expiry. No refresh-token flow or persistent client token store
is introduced. Login throttling remains a later backend/deployment concern.

## Visual language

Budget App is the frontend product name. Off-white surfaces, dark slate typography,
restrained teal accents, subtle borders, and a shared spacing scale keep the UI
quiet and readable. The dashboard uses compact summaries, a transaction table,
a category breakdown with text equivalents, recurring payments, and goal progress.
System fonts avoid external font requests and keep builds offline-friendly.

The sidebar becomes a native modal drawer on small screens, with Escape handling,
focus containment, and a labelled close button. Inputs have real labels, state
messages have appropriate live roles, progress bars expose values, links identify
the current page, and keyboard focus is visible. Reduced-motion preferences are
respected. All navigation and account form controls work within this phase's scope.

## Phase 4: real financial structure

Start the Spring Boot backend with its database and JWT environment configured, then sign in through the frontend. Accounts and Categories use the private backend APIs through the Next.js financial proxy. You can add, edit, archive, and restore records. Phase 5 adds Transactions and calculated account balances; values are never combined across currencies. The dashboard stays a labelled sample preview. See [the Phase 4 guide](../docs/phase4-accounts-categories.md).

## Phase 5

Transactions now use the real API with date/account/type filters and pagination.
The sidebar and page titles use Budget App. The internal session cookie is unchanged.
See [the Phase 5 guide](../docs/phase5-transactions.md).