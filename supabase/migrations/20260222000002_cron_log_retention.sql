-- Schedule a daily cleanup job to prune pg_cron run history older than 7 days.
-- Without this, cron.job_run_details grows at ~720 rows/day (1 per minute) indefinitely.
SELECT cron.schedule(
  'cleanup-cron-logs',
  '0 3 * * *',  -- runs at 3:00 AM UTC daily
  $$
  DELETE FROM cron.job_run_details
  WHERE end_time < NOW() - INTERVAL '7 days';
  $$
);
