# Phase 2 — Inventory audit, shelf codes, and cross-account relist

Status: **BUILT** (2.0–2.4) · Drafted 2026-09-14 · Built 2026-09-14
Branch `feat/inventory-audit-locations`. Extension packed as v1.1.0.
Deployed to shinobi prod: **NOT YET** — see §7.
Companion to `PHASE1-DESIGN.md` · Fleet standards `~/.claude-fleet/STANDARDS.md` §6

## 1. The problem

Inventory was historically split across two eBay accounts:

| Account            | Was            | Now |
|--------------------|----------------|-----|
| `yakimanet`        | home eBay room | inventory physically moved to YF |
| `yakimanetworking` | YF eBay room   | destination |

Everything has moved to the Yakima Finds location and been put on a new shelving
system. We need an **inventory audit** that ends with every item's physical
Row/Shelf recorded in the DB and stamped into the live eBay listing's Custom
Label as `<SKU>|<LOC>` (Standards §6).

The owner's proposed mechanism: end the listing on one account, relist it on the
other with the shelf code, using a Chrome extension that captures a listing and
replays it into a new one.

## 1a. Hard constraint — extension only, no eBay API (decided 2026-09-14)

**Every read and every write in this phase goes through the Chrome extension
driving the eBay web UI. No eBay API, for anything.** This goes further than
Standards §6, which permits API/OAuth for read paths (sales sync, Browse); for
this project those are off the table too.

The decision is effectively free today: neither `EbayAccount` row carries a
`refreshToken`, so `ebayClient.service.ts` and `ebayOauth.routes.ts` are dormant
and nothing in the current suite depends on them. They stay in the tree,
untouched and unused, for the separate sales-sync question. This phase adds
nothing to them.

**And no crawling.** The extension never navigates on its own. It acts only on
the page the operator has already opened, one listing at a time, when the
operator clicks. There is no background sweep, no queue of tabs, no automated
paging through Active listings.

The extension's whole world is therefore two things:

1. **the eBay account this Chrome profile is logged into**, and
2. **the listings saved on the listflow server.**

It knows nothing about the other account, the other profile, or any listing it
has not been shown.

Consequences, all of them designed for below:

* Custom Label revision (Flow 1) becomes real work — see §4.1;
* ending a listing is the operator clicking eBay's own End, extension-assisted;
* "is it really live / really ended?" is answered by what was last scraped, not
  by query;
* tracking the audit itself is **out of scope** (§4.2).

## 2. What already exists (do not rebuild)

Roughly 70% of the capture/replay tool is already in `listflow`.

### Capture half — `packages/extension/content-detail.js`
Runs on `ebay.com/itm/*`. `scrape()` already pulls title, price, category
breadcrumb, condition, brand, model, **all item specifics**, description, image
URLs, seller. Injects "↑ Import details to listing", which lets you pick a
target Item and approve each field before saving.

### Server intake — `POST /api/v1/items/:id/import-from-active`
(`packages/server/src/routes/items.routes.ts:285`). Merges approved fields into
an Item and — importantly — **downloads every approved image, re-hosts it**
through the same sharp pipeline as ingest, with sha256 dedup and perceptual
hashing (`downloadAndAttachImage`). Photos survive the source listing's death.

### Replay half — `packages/extension/content-listing.js`
`fillForm(payload)` writes title, condition, category, item specifics,
description, pricing, shipping, **and `customLabel`** into eBay's live listing
form, using the Standards §6 selector ladder (`data-testid → aria-label → name`)
with per-field try/catch and telemetry on failure.

### Payload builder — `services/draft.service.ts`
`buildAutofillPayload()` already emits
`customLabel: composeCustomLabel(await ensureItemSku(item), item.locationCode)`
→ exactly the `YF001234|R3-S2` the audit needs. SKU allocation is a Postgres
sequence (`services/sku.service.ts`), concurrency-safe.

### Draft linkage — `content-draft.js` + `routes/drafts.routes.ts`
Link a live eBay draft to an Item, fill-missing vs force-overwrite, 30 s
heartbeat, and auto-flip to `LISTED` + capture the new `ebayItemId` when the
page redirects to `/itm/`.

**Conclusion: the tool the owner described is mostly built. This phase wires it
into an audit workflow and closes four real gaps.**

## 3. The four gaps

### Gap A — `Item.locationCode` is dead weight
It is declared in `prisma/schema.prisma:136`, it is consumed by
`composeCustomLabel()`, and **nothing in the entire codebase ever writes it.**
There is no location taxonomy, no assignment UI, no validation, no move history.
This is the actual core of the audit and it is 100% unbuilt.

### Gap B — capture cannot create
`content-detail.js` can only import *into an Item that already exists*
(`/extension/unlisted-items` picker). For an audit of hundreds of live listings
there is no "capture this listing as a new Item," and no bulk sweep over the
seller's Active-listings pages. Today the `Item` table on tinybox holds 2 rows.

### Gap C — the scraper loses the two things a relist can't survive without

1. **Images are thumbnails.** `scrape()` collects
   `img.ux-image-carousel-item` `.src`, which on a modern eBay item page is the
   `s-l140` / `s-l500` thumbnail (and lazy-loaded ones may be a 1×1
   placeholder). The full-resolution URL is on `data-zoom-src`, or is obtained
   by rewriting `s-l\d+` → `s-l1600`. **Relisting from a 140 px thumbnail is a
   ruined listing**, and once the source listing is ended the original is gone.
2. **Descriptions come back empty.** `scrape()` reads
   `iframe#desc_ifr.contentDocument` inside a `try {} catch {}`. eBay serves
   that iframe from `vi.vipr.ebaydesc.com`, so the access throws cross-origin
   and is silently swallowed — `description` is `''`. The iframe `src` must be
   fetched from the service worker (needs `https://*.ebaydesc.com/*` in
   `host_permissions`) or server-side.

Both must be fixed **before** any listing is ended. Ending a listing is the
point of no return for its source data.

### Gap D — no ending, no relist worklist, no reconciliation
Nothing tracks source account vs target account, nothing records "ended",
nothing produces the audit report, and there is no mechanism to end a listing.
Note `services/ebayClient.service.ts` requests **read-only** scopes
(`sell.inventory.readonly`, `sell.account.readonly`, `sell.fulfillment*`), and
neither `EbayAccount` row has a `refreshToken` — no eBay account is OAuth
connected at all today.

## 4. Two flows, both built (decided 2026-09-14)

Ending and relisting discards the eBay item ID, watchers, view counts, Best
Match seniority, Q&A and promoted-listing history, and consumes an insertion
slot. It is *mechanically* necessary only when a listing changes accounts.

The owner's call is to build **both** flows, because the relist has a second
purpose beyond the account move: **a new listing gets a fresh start in search
and motivates sales on stale inventory.** That is a legitimate reason to pay the
cost deliberately, so the tool must support it as a choice rather than treating
end-and-relist as pure overhead.

* **Flow 1 — Revise in place.** Adding a shelf location to a listing that is
  staying where it is, is just a listing revision: Custom Label is
  seller-private, and revising it does not restart the listing. Cheap, safe,
  bulk-able. This is the default for anything already on the destination
  account that is selling fine.
* **Flow 2 — Capture → end → relist.** Required for every item moving from
  `yakimanet` to `yakimanetworking`, and available *by choice* for stale
  inventory on the destination account that would benefit from being new again.

Because Flow 2 is opt-in rather than forced, the audit UI needs a per-item
decision column (`revise` | `relist`), defaulted by rule (cross-account ⇒
relist) and overridable by the operator — e.g. bulk-selecting everything on a
shelf that has sat unsold since a given date.

### 4.1 The on-page bar — one listing, operator-initiated

All capture and all revision happen through a single bar the extension injects
**at the top of the page** on `ebay.com/itm/*` (replacing today's floating
bottom-right buttons in `content-detail.js`). Nothing fires automatically; every
action is a click.

The bar is account-aware, because the profile knows the account it is pinned to
(§5.2) and the item page names its seller:

**This listing belongs to the account I'm logged into:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ listflow · YF001234 · R3-S2 · saved 2026-09-14    [✎ Revise listing] │
│                                                    [📋 Copy listing]  │
└──────────────────────────────────────────────────────────────────────┘
```

* **✎ Revise listing** — Flow 1, the common case. Opens eBay's own revise form
  for this item and writes Custom Label `<SKU>|<LOC>`. If the item has no
  location yet, the bar asks for one first (type or scan) and saves it to the
  DB before revising, so the DB stays the authority (Standards §6).
* **📋 Copy listing** — Flow 2's first step. Full scrape → saved to the server
  as an Item, photos re-hosted, raw payload stored.

**Someone else's listing, or an account this profile isn't logged into:**
only **📋 Copy listing** is offered. Revise is impossible and the bar says so
rather than failing at the form.

**Already saved:** the bar shows the SKU, the shelf code and when it was
captured, so landing on a listing twice is immediately obvious.

This makes the shelf-code audit a standing-at-the-shelf activity: pull up the
listing, click Revise, scan the shelf barcode, done — one page, no separate app.
It is also why Phase 2.3's web UI shrinks (see §6): assignment happens here, and
the web app is left holding the *report*, not the primary data-entry flow.

### 4.2 Out of scope — coverage and audit trail

**The extension does not track the audit.** No coverage badging of the Active
listings page, no "what's left to do" counter, no reconciliation of DB against
live listings, no move history. The extension's entire job is: copy the listing
in front of you, revise the listing in front of you, and repopulate a new
listing from something already saved.

Consequence, stated plainly so it is not a surprise later: **nothing will tell
you which listings you have not done yet.** Coverage is the operator's to track,
outside this tool. That is a deliberate trade for a much smaller, more reliable
extension.

Left out, and cheap to add later if it is ever wanted:

* `ItemLocationEvent` (who moved what, when) — one table, written on assignment.
  Not built. `Item.locationCode` holds the current value only.
* DB-vs-live Custom Label reconciliation.
* Any notion of "the audit is N% complete".

## 5. The two-profile handoff (owner's intended workflow)

> Scrape a listing in the Chrome profile logged into account A, switch to the
> profile logged into account B, start a new listing, and have the extension
> walk you through rebuilding it from the scrape.

This is already the shape Standards §6 mandates — *"multi-account = one Chrome
profile per eBay account, each profile's extension pinned to (TeamTime lister,
eBay account)"* — so no redesign is needed. Three things follow from it.

### 5.1 The server is the handoff, not the extension

The two profiles are separate Chrome instances with separate extension installs
and separate `chrome.storage`. **Nothing can be handed between them in the
browser.** The `Item` row on the listflow server is the handoff object:

```
profile A (yakimanet)              shinobi :3005                profile B (yakimanetworking)
  scrape /itm/123  ──POST /capture/listing──▶  Item{sku, capturedPayload,
                                                    sourceEbayAccountId:A,
                                                    photos re-hosted}
                                                       │
                                     GET /relist/queue ◀── "what's waiting for me?"
                                                       └──▶ guided rebuild on /sl/sell
```

Because the server already re-hosts every captured photo through the sharp
pipeline, profile B never needs to reach back to profile A or to the original
eBay page — which is essential, since by then the source listing may be ended.

### 5.2 The profile knows which side it is — for free

`background.js` already keeps `pinnedAccountId` / `pinnedAccountName`, and
`POST /items/:id/drafts` already resolves `accountHint` to an `EbayAccount` row.
So each profile can be account-aware with no new plumbing:

* pinned account **is** the item's `sourceEbayAccountId` → show **Capture**.
* pinned account **is not** → show **Relist queue** and the guided rebuild.

That means one extension build, no per-profile configuration beyond the pin, and
no way to accidentally relist into the account you are trying to empty.

### 5.3 BLOCKER — `storage.sync` will clobber the pin

`apiKey`, `pinnedAccountId` and `pinnedAccountName` are currently written to
**`chrome.storage.sync`** (`background.js:25`, `popup.js:70`, `options.js:15`).
`storage.sync` is shared across every Chrome profile signed into the *same
Google account*. If both eBay profiles are signed into one Google account — the
normal thing to do on a shop workstation — then:

* the two profiles **overwrite each other's eBay account pin**, so source and
  target flip at random, and
* they **share one machine API key**, so the server cannot tell the profiles
  apart at all.

Result: drafts attributed to the wrong eBay account, and captures that think
they came from the account they are being relisted into. Silent and
data-corrupting.

**Fix (small, do it in the first block):** move `apiKey`, `pinnedAccountId` and
`pinnedAccountName` to `chrome.storage.local`. `machineId` is already correctly
in `storage.local` (`background.js:19`). `baseUrl` / `webUrl` may stay in
`sync` — they are identical on both profiles and syncing them is convenient.

### 5.4 The guided rebuild ("walk me through")

Today `content-listing.js` does a single blind `fillForm()` fired by
`?swiftlistItemId=`. The owner wants a step-through instead, and it is the
better design for a different reason: eBay's Sell flow is a multi-step form
(category → specifics → photos → price/format → shipping), and a wizard that
fills **one step at a time** turns the brittle-selector problem from silent data
loss into a visible, recoverable moment.

Docked side panel on `/sl/sell*` and `/lstng*`, driven by the captured payload:

* one card per step, showing **the source listing's value** beside the field;
* "Fill this step" writes just that step via the existing `fillForm()` internals;
* a per-field ✎ so the operator can edit before filling (title tweaks, price
  changes for the new account);
* if a selector misses, the source value is on screen to copy — the operator is
  never blocked, and `telemetry()` still reports the miss;
* Custom Label is pre-filled `<SKU>|<LOC>` and **cannot be skipped** — this is
  the whole point of the audit (Standards §6);
* progress persists on the `EbayDraft` row, so an interrupted rebuild resumes
  (the existing heartbeat + `lastFilledFields` machinery already does this).

### 5.5 Photos — the one genuinely hard step

Photos cannot be filled by writing a value. The workable technique, in order:

1. **Synthesize a file drop.** The SW fetches the re-hosted photo blobs from
   listflow (it already has host permission), builds
   `new DataTransfer()` → `dt.items.add(new File([blob], name))` →
   `input.files = dt.files` → dispatch `change`. This works on most uploaders
   including eBay's, and is the only fully-automatic path.
2. **Fallback:** the panel renders the re-hosted photos for manual drag into the
   uploader.
3. **Last resort:** "download all" so they can be added from disk.

Build (1), keep (2) visible in the same panel so a failure costs seconds rather
than derailing the relist.

## 6. Build plan

### Phase 2.0 — Location taxonomy (blocks everything)
* Prisma: `StorageLocation { id, code @unique, zone, row, shelf, bin?, label,
  active, notes }`; add `Item.locationId` relation alongside the existing
  `locationCode` string (the string stays — it is what the Custom Label is built
  from and must tolerate codes for locations later retired).
* Routes: `/api/v1/locations` CRUD, `POST /api/v1/items/:id/location`.
* Seed from the real shelving. **Decided 2026-09-14: `R<row>-S<shelf>`**
  (e.g. `R3-S2`) — two levels, matching Standards §6. No bin level. Validate
  codes against `/^R\d+-S\d+$/` on write so a typo can never reach a Custom
  Label.
* Reuse: the fleet already prints Zebra labels (`yakima-label` /
  `teamtime-label-app`, installers on hairydel `~/ttlapp/`). A Code-128 barcode
  per shelf code turns assignment into a scan instead of typing — worth doing
  on day one, it is the difference between a 2-day audit and a 2-week one.

### Phase 2.1 — Fix the scraper (Gap C) + the profile blocker (§5.3)
* **Move `apiKey` / `pinnedAccount*` from `storage.sync` to `storage.local`**
  before either profile is configured — see §5.3. Cheap now, corrupting later.
* Full-resolution image URLs (`data-zoom-src`, `s-l\d+` → `s-l1600`), verified
  by asserting downloaded pixel dimensions server-side.
* Description capture via the SW fetching the `desc_ifr` `src`; add
  `https://*.ebaydesc.com/*` to `host_permissions`.
* Store the whole scrape verbatim as `Item.capturedPayload Json`. Lossless raw
  snapshot means a parsing miss can be re-parsed later **without revisiting a
  page that may no longer exist.** This is the single most important safety
  property in the whole plan.

### Phase 2.2 — Capture (Gap B)
* `POST /api/v1/capture/listing` — creates an Item from a scrape: allocates SKU,
  records `sourceEbayItemId` / `sourceEbayAccountId` / `capturedAt`, re-hosts
  photos, stores the raw payload. Idempotent on `sourceEbayItemId`.
* `content-detail.js`: replace the floating bottom-right buttons with the
  account-aware **top bar** of §4.1 — Copy listing, Revise listing, and the
  saved-state readout. No bulk capture, no sweep, no automated navigation.
* Inline location entry in the bar (type or scan) writing through
  `POST /items/:id/location`, so the shelf code is set where the operator is
  standing.
* No Active-listings content script at all (§4.2).

### Phase 2.3 — Minimal web views (`packages/app`)
Assignment happens in the on-page bar (§4.1), so the web app stays small:
* a saved-listings list — SKU, title, source account, shelf code, captured-at —
  with search and a filter for "no location yet";
* a bulk-move correction path ("everything on R3-S2 is now on R5-S1");
* location CRUD.

No coverage view, no reconciliation report (§4.2).

### Phase 2.4 — Relist pipeline (Gap D)
Ordering is deliberate: **capture → completeness gate → end → relist.**
* Completeness gate, server-side, reusing `util/completeness.ts` and the
  existing `Item.completeness` field: refuse to mark an item end-ready unless
  title, category, specifics, a non-empty description, and ≥1 photo at
  full resolution are all present locally.
* "End on source" is **operator-driven, extension-assisted** — the extension
  marks which rows on the Active-listings page are cleared to end (capture
  complete, completeness gate passed) and the operator uses eBay's own bulk
  End. The extension never ends a listing by itself.
* Relist: the **guided rebuild panel** of §5.4 on the target account's profile,
  plus `GET /api/v1/relist/queue` filtered by the profile's pinned account.
  Photo injection per §5.5. `content-listing.js`'s field writers are reused as
  the wizard's internals rather than being fired blind.
* `EbayDraft` → `SUBMITTED` already flips the Item to `LISTED` and records the
  new `ebayItemId`; add `relistedFromEbayItemId` so the audit trail closes.

## 7. Hosting — DECIDED: stays on shinobi

The owner initially asked for the backend on tinybox; on review of the
2026-08-14 move (prod role → shinobi, 31 GB RAM / 8 cores, `pm2-yaknet` under
systemd) the decision is to **keep production on shinobi** and build straight
onto it. No migration, no nginx repoint, no crx move.

* Prod: shinobi `10.42.0.12:3005`, DB `listflow` / role `ebaysuite` on
  **Postgres 17 port 5433** (not 5432 — 5432 is a dev docker container on that
  box and will look like a wrong password). FILE_ROOT
  `/home/yaknet/listflow-files`. Public via Robug-Hosting-box nginx →
  `listflow.robug.com`, `list.robug.com`.
* tinybox stays the dev box (`:3005`, local PG 5432, 2026-08-13 snapshot).
  Develop here, deploy to shinobi.
* Accepted risk, unchanged: shinobi also carries the `/dev/shm` FD leak and the
  cam33 preservation duty.

Two items are still required regardless of host:

* **`host_permissions` fix.** The manifest allows `http://localhost:3005/*`
  plus the public names. Listing work happens on the eBay-room workstations,
  which are not the server — the public `https://listflow.robug.com` name
  already covers them, but add the Nebula address
  (`http://10.42.0.12:3005/*`) as a fallback for when the hosting box or its
  nginx is down. Do **not** add a bare LAN IP that would break off-LAN.
* **Backups.** Once the DB is the authority for where every physical item
  lives (Standards §6 says it is), losing it loses the audit. Confirm shinobi
  has a nightly `pg_dump` off-box; tinybox has no crontab for `ebay` at all.

## 8. Decisions taken & questions still open

Decided 2026-09-14:
0. **No eBay API — extension only**, reads as well as writes, **and no
   crawling**: one listing at a time, on the page the operator opened, on a
   click (§1a, §4.1).
0b. **Audit trail, coverage tracking and reconciliation are out of scope**
   (§4.2). The extension copies, revises and repopulates — nothing more.
1. **Host:** production stays on **shinobi**; tinybox remains the dev box.
2. **Flows:** build **both** — revise-in-place for shelf codes, and
   capture/end/relist for account moves *and* for deliberately refreshing stale
   listings.
3. **Shelf scheme:** `R<row>-S<shelf>`, e.g. `R3-S2`. No bin level.

Still open:
4. **Scale:** roughly how many active listings on each account? Does not change
   the design any more — only how long the audit takes in operator-hours.
5. *(resolved — coverage and audit trail are out of scope, §4.2.)*
6. **Staleness rule:** what makes a destination-account listing a relist
   candidate — days unsold, view count, watchers? Needed to default the
   `revise` | `relist` column instead of deciding item by item.
