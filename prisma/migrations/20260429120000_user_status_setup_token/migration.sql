-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "setupTokenHash" TEXT,
  ADD COLUMN "setupTokenExpiresAt" TIMESTAMP(3);

-- Backfill: existing users (created before vetted onboarding) are considered approved
UPDATE "User" SET "status" = 'APPROVED';

-- CreateIndex
CREATE UNIQUE INDEX "User_setupTokenHash_key" ON "User"("setupTokenHash");
