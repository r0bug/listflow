# eBay Seller Hub Reports — CSV Listing Reference
**For use with ListFlow / Yakima Finds batch listing workflow**
*Source: Official eBay Inventory Onboarding Guide (ir.ebaystatic.com) + confirmed live session data*
*Last validated: March 2026*

---

## Table of Contents
1. [How the System Works](#how-the-system-works)
2. [Universal Required Fields](#universal-required-fields)
3. [Shipping Fields](#shipping-fields)
4. [Return Policy Fields](#return-policy-fields)
5. [Optional & Advanced Fields](#optional--advanced-fields)
6. [Item Specifics (C: columns)](#item-specifics-c-columns)
7. [Variations](#variations)
8. [International Shipping](#international-shipping)
9. [Calculated Shipping](#calculated-shipping)
10. [eBay Motors P&A — Special Rules](#ebay-motors-pa--special-rules)
11. [Category Reference — Top Level](#category-reference--top-level)
12. [Category Reference — Yakima Finds Working Set](#category-reference--yakima-finds-working-set)
13. [Category-Specific Item Specifics](#category-specific-item-specifics)
14. [ConditionID Values](#conditionid-values)
15. [Shipping Service Codes](#shipping-service-codes)
16. [Workflow Rules for ListFlow](#workflow-rules-for-listflow)
17. [Common Errors & Fixes](#common-errors--fixes)

---

## How the System Works

eBay's bulk listing tool is now called **Seller Hub Reports** (legacy name: File Exchange). Access it at:
**Seller Hub → Reports → Upload**

- Files are CSV or XLSX format
- Each row = one listing (or one variation child row)
- Column headers define field names
- `Action` must be the first column
- The **5-category limit** in the template downloader is a UI restriction only — the CSV format itself is universal across all standard categories
- eBay Motors P&A categories use a completely different template and SiteID (see section below)
- Templates may take several hours to process after upload
- Always check the upload results report for errors — eBay sends a confirmation email

**Template Download Path:**
Seller Hub → Reports → Upload → Download Template → Select "Listings" → Category Template → select up to 5 categories → Download

> **For new categories not in your working set:** Always download the official template for that category to confirm required `C:` item specific columns before building the CSV.

---

## Universal Required Fields

These fields are required for **every** standard listing regardless of category.

| Column Header | Required | Description | Accepted Values |
|---|---|---|---|
| `Action` | **YES** | Operation to perform | `Add`, `Revise`, `Relist`, `End` |
| `Category ID` | **YES** | eBay numeric category ID (leaf only) | Integer, e.g. `616` |
| `Title` | **YES** | Listing title | Text, max 80 chars |
| `P:UPC` | **YES** (US site) | Universal Product Code | 12-digit integer, or `Does not apply` |
| `Start price` | **YES** | Buy It Now price (fixed) or auction start | Numeric, e.g. `9.99` — no $ symbol |
| `Quantity` | **YES** | Number of items available | Integer, e.g. `1` |
| `Item photo URL` | **YES** | Direct image URL(s) | https:// URL ending in .jpg/.png; multiple separated by pipe `\|` |
| `Condition ID` | **YES** | Numeric condition value | See ConditionID table below |
| `Description` | **YES** | Item description | Plain text or simple HTML; max ~500,000 chars |
| `Format` | **YES** | Listing type | `FixedPrice` or `Auction` |
| `Duration` | **YES** | Listing duration | `GTC` (fixed price) or `1`,`3`,`5`,`7`,`10` (auction days) |
| `Location` | **YES*** | City and state of item | e.g. `Yakima, WA` — *omit if using PostalCode* |

**Alternative to Location:**

| Column Header | Required | Description | Accepted Values |
|---|---|---|---|
| `PostalCode` | Optional | ZIP code (replaces Location) | 5-digit ZIP, e.g. `98901` |

> **Yakima Finds default:** Use `PostalCode=98901`. Do not use both `Location` and `PostalCode` in the same row.

**Optional identity fields:**

| Column Header | Required | Description | Accepted Values |
|---|---|---|---|
| `Custom label (SKU)` | No | Internal SKU / inventory ID | Alphanumeric string |
| `P:ISBN` | Required in book categories | International Standard Book Number | 10 or 13 digits |
| `P:EAN` | No (US site) | European Article Number | 13 digits |
| `P:EPID` | No | eBay Product ID (catalog) | 13 digits — mainly Motors |
| `Buy It Now price` | No | BIN price on auction listings only | Numeric |
| `Subtitle` | No | Second line below title (extra fee) | Text, max 55 chars |

---

## Shipping Fields

### Option A — Business Policies (recommended, simpler)

If opted into eBay Business Policies, replace all individual shipping fields with these three:

| Column Header | Required | Description |
|---|---|---|
| `Shipping profile name` | **YES** | Exact name of your shipping policy (case-sensitive) |
| `Return profile name` | **YES** | Exact name of your return policy (case-sensitive) |
| `Payment profile name` | **YES** | Exact name of your payment policy (case-sensitive) |

> Policy names are **case-sensitive** and must match exactly as they appear in My eBay Business Policies.

---

### Option B — Manual Shipping Fields

Use these if NOT opted into Business Policies.

| Column Header | Required | Description | Accepted Values |
|---|---|---|---|
| `Shipping service 1 option` | **YES** | Primary shipping carrier/service | See Shipping Service Codes |
| `Shipping service 1 cost` | **YES** | Cost to ship | Numeric, e.g. `0.00` for free |
| `Shipping service 1 priority` | **YES** (if >1 service) | Display order | `1` |
| `Shipping service 2 option` | No | Second shipping option | Valid service code |
| `Shipping service 2 cost` | No | Cost for second option | Numeric |
| `Shipping service 2 priority` | No | Display order | `2` |
| `Shipping service 3 option` | No | Third option (add column manually) | Valid service code |
| `Shipping service 3 cost` | No | Cost for third option | Numeric |
| `Shipping service 3 priority` | No | Display order | `3` |
| `Max dispatch time` | **YES** | Handling time in business days | `1`,`2`,`3`,`4`,`5`,`10`,`15`,`20`,`30` |

> Up to 4 domestic shipping services supported. Columns 3 and 4 must be added manually.

**Yakima Finds standard (media mail, free shipping, baked into price):**
```
Shipping service 1 option = USPSMedia
Shipping service 1 cost = 0.00
Max dispatch time = 3
```

> **CRITICAL:** Do NOT use `ShippingType=Free`. Use `ShippingType=Flat` with `Cost=0` for free shipping. `ShippingType=Free` causes upload errors in File Exchange.

---

## Return Policy Fields

Only needed when NOT using Business Policies.

| Column Header | Required | Description | Accepted Values |
|---|---|---|---|
| `Returns accepted option` | **YES** | Accept returns or not | `ReturnsAccepted` or `ReturnsNotAccepted` |
| `Returns within option` | **YES** (if accepting) | Return window | `Days_14`, `Days_30`, `Days_60` |
| `Refund option` | **YES** (if accepting) | Refund method | `MoneyBack`, `MoneyBackOrExchange`, `MoneyBackOrReplacement` |
| `Return shipping cost paid by` | **YES** (if accepting) | Who pays return shipping | `Buyer` or `Seller` |

---

## Optional & Advanced Fields

| Column Header | Description | Accepted Values |
|---|---|---|
| `ShippingDiscountProfileID` | Discount profile for multi-item purchases across listings | Numeric profile ID |
| `Shipping service 1 additional cost` | Reduced cost for additional quantity in same listing | Numeric |
| `DomesticShippingRateTableID` | Apply a rate table (regional pricing) | 10-digit numeric ID from account settings |
| `GlobalShipping` | Opt item into Global Shipping Program | `1` |
| `WeightMajor` | Shipping weight (whole lbs) — required for Global Shipping / Calculated | Integer |
| `WeightMinor` | Shipping weight (ounces) — required for Global Shipping / Calculated | Integer |
| `WeightUnit` | Unit of weight measure | `lb` |
| `PackageLength` | Package length in inches | Integer |
| `PackageDepth` | Package depth in inches | Integer |
| `PackageWidth` | Package width in inches | Integer |
| `PackageType` | Package type | `PackageThickEnvelope`, `Letter`, `LargeEnvelope`, `USPSLargePack`, `None` |
| `OriginatingPostalCode` | ZIP for calculated shipping origin | 5 or 9 digit ZIP |
| `PackagingHandlingCosts` | Handling fee for calculated shipping | Numeric, e.g. `0.99` |
| `Immediate pay required` | Require payment before closing | `1` |
| `Payment instructions` | Buyer payment notes | Text, max 500 chars |
| `StoreCategory` | Store category number (not eBay category) | Numeric store cat ID |
| `BoldTitle` | Bold title upgrade (extra fee) | `1` (true) or `0` (false) |
| `GalleryType` | Gallery image upgrade | `Gallery` (standard, free) |

---

## Item Specifics (C: columns)

Item specifics are category-defined attributes. Prefix the column header with `C:` followed by the exact attribute name.

**Format:**
```
C:Brand | C:Era | C:Type | C:Publication Name | C:Country/Region of Manufacture
```

**Rules:**
- Column names are case-sensitive — must match eBay's exact naming for the category
- Required item specifics that are missing will cause listing failure or suppression
- Use `Does not apply` when a required specific doesn't apply to a particular item
- To find exact required item specifics for any category: download the official template for that category from Seller Hub — required fields are highlighted in red

**How to add custom/non-standard specifics:**
Prefix with `C:` and use the exact eBay-recognized name. Unknown names are silently ignored by eBay.

---

## Variations

Used when selling the same item in multiple sizes, colors, etc. Uses a parent-child row structure.

**Parent row:** Contains all shared listing data (title, description, shipping, category, etc.). Leave `Relationship`, `Relationship details`, `P:UPC`, `Quantity`, `Start price` blank.

**Child rows:** Contain variation-specific data only.

| Field | Parent Row | Child Row |
|---|---|---|
| `Relationship` | *leave blank* | `Variation` |
| `Relationship details` | All traits + values: `Color=Blue;Red\|Size=M;L` | One combo: `Color=Blue\|Size=M` |
| `P:UPC` | *leave blank* | Barcode or `Does not apply` |
| `Quantity` | *leave blank* | Integer per variation |
| `Start price` | *leave blank* | Price per variation |
| `Item photo URL` | Shared gallery image | `Color=https://url.jpg` (trait=URL format) |
| `Custom label (SKU)` | Optional parent SKU | Optional variation SKU (must differ from parent) |

> **IMPORTANT:** You cannot add variations to an existing non-variation listing via revision. End the listing and create a new one.

> Variation support varies by category. Check the category template.

---

## International Shipping

Add these columns manually to the template if needed. Up to 4 international shipping options.

| Column Header | Description | Accepted Values |
|---|---|---|
| `IntlShippingService-1:Option` | International carrier/service | Valid intl service code |
| `IntlShippingService-1:Cost` | International shipping cost | Numeric |
| `IntlShippingService-1:AdditionalCost` | Additional item cost | Numeric |
| `IntlShippingService-1:Locations` | Destination regions | `Worldwide`, `Americas`, `Europe`, `Asia`, `AU`, `CA`, `DE`, `GB`, `JP`, `MX`, `None` — multiple separated by `\|` |
| `IntlShippingService-1:Priority` | Display order | `1` |
| *(repeat with -2, -3, -4 for additional services)* | | |

---

## Calculated Shipping

Use when you want eBay to calculate shipping cost based on buyer location.

Add `ShippingType=Calculated` plus these required fields:

| Column Header | Required | Description | Values |
|---|---|---|---|
| `ShippingType` | **YES** | Specifies calculated shipping | `Calculated` |
| `Shipping service 1 option` | **YES** | Carrier/service | Valid service code |
| `OriginatingPostalCode` | **YES** | Item location ZIP | e.g. `98901` |
| `PackageType` | **YES** | Package type | See PackageType values above |
| `WeightMajor` | **YES** | Pounds | Integer |
| `WeightMinor` | **YES** | Ounces | Integer |
| `WeightUnit` | **YES** | Unit | `lb` |
| `PackageLength` | **YES** | Length in inches | Integer |
| `PackageDepth` | **YES** | Depth in inches | Integer |
| `PackageWidth` | **YES** | Width in inches | Integer |
| `PackagingHandlingCosts` | No | Handling fee | Numeric |

> Do not enter `Shipping service 1 cost` when using calculated shipping.

---

## eBay Motors P&A — Special Rules

**Motors Parts & Accessories categories require a completely different setup.**

### Header Row Difference

Standard CSV header:
```
SiteID=US|Country=US|Currency=USD|Version=999|CC=UTF-8
```

Motors P&A CSV header:
```
SiteID=eBayMotors|Country=US|Currency=USD|Version=999|CC=UTF-8
```

> Using `SiteID=US` or `SiteID=100` for Motors categories will cause upload failure.

### Template Rule

**ALWAYS download the official template from Seller Hub → Reports → Get Template for any Motors P&A category before building the CSV.** Never guess column names or order for Motors categories. The template's exact header row, column order, Version number, and field names must be used verbatim.

### Confirmed Working Motors P&A Categories

| Category ID | Category Name | Notes |
|---|---|---|
| `35563` | Fuel Tanks | |
| `177076` | Vintage Helmets | |
| `183528` | Saddlebags & Panniers | |
| `35597` | Horns | |
| `21916884` | Window Deflectors / Ventvisors | Correct leaf — parent 262153 is NOT a leaf |

### Motors Fitment / Compatibility

For parts with vehicle compatibility lists:
- Use `Relationship=Compatibility` on child rows
- Or use `CopyCarCompatibility` to copy fitment from an existing listing by Item ID
- `CarMake`, `CarModel`, `CarYear`, `CarTrim`, `CarEngine` columns for manual entry

---

## Category Reference — Top Level

eBay US top-level categories (L1). You can only list in **leaf categories** — navigate subcategories until no further subdivision exists.

| Category ID | Category Name |
|---|---|
| `20081` | Antiques |
| `550` | Art |
| `2984` | Baby |
| `267` | Books & Magazines |
| `12576` | Business & Industrial |
| `625` | Cameras & Photo |
| `15032` | Cell Phones & Accessories |
| `11450` | Clothing, Shoes & Accessories |
| `11116` | Coins & Paper Money |
| `1` | Collectibles |
| `58058` | Computers/Tablets & Networking |
| `14339` | Consumer Electronics |
| `237` | Dolls & Bears |
| `11232` | DVDs & Movies |
| `281` | Electronics |
| `26395` | Gift Cards & Coupons |
| `11450` | Health & Beauty |
| `11700` | Home & Garden |
| `11450` | Jewelry & Watches |
| `11233` | Music |
| `619` | Musical Instruments & Gear |
| `870` | Pet Supplies |
| `870` | Pottery & Glass |
| `64482` | Real Estate |
| `888` | Specialty Services |
| `382` | Sporting Goods |
| `1305` | Sports Mem, Cards & Fan Shop |
| `220` | Stamps |
| `171228` | Tickets & Experiences |
| `316` | Toys & Hobbies |
| `260` | Travel |
| `99` | Video Games & Consoles |
| `293` | Everything Else |

**eBay Motors (separate SiteID):**

| Category ID | Category Name |
|---|---|
| `6000` | eBay Motors (top level) |
| `10063` | Parts & Accessories |

> For the complete leaf category tree, use: **https://www.isoldwhat.com/getcats/** (updated nightly from eBay API)
> Or use eBay's Trading API `GetCategories` call for programmatic access.

---

## Category Reference — Yakima Finds Working Set

All confirmed live categories used in Yakima Finds eBay batch listing sessions.

### Comics & Publications

| Category ID | Category Name | Required C: Specifics |
|---|---|---|
| `616` | Comics — US/Canada | `C:Era`, `C:Language`, `C:Type`, `C:Publication Name`, `C:Country/Region of Manufacture` |
| `617` | Comics — Non-US/International | `C:Movie/TV Title` (DVDs), varies |
| `2229` | Magazines | `C:Subject`, `C:Year` |
| `29223` | Pulp Magazines | `C:Genre`, `C:Year` |
| `14290` | Comic Books (general) | Varies |

### Books

| Category ID | Category Name | Notes |
|---|---|---|
| `267` | Books (top level — not a leaf) | |
| `171228` | Fiction & Literature | |
| `11232` | Nonfiction | |
| `378` | Children's Books | Requires P:ISBN |
| `2228` | Catalogs | Sears/Montgomery Ward fall here |
| `1` | Magazine Back Issues | |

### Breweriana / Beer

| Category ID | Category Name | Notes |
|---|---|---|
| `562` | Breweriana, Beer (top level) | |
| `3147` | Beer Tap Handles | Confirmed working |
| `13603` | Beer Signs | |
| `13604` | Beer Steins | |
| `13615` | Beer Trays | |
| `38291` | Beer Mirrors | |
| `562` | Other Breweriana | |

### Antiques

| Category ID | Category Name | Notes |
|---|---|---|
| `20081` | Antiques (top level) | |
| `37903` | Antique Advertising | |
| `40` | Primitives | |
| `20095` | Maps, Atlases & Globes | |
| `13776` | Science & Medicine (Antique) | |
| `163130` | Furniture (Antique) | |

### Cameras & Photo

| Category ID | Category Name | Notes |
|---|---|---|
| `625` | Cameras & Photo (top level) | |
| `15230` | Film Cameras | Minolta XG-M, Pentax Spotmatic |
| `30077` | Camera Lenses | |
| `71459` | Darkroom | |

### Consumer Electronics / Vintage

| Category ID | Category Name | Notes |
|---|---|---|
| `14339` | Consumer Electronics (top level) | |
| `14969` | Vintage Electronics | Radios, reel-to-reel, hi-fi |
| `3270` | Portable Audio & Headphones | Portable CD players |
| `3276` | CD Players | |
| `14973` | Ham & Amateur Radio | |

### Music

| Category ID | Category Name | Notes |
|---|---|---|
| `11233` | Music (top level) | |
| `306` | Records/Vinyl | |
| `176984` | CDs | |
| `306` | 45 RPM | |

### DVDs & Movies

| Category ID | Category Name | Notes |
|---|---|---|
| `11232` | DVDs & Movies (top level) | |
| `617` | DVDs — requires `C:Movie/TV Title` | Confirmed required |
| `309` | VHS Tapes | |

### Toys & Hobbies

| Category ID | Category Name | Notes |
|---|---|---|
| `316` | Toys & Hobbies (top level) | |
| `717` | Action Figures | |
| `2624` | Model Trains | |
| `19024` | Slot Cars | |

### Apple Crate Labels / Paper Ephemera

| Category ID | Category Name | Notes |
|---|---|---|
| `1` | Collectibles → Advertising | Crate labels |
| `34` | Advertising (collectibles) | |
| `13580` | Paper Ephemera | |
| `267` | Fruit Crate Labels | Check subcategory |

### Sports Cards & Memorabilia

| Category ID | Category Name | Notes |
|---|---|---|
| `1305` | Sports Mem, Cards & Fan Shop | |
| `214` | Sports Trading Cards | |
| `868` | Baseball | |

### PC Games / Software

| Category ID | Category Name | Notes |
|---|---|---|
| `99` | Video Games & Consoles (top level) | |
| `11047` | PC Video Games | CD-ROM demos, vintage software |

### eBay Motors P&A (Confirmed Working)

| Category ID | Category Name | SiteID Required |
|---|---|---|
| `35563` | Fuel Tanks | `eBayMotors` |
| `177076` | Vintage Helmets | `eBayMotors` |
| `183528` | Saddlebags & Panniers | `eBayMotors` |
| `35597` | Horns | `eBayMotors` |
| `21916884` | Window Deflectors / Ventvisors | `eBayMotors` |

---

## Category-Specific Item Specifics

### Category 616 — Comics (US/Canada)

All five required — upload will fail or be suppressed without them:

| C: Column | Required | Common Values |
|---|---|---|
| `C:Era` | **YES** | `Silver Age (1956-69)`, `Bronze Age (1970-83)`, `Copper Age (1984-91)`, `Modern Age (1992-Now)`, `Golden Age (1938-55)`, `Pre-Golden Age` |
| `C:Language` | **YES** | `English` |
| `C:Type` | **YES** | `Single Issue`, `Annual`, `Giant-Size`, `Limited Series` |
| `C:Publication Name` | **YES** | Publisher name, e.g. `DC Comics`, `Marvel`, `Charlton`, `Harvey`, `Gold Key`, `Dell`, `ACG` |
| `C:Country/Region of Manufacture` | **YES** | `United States` |

### DVDs — Category 617

| C: Column | Required | Notes |
|---|---|---|
| `C:Movie/TV Title` | **YES** | Exact title of the film or show |
| `C:Format` | Recommended | `DVD`, `Blu-ray` |
| `C:Genre` | Recommended | `Action`, `Comedy`, `Drama`, etc. |

### Books

| C: Column | Required | Notes |
|---|---|---|
| `C:Topic` | Recommended | Subject matter |
| `C:Author` | Recommended | Author name |
| `C:Language` | Recommended | `English` |

### Breweriana — Beer Tap Handles (3147)

| C: Column | Required | Notes |
|---|---|---|
| `C:Brand` | Recommended | Brewery name |
| `C:Type` | Recommended | `Tap Handle` |
| `C:Era` | Optional | Decade or year range |

### Cameras — Film Cameras (15230)

| C: Column | Required | Notes |
|---|---|---|
| `C:Brand` | **YES** | `Minolta`, `Pentax`, `Canon`, etc. |
| `C:Type` | **YES** | `35mm SLR`, `Rangefinder`, etc. |
| `C:Model` | Recommended | Specific model name |
| `C:Film Format` | Recommended | `35mm` |

### Vintage Electronics (14969)

| C: Column | Required | Notes |
|---|---|---|
| `C:Brand` | Recommended | Manufacturer |
| `C:Type` | Recommended | `Radio`, `Amplifier`, `Turntable`, etc. |
| `C:Country/Region of Manufacture` | Optional | `United States`, `Japan`, etc. |

> **For any new category:** Download the official template from Seller Hub. Red-highlighted columns = required. Yellow = recommended. Required specifics not included = listing suppression in search.

---

## ConditionID Values

Conditions vary by category. Not all values are valid in all categories. Use the category template to confirm valid values.

| ConditionID | Label | Typical Use |
|---|---|---|
| `1000` | New | Sealed, never used |
| `1500` | New Other | New but opened or missing tags |
| `2000` | Certified Refurbished | eBay-approved program only |
| `2500` | Seller Refurbished | Seller-restored |
| `3000` | Used | Standard used |
| `4000` | Very Good | Used, minimal wear |
| `5000` | Good | Used, some wear |
| `6000` | Acceptable | Heavy wear, still functional |
| `7000` | For Parts or Not Working | Broken, sold for parts |

**Yakima Finds defaults:**
- Comics/magazines: `3000` (Used) or `4000` (Very Good)
- Tap handles: `3000` (Used)
- Sealed items: `1000` (New)
- Parts/broken: `7000`

---

## Shipping Service Codes

Common US domestic service codes for `Shipping service X option` field:

| Service Code | Description |
|---|---|
| `USPSMedia` | USPS Media Mail — books, comics, magazines, DVDs, CDs, games |
| `USPSFirstClass` | USPS First Class |
| `USPSPriority` | USPS Priority Mail |
| `USPSPriorityFlatRateBox` | USPS Priority Flat Rate Box |
| `USPSParcelSelect` | USPS Parcel Select Ground |
| `USPSGroundAdvantage` | USPS Ground Advantage |
| `UPSGround` | UPS Ground |
| `FedExHomeDelivery` | FedEx Home Delivery |
| `FedExGround` | FedEx Ground |
| `FreightShipping` | Freight (large items) |
| `LocalPickup` | Local pickup only |

**Common international service codes:**

| Service Code | Description |
|---|---|
| `USPSFirstClassMailIntl` | USPS First Class International |
| `USPSPriorityMailIntl` | USPS Priority International |
| `USPSExpressMailIntl` | USPS Express International |

---

## Workflow Rules for ListFlow

These are standing rules established across all Yakima Finds listing sessions. Claude Code must apply these automatically.

### Pricing
- Items priced under `$10.00`: use as-is from research
- Items priced `$10.00` and above: apply **+10% markup** before writing to CSV
- Price shipping into the item price — all listings use **free shipping** (cost = 0)

### Shipping
- Default service: `USPSMedia` for all comics, books, magazines, DVDs, CDs, games, and small collectibles
- For tap handles and larger items: `USPSPriority` or `USPSGroundAdvantage`
- Cost always = `0.00` (free, baked into price)
- Do NOT use `ShippingType=Free` — use `ShippingType=Flat` with `Cost=0`

### Location
- Always: `PostalCode=98901`
- Do not use the `Location` field when PostalCode is set

### Titles
- Max 80 characters — hard limit
- No HTML in titles
- No marketing language (avoid: "RARE!", "LOOK!", "L@@K")
- Include: publisher, title, issue number, year, condition keywords where relevant

### Descriptions
- Plain conversational text — no HTML tags, no bullet points, no bold
- No marketing language or artificial urgency
- Include: condition details, notable features, any defects honestly noted

### Images
- Use direct `i.imgur.com` links (e.g. `https://i.imgur.com/XXXXXXX.jpg`)
- Multiple images: pipe-separated in the `Item photo URL` column
- URL must start with `https://`
- Spaces in URLs must be replaced with `%20`

### CSV Structure
- One CSV per batch session
- One row per item (single quantity, unique listings)
- `Action=Add` for all new listings
- `Format=FixedPrice`, `Duration=GTC` for all standard listings

### Item Specifics
- Category 616 (comics): all 5 required C: columns mandatory — no exceptions
- Category 617 (DVDs): `C:Movie/TV Title` mandatory
- For any new category: check template before building rows

### eBay Motors
- Always use `SiteID=eBayMotors` in header
- Always download official template before first use of any new Motors category

---

## Common Errors & Fixes

| Error | Likely Cause | Fix |
|---|---|---|
| Upload fails — bad header | Wrong SiteID for Motors | Change to `SiteID=eBayMotors` |
| Listing not appearing in search | Missing required item specifics | Add all red-highlighted C: columns |
| Image not showing | URL has spaces, or http:// instead of https:// | Replace spaces with `%20`, use `https://` |
| Shipping error | Used `ShippingType=Free` | Use `ShippingType=Flat` with `Cost=0` |
| Condition rejected | ConditionID not valid for category | Check category template for valid IDs |
| Title too long | Over 80 characters | Trim to 80 chars max |
| UPC error | Blank UPC field | Enter `Does not apply` |
| Variation error | Tried to add variations to existing listing | End listing, create new with variations |
| Motors category rejected | Used standard US template | Download Motors template, use `SiteID=eBayMotors` |
| Category 616 not finding comics | Wrong category ID | Confirm leaf category ID — use isoldwhat.com |
| Policy name mismatch | Case error in profile name | Copy exact name from Business Policies page |

---

## Quick Reference — Minimal Working CSV (Standard Listing, Business Policies)

```csv
Action,Category ID,Custom label (SKU),Title,P:UPC,Start price,Quantity,Item photo URL,Condition ID,Description,Format,Duration,PostalCode,Shipping profile name,Return profile name,Payment profile name
Add,616,YF-001,1968 Batman #200 DC Comics Silver Age,Does not apply,14.99,1,https://i.imgur.com/abc123.jpg,3000,Nice copy of Batman 200. Cover shows light wear. Pages are white and crisp.,FixedPrice,GTC,98901,Free Shipping Media,30 Day Returns Buyer Pays,eBay Payments
```

## Quick Reference — Minimal Working CSV (Standard Listing, Manual Shipping)

```csv
Action,Category ID,Custom label (SKU),Title,P:UPC,Start price,Quantity,Item photo URL,Condition ID,Description,Format,Duration,PostalCode,Shipping service 1 option,Shipping service 1 cost,Shipping service 1 priority,Max dispatch time,Returns accepted option,Returns within option,Refund option,Return shipping cost paid by
Add,616,YF-001,1968 Batman #200 DC Comics Silver Age,Does not apply,14.99,1,https://i.imgur.com/abc123.jpg,3000,Nice copy of Batman 200. Cover shows light wear. Pages are white and crisp.,FixedPrice,GTC,98901,USPSMedia,0.00,1,3,ReturnsAccepted,Days_30,MoneyBack,Buyer
```

---

*End of EBAY_CSV_REFERENCE.md*
*Maintained for ListFlow / Yakima Finds. Update when new categories are confirmed or eBay changes spec.*
