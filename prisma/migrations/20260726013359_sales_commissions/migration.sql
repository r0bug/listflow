-- CreateEnum
CREATE TYPE "public"."CommissionRateType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "public"."AttributionStatus" AS ENUM ('PENDING', 'ATTRIBUTED', 'HOUSE');

-- AlterTable
ALTER TABLE "public"."EbayAccount" ADD COLUMN     "ordersSyncedThrough" TIMESTAMP(3),
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "commissionRateType" "public"."CommissionRateType",
ADD COLUMN     "commissionRateValue" DOUBLE PRECISION,
ADD COLUMN     "listingAgentId" TEXT;

-- CreateTable
CREATE TABLE "public"."ListingAgent" (
    "id" TEXT NOT NULL,
    "teamtimeUserId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rateType" "public"."CommissionRateType" NOT NULL DEFAULT 'PERCENT',
    "rateValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "ebayOrderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL DEFAULT '0',
    "legacyItemId" TEXT,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemPrice" DOUBLE PRECISION NOT NULL,
    "shippingPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "buyerUsername" TEXT,
    "buyerName" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "imagePath" TEXT,
    "thumbnailPath" TEXT,
    "source" TEXT NOT NULL,
    "rawData" JSONB,
    "attributionStatus" "public"."AttributionStatus" NOT NULL DEFAULT 'PENDING',
    "ebayAccountId" TEXT NOT NULL,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commission" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rateType" "public"."CommissionRateType" NOT NULL,
    "rateValue" DOUBLE PRECISION NOT NULL,
    "basis" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingAgent_teamtimeUserId_key" ON "public"."ListingAgent"("teamtimeUserId");

-- CreateIndex
CREATE INDEX "ListingAgent_active_idx" ON "public"."ListingAgent"("active");

-- CreateIndex
CREATE INDEX "Sale_soldAt_idx" ON "public"."Sale"("soldAt");

-- CreateIndex
CREATE INDEX "Sale_attributionStatus_idx" ON "public"."Sale"("attributionStatus");

-- CreateIndex
CREATE INDEX "Sale_ebayAccountId_idx" ON "public"."Sale"("ebayAccountId");

-- CreateIndex
CREATE INDEX "Sale_legacyItemId_idx" ON "public"."Sale"("legacyItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_ebayAccountId_ebayOrderId_lineItemId_key" ON "public"."Sale"("ebayAccountId", "ebayOrderId", "lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_saleId_key" ON "public"."Commission"("saleId");

-- CreateIndex
CREATE INDEX "Commission_agentId_createdAt_idx" ON "public"."Commission"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "public"."Commission"("status");

-- CreateIndex
CREATE INDEX "Listing_listingAgentId_idx" ON "public"."Listing"("listingAgentId");

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_listingAgentId_fkey" FOREIGN KEY ("listingAgentId") REFERENCES "public"."ListingAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ListingAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
