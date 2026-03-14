-- Store cron secret in a config table (ALTER DATABASE requires superuser, not available in migrations).
-- pg_cron reads the secret via SELECT from this table.

CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Restrict access: only service role can read/write
REVOKE ALL ON app_config FROM anon, authenticated;
GRANT SELECT ON app_config TO postgres;

INSERT INTO app_config (key, value)
VALUES ('cron_secret', 'f7k2mX9pQw4nR8vL3bY6sE1tA5cJ0hN2')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update the pg_cron job to read secret from app_config table
SELECT cron.unschedule('process-pending-tasks-pg');

SELECT cron.schedule(
  'process-pending-tasks-pg',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sharpii.ai/api/tasks/process-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT value FROM app_config WHERE key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
