-- Enable RLS on sensitive financial tables and block all anon/public access.
-- These tables are only accessed via the service role key in API routes,
-- so no legitimate use case requires public reads.

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Block all access for non-service-role callers (anon and authenticated via Supabase JWT).
-- The app uses custom auth + service role key, so auth.uid() is always NULL for real requests.
-- These USING (false) policies ensure nothing leaks even if the anon key is exposed.

CREATE POLICY "no_public_access" ON credit_transactions
  AS RESTRICTIVE FOR ALL TO public USING (false);

CREATE POLICY "no_public_access" ON checkout_sessions
  AS RESTRICTIVE FOR ALL TO public USING (false);

CREATE POLICY "no_public_access" ON webhook_logs
  AS RESTRICTIVE FOR ALL TO public USING (false);
