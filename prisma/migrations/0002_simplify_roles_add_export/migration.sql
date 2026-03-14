-- Migration: Simplify roles to ADMIN/USER, add export fields

-- Step 1: Create the new enum type first
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'USER');

-- Step 2: Convert column to text, map old roles, then cast to new enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT;
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'MANAGER';
UPDATE "User" SET "role" = 'USER' WHERE "role" NOT IN ('ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::"UserRole_new");

-- Step 3: Drop old enum and rename new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 4: Add publicUrl to Photo
ALTER TABLE "Photo" ADD COLUMN "publicUrl" TEXT;

-- Step 5: Add exportedAt to Item
ALTER TABLE "Item" ADD COLUMN "exportedAt" TIMESTAMP(3);
