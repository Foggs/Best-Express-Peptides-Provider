-- AlterTable: flag intake submissions whose email already maps to an existing User
ALTER TABLE "ProviderApplication"
  ADD COLUMN "existingUserAtIntake" BOOLEAN NOT NULL DEFAULT false;
