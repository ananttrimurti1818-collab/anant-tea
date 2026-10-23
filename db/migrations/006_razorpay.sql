-- Razorpay Standard Checkout metadata on the existing legacy Order table.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_razorpayOrderId_key"
  ON "Order" ("razorpayOrderId")
  WHERE "razorpayOrderId" IS NOT NULL;

-- Ensure the existing enum-backed fields accept the values used by this gateway.
-- If either column is plain text, no enum change is needed.
DO $$
DECLARE
  method_type TEXT;
  status_type TEXT;
BEGIN
  SELECT udt_name INTO method_type
  FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name = 'Order' AND column_name = 'paymentMethod';

  IF method_type IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_type WHERE typname = method_type AND typtype = 'e'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = method_type AND e.enumlabel = 'ONLINE'
  ) THEN
    EXECUTE format('ALTER TYPE %I ADD VALUE %L', method_type, 'ONLINE');
  END IF;

  SELECT udt_name INTO status_type
  FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name = 'Order' AND column_name = 'paymentStatus';

  IF status_type IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_type WHERE typname = status_type AND typtype = 'e'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = status_type AND e.enumlabel = 'PAID'
  ) THEN
    EXECUTE format('ALTER TYPE %I ADD VALUE %L', status_type, 'PAID');
  END IF;
END $$;
