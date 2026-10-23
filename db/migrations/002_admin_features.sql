-- Anant Tea admin/customer experience additions.
-- Does not alter or delete the existing populated Prisma tables.

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  announcement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  announcement_message TEXT NOT NULL DEFAULT '🚚 Free shipping on orders above ₹499',
  announcement_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legacy_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS legacy_order_status_history_order_idx
  ON legacy_order_status_history(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS buyer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  customer_id TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS buyer_verifications_phone_idx ON buyer_verifications(phone);

INSERT INTO site_settings (id, announcement_enabled, announcement_message, announcement_items)
VALUES (
  'default',
  TRUE,
  '🚚 Free shipping on orders above ₹499',
  '["Premium Assam Tea Blends","Order on WhatsApp"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketing_templates (name, template)
VALUES
('New Product Announcement', 'Hi {customer_name},\n\nWe have something special for you from Anant Tea. Explore our latest tea collection.\n\nVisit Anant Tea and enjoy your next cup!'),
('Special Offer', 'Hi {customer_name},\n\nA special offer is waiting for you at Anant Tea.\n\nUse code {coupon_code} at checkout and enjoy your tea.\n\nThank you,\nAnant Tea'),
('Customer Follow-up', 'Hi {customer_name},\n\nThank you for being a customer of Anant Tea. We hope you are enjoying our tea.\n\nWe would love to serve you again.\n\nAnant Tea')
ON CONFLICT DO NOTHING;
