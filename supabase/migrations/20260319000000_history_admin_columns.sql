-- Add admin-facing columns to history_items
ALTER TABLE history_items
  ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill completed_at from updated_at for completed/failed tasks
UPDATE history_items
SET completed_at = updated_at
WHERE status IN ('completed', 'failed') AND completed_at IS NULL;

-- Index for error queries
CREATE INDEX IF NOT EXISTS idx_history_items_status_error
  ON history_items(status, created_at DESC)
  WHERE status = 'failed';
