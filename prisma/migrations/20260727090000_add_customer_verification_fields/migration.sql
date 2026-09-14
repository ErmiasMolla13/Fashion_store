-- AlterTable: add email verification fields that schema.prisma already declares
-- but were missing from the initial migration (schema drift fix)
ALTER TABLE "Customer" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "otp" TEXT;
ALTER TABLE "Customer" ADD COLUMN "otpExpires" TIMESTAMP(3);
