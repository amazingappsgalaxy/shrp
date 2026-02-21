-- Create checkout sessions table to map Dodo subscription IDs to user data
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id text NOT NULL UNIQUE,
  payment_id text,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  plan text NOT NULL,
  billing_period text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies (disabled for now to allow webhook access)
ALTER TABLE checkout_sessions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON checkout_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON checkout_sessions TO authenticated;
GRANT SELECT ON checkout_sessions TO anon;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS checkout_sessions_subscription_id_idx ON checkout_sessions(subscription_id);
CREATE INDEX IF NOT EXISTS checkout_sessions_user_id_idx ON checkout_sessions(user_id);