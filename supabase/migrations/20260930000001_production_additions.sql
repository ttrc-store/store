-- TTRC Store: Production Additions Migration
-- Migration: 20260930000001_production_additions.sql
-- Adds missing columns, order_events table, and helper functions.

-- ─── Products: Add missing columns ──────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS return_window_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS is_featured        BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Orders: Add human-readable order_number ─────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Sequence for yearly order numbers (financial year 2025-26 base)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function: generate next order number
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  fy      TEXT;
  current_month INT;
  current_year  INT;
BEGIN
  seq_val := nextval('order_number_seq');
  current_month := EXTRACT(MONTH FROM NOW());
  current_year  := EXTRACT(YEAR FROM NOW());
  -- FY: April to March
  IF current_month >= 4 THEN
    fy := (current_year % 100)::TEXT || '-' || ((current_year + 1) % 100)::TEXT;
  ELSE
    fy := ((current_year - 1) % 100)::TEXT || '-' || (current_year % 100)::TEXT;
  END IF;
  RETURN 'TTRC/' || fy || '/' || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ─── Order Events (Immutable Timeline) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,           -- e.g. 'order_created', 'payment_captured', 'shipped'
  actor_id   UUID REFERENCES auth.users(id),
  actor_role TEXT,                    -- 'customer', 'admin', 'staff', 'system'
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, created_at DESC);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events: users read own" ON order_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "order_events: admin read all" ON order_events
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "order_events: service role write" ON order_events
  FOR ALL USING (TRUE);

-- ─── Returns Table ───────────────────────────────────────────────────────────
CREATE TYPE return_status AS ENUM (
  'requested', 'approved', 'rejected', 'received', 'inspected', 'refunded', 'replaced'
);

CREATE TABLE IF NOT EXISTS returns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  order_item_id   UUID NOT NULL REFERENCES order_items(id),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  reason          TEXT NOT NULL,
  status          return_status NOT NULL DEFAULT 'requested',
  admin_note      TEXT,
  refund_amount   INTEGER,    -- paise; null until refund processed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user  ON returns(user_id);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "returns: users read own" ON returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "returns: users create" ON returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "returns: admin manage" ON returns
  FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Refunds Table ───────────────────────────────────────────────────────────
CREATE TYPE refund_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS refunds (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id),
  return_id            UUID REFERENCES returns(id),
  amount_paise         INTEGER NOT NULL CHECK (amount_paise > 0),
  status               refund_status NOT NULL DEFAULT 'pending',
  razorpay_refund_id   TEXT UNIQUE,
  reason               TEXT,
  initiated_by         UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds: users read own" ON refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "refunds: admin manage" ON refunds
  FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Notify Me (Out-of-Stock Alerts) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  notified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, email)
);

ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_notif: public insert" ON stock_notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "stock_notif: admin read" ON stock_notifications FOR SELECT USING (is_admin_or_staff());

-- ─── Review Admin Reply ───────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS admin_reply      TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_note  TEXT,
  ADD COLUMN IF NOT EXISTS is_reported      BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Additional site_settings seeds ──────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('support_email',             '"support@tamizhtech.in"'),
  ('whatsapp_number',           '"919876543210"'),
  ('return_window_days',        '7'),
  ('grievance_officer_name',    '"{{GRIEVANCE_OFFICER_NAME}}"'),
  ('grievance_officer_email',   '"{{GRIEVANCE_OFFICER_EMAIL}}"')
ON CONFLICT (key) DO NOTHING;

-- ─── Additional settings visible to public ───────────────────────────────────
-- Extend the RLS policy so the storefront can read these non-sensitive keys
DROP POLICY IF EXISTS "settings: public read non-sensitive" ON settings;
CREATE POLICY "settings: public read non-sensitive" ON settings
  FOR SELECT USING (key IN (
    'shipping_free_threshold_paise', 'cod_enabled', 'cod_max_order_paise'
  ));

-- site_settings all public-readable (table has no sensitive private data;
-- sensitive admin flags are only settable via admin UI with role guard)
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
CREATE POLICY "site_settings: public read" ON site_settings
  FOR SELECT USING (true);
