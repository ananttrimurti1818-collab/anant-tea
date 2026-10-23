-- Editable About Us content and shipping rules.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS shipping_charge NUMERIC(10,2) NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS free_shipping_above NUMERIC(10,2) NOT NULL DEFAULT 499,
  ADD COLUMN IF NOT EXISTS about_title TEXT NOT NULL DEFAULT 'About Anant Tea',
  ADD COLUMN IF NOT EXISTS about_subtitle TEXT NOT NULL DEFAULT 'A tea brand built around the simple joy of a great cup.',
  ADD COLUMN IF NOT EXISTS about_story_heading TEXT NOT NULL DEFAULT 'From Assam leaves to your daily chai.',
  ADD COLUMN IF NOT EXISTS about_story_p1 TEXT NOT NULL DEFAULT 'Anant Tea is focused on delivering quality tea blends with the aroma, colour and strength that Indian tea lovers expect. We believe good tea is not only a product; it is part of conversations, family time and daily rituals.',
  ADD COLUMN IF NOT EXISTS about_story_p2 TEXT NOT NULL DEFAULT 'Our goal is simple: offer dependable, flavourful Assam tea with thoughtful packaging and a modern buying experience.',
  ADD COLUMN IF NOT EXISTS about_story_image_url TEXT NOT NULL DEFAULT '/about-story-reference.png',
  ADD COLUMN IF NOT EXISTS about_promise_heading TEXT NOT NULL DEFAULT 'Better Tea for a Brighter Tomorrow',
  ADD COLUMN IF NOT EXISTS about_promise_body TEXT NOT NULL DEFAULT 'We are committed to bringing the richness of Assam tea to more homes, building long-term relationships with our customers, partners and tea-loving communities.';

UPDATE site_settings
SET shipping_charge = COALESCE(shipping_charge, 60),
    free_shipping_above = COALESCE(free_shipping_above, 499)
WHERE id = 'default';
