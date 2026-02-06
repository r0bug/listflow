-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'PHOTOGRAPHER', 'PROCESSOR', 'PRICER', 'PUBLISHER', 'MANAGER');

-- CreateEnum
CREATE TYPE "public"."WorkflowStage" AS ENUM ('PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."TemplateSourceType" AS ENUM ('MANUAL', 'SELL_SIMILAR', 'AI_GENERATED', 'IMPORTED');

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EbayAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "cert_id" TEXT NOT NULL,
    "dev_id" TEXT NOT NULL,
    "auth_token" TEXT,
    "refresh_token" TEXT,
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "siteId" INTEGER NOT NULL DEFAULT 0,
    "paypalEmail" TEXT,
    "postalCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbayAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "password" TEXT NOT NULL,
    "locationId" TEXT,
    "lastActive" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "stage" "public"."WorkflowStage" NOT NULL DEFAULT 'PHOTO_UPLOAD',
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "locationId" TEXT NOT NULL,
    "ebayAccountId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "category" TEXT,
    "condition" TEXT,
    "brand" TEXT,
    "features" TEXT[],
    "keywords" TEXT[],
    "aiAnalysis" JSONB,
    "startingPrice" DOUBLE PRECISION,
    "buyNowPrice" DOUBLE PRECISION,
    "shippingCost" DOUBLE PRECISION,
    "ebayId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Photo" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "optimizedPath" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "analysis" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowAction" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStage" "public"."WorkflowStage" NOT NULL,
    "toStage" "public"."WorkflowStage" NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "buyNowPrice" DOUBLE PRECISION,
    "ebayId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "imageUrls" TEXT[],
    "category" TEXT,
    "condition" TEXT,
    "metadata" JSONB,
    "itemId" TEXT,
    "ebayAccountId" TEXT,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "soldPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SoldItem" (
    "id" TEXT NOT NULL,
    "ebayItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "soldPrice" DOUBLE PRECISION NOT NULL,
    "shippingPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "condition" TEXT,
    "category" TEXT,
    "categoryId" TEXT,
    "seller" TEXT,
    "sellerFeedback" INTEGER,
    "listingType" TEXT,
    "bidCount" INTEGER,
    "watchCount" INTEGER,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "soldDate" TIMESTAMP(3) NOT NULL,
    "listingEndDate" TIMESTAMP(3),
    "searchQuery" TEXT,
    "source" TEXT NOT NULL DEFAULT 'scraper',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoldItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceResearch" (
    "id" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "medianPrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "price25th" DOUBLE PRECISION,
    "price75th" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "soldItemIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ListingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "sourceType" "public"."TemplateSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceEbayItemId" TEXT,
    "titleTemplate" TEXT,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "categoryPath" TEXT,
    "defaultCondition" TEXT,
    "defaultConditionId" INTEGER,
    "itemSpecifics" JSONB,
    "descriptionTemplate" TEXT,
    "suggestedPriceMin" DOUBLE PRECISION,
    "suggestedPriceMax" DOUBLE PRECISION,
    "defaultListingType" TEXT,
    "defaultDuration" TEXT,
    "defaultShippingProfileId" TEXT,
    "estimatedShippingCost" DOUBLE PRECISION,
    "estimatedWeight" DOUBLE PRECISION,
    "packageDimensions" JSONB,
    "referenceImageUrls" TEXT[],
    "requiresPhotos" BOOLEAN NOT NULL DEFAULT true,
    "minimumPhotos" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "public"."Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "public"."Location"("code");

-- CreateIndex
CREATE INDEX "Location_code_idx" ON "public"."Location"("code");

-- CreateIndex
CREATE INDEX "Location_isActive_idx" ON "public"."Location"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EbayAccount_accountName_key" ON "public"."EbayAccount"("accountName");

-- CreateIndex
CREATE INDEX "EbayAccount_accountName_idx" ON "public"."EbayAccount"("accountName");

-- CreateIndex
CREATE INDEX "EbayAccount_locationId_idx" ON "public"."EbayAccount"("locationId");

-- CreateIndex
CREATE INDEX "EbayAccount_isActive_idx" ON "public"."EbayAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_locationId_idx" ON "public"."User"("locationId");

-- CreateIndex
CREATE INDEX "User_isOnline_idx" ON "public"."User"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Item_ebayId_key" ON "public"."Item"("ebayId");

-- CreateIndex
CREATE INDEX "Item_stage_idx" ON "public"."Item"("stage");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "public"."Item"("status");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "public"."Item"("createdAt");

-- CreateIndex
CREATE INDEX "Item_sku_idx" ON "public"."Item"("sku");

-- CreateIndex
CREATE INDEX "Item_locationId_idx" ON "public"."Item"("locationId");

-- CreateIndex
CREATE INDEX "Item_ebayAccountId_idx" ON "public"."Item"("ebayAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "public"."UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "public"."UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "public"."UserSession"("userId");

-- CreateIndex
CREATE INDEX "Photo_itemId_idx" ON "public"."Photo"("itemId");

-- CreateIndex
CREATE INDEX "Photo_isPrimary_idx" ON "public"."Photo"("isPrimary");

-- CreateIndex
CREATE INDEX "WorkflowAction_itemId_idx" ON "public"."WorkflowAction"("itemId");

-- CreateIndex
CREATE INDEX "WorkflowAction_userId_idx" ON "public"."WorkflowAction"("userId");

-- CreateIndex
CREATE INDEX "WorkflowAction_createdAt_idx" ON "public"."WorkflowAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_ebayId_key" ON "public"."Listing"("ebayId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_itemId_key" ON "public"."Listing"("itemId");

-- CreateIndex
CREATE INDEX "Listing_ebayId_idx" ON "public"."Listing"("ebayId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "public"."Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_listedAt_idx" ON "public"."Listing"("listedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SoldItem_ebayItemId_key" ON "public"."SoldItem"("ebayItemId");

-- CreateIndex
CREATE INDEX "SoldItem_title_idx" ON "public"."SoldItem"("title");

-- CreateIndex
CREATE INDEX "SoldItem_soldDate_idx" ON "public"."SoldItem"("soldDate");

-- CreateIndex
CREATE INDEX "SoldItem_searchQuery_idx" ON "public"."SoldItem"("searchQuery");

-- CreateIndex
CREATE INDEX "SoldItem_category_idx" ON "public"."SoldItem"("category");

-- CreateIndex
CREATE INDEX "SoldItem_soldPrice_idx" ON "public"."SoldItem"("soldPrice");

-- CreateIndex
CREATE INDEX "PriceResearch_searchQuery_idx" ON "public"."PriceResearch"("searchQuery");

-- CreateIndex
CREATE INDEX "PriceResearch_expiresAt_idx" ON "public"."PriceResearch"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceResearch_searchQuery_key" ON "public"."PriceResearch"("searchQuery");

-- CreateIndex
CREATE INDEX "ListingTemplate_name_idx" ON "public"."ListingTemplate"("name");

-- CreateIndex
CREATE INDEX "ListingTemplate_sourceType_idx" ON "public"."ListingTemplate"("sourceType");

-- CreateIndex
CREATE INDEX "ListingTemplate_isActive_idx" ON "public"."ListingTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ListingTemplate_timesUsed_idx" ON "public"."ListingTemplate"("timesUsed");

-- AddForeignKey
ALTER TABLE "public"."EbayAccount" ADD CONSTRAINT "EbayAccount_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowAction" ADD CONSTRAINT "WorkflowAction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowAction" ADD CONSTRAINT "WorkflowAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

