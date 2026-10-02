-- TTRC Store: Database Helper Functions Migration
-- Migration: 20260930000002_helper_functions.sql

-- ─── Atomic stock decrement function ─────────────────────────────────────────
-- Returns an error if stock would go below 0 (prevents overselling)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock_qty INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE; -- Row-level lock prevents race conditions

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
      p_product_id, current_stock, p_quantity;
  END IF;

  UPDATE products
  SET stock_qty = stock_qty - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment coupon uses ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Restore stock on order cancellation ─────────────────────────────────────
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Restore stock for all order items
    UPDATE products p
    SET stock_qty = p.stock_qty + oi.quantity,
        updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;

    -- Log inventory movements for restoration
    INSERT INTO inventory_movements (product_id, delta, reason, reference)
    SELECT oi.product_id, oi.quantity, 'return', NEW.id::TEXT
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_cancel();

-- ─── Auto-set order number on insert ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := next_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ─── Low stock notification trigger ──────────────────────────────────────────
-- Raises a PostgreSQL NOTICE when stock drops to or below threshold
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_qty <= NEW.low_stock_threshold AND NEW.stock_qty >= 0 THEN
    -- In production, this can trigger a pg_notify / Supabase Realtime event
    RAISE NOTICE 'LOW STOCK ALERT: Product % has only % units remaining (threshold: %)',
      NEW.id, NEW.stock_qty, NEW.low_stock_threshold;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_low_stock ON products;
CREATE TRIGGER trigger_notify_low_stock
  AFTER UPDATE OF stock_qty ON products
  FOR EACH ROW
  WHEN (NEW.stock_qty != OLD.stock_qty)
  EXECUTE FUNCTION notify_low_stock();

-- ─── is_admin_or_staff helper (used in RLS policies) ─────────────────────────
-- Create if not already exists from initial migrations
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── Get current user role ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── coupon_redemptions table (if not already exists) ────────────────────────
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES coupons(id),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  order_id    UUID NOT NULL REFERENCES orders(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_redemptions: users read own" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coupon_redemptions: service role write" ON coupon_redemptions
  FOR ALL USING (TRUE);

-- ─── Add payments table columns if missing ───────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS captured_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS method              TEXT;

-- ─── Add razorpay columns to orders table ────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_note       TEXT,
  ADD COLUMN IF NOT EXISTS coupon_code         TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount_paise INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_paise      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxable_paise       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_paise          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_paise          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_paise          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_gst_paise     INTEGER NOT NULL DEFAULT 0;

-- Index for Razorpay lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment ON orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
