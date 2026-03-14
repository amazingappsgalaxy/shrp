-- Admin config tables for runtime-editable pricing

CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price NUMERIC NOT NULL,
  yearly_price NUMERIC,
  credits INTEGER NOT NULL,
  credits_label TEXT,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  is_popular BOOLEAN DEFAULT FALSE,
  is_highlighted BOOLEAN DEFAULT FALSE,
  badge TEXT,
  billing_period TEXT DEFAULT 'monthly',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_pricing_configs (
  model_id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only service role can read/write (admin API uses service role key)
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing_configs ENABLE ROW LEVEL SECURITY;

-- No public access; service role bypasses RLS entirely
CREATE POLICY "No public access" ON pricing_plans FOR ALL USING (false);
CREATE POLICY "No public access" ON model_pricing_configs FOR ALL USING (false);
