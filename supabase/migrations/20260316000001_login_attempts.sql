-- Track failed login attempts for brute-force protection.
-- Lightweight: stores attempt counts with auto-expiry via created_at.

CREATE TABLE IF NOT EXISTS login_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  ip_address  text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by email or IP within a time window
CREATE INDEX idx_login_attempts_email_time ON login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time    ON login_attempts (ip_address, attempted_at DESC);

-- Auto-clean old attempts (older than 1 hour) via a simple delete function
-- called from the signin route on every attempt.
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 hour';
$$;
