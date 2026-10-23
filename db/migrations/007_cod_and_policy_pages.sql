-- Cash-on-delivery toggle and editable policy/content pages.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN NOT NULL DEFAULT TRUE;
CREATE TABLE IF NOT EXISTS policy_pages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  show_in_footer BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO policy_pages (title,slug,content,show_in_footer,is_published,display_order) VALUES
('Terms & Conditions','terms-and-conditions','Please add your Terms & Conditions content from the Admin Panel.',TRUE,TRUE,10),
('Privacy Policy','privacy-policy','Please add your Privacy Policy content from the Admin Panel.',TRUE,TRUE,20),
('Shipping & Delivery Policy','shipping-policy','Please add your Shipping & Delivery Policy content from the Admin Panel.',TRUE,TRUE,30),
('Cancellation & Refund Policy','cancellation-refund-policy','Please add your Cancellation & Refund Policy content from the Admin Panel.',TRUE,TRUE,40)
ON CONFLICT (slug) DO NOTHING;
