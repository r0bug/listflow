-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('IN_PROCESS', 'DRAFT', 'READY', 'LISTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ItemStage" AS ENUM ('INGESTED', 'GROUPED', 'IDENTIFIED', 'MATCHED', 'DRAFT_STARTED', 'READY');

-- CreateEnum
CREATE TYPE "public"."PhotoGroupStatus" AS ENUM ('PENDING', 'ANALYZING', 'ASSIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."IngestDecision" AS ENUM ('NEW_ITEM', 'ADDED_TO_ITEM', 'DUPLICATE_SKIPPED', 'GROUPED_PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."IngestSource" AS ENUM ('WATCH_FOLDER', 'USB_DCIM', 'SYNC_FOLDER', 'PWA_UPLOAD', 'CAPTURE_APK', 'EBAY_IMPORT');

-- CreateEnum
CREATE TYPE "public"."DeviceImportMethod" AS ENUM ('MASS_STORAGE', 'GVFS', 'GPHOTO2');

-- CreateEnum
CREATE TYPE "public"."EbayDraftStatus" AS ENUM ('OPEN', 'SUBMITTED', 'ABANDONED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ExternalAnalysisBatchStatus" AS ENUM ('QUEUED', 'CLAIMED', 'COMMITTED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."AttributionStatus" AS ENUM ('PENDING', 'ATTRIBUTED', 'HOUSE');

-- CreateEnum
CREATE TYPE "public"."TemplateSourceType" AS ENUM ('MANUAL', 'SELL_SIMILAR', 'AI_GENERATED', 'IMPORTED');

-- CreateTable
CREATE TABLE "public"."StaffUser" (
    "id" TEXT NOT NULL,
    "teamtimeUserId" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "canListOnEbay" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'teamtime',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'machine',
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "label" TEXT,
    "kind" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."EbayAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "email" TEXT,
    "siteId" INTEGER NOT NULL DEFAULT 0,
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "authToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "ordersSyncedThrough" TIMESTAMP(3),
    "postalCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbayAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "category" TEXT,
    "ebayCategoryId" TEXT,
    "condition" TEXT,
    "conditionId" INTEGER,
    "features" TEXT[],
    "keywords" TEXT[],
    "itemSpecifics" JSONB,
    "upc" TEXT,
    "isbn" TEXT,
    "mpn" TEXT,
    "epid" TEXT,
    "startingPrice" DECIMAL(10,2),
    "buyNowPrice" DECIMAL(10,2),
    "shippingPrice" DECIMAL(10,2),
    "weightOz" DOUBLE PRECISION,
    "packageDimensions" JSONB,
    "listingFormat" TEXT,
    "listingDuration" TEXT,
    "returnPolicy" JSONB,
    "postalCode" TEXT,
    "locationCode" TEXT,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'IN_PROCESS',
    "stage" "public"."ItemStage" NOT NULL DEFAULT 'INGESTED',
    "aiAnalysis" JSONB,
    "aiCost" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "completeness" JSONB,
    "sourceFolder" TEXT,
    "fingerprint" TEXT,
    "ebayItemId" TEXT,
    "ebayListingUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "ebayAccountId" TEXT,
    "consignmentGroupId" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Photo" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "photoGroupId" TEXT,
    "originalPath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "optimizedPath" TEXT,
    "publicUrl" TEXT,
    "cdnUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sha256" TEXT NOT NULL,
    "perceptualHash" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "mime" TEXT,
    "capturedAt" TIMESTAMP(3),
    "exif" JSONB,
    "analysis" JSONB,
    "source" "public"."IngestSource" NOT NULL DEFAULT 'WATCH_FOLDER',
    "machineDbId" TEXT,
    "uploadedById" TEXT,
    "groupHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhotoGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "label" TEXT,
    "sourceFolder" TEXT NOT NULL,
    "firstFilenameNumeric" INTEGER,
    "lastFilenameNumeric" INTEGER,
    "firstCapturedAt" TIMESTAMP(3),
    "lastCapturedAt" TIMESTAMP(3),
    "status" "public"."PhotoGroupStatus" NOT NULL DEFAULT 'PENDING',
    "llmDecision" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IngestEvent" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "decision" "public"."IngestDecision" NOT NULL,
    "source" "public"."IngestSource" NOT NULL DEFAULT 'WATCH_FOLDER',
    "machineId" TEXT,
    "userId" TEXT,
    "itemId" TEXT,
    "groupId" TEXT,
    "llmCostUsd" DECIMAL(10,4),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WatchFolder" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "includeGlobs" TEXT[] DEFAULT ARRAY['**/*.{jpg,jpeg,png,heic,heif,webp}']::TEXT[],
    "excludeGlobs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastScanAt" TIMESTAMP(3),
    "recursive" BOOLEAN NOT NULL DEFAULT true,
    "ownerHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Device" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT,
    "lastMountPath" TEXT,
    "lastImportedAt" TIMESTAMP(3),
    "autoImport" BOOLEAN NOT NULL DEFAULT false,
    "importSubdir" TEXT,
    "importMethod" "public"."DeviceImportMethod" NOT NULL DEFAULT 'MASS_STORAGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalAnalysisBatch" (
    "id" TEXT NOT NULL,
    "sourceFolder" TEXT NOT NULL,
    "status" "public"."ExternalAnalysisBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "photoIds" TEXT[],
    "continuation" JSONB,
    "result" JSONB,
    "claimedAt" TIMESTAMP(3),
    "claimedBy" TEXT,
    "committedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAnalysisBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EbayDraft" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ebayDraftId" TEXT,
    "ebayDraftUrl" TEXT NOT NULL,
    "ebayAccountId" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFilledAt" TIMESTAMP(3),
    "lastFilledFields" JSONB,
    "currentValues" JSONB,
    "status" "public"."EbayDraftStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbayDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "ebayOrderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL DEFAULT '0',
    "salesRecordNumber" TEXT,
    "legacyItemId" TEXT,
    "customLabel" TEXT,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemPrice" DOUBLE PRECISION NOT NULL,
    "shippingPrice" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION,
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "buyerUsername" TEXT,
    "shipCity" TEXT,
    "shipState" TEXT,
    "shipCountry" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "shippingService" TEXT,
    "imageUrl" TEXT,
    "imagePath" TEXT,
    "thumbnailPath" TEXT,
    "source" TEXT NOT NULL,
    "rawData" JSONB,
    "attributionStatus" "public"."AttributionStatus" NOT NULL DEFAULT 'PENDING',
    "listedById" TEXT,
    "consignmentGroupId" TEXT,
    "ebayAccountId" TEXT NOT NULL,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SoldComp" (
    "id" SERIAL NOT NULL,
    "ebayItemId" TEXT NOT NULL,
    "itemUrl" TEXT,
    "title" TEXT NOT NULL,
    "soldPrice" DOUBLE PRECISION NOT NULL,
    "shippingPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "condition" TEXT,
    "category" TEXT,
    "listingType" TEXT,
    "bidCount" INTEGER,
    "quantitySold" INTEGER,
    "totalSales" DOUBLE PRECISION,
    "watchers" INTEGER,
    "seller" TEXT,
    "sellerFeedback" INTEGER,
    "imageUrl" TEXT,
    "localImage" TEXT,
    "soldDate" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'extension',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoldComp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Search" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "avgPrice" DOUBLE PRECISION,
    "medianPrice" DOUBLE PRECISION,
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'seller_hub',
    "pagesScraped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchComp" (
    "searchId" INTEGER NOT NULL,
    "compId" INTEGER NOT NULL,

    CONSTRAINT "SearchComp_pkey" PRIMARY KEY ("searchId","compId")
);

-- CreateTable
CREATE TABLE "public"."ItemComp" (
    "itemId" TEXT NOT NULL,
    "compId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemComp_pkey" PRIMARY KEY ("itemId","compId")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" JSONB,
    "ownerId" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundleBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionComp" (
    "collectionId" TEXT NOT NULL,
    "compId" INTEGER NOT NULL,
    "flaggedForListing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollectionComp_pkey" PRIMARY KEY ("collectionId","compId")
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
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_teamtimeUserId_key" ON "public"."StaffUser"("teamtimeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "public"."StaffUser"("email");

-- CreateIndex
CREATE INDEX "StaffUser_active_idx" ON "public"."StaffUser"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_machineId_key" ON "public"."Machine"("machineId");

-- CreateIndex
CREATE INDEX "Machine_apiKeyId_idx" ON "public"."Machine"("apiKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "EbayAccount_accountName_key" ON "public"."EbayAccount"("accountName");

-- CreateIndex
CREATE INDEX "EbayAccount_isActive_idx" ON "public"."EbayAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Item_ebayItemId_key" ON "public"."Item"("ebayItemId");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "public"."Item"("status");

-- CreateIndex
CREATE INDEX "Item_stage_idx" ON "public"."Item"("stage");

-- CreateIndex
CREATE INDEX "Item_fingerprint_idx" ON "public"."Item"("fingerprint");

-- CreateIndex
CREATE INDEX "Item_ebayAccountId_idx" ON "public"."Item"("ebayAccountId");

-- CreateIndex
CREATE INDEX "Item_consignmentGroupId_idx" ON "public"."Item"("consignmentGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_sha256_key" ON "public"."Photo"("sha256");

-- CreateIndex
CREATE INDEX "Photo_itemId_idx" ON "public"."Photo"("itemId");

-- CreateIndex
CREATE INDEX "Photo_photoGroupId_idx" ON "public"."Photo"("photoGroupId");

-- CreateIndex
CREATE INDEX "Photo_perceptualHash_idx" ON "public"."Photo"("perceptualHash");

-- CreateIndex
CREATE INDEX "Photo_capturedAt_idx" ON "public"."Photo"("capturedAt");

-- CreateIndex
CREATE INDEX "Photo_groupHint_idx" ON "public"."Photo"("groupHint");

-- CreateIndex
CREATE INDEX "PhotoGroup_sourceFolder_firstCapturedAt_idx" ON "public"."PhotoGroup"("sourceFolder", "firstCapturedAt");

-- CreateIndex
CREATE INDEX "PhotoGroup_status_idx" ON "public"."PhotoGroup"("status");

-- CreateIndex
CREATE INDEX "IngestEvent_sha256_idx" ON "public"."IngestEvent"("sha256");

-- CreateIndex
CREATE INDEX "IngestEvent_createdAt_idx" ON "public"."IngestEvent"("createdAt");

-- CreateIndex
CREATE INDEX "IngestEvent_decision_idx" ON "public"."IngestEvent"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "WatchFolder_path_key" ON "public"."WatchFolder"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Device_vendorId_productId_key" ON "public"."Device"("vendorId", "productId");

-- CreateIndex
CREATE INDEX "ExternalAnalysisBatch_status_idx" ON "public"."ExternalAnalysisBatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EbayDraft_ebayDraftId_key" ON "public"."EbayDraft"("ebayDraftId");

-- CreateIndex
CREATE INDEX "EbayDraft_itemId_idx" ON "public"."EbayDraft"("itemId");

-- CreateIndex
CREATE INDEX "EbayDraft_status_idx" ON "public"."EbayDraft"("status");

-- CreateIndex
CREATE INDEX "Sale_soldAt_idx" ON "public"."Sale"("soldAt");

-- CreateIndex
CREATE INDEX "Sale_attributionStatus_idx" ON "public"."Sale"("attributionStatus");

-- CreateIndex
CREATE INDEX "Sale_legacyItemId_idx" ON "public"."Sale"("legacyItemId");

-- CreateIndex
CREATE INDEX "Sale_consignmentGroupId_idx" ON "public"."Sale"("consignmentGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_ebayAccountId_ebayOrderId_lineItemId_key" ON "public"."Sale"("ebayAccountId", "ebayOrderId", "lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SoldComp_ebayItemId_key" ON "public"."SoldComp"("ebayItemId");

-- CreateIndex
CREATE INDEX "SoldComp_title_idx" ON "public"."SoldComp"("title");

-- CreateIndex
CREATE INDEX "SoldComp_soldDate_idx" ON "public"."SoldComp"("soldDate");

-- CreateIndex
CREATE INDEX "SoldComp_soldPrice_idx" ON "public"."SoldComp"("soldPrice");

-- CreateIndex
CREATE INDEX "SoldComp_category_idx" ON "public"."SoldComp"("category");

-- CreateIndex
CREATE INDEX "Search_keyword_idx" ON "public"."Search"("keyword");

-- CreateIndex
CREATE INDEX "Search_createdAt_idx" ON "public"."Search"("createdAt");

-- CreateIndex
CREATE INDEX "ListingTemplate_name_idx" ON "public"."ListingTemplate"("name");

-- CreateIndex
CREATE INDEX "ListingTemplate_isActive_idx" ON "public"."ListingTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ListingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_machineDbId_fkey" FOREIGN KEY ("machineDbId") REFERENCES "public"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_photoGroupId_fkey" FOREIGN KEY ("photoGroupId") REFERENCES "public"."PhotoGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhotoGroup" ADD CONSTRAINT "PhotoGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngestEvent" ADD CONSTRAINT "IngestEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EbayDraft" ADD CONSTRAINT "EbayDraft_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EbayDraft" ADD CONSTRAINT "EbayDraft_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_listedById_fkey" FOREIGN KEY ("listedById") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_ebayAccountId_fkey" FOREIGN KEY ("ebayAccountId") REFERENCES "public"."EbayAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchComp" ADD CONSTRAINT "SearchComp_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "public"."Search"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchComp" ADD CONSTRAINT "SearchComp_compId_fkey" FOREIGN KEY ("compId") REFERENCES "public"."SoldComp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemComp" ADD CONSTRAINT "ItemComp_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemComp" ADD CONSTRAINT "ItemComp_compId_fkey" FOREIGN KEY ("compId") REFERENCES "public"."SoldComp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionComp" ADD CONSTRAINT "CollectionComp_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionComp" ADD CONSTRAINT "CollectionComp_compId_fkey" FOREIGN KEY ("compId") REFERENCES "public"."SoldComp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
