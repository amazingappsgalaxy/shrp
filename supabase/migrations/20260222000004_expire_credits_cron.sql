-- Schedule hourly credits expiry job
-- This ensures subscription credits are marked inactive once their expires_at passes.
-- Without this, users see stale credits after Day Pass or subscription period ends.
SELECT cron.schedule(
  'expire-subscription-credits',
  '0 * * * *', -- every hour at :00
  $$
  SELECT expire_subscription_credits();
  $$
);
