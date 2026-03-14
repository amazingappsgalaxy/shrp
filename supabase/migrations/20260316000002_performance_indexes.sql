-- Performance indexes for commonly queried patterns

-- history_items: used by process-pending (status+created_at), user history pages, admin tasks
CREATE INDEX IF NOT EXISTS idx_history_items_status_created   ON history_items (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_items_user_created     ON history_items (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_items_user_status      ON history_items (user_id, status);

-- credits: used by getUserCredits, expiry queries, admin user lookups
CREATE INDEX IF NOT EXISTS idx_credits_user_active_type       ON credits (user_id, is_active, type);
CREATE INDEX IF NOT EXISTS idx_credits_expires_active         ON credits (expires_at, is_active) WHERE is_active = true;

-- sessions: used on every authenticated request
CREATE INDEX IF NOT EXISTS idx_sessions_token_expires         ON sessions (token, expires_at);

-- credit_transactions: used by admin credit history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions (user_id, created_at DESC);

-- payments: used by admin revenue queries
CREATE INDEX IF NOT EXISTS idx_payments_status_currency_created ON payments (status, currency, created_at DESC);

-- subscriptions: used by admin user list (plan_name lookup)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status       ON subscriptions (user_id, status);
