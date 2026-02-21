-- Fix updated_at trigger function name collision between snake_case and camelCase schemas
-- Root cause: both base schema and Better Auth schema defined a function named update_updated_at_column()
-- One version sets NEW.updated_at, the other sets NEW."updatedAt". Because they share the same name/signature,
-- the later migration overwrote the function globally, causing updates on snake_case tables (e.g., users)
-- to attempt to set NEW."updatedAt" which doesn't exist, raising error 42703.

BEGIN;

-- Create separate, unambiguous functions for each naming convention
CREATE OR REPLACE FUNCTION update_updated_at_snake()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_camel()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rewire snake_case tables to the snake function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_images_updated_at ON images;
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_history_items_updated_at ON history_items;
CREATE TRIGGER update_history_items_updated_at BEFORE UPDATE ON history_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_credit_purchases_updated_at ON credit_purchases;
CREATE TRIGGER update_credit_purchases_updated_at BEFORE UPDATE ON credit_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

-- If your base schema also has a sessions table with snake_case columns
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_snake();

-- Rewire Better Auth camelCase tables to the camel function
DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_camel();

DROP TRIGGER IF EXISTS update_session_updated_at ON "session";
CREATE TRIGGER update_session_updated_at BEFORE UPDATE ON "session"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_camel();

DROP TRIGGER IF EXISTS update_account_updated_at ON "account";
CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON "account"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_camel();

DROP TRIGGER IF EXISTS update_verification_updated_at ON "verification";
CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON "verification"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_camel();

-- Remove the ambiguous function to prevent future collisions
DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT;
