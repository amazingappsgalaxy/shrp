-- ============================================================
-- Migration: subscription_status_sync
--
-- Problem: when subscription credits expire (hourly cron marks
-- credits.is_active = false), users.subscription_status was NOT
-- automatically reset to 'free'. Users retained 'active' status
-- with 0 credits — showing wrong plan info in dashboard.
--
-- Fix:
-- 1. sync_subscription_statuses() — resets users.subscription_status
--    to 'free' for any user with no active subscription credits.
--    Also marks subscriptions with expired period as 'expired'.
--
-- 2. expire_and_sync() — wrapper that runs expire_subscription_credits()
--    then sync_subscription_statuses() in one call.
--
-- 3. Replaces the pg_cron 'expire-subscription-credits' job with
--    the new combined expire_and_sync() call.
-- ============================================================

-- Step 1: Create sync function that aligns users.subscription_status
-- with their actual credit state.
CREATE OR REPLACE FUNCTION sync_subscription_statuses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Mark subscriptions as 'expired' when current_period_end has passed
  -- and they are still 'active' (Dodo webhook missed / not yet fired)
  UPDATE subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();

  -- Reset users.subscription_status to 'free' for any user whose
  -- subscription_status is 'active' but has zero active, non-expired credits
  -- of type 'subscription' (permanent/top-up credits don't count for sub status).
  WITH users_to_downgrade AS (
    SELECT DISTINCT u.id
    FROM users u
    WHERE u.subscription_status = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM credits c
        WHERE c.user_id = u.id
          AND c.is_active = true
          AND c.type = 'subscription'
          AND (c.expires_at IS NULL OR c.expires_at > now())
      )
  )
  UPDATE users
  SET
    subscription_status = 'free',
    updated_at = now()
  WHERE id IN (SELECT id FROM users_to_downgrade);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

-- Step 2: Wrapper that expires credits then syncs statuses
CREATE OR REPLACE FUNCTION expire_and_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired integer;
  v_synced  integer;
BEGIN
  -- Expire any credits whose expires_at has passed
  SELECT expire_subscription_credits() INTO v_expired;

  -- Sync subscription_status field in users table
  SELECT sync_subscription_statuses() INTO v_synced;

  IF v_expired > 0 OR v_synced > 0 THEN
    RAISE NOTICE 'expire_and_sync: expired=%, synced_users=%', v_expired, v_synced;
  END IF;
END;
$$;

-- Step 3: Update the pg_cron job to use the combined function
-- (unschedule old job and reschedule with new function)
SELECT cron.unschedule('expire-subscription-credits');

SELECT cron.schedule(
  'expire-subscription-credits',
  '*/15 * * * *',  -- every 15 minutes (more responsive than hourly)
  $$
  SELECT expire_and_sync();
  $$
);

-- Step 4: Run once immediately to fix any users already in bad state
SELECT sync_subscription_statuses();
