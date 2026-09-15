-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "capturedPayload" JSONB,
ADD COLUMN     "sourceEbayAccountId" TEXT,
ADD COLUMN     "sourceEbayItemId" TEXT;

-- CreateTable
CREATE TABLE "public"."StorageLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "shelf" INTEGER NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_code_key" ON "public"."StorageLocation"("code");

-- CreateIndex
CREATE INDEX "StorageLocation_active_idx" ON "public"."StorageLocation"("active");

-- CreateIndex
CREATE INDEX "StorageLocation_row_shelf_idx" ON "public"."StorageLocation"("row", "shelf");

-- CreateIndex
CREATE INDEX "Item_sourceEbayItemId_idx" ON "public"."Item"("sourceEbayItemId");

-- CreateIndex
CREATE INDEX "Item_locationCode_idx" ON "public"."Item"("locationCode");

