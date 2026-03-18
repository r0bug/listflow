# Bug Journal

Known issues and their fixes. Check here FIRST before debugging.

---

## eBay Trading API: XML Parse Error / SimpleDeserializer
**Date:** 2026-03-17
**Symptom:** "Schema XML request error: SimpleDeserializer encountered a child element, which is NOT expected"
**Root cause:** The `@hendt/ebay-api` library incorrectly serializes nested objects to XML. Complex structures like `ShippingPackageDetails` with `WeightMajor`/`WeightMinor`, `SellerProfiles`, and `CalculatedShippingRate` all fail.
**Fix:** Bypass the library entirely — use raw XML via `fetch()` to `https://api.ebay.com/ws/api.dll` for both `AddItem` and `ReviseItem`. Build XML strings manually with proper CDATA wrapping for descriptions.
**Files:** `src/services/ebay.service.ts`

## eBay Trading API: Auth Token Invalid (Error 931)
**Date:** 2026-03-17
**Symptom:** "Auth token is invalid" when pushing to eBay
**Root cause:** The `#` characters in eBay auth tokens are interpreted as inline comments by dotenv. Token `v^1.1#i^1#...` was truncated to just `v^1.1` (5 chars).
**Fix:** Wrap the token value in double quotes in `.env`: `EBAY_AUTH_TOKEN="v^1.1#i^1#..."`
**Files:** `.env`

## eBay Trading API: Invalid ebayId Type
**Date:** 2026-03-17
**Symptom:** Prisma error: "Expected String, provided Int" for `ebayId` field after successful eBay push
**Root cause:** eBay returns `ItemID` as a number, but Prisma schema expects a string.
**Fix:** `ebayId: String(result.listingId)` — always cast to string.
**Files:** `src/routes/dashboard.routes.ts`

## eBay Trading API: ShippingDetails Invalid
**Date:** 2026-03-17
**Symptom:** "Input data for tag Item.ShippingDetails is invalid or missing"
**Root cause:** Seller has business policies enabled. Legacy shipping/return/payment fields are rejected or cause issues. Calculated shipping XML structure is particularly problematic.
**Fix:** Use `SellerProfiles` with policy IDs in raw XML. Flat shipping with `USPSPriority/free` works as a fallback since eBay auto-maps to business policies.
**Files:** `src/services/ebay.service.ts`

## eBay CSV Upload: Category Not a Leaf
**Date:** 2026-03-17
**Symptom:** "The category selected is not a leaf category" when uploading CSV
**Root cause:** Category ID 58058 is "Computers/Tablets & Networking" (parent), not the specific subcategory. AI analysis gives text paths, not numeric leaf IDs.
**Fix:** Auto-lookup via eBay Browse API `item_summary/search` — find similar listings and use their `leafCategoryIds[0]`. Cache on item's `ebayCategoryId` field.
**Files:** `src/services/ebay.service.ts`, `src/services/csvExport.service.ts`

## eBay CSV Upload: Invalid Condition ID
**Date:** 2026-03-17
**Symptom:** "The provided condition id is invalid for the selected primary category"
**Root cause:** Condition IDs 4000 (Very Good), 5000 (Good), 6000 (Acceptable) are only valid for Books/Music/Movies. Electronics and most other categories only accept 3000 (Used).
**Fix:** Map all "Used" variants to condition ID 3000.
**Files:** `src/services/ebay.service.ts`, `src/services/csvExport.service.ts`

## eBay Shipping Service: USPSGround Invalid
**Date:** 2026-03-17
**Symptom:** "Shipping service US Postal Service Ground(17) is not available"
**Root cause:** `USPSGround` is not a valid eBay API shipping code. USPS renamed it to Ground Advantage.
**Fix:** Map `USPSGround` → `USPSGroundAdvantage` in `mapShippingService()`.
**Files:** `src/services/ebay.service.ts`

## Server Crash: TS Compilation Error on Location.settings
**Date:** 2026-03-15
**Symptom:** Server crashes on startup, PIN login fails. TS error: "'settings' does not exist on type LocationSelect"
**Root cause:** Prisma generated types don't include the `settings` Json field when using `select` clause. The `listing-defaults` routes used a `select` that excluded `settings`.
**Fix:** Remove `select` clause, cast to `any`: `((location as any).settings as Record<string, unknown>)`
**Files:** `src/routes/dashboard.routes.ts`

## Vite Preview: NODE_ENV=production Crash
**Date:** 2026-03-18
**Symptom:** Vite preview server prints addresses but immediately exits. "NODE_ENV=production is not supported in the .env file"
**Root cause:** Vite reads `.env` from parent directories. The root `.env` had `NODE_ENV=production` which Vite rejects.
**Fix:** Remove `NODE_ENV` from `.env`, set it via PM2 command instead: `pm2 start "NODE_ENV=production npx ts-node src/server.ts"`. Run Vite preview via PM2 too.
**Files:** `.env`, PM2 config

## Vite Preview: Blocked Host
**Date:** 2026-03-18
**Symptom:** "Blocked request. This host is not allowed" when accessing via list.robug.com
**Fix:** Add hosts to `preview.allowedHosts` in `client/vite.config.ts`. Already configured but requires rebuild after changes.
**Files:** `client/vite.config.ts`

## Photo Edit: Rotation Saves as Zoomed-In
**Date:** 2026-03-14
**Symptom:** Rotating a photo saves a zoomed-in cropped version instead of the full rotated image
**Root cause:** react-easy-crop always fires `onCropComplete` with auto-calculated crop coordinates for rotated images (largest inscribed rectangle). Backend applied rotation first, then crop, misaligning coordinates.
**Fix:** (1) Frontend: only send crop when user explicitly interacts via `userCropped` ref. (2) Backend: reorder pipeline to crop → rotate.
**Files:** `client/src/components/PhotoEditor.tsx`, `src/routes/dashboard.routes.ts`

## Push to eBay: Missing Images
**Date:** 2026-03-17
**Symptom:** Items pushed to eBay have no photos
**Root cause:** Push endpoint didn't run image hosting to create public URLs before sending to eBay. Photos had null `publicUrl`.
**Fix:** Call `hostItemImages(id)` before building the image URL array in the push-to-ebay endpoint.
**Files:** `src/routes/dashboard.routes.ts`
