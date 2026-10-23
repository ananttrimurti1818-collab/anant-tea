-- Optional discounted selling price for existing legacy product variants.
-- Keep "price" as the regular price for backwards compatibility.
ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "discountPrice" NUMERIC(12,2);

ALTER TABLE "ProductVariant"
  DROP CONSTRAINT IF EXISTS product_variant_discount_price_check;
ALTER TABLE "ProductVariant"
  ADD CONSTRAINT product_variant_discount_price_check
  CHECK ("discountPrice" IS NULL OR ("discountPrice" >= 0 AND "discountPrice" < "price"));
