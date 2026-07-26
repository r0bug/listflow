-- AlterTable
ALTER TABLE "public"."SoldComp" ADD COLUMN     "categoryPath" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "itemSpecifics" JSONB,
ALTER COLUMN "soldPrice" DROP NOT NULL;
