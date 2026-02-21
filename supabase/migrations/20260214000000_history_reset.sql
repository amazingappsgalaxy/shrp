CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Users can view own enhancement tasks" ON enhancement_tasks;
DROP POLICY IF EXISTS "Users can insert own enhancement tasks" ON enhancement_tasks;
DROP POLICY IF EXISTS "Users can update own enhancement tasks" ON enhancement_tasks;
DROP POLICY IF EXISTS "Users can delete own enhancement tasks" ON enhancement_tasks;
DROP TRIGGER IF EXISTS update_enhancement_tasks_updated_at ON enhancement_tasks;
DROP TABLE IF EXISTS enhancement_tasks CASCADE;

CREATE TABLE IF NOT EXISTS history_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL UNIQUE,
    output_urls JSONB NOT NULL,
    model_name TEXT NOT NULL,
    page_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    generation_time_ms INTEGER,
    settings JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS history_details (
    history_id UUID PRIMARY KEY REFERENCES history_items(id) ON DELETE CASCADE,
    settings_full JSONB,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_history_items_user_created_at ON history_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_items_user_status ON history_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_history_details_history_id ON history_details(history_id);

CREATE TRIGGER update_history_items_updated_at BEFORE UPDATE ON history_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE history_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history items" ON history_items;
DROP POLICY IF EXISTS "Users can insert own history items" ON history_items;
DROP POLICY IF EXISTS "Users can update own history items" ON history_items;
DROP POLICY IF EXISTS "Users can delete own history items" ON history_items;
DROP POLICY IF EXISTS "Users can view own history details" ON history_details;
DROP POLICY IF EXISTS "Users can insert own history details" ON history_details;
DROP POLICY IF EXISTS "Users can update own history details" ON history_details;
DROP POLICY IF EXISTS "Users can delete own history details" ON history_details;

CREATE POLICY "Users can view own history items" ON history_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history items" ON history_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history items" ON history_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history items" ON history_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history details" ON history_details FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can insert own history details" ON history_details FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can update own history details" ON history_details FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
CREATE POLICY "Users can delete own history details" ON history_details FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM history_items WHERE id = history_id)
);
