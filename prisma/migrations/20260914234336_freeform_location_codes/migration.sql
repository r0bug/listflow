-- Location codes become free text. The app imposes no scheme: the shop's
-- printed labels read "A-1".."Z-6", but a location may equally be "johns
-- garage". row/shelf are kept only as opportunistic sort keys and are now
-- nullable, null for anything that does not follow the printed convention.
--
-- Existing rows are placeholders seeded during testing ("R1-S1" …). They
-- describe no real shelving, so they are dropped along with any Item pointing
-- at one. Real locations get entered by the operator standing at the shelf.

UPDATE "Item" SET "locationCode" = NULL WHERE "locationCode" ~ '^R[0-9]+-S[0-9]+$';
DELETE FROM "StorageLocation" WHERE "code" ~ '^R[0-9]+-S[0-9]+$';

ALTER TABLE "StorageLocation" ALTER COLUMN "row" SET DATA TYPE TEXT;
ALTER TABLE "StorageLocation" ALTER COLUMN "row" DROP NOT NULL;
ALTER TABLE "StorageLocation" ALTER COLUMN "shelf" DROP NOT NULL;
