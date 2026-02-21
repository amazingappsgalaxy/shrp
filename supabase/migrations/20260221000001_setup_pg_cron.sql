-- Enable pg_net for making HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduling jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the background task processor to run every minute.
-- This checks all in-progress RunningHub tasks and completes them,
-- ensuring tasks finish even when users close their browsers.
SELECT cron.schedule(
  'process-pending-tasks',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sharpii.ai/api/tasks/process-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'f7k2mX9pQw4nR8vL3bY6sE1tA5cJ0hN2'
    ),
    body := '{}'::jsonb
  );
  $$
);
