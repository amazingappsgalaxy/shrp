-- Supabase Initial Schema Migration
-- This file contains the initial SQL schema for the application database

-- Enable UUID extension (pgcrypto is preferred in modern PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'free',
    api_usage INTEGER DEFAULT 0,
    monthly_api_limit INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    enhanced_url TEXT,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    enhancement_type VARCHAR(100),
    processing_time INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_ids JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB
);

-- User Activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'basic', 'creator', 'professional', 'enterprise'
    status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'expired', 'pending'
    billing_period VARCHAR(20), -- 'monthly', 'yearly'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    dodo_customer_id VARCHAR(255),
    dodo_subscription_id VARCHAR(255),
    dodo_payment_method_id VARCHAR(255),
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Number of credits
    type VARCHAR(50) NOT NULL, -- 'subscription', 'bonus', 'refund'
    source VARCHAR(100) NOT NULL, -- 'monthly_allocation', 'payment', 'admin_grant'
    subscription_id UUID REFERENCES subscriptions(id),
    transaction_id VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Credit Transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_id UUID REFERENCES credits(id),
    amount INTEGER NOT NULL, -- Positive for credit, negative for debit
    type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    reason VARCHAR(100) NOT NULL, -- 'subscription_renewal', 'image_enhancement', 'bonus', 'refund'
    description TEXT,
    enhancement_task_id UUID,
    subscription_id UUID REFERENCES subscriptions(id),
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    dodo_payment_id VARCHAR(255) NOT NULL,
    dodo_customer_id VARCHAR(255),
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', etc.
    plan VARCHAR(50), -- 'basic', 'creator', 'professional', 'enterprise'
    billing_period VARCHAR(20), -- 'monthly', 'yearly'
    credits_granted INTEGER, -- Number of credits granted for this payment
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- JSON metadata from Dodo
);

-- History items (lightweight records for output history)
CREATE TABLE IF NOT EXISTS history_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL UNIQUE,
    output_urls JSONB NOT NULL,
    model_name TEXT NOT NULL,
    page_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    generation_time_ms INTEGER,
    settings JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- History details (optional modal-only data)
CREATE TABLE IF NOT EXISTS history_details (
    history_id UUID PRIMARY KEY REFERENCES history_items(id) ON DELETE CASCADE,
    settings_full JSONB,
    metadata JSONB
);

-- Credit Purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_type VARCHAR(50) NOT NULL, -- 'starter', 'popular', 'premium', 'ultimate', 'custom'
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    credits INTEGER NOT NULL, -- Number of credits in this purchase
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    dodo_payment_id VARCHAR(255) NOT NULL,
    checkout_url TEXT,
    product_id VARCHAR(255) NOT NULL,
    custom_amount INTEGER, -- For custom credit purchases
    credits_granted INTEGER, -- Actual credits granted
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- JSON metadata from Dodo
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_expires_at ON credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_history_items_user_created_at ON history_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_items_user_status ON history_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_history_details_history_id ON history_details(history_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_history_items_updated_at BEFORE UPDATE ON history_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_purchases_updated_at BEFORE UPDATE ON credit_purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own images" ON images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON credits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history items" ON history_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history items" ON history_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history items" ON history_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history items" ON history_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own history details" ON history_details FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can insert own history details" ON history_details FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can update own history details" ON history_details FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can delete own history details" ON history_details FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);

CREATE POLICY "Users can view own credit purchases" ON credit_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit purchases" ON credit_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit purchases" ON credit_purchases FOR UPDATE USING (auth.uid() = user_id);
