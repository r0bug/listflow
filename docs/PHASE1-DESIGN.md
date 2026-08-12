# Phase 1 Design — Unified eBay Suite ("listflow" merge)

Status: DRAFT for review · 2026-07-25
Scope: repo merge (swiftlist → listflow), unified DB/Prisma schema, central
ingest pipeline + contract. Does NOT touch TeamTime (phases 3–4) — TeamTime is
the only production system; all TeamTime work later is additive, dev-branch +
local-DB first, fleet-coordinated on deploy.

## 0. Decisions this design implements

- One app: swiftlist merges into listflow. listflow's image layer, mocked
  Trading-API publish path, and local User/auth are retired.
- Publish path: eBay drafts via the Chrome extension (human review at the
  draft). Multi-account via Chrome profiles (profile = TeamTime lister +
  eBay account pairing).
- Front door: the extension (popup login + bundled full-page SPA). Two
  staff-only locked web surfaces: mobile upload PWA + comptool field page
  (offline-capable collections). No public websites; comptool's public
  registration / tiered data API / Stripe stubs are removed.
- Auth: credential proxy to TeamTime (phase 3). Until then dev-mode local
  login stub behind the same interface.
- Money: listflow = sales ledger (eBay order links, lister attribution,
  consignment-group tags). TeamTime = commission/split/points logic + payroll
  reports (phase 4). Consignors: vendor | estate | walk-in, registry in
  TeamTime; listflow stores only the group reference.

## 1. Repo layout (npm workspaces, one repo: `listflow`)

```
listflow/
├── package.json                # workspaces
├── prisma/schema.prisma        # ONE unified schema (section 2)
├── docker-compose.yml          # postgres only (redis removed — unused)
├── docs/
├── packages/
│   ├── server/                 # Express+TS API (port 3001) — merged
│   │   └── src/
│   │       ├── routes/         # /api/v1/* only; every route JWT- or machine-key-gated
│   │       ├── services/       # ingest, image, grouping, hosting, ai,
│   │       │                   # drafts, comps, salesSync, agentSync
│   │       └── ...
│   ├── extension/              # merged MV3 extension (swiftlist base)
│   │   ├── manifest.json       # + comptool matches (sh/research, sch, worthpoint)
│   │   ├── sw/                 # service worker: token holder, API proxy
│   │   ├── content/            # listing/draft fill + comps scrapers
│   │   └── app/                # bundled Vite SPA (pool, grouping, items,
│   │                           # review, comps, settings) — chrome-extension:// page
│   ├── watcher/                # fleet-workstation daemon (folder + USB/DCIM)
│   ├── mobile-upload/          # PWA: PIN login, camera/gallery upload (token-gated)
│   ├── field/                  # comptool field page PWA: collections, offline cache
│   ├── mcp-server/             # external-AI batch queue (unchanged flow)
│   └── shared/                 # DTOs: ingest, autofill, draft, universal-item
```

Retired (deleted, not migrated): listflow `client/` (Vite web app → extension
SPA), `desktop/` (Electron), `Ebaytools-main/` (legacy Python), `src/cli/`,
cleanup.service.ts, upload.controller/routes, Segmind ai.service (replaced by
swiftlist's Anthropic/external-MCP ai.service), `bull` + redis, `openai` dep,
schema.v2.prisma, soldData puppeteer scraper (extension scrapes instead).
comptool repo: backend routes fold into `server/` (keep `/api/v1/comps/*`),
dashboard becomes `field/`; public registration (`clients.js`), tiered
`dataApi.js`, Stripe/planTier fields are dropped.

## 2. Unified Prisma schema (draft)

One Postgres database `listflow`, default schema. Data sources for migration:
comptool `SoldComp/Search` data is REAL and migrated; swiftlist photos/items
migrated if present; old listflow rows are test data — not migrated.

```prisma
// ── Identity ──────────────────────────────────────────────
// Staff comes from TeamTime (roster sync exists today; credential proxy in
// phase 3). No local passwords. Absorbs old ListingAgent (rates → TeamTime).
model StaffUser {
  id             String   @id @default(cuid())
  teamtimeUserId String?  @unique          // null only for legacy/manual rows
  email          String?  @unique
  name           String
  role           String   @default("staff") // mirrored from TeamTime
  canListOnEbay  Boolean  @default(false)
  active         Boolean  @default(true)
  source         String   @default("teamtime") // teamtime | manual
  lastSyncedAt   DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  itemsCreated  Item[]        @relation("ItemCreator")
  photosAdded   Photo[]
  salesListed   Sale[]
  collections   Collection[]
}

// Machine credentials for non-human callers: watchers, extension installs,
// capture APK. swiftlist's hashed-key model (comptool's plaintext keys drop).
model ApiKey {
  id         String    @id @default(cuid())
  keyHash    String    @unique
  name       String?
  kind       String    @default("machine") // machine | service
  revokedAt  DateTime?
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  machines   Machine[]
}

model Machine {
  id         String    @id @default(cuid())
  apiKeyId   String
  machineId  String    @unique   // client-generated UUID (X-Machine-Id)
  label      String?             // "photo-station-1", "john-pixel"
  kind       String?             // workstation | extension | phone
  userAgent  String?
  lastSeenAt DateTime?
  createdAt  DateTime  @default(now())
  apiKey     ApiKey    @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  photos     Photo[]
  @@index([apiKeyId])
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}

// ── eBay accounts ────────────────────────────────────────
// Drafts publishing doesn't need Trading-API creds, but sales sync + Browse
// still use OAuth. PayPal-era fields dropped.
model EbayAccount {
  id                  String    @id @default(cuid())
  accountName         String    @unique
  email               String?
  siteId              Int       @default(0)
  sandbox             Boolean   @default(false)
  authToken           String?   @db.Text
  refreshToken        String?   @db.Text
  tokenExpiresAt      DateTime?
  ordersSyncedThrough DateTime?
  postalCode          String?
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  items  Item[]
  drafts EbayDraft[]
  sales  Sale[]
}

// ── Items & photos (swiftlist core, enriched) ────────────
model Item {
  id                 String     @id @default(cuid())
  sku                String?    @unique
  title              String?
  description        String?    @db.Text
  brand              String?
  model              String?
  category           String?
  ebayCategoryId     String?
  condition          String?
  conditionId        Int?
  features           String[]
  keywords           String[]
  itemSpecifics      Json?
  upc                String?
  isbn               String?
  mpn                String?
  epid               String?
  startingPrice      Decimal?   @db.Decimal(10, 2)
  buyNowPrice        Decimal?   @db.Decimal(10, 2)
  shippingPrice      Decimal?   @db.Decimal(10, 2)
  weightOz           Float?
  packageDimensions  Json?
  listingFormat      String?
  listingDuration    String?
  returnPolicy       Json?
  postalCode         String?

  locationCode       String?    // physical Row/Shelf, e.g. "R3-S2" — DB is
                                // authority; stamped into eBay Custom Label
                                // as "<SKU>|<LOC>" at draft time (Standards §6)
  status             ItemStatus @default(IN_PROCESS)
  stage              ItemStage  @default(INGESTED)
  aiAnalysis         Json?
  aiCost             Decimal    @default(0) @db.Decimal(10, 4)
  completeness       Json?
  sourceFolder       String?
  fingerprint        String?

  // Live listing (drafts path: set when extension sees the /itm/ redirect)
  ebayItemId         String?    @unique
  ebayListingUrl     String?
  publishedAt        DateTime?

  // Attribution + routing
  createdBy          StaffUser?   @relation("ItemCreator", fields: [createdById], references: [id])
  createdById        String?
  ebayAccount        EbayAccount? @relation(fields: [ebayAccountId], references: [id])
  ebayAccountId      String?      // target account; extension filters on this
  consignmentGroupId String?      // TeamTime-owned registry; reference only
  templateId         String?
  template           ListingTemplate? @relation(fields: [templateId], references: [id])

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  photos       Photo[]
  groups       PhotoGroup[]
  comps        ItemComp[]
  drafts       EbayDraft[]
  sales        Sale[]
  ingestEvents IngestEvent[]

  @@index([status])
  @@index([stage])
  @@index([ebayAccountId])
  @@index([consignmentGroupId])
}

model Photo {
  id             String      @id @default(cuid())
  itemId         String?
  photoGroupId   String?
  originalPath   String
  thumbnailPath  String?
  optimizedPath  String?
  publicUrl      String?
  cdnUrl         String?
  isPrimary      Boolean     @default(false)
  order          Int         @default(0)
  sha256         String      @unique     // idempotent ingest
  perceptualHash String?
  width          Int?
  height         Int?
  bytes          Int?
  mime           String?
  capturedAt     DateTime?
  exif           Json?
  analysis       Json?

  // Provenance (new): who/what/where it came from
  source         IngestSource @default(WATCH_FOLDER)
  machine        Machine?     @relation(fields: [machineDbId], references: [id])
  machineDbId    String?
  uploadedBy     StaffUser?   @relation(fields: [uploadedById], references: [id])
  uploadedById   String?
  groupHint      String?      // capture-time grouping key (APK "next item")

  createdAt      DateTime    @default(now())

  item       Item?       @relation(fields: [itemId], references: [id], onDelete: SetNull)
  photoGroup PhotoGroup? @relation(fields: [photoGroupId], references: [id], onDelete: SetNull)

  @@index([itemId])
  @@index([photoGroupId])
  @@index([perceptualHash])
  @@index([capturedAt])
  @@index([groupHint])
}

model PhotoGroup {
  id                   String           @id @default(cuid())
  itemId               String?
  label                String?
  sourceFolder         String
  firstFilenameNumeric Int?
  lastFilenameNumeric  Int?
  firstCapturedAt      DateTime?
  lastCapturedAt       DateTime?
  status               PhotoGroupStatus @default(PENDING)
  llmDecision          Json?
  createdAt            DateTime         @default(now())
  item   Item?   @relation(fields: [itemId], references: [id], onDelete: SetNull)
  photos Photo[]
  @@index([status])
}

model IngestEvent {
  id         String         @id @default(cuid())
  path       String
  sha256     String
  decision   IngestDecision
  source     IngestSource   @default(WATCH_FOLDER)
  machineId  String?
  userId     String?
  itemId     String?
  groupId    String?
  llmCostUsd Decimal?       @db.Decimal(10, 4)
  error      String?
  createdAt  DateTime       @default(now())
  item Item? @relation(fields: [itemId], references: [id], onDelete: SetNull)
  @@index([sha256])
  @@index([createdAt])
}

model WatchFolder { /* unchanged from swiftlist */ 
  id           String    @id @default(cuid())
  path         String    @unique
  enabled      Boolean   @default(true)
  includeGlobs String[]  @default(["**/*.{jpg,jpeg,png,heic,heif,webp}"])
  excludeGlobs String[]  @default([])
  lastScanAt   DateTime?
  recursive    Boolean   @default(true)
  ownerHint    String?   // for synced folders: maps folder → StaffUser attribution
  createdAt    DateTime  @default(now())
}

model Device { /* unchanged from swiftlist (USB auto-import) */
  id             String             @id @default(cuid())
  vendorId       String
  productId      String
  label          String?
  lastMountPath  String?
  lastImportedAt DateTime?
  autoImport     Boolean            @default(false)
  importSubdir   String?
  importMethod   DeviceImportMethod @default(MASS_STORAGE)
  createdAt      DateTime           @default(now())
  @@unique([vendorId, productId])
}

model ExternalAnalysisBatch { /* unchanged from swiftlist */
  id           String                      @id @default(cuid())
  sourceFolder String
  status       ExternalAnalysisBatchStatus @default(QUEUED)
  photoIds     String[]
  continuation Json?
  result       Json?
  claimedAt    DateTime?
  claimedBy    String?
  committedAt  DateTime?
  error        String?
  createdAt    DateTime                    @default(now())
  updatedAt    DateTime                    @updatedAt
  @@index([status])
}

// ── Drafts (publish path) ────────────────────────────────
model EbayDraft {
  id               String          @id @default(cuid())
  itemId           String
  ebayDraftId      String?         @unique
  ebayDraftUrl     String
  ebayAccountId    String?         // replaces accountHint — profile-pinned
  lastSeenAt       DateTime        @default(now())
  lastFilledAt     DateTime?
  lastFilledFields Json?
  currentValues    Json?
  status           EbayDraftStatus @default(OPEN)
  notes            String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  item        Item         @relation(fields: [itemId], references: [id], onDelete: Cascade)
  ebayAccount EbayAccount? @relation(fields: [ebayAccountId], references: [id])
  @@index([itemId])
  @@index([status])
}

// ── Sales ledger (feeds TeamTime; commission logic NOT here) ──
// Field set validated against a real Seller Hub Orders report export
// (yakimanet, Apr–May 2026, 500 line items). See §3b import spec.
model Sale {
  id                String   @id @default(cuid())
  ebayOrderId       String              // "Order Number"
  lineItemId        String   @default("0") // "Transaction ID"; blank in ~0.6% → fall back to salesRecordNumber
  salesRecordNumber String?             // Seller Hub SRN — clerk-facing anchor
  legacyItemId      String?             // "Item Number" → Item.ebayItemId
  customLabel       String?             // "Custom Label" = our SKU → Item.sku (deterministic join)
  title             String
  quantity          Int      @default(1)
  itemPrice         Float               // "Sold For" (pre-tax; commission basis)
  shippingPrice     Float?              // "Shipping And Handling"
  taxAmount         Float?              // "eBay Collected Tax" (eBay remits; never ours)
  totalPrice        Float               // "Total Price" (incl. tax+shipping)
  fees              Float?              // NOT in Orders report; enriched later from Payments report
  promoted          Boolean  @default(false) // "Sold Via Promoted Listings" (83% of real sales!) → ad fees exist
  currency          String   @default("USD")
  buyerUsername     String?
  shipCity          String?
  shipState         String?
  shipCountry       String?
  // PII policy: buyer name/email/street/phone are NOT imported; rawData holds
  // the source row MINUS PII columns. Original reports archived on disk.
  soldAt            DateTime            // "Sale Date"
  paidAt            DateTime?           // "Paid On Date"
  shippedAt         DateTime?           // "Shipped On Date"
  trackingNumber    String?
  shippingService   String?
  imageUrl          String?
  imagePath         String?
  thumbnailPath     String?
  source            String   // api | csv
  rawData           Json?    // PII-stripped source row

  attributionStatus  AttributionStatus @default(PENDING)
  listedBy           StaffUser?  @relation(fields: [listedById], references: [id])
  listedById         String?     // resolved via Item → draft → profile lister
  consignmentGroupId String?     // snapshot from Item at attribution time

  ebayAccount   EbayAccount @relation(fields: [ebayAccountId], references: [id])
  ebayAccountId String
  item          Item?       @relation(fields: [itemId], references: [id])
  itemId        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([ebayAccountId, ebayOrderId, lineItemId])
  @@index([soldAt])
  @@index([attributionStatus])
  @@index([legacyItemId])
  @@index([consignmentGroupId])
}
// NOTE: old listflow `Commission` + `ListingAgent` rate fields are dropped —
// TeamTime owns splits/points (phase 4). The /api/v1/sales/feed endpoint is
// KEPT and enriched (consignmentGroupId, listedBy.teamtimeUserId, account).
// /api/v1/commissions/payroll is retired in phase 4 when TeamTime computes.

// ── Comps (comptool core, single-tenant) ─────────────────
model SoldComp {
  id             Int       @id @default(autoincrement())
  ebayItemId     String    @unique     // clientId dimension dropped
  itemUrl        String?
  title          String
  soldPrice      Float
  shippingPrice  Float?
  totalPrice     Float?
  condition      String?
  category       String?
  listingType    String?
  bidCount       Int?
  quantitySold   Int?
  totalSales     Float?
  watchers       Int?
  seller         String?
  sellerFeedback Int?
  imageUrl       String?
  localImage     String?              // cached — required for offline field use
  soldDate       DateTime?
  source         String    @default("extension") // extension | worthpoint | bookmarklet
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  searches    SearchComp[]
  items       ItemComp[]
  collections CollectionComp[]
  @@index([title])
  @@index([soldDate])
  @@index([soldPrice])
  @@index([category])
}

model Search { /* comptool, minus clientId */
  id           Int      @id @default(autoincrement())
  keyword      String
  filters      Json?
  resultCount  Int      @default(0)
  avgPrice     Float?
  medianPrice  Float?
  minPrice     Float?
  maxPrice     Float?
  source       String   @default("seller_hub")
  pagesScraped Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  comps SearchComp[]
  @@index([keyword])
}

model SearchComp {
  searchId Int
  compId   Int
  search Search   @relation(fields: [searchId], references: [id], onDelete: Cascade)
  comp   SoldComp @relation(fields: [compId], references: [id], onDelete: Cascade)
  @@id([searchId, compId])
}

// Item ↔ comp association (replaces swiftlist's duplicating SoldCompLink)
model ItemComp {
  itemId    String
  compId    Int
  isPrimary Boolean @default(false)
  linkedAt  DateTime @default(now())
  item Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  comp SoldComp @relation(fields: [compId], references: [id], onDelete: Cascade)
  @@id([itemId, compId])
}

// ── Field collections (pick prep, offline) ───────────────
model Collection {
  id          String   @id @default(cuid())
  name        String                       // "Ford Model A parts"
  query       Json?                        // saved search/filters that built it
  owner       StaffUser? @relation(fields: [ownerId], references: [id])
  ownerId     String?
  snapshotAt  DateTime @default(now())     // when comps were frozen into it
  bundleBytes Int?                         // size of offline bundle (thumbs+data)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  comps CollectionComp[]
}

model CollectionComp {
  collectionId String
  compId       Int
  flaggedForListing Boolean @default(false) // field "I'll be listing this" → seeds item stub
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  comp       SoldComp   @relation(fields: [compId], references: [id], onDelete: Cascade)
  @@id([collectionId, compId])
}

model ListingTemplate { /* carried from listflow as-is, plus items backref */ }

// ── Enums ────────────────────────────────────────────────
enum ItemStatus  { IN_PROCESS DRAFT READY LISTED SOLD ARCHIVED }
enum ItemStage   { INGESTED GROUPED IDENTIFIED MATCHED DRAFT_STARTED READY }
enum PhotoGroupStatus { PENDING ANALYZING ASSIGNED REJECTED }
enum IngestDecision   { NEW_ITEM ADDED_TO_ITEM DUPLICATE_SKIPPED GROUPED_PENDING ERROR }
enum IngestSource     { WATCH_FOLDER USB_DCIM SYNC_FOLDER PWA_UPLOAD CAPTURE_APK EBAY_IMPORT }
enum DeviceImportMethod { MASS_STORAGE GVFS GPHOTO2 }
enum EbayDraftStatus  { OPEN SUBMITTED ABANDONED UNKNOWN }
enum ExternalAnalysisBatchStatus { QUEUED CLAIMED COMMITTED ERROR }
enum AttributionStatus { PENDING ATTRIBUTED HOUSE }
```

Dropped entirely: listflow `Location` (single-site; resurrect later if a second
site happens), `UserSession`, `Listing` (Item IS the listing record on the
drafts path), `SoldItem`/`PriceResearch` (superseded by SoldComp/Search),
`Commission` + agent rate fields (→ TeamTime), swiftlist `User` +
`SoldCompLink`, comptool `Client` billing fields.

## 3. Ingest contract (all four feeders, one endpoint)

`POST /api/v1/ingest/photo` — multipart (`file`) or JSON
(`{ path }` for same-host watcher, `{ inline: {base64,...} }` for remote).

Auth: either staff JWT (`Authorization: Bearer`) — PWA/extension; or machine
key (`X-Api-Key` + `X-Machine-Id`) — watcher/APK/sync-scanner.

Body fields (all optional unless noted):
```
file | path | inline    REQUIRED (one of)
source                  IngestSource (server infers default from auth kind)
capturedAt              ISO override when EXIF is missing
groupHint               capture-time grouping key; photos sharing a hint are
                        pre-clustered into one PhotoGroup automatically
itemId                  append directly to an existing item (skip pool)
watchFolderId           audit/routing for watcher
uploadedForUserId       machine callers may attribute to a staff user
```
Response: `{ status: "created" | "duplicate", photoId, sha256, thumbnailUrl }`
Semantics: idempotent by sha256 (re-inserting an SD card is always safe);
EXIF-rotate; 1500px + 400px variants; file write + DB row transactional;
photo lands in the pool tagged with source/machine/user.

`POST /api/v1/ingest/batch` — array form for APK bursts (one groupHint per
item burst). `GET /api/v1/ingest/status` — progress counts (popup/PWA polling).

## 3b. Seller Hub Orders CSV import spec

Validated against the real yakimanet export
(`~/Downloads/eBay-OrdersReport-Jul-25-2026-22_25_00-0700-11322995290.csv`,
500 line items, Apr–May 2026, $29.4k gross). Format quirks the importer MUST
handle:

- UTF-8 BOM; line 1 is a junk all-commas row; header is line 2; line 3 is an
  empty-quotes spacer. Some data rows have a column-count mismatch (2/500) —
  parse defensively by header name, never by position count.
- Money as `"$1,234.56"` strings; dates as `Apr-01-26` (assume account-local
  TZ, America/Los_Angeles).
- Key: (ebayAccountId, "Order Number", "Transaction ID"); Transaction ID blank
  on ~0.6% of rows → fall back to "Sales Record Number". Multi-line orders are
  real (up to 3 line items). Re-import is idempotent (upsert on key).
- Item join order: "Custom Label" → Item.sku (only 10% of legacy sales have
  one — see requirement below), else "Item Number" → Item.ebayItemId, else
  unmatched (attributionStatus stays PENDING for manual match in the UI).
  Custom Label format is `<SKU>|<LOC>` (fleet Standards §6) — split on `|`,
  join on the SKU half, compare the LOC half against Item.locationCode and
  flag mismatches (stale eBay copy) rather than overwriting the DB.
- "Payment Method" is empty in modern exports — ignore. "Variation Details"
  empty in our data — ignore until seen.
- PII: import buyerUsername + ship city/state/country ONLY. Buyer name, email,
  street address, phone are dropped; rawData stores the row minus PII columns;
  the original CSV is archived under FILE_ROOT/imports/ (see §3c).
- Fees are NOT in this report (83% of sales are Promoted → real ad fees
  exist). If splits are computed on net, a Payments-report importer enriches
  Sale.fees later; until then fees stays null and basis = itemPrice.

**Pipeline requirement fed back by this data:** the extension autofill MUST
stamp eBay's Custom Label field with Item.sku on every draft, so all future
sales join deterministically to item → lister → consignment group.

## 3c. Photo storage layout (fleet machine, rational, backup-friendly)

All photos live under ONE root on the designated fleet photo host (the server
box), `FILE_ROOT` env (e.g. `/srv/listflow`). The DB stores paths RELATIVE to
FILE_ROOT — this kills old listflow's three-conflicting-path-roots bug and
makes the whole store relocatable (change one env var, rsync the tree).

```
FILE_ROOT/
├── photos/
│   ├── originals/YYYY/MM/<sha16>.<ext>   # immutable masters, sharded by
│   │                                     # capturedAt (ingest date fallback).
│   │                                     # Never renamed, never rewritten →
│   │                                     # rsync/syncthing sees append-only.
│   ├── derived/<sha16>.opt.jpg|.thumb.jpg # 1500px/400px variants. Fully
│   │                                     # regenerable from originals —
│   │                                     # EXCLUDABLE from backup.
│   └── items/YYYY/<item-slug>/image1.jpg…# human-browsable per-item folders =
│                                         # exactly what eBay drafts reference
│                                         # (hosted URLs). Small optimized
│                                         # copies; deliberate duplication.
├── sales/<accountName>/<orderId>-<line>.jpg  # sale thumbnails from sync
├── imports/                              # archived source reports (CSV etc.)
└── inbox/                                # watcher working area (transient)
```

Backup/sync story: precious set = `photos/originals` + `photos/items` +
`imports` + Postgres dump; `derived` and `inbox` are excludable. Append-only
content-named originals mean incremental backups are trivially cheap and a
re-sync can never corrupt (same name ⇒ same bytes). Fleet workstations do NOT
keep local photo stores — they feed the ingest API; the store lives on the
server host and is synced/backed up from there (fleet.sh coordination applies
to any job touching this tree).

## 3d. eBay draft import (inbound: Seller Hub draft → Item)

Everything else in the draft path is **outbound** — ListFlow owns an Item, the
extension fills an eBay draft from it, and the draft reports progress back
(`by-url`, `PATCH /:id`, `/:id/resume`). A draft typed straight into Seller Hub
therefore has no way into the system: `EbayDraft` rows are only ever created by
linking an existing Item, so those drafts stay invisible. On
`ebay.com/sh/lst/drafts*` they render as `not in swiftlist` and there is nothing
the operator can do about it. This section closes that gap.

**Two distinct operations, one endpoint.** Both are "adopt this eBay draft",
they differ only in whether a matching Item already exists:

- **Link** — operator picks an existing Item; we record the linkage. No Item is
  created. This is what the `not in swiftlist` badge should have offered.
- **Import** — no Item exists yet; create one *from the draft's own fields* and
  link it. The eBay draft is the originating record.

```
POST /api/v1/drafts/import          auth: staffOrMachine
{
  ebayDraftUrl: string,             // required, the /lstng?…draftId=… URL
  ebayDraftId?: string,             // parsed from the URL when eBay exposes it
  ebayAccountId?: string,           // profile-pinned account, as elsewhere
  itemId?: string,                  // present ⇒ LINK; absent ⇒ IMPORT
  scraped?: {                       // ignored when itemId is given
    title?, description?, brand?, condition?, categoryId?,
    price?, quantity?, customLabel?, photoUrls?[]
  }
}
→ 200 { draft, item, created: boolean, linked: boolean }
```

**Rules, and why:**

1. **Idempotent by draft identity.** If an `EbayDraft` already exists for that
   `ebayDraftId` (or `ebayDraftUrl` when eBay withholds the id), return it
   unchanged with `created:false, linked:false`. The drafts *list* page fires
   one lookup per row; a double-click or a re-scan must never mint a second
   Item. `ebayDraftId` is already `@unique` — the collision is a 200, not a 500.
2. **Import never invents a SKU.** `Item.sku` is `@unique` and is the join key
   the Custom Label carries as `<SKU>|<LOC>` (Standards §6). If the draft's
   customLabel parses as that pattern, adopt both halves — the draft came from
   us originally (re-imaged station, lost DB row) and we are re-adopting our own
   SKU. Otherwise leave `sku` null and let the normal SKU sequence assign one at
   draft time. Guessing a SKU from a free-text label risks colliding with a live
   Item.
3. **Imported Items are quarantined, not `READY`.** `status: DRAFT`,
   `stage: DRAFT_STARTED`. An imported Item has no photos in `FILE_ROOT`, no AI
   analysis, no comps — it must not fall into any "ready to list" queue. The
   operator finishes it deliberately.
4. **`photoUrls` are recorded, not fetched.** They are eBay CDN URLs for images
   we do not own the originals of. Storing them in `EbayDraft.currentValues`
   keeps the provenance trail honest; writing them into `photos/originals/` would
   put non-original bytes in the immutable content-named store (§3c) and lie
   about where the file came from. Re-photographing is the correct path.
5. **Scraped values land in `currentValues`, verbatim.** Same field the heartbeat
   already writes, so `buildDeltaPayload` sees an accurate picture of what is on
   the eBay form and only fills genuine gaps. Import must not make the delta
   engine think the form is empty.
6. **`status: OPEN`, `lastSeenAt: now`.** An imported draft is by definition an
   open one — it is sitting in the operator's Seller Hub drafts list.

**Extension surface.** `content-drafts-list.js` currently injects a static
`not in swiftlist` span; its own header comment claims a
`Link to swiftlist Item` button that was never implemented. That span becomes
the affordance: clicking it offers the last-used Item (`lastSwiftlistItemId`,
already in extension storage) or an Item picker, then calls this endpoint. The
row's badge flips green in place. `content-draft.js` — the individual draft page
— gets the same action for the case where the operator is already inside the
draft.

**Boundary check (Standards §3).** This does not move ownership: ListFlow still
owns listing data, and the draft is listing data. Nothing here touches TeamTime,
which consumes only `/api/v1/sales/feed` — sold items. Imported drafts are
invisible to TeamTime until they sell, which is correct.

## 4. Migration & sequencing

1. Scaffold merged repo on a branch in ~/listflow; bring swiftlist packages in
   with `git subtree`/history-preserving copy; unified prisma + fresh
   `migrate dev` baseline (nothing is production).
2. Port server: swiftlist services become the core; graft listflow's sales
   sync (GetSellerTransactions/CSV), agentSync (TeamTime roster), templates,
   Browse/OAuth routes. Auth middleware: JWT everywhere + machine-key
   middleware; dev login stub until phase 3.
3. Data migration scripts: comptool SoldComp/Search (real data) → new tables;
   swiftlist photos/items if wanted. Old listflow DB: abandoned.
4. Watcher: point at new endpoint; package as installable service
   (systemd unit + install script) with per-machine key provisioning.
5. Extension: swiftlist base + comptool content scripts; SW-routed API calls;
   storage namespacing; remove hot-patch (`new Function`) paths.
6. PWAs (mobile-upload, field) scaffolded but can trail the core merge.

Definition of done for phase 1: SD card in fleet workstation → photos in pool
with provenance → group (assisted) → AI identify → comps linked → hosted URLs
→ extension fills a draft on the right account → submit detected → item
LISTED. Sales sync attributes to Item + lister. TeamTime untouched.

## 5. Open questions

- comptool public data API: confirmed dead? (Design assumes yes — removed.)
- Sales sync per account: API OAuth per account vs Seller Hub CSV import as
  the fallback — both carried from listflow; which is primary day-to-day?
- Naming: repo/product stays "listflow"? (Design assumes yes.)
```
