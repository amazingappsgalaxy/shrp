-- Re-enable pg_cron for process-pending-tasks as a reliable backup scheduler.
--
-- The previous pg_cron job was disabled because the CRON_SECRET was hardcoded
-- in the migration file (committed to git). This version reads the secret from
-- a Postgres database setting — set manually in Supabase SQL editor, NEVER in git:
--
--   ALTER DATABASE postgres SET app.cron_secret = 'your-actual-cron-secret';
--   SELECT pg_reload_conf();
--
-- Run that one-time command in Supabase SQL editor (Dashboard → SQL Editor).
-- Then push this migration.
--
-- Schedule: pg_cron runs every 2 minutes, Netlify runs every minute.
-- Different intervals prevent exact-simultaneous double-runs.
-- Atomic DB updates in process-pending ensure no task is processed twice.

SELECT cron.schedule(
  'process-pending-tasks-pg',
  '*/2 * * * *',  -- every 2 minutes (staggered vs Netlify's every minute)
  $$
  SELECT net.http_post(
    url := 'https://sharpii.ai/api/tasks/process-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
