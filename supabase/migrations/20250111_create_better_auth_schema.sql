-- Better Auth Database Schema for Supabase
-- This creates all necessary tables for Better Auth authentication

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Accounts table (for OAuth providers)
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("providerId", "accountId")
);

-- Verification table (for email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_token" ON "session"("token");
CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_providerId_accountId" ON "account"("providerId", "accountId");
CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user"("email");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_updated_at BEFORE UPDATE ON "session"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON "account"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON "verification"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can view own user data" ON "user"
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own user data" ON "user"
    FOR UPDATE USING (auth.uid()::text = id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON "session"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own sessions" ON "session"
    FOR DELETE USING (auth.uid()::text = "userId");

-- Accounts policies
CREATE POLICY "Users can view own accounts" ON "account"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own accounts" ON "account"
    FOR UPDATE USING (auth.uid()::text = "userId");

-- Service role can do everything (for Better Auth)
CREATE POLICY "Service role can manage all users" ON "user"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all sessions" ON "session"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all accounts" ON "account"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all verifications" ON "verification"
    FOR ALL USING (auth.role() = 'service_role');