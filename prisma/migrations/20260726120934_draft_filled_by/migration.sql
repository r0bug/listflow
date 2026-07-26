-- AlterTable
ALTER TABLE "public"."EbayDraft" ADD COLUMN     "filledById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."EbayDraft" ADD CONSTRAINT "EbayDraft_filledById_fkey" FOREIGN KEY ("filledById") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
