-- Remove the pg_cron job that was making HTTP calls to /api/tasks/process-pending.
-- The Netlify scheduled function (runs every minute) handles task processing instead.
-- Having BOTH running caused every task to be processed twice per minute,
-- and the pg_cron version had the CRON_SECRET hardcoded in plain text in this repo.
--
-- The 'expire-subscription-credits' pg_cron job (pure SQL, no HTTP) is kept —
-- but is now supplemented by process-pending calling expire_and_sync() on every run.

SELECT cron.unschedule('process-pending-tasks');
