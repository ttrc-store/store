-- TTRC Store: Site Settings Table and Flags
-- Migration: 20260920000003_site_settings.sql

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

-- RLS: Anyone can read settings, only admin/staff can update
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admin/staff can modify site settings"
  ON site_settings FOR ALL
  USING (is_admin());

-- Seed default flags (gst_enabled = false, razorpay_enabled = false)
INSERT INTO site_settings (key, value) VALUES
  ('gst_enabled', 'false'),
  ('razorpay_enabled', 'false'),
  ('company_name', '"Tamizh Tech"'),
  ('gstin', '"Not yet registered — add GSTIN here when available"'),
  ('free_shipping_threshold_paise', '99900'),
  ('base_shipping_paise', '5900'),
  ('cod_max_limit_paise', '500000')
ON CONFLICT (key) DO NOTHING;
