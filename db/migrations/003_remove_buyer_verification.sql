-- The storefront no longer uses buyer OTP verification or first-time buyer welcome coupons.
-- Only the table introduced by migration 002 is removed; existing ecommerce tables remain intact.
DROP TABLE IF EXISTS buyer_verifications;

-- Retire the legacy welcome-coupon flag from all existing coupons so no old welcome offer can be used.
UPDATE "Coupon" SET "welcomeCoupon" = false WHERE "welcomeCoupon" = true;
