-- Fix sync_subscription_statuses() to use correct column name 'end_date'
-- instead of 'current_period_end' which does not exist in the subscriptions table.
-- Also updates expire_and_sync() wrapper since it calls this function.

CREATE OR REPLACE FUNCTION sync_subscription_statuses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Mark subscriptions as 'expired' when end_date has passed
  -- and they are still 'active' (Dodo webhook missed / not yet fired)
  UPDATE subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'active'
    AND end_date IS NOT NULL
    AND end_date < now();

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
