-- TTRC Store: Production Seed Data
-- SEEDS ONLY: Categories, Subcategories & Default Site Settings.
-- NO DEMO PRODUCTS OR CUSTOMERS — The store starts 100% empty of products.

-- ─── 8 Main Categories & Subcategories ─────────────────────────────────────────
INSERT INTO categories (id, name, slug, parent_id, icon, sort_order) VALUES
  ('00000000-0000-4000-a000-000000000001', 'Gamified Robots',    'gamified-robots',    NULL,                                   'bot',              1),
  ('00000000-0000-4000-a000-000000000002', 'STEM Kits',         'stem-kits',          NULL,                                   'flask-conical',     2),
  ('00000000-0000-4000-a000-000000000003', 'Fasteners',         'fasteners',          NULL,                                   'settings-2',       3),
  ('00000000-0000-4000-a000-000000000004', 'Batteries',         'batteries',          NULL,                                   'battery-charging',  4),
  ('00000000-0000-4000-a000-000000000005', 'Motors',            'motors',             NULL,                                   'rotate-3d',        5),
  ('00000000-0000-4000-a000-000000000006', 'Sensors',           'sensors',            NULL,                                   'scan',             6),
  ('00000000-0000-4000-a000-000000000007', 'Drones',            'drones',             NULL,                                   'plane',            7),
  ('00000000-0000-4000-a000-000000000008', 'Wires & Connectors','wires-connectors',   NULL,                                   'cable',            8),

  -- Subcategories under Gamified Robots
  ('00000000-0000-4000-a000-000000000009', 'Robo Race',         'robo-race',          '00000000-0000-4000-a000-000000000001',  'zap',              1),
  ('00000000-0000-4000-a000-000000000010', 'Line Follower',    'line-follower',      '00000000-0000-4000-a000-000000000001',  'git-branch',       2),
  ('00000000-0000-4000-a000-000000000011', 'Robo Soccer',       'robo-soccer',        '00000000-0000-4000-a000-000000000001',  'circle',           3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- ─── Default Site Settings ───────────────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('company_name', '"Tamizh Tech"'),
  ('gstin', '"{{GSTIN}}"'),
  ('grievance_officer', '"Karthik Raja (support@tamizhtech.in)"'),
  ('free_shipping_threshold_paise', '99900'),
  ('base_shipping_paise', '5900'),
  ('cod_max_limit_paise', '500000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
