-- Composite foreign keys enforce ownership, currency and category type even outside the API.
ALTER TABLE financial_account ADD CONSTRAINT uq_account_owner_currency UNIQUE (id, user_id, currency);
ALTER TABLE category ADD CONSTRAINT uq_category_owner_type UNIQUE (id, user_id, type);
CREATE TABLE financial_transaction (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id),
    account_id UUID NOT NULL,
    category_id UUID NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (account_id,user_id,currency) REFERENCES financial_account(id,user_id,currency),
    FOREIGN KEY (category_id,user_id,type) REFERENCES category(id,user_id,type)
);
CREATE INDEX ix_transaction_owner_date ON financial_transaction(user_id,transaction_date DESC,id DESC);
CREATE INDEX ix_transaction_account ON financial_transaction(account_id);
CREATE INDEX ix_transaction_category ON financial_transaction(category_id);
