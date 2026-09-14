-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CashOnDelivery');

-- AlterTable
-- Existing rows (if any) get placeholder shipping info since these columns
-- are required going forward; new orders always supply real values via the API.
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CashOnDelivery';
ALTER TABLE "Order" ADD COLUMN "shippingName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingAddress" TEXT NOT NULL DEFAULT '';
