CREATE TABLE financial_account (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER')),
    currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    opening_balance NUMERIC(19,4) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX ix_account_owner ON financial_account(user_id);

CREATE TABLE category (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0 AND name = trim(name)),
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
-- Includes archived names; restore/rename an existing category rather than duplicating it.
-- The leading user_id also supports owner-scoped list queries.
CREATE UNIQUE INDEX uk_category_owner_type_name ON category(user_id, type, lower(name));

-- Backfill users who registered before Phase 4. New registrations use DefaultCategoryService.
INSERT INTO category (id, user_id, name, type, is_default, active, created_at, updated_at)
SELECT gen_random_uuid(), u.id, d.name, d.type, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM app_user u CROSS JOIN (VALUES
    ('Salary', 'INCOME'), ('Freelance', 'INCOME'), ('Other Income', 'INCOME'),
    ('Housing', 'EXPENSE'), ('Groceries', 'EXPENSE'), ('Transport', 'EXPENSE'),
    ('Dining', 'EXPENSE'), ('Utilities', 'EXPENSE'), ('Entertainment', 'EXPENSE'),
    ('Shopping', 'EXPENSE'), ('Healthcare', 'EXPENSE'), ('Education', 'EXPENSE'),
    ('Subscriptions', 'EXPENSE'), ('Travel', 'EXPENSE'), ('Moving / Relocation', 'EXPENSE'), ('Other', 'EXPENSE')
) AS d(name, type);
