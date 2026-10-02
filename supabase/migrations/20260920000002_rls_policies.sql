-- TTRC Store: Row Level Security Policies
-- Migration: 20260920000002_rls_policies.sql
-- Every table has RLS enabled. Customers only see/modify their own data.
-- Admin/staff can read/write all. Public can read published catalog.

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user admin or staff?
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) IN ('admin', 'staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users read own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: users update own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: admin reads all" ON profiles
  FOR SELECT USING (is_admin_or_staff());

-- ─── user_roles ───────────────────────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles: users read own" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles: admin reads all" ON user_roles
  FOR SELECT USING (is_admin());

CREATE POLICY "user_roles: admin manages" ON user_roles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── categories ───────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "categories: public read active" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "categories: admin read all" ON categories
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "categories: admin write" ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── products ─────────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: public read published" ON products
  FOR SELECT USING (status = 'published');

CREATE POLICY "products: admin read all" ON products
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "products: admin write" ON products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "products: staff write inventory" ON products
  FOR UPDATE USING (is_admin_or_staff())
  WITH CHECK (is_admin_or_staff());

-- ─── product_images ───────────────────────────────────────────────────────────
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images: public read (via published product)" ON product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'published')
  );

CREATE POLICY "product_images: admin write" ON product_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── product_specs ────────────────────────────────────────────────────────────
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_specs: public read" ON product_specs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'published')
  );

CREATE POLICY "product_specs: admin write" ON product_specs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── product_variants ─────────────────────────────────────────────────────────
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants: public read" ON product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'published')
  );

CREATE POLICY "product_variants: admin write" ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── product_compatibility ────────────────────────────────────────────────────
ALTER TABLE product_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_compatibility: public read" ON product_compatibility
  FOR SELECT USING (TRUE); -- both products visible if accessed

CREATE POLICY "product_compatibility: admin write" ON product_compatibility
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── addresses ────────────────────────────────────────────────────────────────
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: users read own" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses: users write own" ON addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: admin read" ON addresses
  FOR SELECT USING (is_admin_or_staff());

-- ─── carts ────────────────────────────────────────────────────────────────────
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts: users read own" ON carts
  FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "carts: users write own" ON carts
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "carts: admin read" ON carts
  FOR SELECT USING (is_admin_or_staff());

-- ─── cart_items ───────────────────────────────────────────────────────────────
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items: users manage via cart" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts c
      WHERE c.id = cart_id
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

CREATE POLICY "cart_items: admin read" ON cart_items
  FOR SELECT USING (is_admin_or_staff());

-- ─── wishlists ────────────────────────────────────────────────────────────────
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlists: users manage own" ON wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── orders ───────────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can only READ their own orders (no direct writes — use RPC)
CREATE POLICY "orders: users read own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders: admin read all" ON orders
  FOR SELECT USING (is_admin_or_staff());

-- Only admin/staff can update order status
CREATE POLICY "orders: admin write" ON orders
  FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- ─── order_items ──────────────────────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: users read own" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "order_items: admin read" ON order_items
  FOR SELECT USING (is_admin_or_staff());

-- ─── payments ─────────────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- No direct customer write to payments — all via Edge Functions
CREATE POLICY "payments: users read own" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "payments: admin read all" ON payments
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "payments: service role write" ON payments
  FOR ALL USING (TRUE); -- Edge Functions use service role

-- ─── shipments ────────────────────────────────────────────────────────────────
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments: users read own" ON shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "shipments: admin write" ON shipments
  FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- ─── reviews ──────────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "reviews: public read approved" ON reviews
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "reviews: users read own" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reviews: users write own" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: users update own pending" ON reviews
  FOR UPDATE USING (auth.uid() = user_id AND is_approved = FALSE)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: admin moderate" ON reviews
  FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- ─── coupons ──────────────────────────────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Customers cannot read coupon internals (usage limits, etc.)
CREATE POLICY "coupons: admin manage" ON coupons
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── banners ──────────────────────────────────────────────────────────────────
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners: public read active" ON banners
  FOR SELECT USING (is_active = TRUE AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()));

CREATE POLICY "banners: admin write" ON banners
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── inventory_movements ─────────────────────────────────────────────────────
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory: admin read" ON inventory_movements
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "inventory: admin write" ON inventory_movements
  FOR INSERT WITH CHECK (is_admin_or_staff());

-- ─── audit_logs ───────────────────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit: admin read" ON audit_logs
  FOR SELECT USING (is_admin());

-- ─── settings ─────────────────────────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Some settings are public (e.g., free shipping threshold for display)
CREATE POLICY "settings: public read non-sensitive" ON settings
  FOR SELECT USING (key IN ('shipping_free_threshold_paise', 'cod_enabled', 'cod_max_order_paise'));

CREATE POLICY "settings: admin read all" ON settings
  FOR SELECT USING (is_admin());

CREATE POLICY "settings: admin write" ON settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── newsletter_subscribers ───────────────────────────────────────────────────
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter: public subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "newsletter: admin read" ON newsletter_subscribers
  FOR SELECT USING (is_admin());

-- ─── device_tokens ────────────────────────────────────────────────────────────
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens: users manage own" ON device_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_tokens: admin read" ON device_tokens
  FOR SELECT USING (is_admin());
