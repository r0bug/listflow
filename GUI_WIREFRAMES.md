# ConsoleEbay Desktop GUI Wireframes

**Version**: 2.0
**Last Updated**: 2025-12-05

---

## Overview

The desktop client (Electron) is the primary workstation for listing items. It's designed for:
- **Speed**: Minimize clicks to list an item
- **Bulk operations**: Handle 50+ items efficiently
- **Offline capability**: Work without internet, sync when connected

---

## Main Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ConsoleEbay Desktop                                    ─ □ ×              │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│   NAVIGATION     │                    MAIN CONTENT AREA                     │
│                  │                                                          │
│  ┌────────────┐  │                                                          │
│  │ Dashboard  │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Import     │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Queue      │  │                                                          │
│  │  ├ Identify│  │                                                          │
│  │  ├ Review  │  │                                                          │
│  │  ├ Price   │  │                                                          │
│  │  └ List    │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Listings   │  │                                                          │
│  │  ├ Active  │  │                                                          │
│  │  └ Sold    │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Inventory  │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Research   │  │                                                          │
│  ├────────────┤  │                                                          │
│  │ Settings   │  │                                                          │
│  └────────────┘  │                                                          │
│                  │                                                          │
│  ──────────────  │                                                          │
│  SYNC STATUS     │                                                          │
│  ● Connected     │                                                          │
│  Last: 2 min ago │                                                          │
│                  │                                                          │
├──────────────────┴──────────────────────────────────────────────────────────┤
│  Domain: Alpha Operations │ Account: Main Store │ User: bob@alpha │ v2.0.0 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 1: Dashboard

**Purpose**: Overview of current state, quick stats

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│  │   QUEUE: 47     │ │  LISTED: 312    │ │  SOLD TODAY: 8  │ │ REVENUE    │ │
│  │                 │ │                 │ │                 │ │            │ │
│  │  ┌───┬───┬───┐  │ │  Active items   │ │  $342.50 total  │ │  $2,847    │ │
│  │  │12 │18 │ 9 │  │ │  on eBay        │ │                 │ │  (30 days) │ │
│  │  │ID │REV│PRC│  │ │                 │ │                 │ │            │ │
│  │  └───┴───┴───┘  │ │                 │ │                 │ │            │ │
│  │  [Start Queue]  │ │  [View All]     │ │  [View Orders]  │ │ [Report]   │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  RECENT ACTIVITY                                                        ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  10:32  Listed "Sony PlayStation 5 Console" → $499.99                   ││
│  │  10:28  Sold "Nintendo Switch OLED" → $289.00                           ││
│  │  10:15  Imported 12 items from SD card                                  ││
│  │  09:45  AI identified 8 items (94% avg confidence)                      ││
│  │  09:30  Session started                                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  NEEDS ATTENTION                                                        ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  ⚠ 3 items with low AI confidence (<70%) need manual review             ││
│  │  ⚠ 5 items waiting >24 hours in queue                                   ││
│  │  ● Sync pending: 4 items to upload                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 2: Photo Import

**Purpose**: Import photos from SD card or folder, group into items

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  IMPORT PHOTOS                                              [Import Folder] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Source: /media/SDCARD/DCIM/                                    [Change]    │
│  Found: 127 photos                                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          PHOTO GROUPING                                 ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  UNGROUPED (23 photos)                                                  ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      ││
│  │  │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │      ││
│  │  │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │ │ ░░░ │      ││
│  │  │ IMG │ │ IMG │ │ IMG │ │ IMG │ │ IMG │ │ IMG │ │ IMG │ │ IMG │      ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      ││
│  │                                                                         ││
│  │  ─────────────────────────────────────────────────────────────────      ││
│  │                                                                         ││
│  │  ITEM GROUPS (8 items created)                         [Auto-Group]     ││
│  │                                                                         ││
│  │  ┌───────────────────────┐  ┌───────────────────────┐                  ││
│  │  │ Item #1 (4 photos)    │  │ Item #2 (3 photos)    │                  ││
│  │  │ ┌───┐┌───┐┌───┐┌───┐  │  │ ┌───┐┌───┐┌───┐      │                  ││
│  │  │ │░░░││░░░││░░░││░░░│  │  │ │░░░││░░░││░░░│      │                  ││
│  │  │ └───┘└───┘└───┘└───┘  │  │ └───┘└───┘└───┘      │                  ││
│  │  │ [+ Add] [Remove]      │  │ [+ Add] [Remove]      │                  ││
│  │  └───────────────────────┘  └───────────────────────┘                  ││
│  │                                                                         ││
│  │  ┌───────────────────────┐  ┌───────────────────────┐                  ││
│  │  │ Item #3 (5 photos)    │  │ Item #4 (2 photos)    │                  ││
│  │  │ ┌───┐┌───┐┌───┐┌───┐  │  │ ┌───┐┌───┐          │                  ││
│  │  │ │░░░││░░░││░░░││░░░│+ │  │ │░░░││░░░│          │                  ││
│  │  │ └───┘└───┘└───┘└───┘  │  │ └───┘└───┘          │                  ││
│  │  │ [+ Add] [Remove]      │  │ [+ Add] [Remove]      │                  ││
│  │  └───────────────────────┘  └───────────────────────┘                  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │ + New Item Group │   Selected: 0 photos    [ Create Items & Process AI ] │
│  └──────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Interaction**:
- Drag photos from ungrouped into item groups
- Click "Auto-Group" to let AI suggest groupings based on visual similarity
- Click "Create Items & Process AI" to start identification

---

## Screen 3: Review Queue (Kanban View)

**Purpose**: See all items across workflow stages, drag to advance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  QUEUE                                         Filter: All │ Search: ______ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  IDENTIFY (12)     REVIEW (18)       PRICE (9)        READY (8)             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│  │             │   │             │   │             │   │             │      │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │      │
│  │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │      │
│  │ │ PS5     │ │   │ │ Switch  │ │   │ │ iPhone  │ │   │ │ MacBook │ │      │
│  │ │ 94% ●●● │ │   │ │ 87% ●●○ │ │   │ │ $299    │ │   │ │ $899    │ │      │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │      │
│  │             │   │             │   │             │   │             │      │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │      │
│  │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │      │
│  │ │ Xbox    │ │   │ │ iPad    │ │   │ │ Samsung │ │   │ │ Monitor │ │      │
│  │ │ 91% ●●● │ │   │ │ 78% ●●○ │ │   │ │ $149    │ │   │ │ $199    │ │      │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │      │
│  │             │   │             │   │             │   │             │      │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │   │             │      │
│  │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │ │ ░░░░░░░ │ │   │             │      │
│  │ │ Vinyl   │ │   │ │ Camera  │ │   │ │ Laptop  │ │   │             │      │
│  │ │ 65% ●○○ │ │   │ │ 82% ●●○ │ │   │ │ $450    │ │   │             │      │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │   │             │      │
│  │             │   │             │   │             │   │             │      │
│  │    ...      │   │    ...      │   │    ...      │   │             │      │
│  │             │   │             │   │             │   │             │      │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘      │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Selected: 0 items     [Bulk Review]  [Bulk Price]  [List All Ready (8)]    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Interaction**:
- Click card to open detail view
- Drag card between columns to advance (with confirmation)
- Select multiple cards for bulk operations
- Color-coded confidence: Green (90%+), Yellow (70-89%), Red (<70%)

---

## Screen 4: Item Detail / Review

**Purpose**: Full item view for review and editing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ITEM: ALPHA-2024-000847                           Step: REVIEW │ ← → (2/18)│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │                               │  │  TITLE                             │  │
│  │                               │  │  ┌────────────────────────────────┐│  │
│  │        ┌─────────────┐        │  │  │Sony PlayStation 5 Console Disc ││  │
│  │        │             │        │  │  │Edition 825GB White CFI-1215A   ││  │
│  │        │             │        │  │  └────────────────────────────────┘│  │
│  │        │   PRIMARY   │        │  │  AI Confidence: 94%  [Edit] [Redo] │  │
│  │        │    PHOTO    │        │  │                                    │  │
│  │        │             │        │  │  CATEGORY                          │  │
│  │        │             │        │  │  ┌────────────────────────────────┐│  │
│  │        └─────────────┘        │  │  │Video Games > Consoles          ││  │
│  │                               │  │  └────────────────────────────────┘│  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐     │  │  [Change Category]                  │  │
│  │  │ ░░░ │ │ ░░░ │ │ ░░░ │     │  │                                    │  │
│  │  │  2  │ │  3  │ │  4  │     │  │  CONDITION                         │  │
│  │  └─────┘ └─────┘ └─────┘     │  │  ┌────────────────────────────────┐│  │
│  │                               │  │  │Used - Like New                 ││  │
│  │  [Add Photo]                  │  │  └────────────────────────────────┘│  │
│  └───────────────────────────────┘  │                                    │  │
│                                      │  ITEM SPECIFICS                   │  │
│  ┌───────────────────────────────┐  │  ┌────────────────────────────────┐│  │
│  │  AI ANALYSIS                  │  │  │Brand: Sony                     ││  │
│  ├───────────────────────────────┤  │  │Model: CFI-1215A                ││  │
│  │                               │  │  │Storage: 825GB                  ││  │
│  │  "I identified this as a     │  │  │Color: White                    ││  │
│  │   Sony PlayStation 5 based   │  │  │+ Add Specific                   ││  │
│  │   on the distinctive white   │  │  └────────────────────────────────┘│  │
│  │   curved design and visible  │  │                                    │  │
│  │   model number CFI-1215A on  │  │  DESCRIPTION                       │  │
│  │   the back label. This is    │  │  ┌────────────────────────────────┐│  │
│  │   the disc edition based     │  │  │<p>Sony PlayStation 5 Console  ││  │
│  │   on the disc drive slot."   │  │  │in excellent condition...</p>   ││  │
│  │                               │  │  │                                ││  │
│  │  Confidence: 94%             │  │  │[View Full] [Edit]              ││  │
│  │  Model used: llava-v1.6      │  │  └────────────────────────────────┘│  │
│  └───────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Additional Context for AI (if redoing):                                ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │ This is actually the digital edition, not the disc version...      │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [← Previous]  [Reject]  [Redo with Context]  [Accept & Next →]             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 5: Pricing

**Purpose**: Set price with market research

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRICING: Sony PlayStation 5                               Step: PRICE      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │                             │  │  YOUR PRICING                        │  │
│  │      ┌─────────────┐        │  │                                      │  │
│  │      │             │        │  │  Buy It Now Price                    │  │
│  │      │   PHOTO     │        │  │  ┌─────────────┐                     │  │
│  │      │             │        │  │  │  $ 449.99   │  ← AI Suggested     │  │
│  │      └─────────────┘        │  │  └─────────────┘                     │  │
│  │                             │  │                                      │  │
│  │  Title: Sony PlayStation 5  │  │  Shipping Cost                       │  │
│  │  Condition: Used - Like New │  │  ┌─────────────┐                     │  │
│  │                             │  │  │  $ 15.99    │  (calculated)       │  │
│  └─────────────────────────────┘  │  └─────────────┘                     │  │
│                                    │                                      │  │
│  ┌─────────────────────────────┐  │  Your Cost (optional)                │  │
│  │  AI PRICE SUGGESTION        │  │  ┌─────────────┐                     │  │
│  ├─────────────────────────────┤  │  │  $ 350.00   │                     │  │
│  │                             │  │  └─────────────┘                     │  │
│  │  Suggested: $449.99         │  │                                      │  │
│  │  Confidence: 87%            │  │  Estimated Profit: $64.00            │  │
│  │                             │  │  (after fees ~$36)                   │  │
│  │  Based on 23 sold items     │  │                                      │  │
│  │  Average sold: $425.00      │  │  ───────────────────────────────     │  │
│  │  Median: $449.99            │  │                                      │  │
│  │  Range: $380 - $520         │  │  Listing Type                        │  │
│  │                             │  │  ○ Auction                           │  │
│  │  "Pricing at median due to  │  │  ● Buy It Now                        │  │
│  │   excellent condition"      │  │  ○ Auction + BIN                     │  │
│  └─────────────────────────────┘  │                                      │  │
│                                    │  Duration: [ GTC         ▼]         │  │
│  ┌─────────────────────────────────┴──────────────────────────────────┐  │  │
│  │  COMPARABLE SOLD ITEMS                              [Refresh Data] │  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │  │
│  │                                                                    │  │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │  │  │
│  │  │  ░░░░  │ │  ░░░░  │ │  ░░░░  │ │  ░░░░  │ │  ░░░░  │           │  │  │
│  │  │ $449   │ │ $425   │ │ $399   │ │ $475   │ │ $450   │           │  │  │
│  │  │ Dec 3  │ │ Dec 2  │ │ Dec 1  │ │ Nov 30 │ │ Nov 29 │           │  │  │
│  │  │ Used   │ │ Used   │ │ Good   │ │ New    │ │ Used   │           │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘           │  │  │
│  │                                                                    │  │  │
│  └────────────────────────────────────────────────────────────────────┘  │  │
│                                                                           │  │
│  [← Back to Review]    [Skip Pricing]    [Accept & Next →]                │  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 6: Ready to List

**Purpose**: Final confirmation before publishing to eBay

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  READY TO LIST (8 items)                                    [List All Now]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  eBay Account: [ Main Store (alpha_main)  ▼]                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ □  │ Photo │ Title                          │ Price   │ Location │ Act ││
│  ├────┼───────┼────────────────────────────────┼─────────┼──────────┼─────┤│
│  │ ☑  │ ░░░░░ │ Sony PlayStation 5 Console...  │ $449.99 │ A-1-3    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Nintendo Switch OLED Model...  │ $289.99 │ A-1-4    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Apple MacBook Pro 14" M3...    │ $899.99 │ B-2-1    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Samsung Galaxy S24 Ultra...    │ $649.99 │ B-2-2    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Canon EOS R6 Mark II Camera    │ $1,899  │ C-1-1    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Bose QuietComfort Ultra...     │ $329.99 │ A-3-2    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Dell UltraSharp 27 Monitor     │ $449.99 │ C-2-1    │ [⋮] ││
│  │ ☑  │ ░░░░░ │ Dyson V15 Detect Vacuum...     │ $549.99 │ D-1-1    │ [⋮] ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  SUMMARY                                                                ││
│  │                                                                         ││
│  │  Items to list: 8                                                       ││
│  │  Total value: $5,518.92                                                 ││
│  │  Estimated fees: ~$717.46                                               ││
│  │                                                                         ││
│  │  ⚠ Location required for 0 items                                        ││
│  │  ⚠ Missing photos: 0 items                                              ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Select All]  [Deselect All]  [Back to Queue]       [LIST SELECTED (8)]    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 7: Quick Identifier Entry

**Purpose**: Enter UPC/ISBN/Matrix without photos (lookup-based listing)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  QUICK IDENTIFIER ENTRY                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Enter identifiers (one per line):                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │ 711719558552                                                        │││
│  │  │ 978-0-13-468599-1                                                   │││
│  │  │ A1B2-3456-7                                                         │││
│  │  │ 045496596439                                                        │││
│  │  │                                                                     │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                         ││
│  │  Type: ○ Auto-detect  ○ UPC  ○ ISBN  ○ Discogs Matrix                  ││
│  │                                                                         ││
│  │  [Process Identifiers]                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  RESULTS                                                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ✓ 711719558552 → Sony PlayStation 5 Console                           ││
│  │    UPC matched. Confidence: 98%                           [Create Item] ││
│  │                                                                         ││
│  │  ✓ 978-0-13-468599-1 → Clean Code by Robert C. Martin                  ││
│  │    ISBN matched. Confidence: 99%                          [Create Item] ││
│  │                                                                         ││
│  │  ✓ A1B2-3456-7 → Pink Floyd - Dark Side of the Moon (LP)               ││
│  │    Discogs match. Confidence: 92%                         [Create Item] ││
│  │                                                                         ││
│  │  ✓ 045496596439 → Nintendo Switch OLED Model                           ││
│  │    UPC matched. Confidence: 97%                           [Create Item] ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Create All Items (4)]                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 8: Inventory / Location Browser

**Purpose**: Find items by physical location

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INVENTORY                                          Search: [____________]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Warehouse: [ Main Storage Facility  ▼]                                     │
│                                                                              │
│  ┌─────────────────────────┐  ┌────────────────────────────────────────────┐│
│  │  LOCATIONS              │  │  ITEMS IN: A-1                              ││
│  ├─────────────────────────┤  ├────────────────────────────────────────────┤│
│  │                         │  │                                            ││
│  │  Zone A (45 items)      │  │  A-1-1: Empty                              ││
│  │  ├─ A-1 (8 items)  ←    │  │  A-1-2: Sony PlayStation 5 ($449)         ││
│  │  ├─ A-2 (12 items)      │  │  A-1-3: Nintendo Switch ($289)            ││
│  │  └─ A-3 (25 items)      │  │  A-1-4: Xbox Series X ($399)              ││
│  │                         │  │  A-1-5: PS5 Controller ($59)               ││
│  │  Zone B (32 items)      │  │  A-1-6: Switch Pro Controller ($49)        ││
│  │  ├─ B-1 (15 items)      │  │  A-1-7: Gaming Headset ($79)               ││
│  │  └─ B-2 (17 items)      │  │  A-1-8: HDMI Cable 3-pack ($19)            ││
│  │                         │  │                                            ││
│  │  Zone C (28 items)      │  │                                            ││
│  │  ├─ C-1 (10 items)      │  │  [Print Labels]  [Move Items]              ││
│  │  └─ C-2 (18 items)      │  │                                            ││
│  │                         │  │                                            ││
│  │  Zone D (15 items)      │  │                                            ││
│  │  └─ D-1 (15 items)      │  │                                            ││
│  │                         │  │                                            ││
│  └─────────────────────────┘  └────────────────────────────────────────────┘│
│                                                                              │
│  Total items in warehouse: 120                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 9: Sell Similar

**Purpose**: Clone an existing eBay listing to create a new item

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SELL SIMILAR                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Enter eBay Item Number or URL:                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 123456789012                                                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  [Fetch Listing]                                                            │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  FETCHED LISTING                                              [Refresh] ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ┌─────────────────────┐  Title:                                        ││
│  │  │                     │  Sony PlayStation 5 Console Disc Edition       ││
│  │  │                     │  825GB White CFI-1215A - Excellent Condition   ││
│  │  │      PHOTO 1        │                                                ││
│  │  │                     │  Category: Video Games > Consoles              ││
│  │  │                     │  Condition: Used - Like New                    ││
│  │  └─────────────────────┘  Price: $449.99 (Buy It Now)                   ││
│  │                                                                         ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ Seller: gamestop_outlet (99.2%)               ││
│  │  │ ░░░ │ │ ░░░ │ │ ░░░ │ Item #: 123456789012                          ││
│  │  │  2  │ │  3  │ │  4  │                                                ││
│  │  └─────┘ └─────┘ └─────┘                                                ││
│  │                                                                         ││
│  │  Item Specifics:                                                        ││
│  │  • Brand: Sony                                                          ││
│  │  • Model: CFI-1215A                                                     ││
│  │  • Storage Capacity: 825GB                                              ││
│  │  • Color: White                                                         ││
│  │  • Platform: Sony PlayStation 5                                         ││
│  │                                                                         ││
│  │  Description Preview:                                                   ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ Sony PlayStation 5 Disc Edition console in excellent working    │   ││
│  │  │ condition. Includes original controller and power cable...      │   ││
│  │  │ [View Full Description]                                         │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CREATE NEW ITEM FROM THIS LISTING                                      ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  What to copy:                                                          ││
│  │  ☑ Title                    ☑ Category                                 ││
│  │  ☑ Item Specifics           ☑ Condition                                ││
│  │  ☑ Description              ☐ Price (will need your own price)         ││
│  │  ☐ Images (you'll add your own)                                        ││
│  │                                                                         ││
│  │  ☐ Save as reusable template: [_______________________]                ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Cancel]                                      [Create Item & Add Photos →] │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Workflow**:
1. Enter eBay item number (or paste full URL)
2. System fetches listing via eBay Browse API
3. Review the fetched data
4. Select what to copy (title, description, category, specifics)
5. Click "Create Item" → Goes to photo capture screen
6. Add your own photos
7. Review AI suggestions (may refine based on your actual item)
8. Price and list

**Saved Templates**:
- Can save frequently-used listings as templates
- E.g., "PS5 Console Template", "iPhone 14 Template"
- Templates appear in a dropdown for quick access

---

## Screen 10: Template Manager

**Purpose**: Browse, create, edit, and manage reusable listing templates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEMPLATES                                          [+ New Template]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Filter: [All Categories    ▼]  Search: [________________]  Sort: [Recent▼] │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                         ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │ ░░░ │ PS5 Console Template                           Used: 47x  │  ││
│  │  │ ░░░ │ Tags: gaming, console, sony                               │  ││
│  │  │     │ Category: Video Games > Consoles                           │  ││
│  │  │     │ Source: Sell Similar (eBay #123456789)   [Edit] [Use] [⋮] │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │ ░░░ │ iPhone 14 Pro Template                         Used: 32x  │  ││
│  │  │ ░░░ │ Tags: phone, apple, iphone                                │  ││
│  │  │     │ Category: Cell Phones & Smartphones                        │  ││
│  │  │     │ Source: Manual                           [Edit] [Use] [⋮] │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │ ░░░ │ Vinyl Record Template                          Used: 89x  │  ││
│  │  │ ░░░ │ Tags: vinyl, records, music                               │  ││
│  │  │     │ Category: Music > Records                                  │  ││
│  │  │     │ Source: Manual                           [Edit] [Use] [⋮] │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │ ░░░ │ Nintendo Switch Game Template                  Used: 156x │  ││
│  │  │ ░░░ │ Tags: gaming, nintendo, switch                            │  ││
│  │  │     │ Category: Video Games > Games                              │  ││
│  │  │     │ Source: AI Generated                     [Edit] [Use] [⋮] │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Showing 4 of 23 templates                              [Load More]         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 11: Template Editor

**Purpose**: Full listing editor with placeholder support for creating/editing templates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEMPLATE EDITOR: PS5 Console Template                    [Save] [Cancel]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  TEMPLATE INFO                                                          ││
│  │  Template Name: [PS5 Console Template                              ]    ││
│  │  Tags: [gaming, console, sony                                      ]    ││
│  │  Notes: [Internal template for all PS5 console listings            ]    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  LISTING CONTENT (use {placeholder} for user input)                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  TITLE TEMPLATE                                          80 char limit  ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │ Sony PlayStation 5 {Edition} Edition {Storage} {Color} - {Cond}    │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │  Preview: Sony PlayStation 5 [Edition] Edition [Storage] [Color] - ... ││
│  │                                                                         ││
│  │  Available placeholders: {Brand}, {Model}, {Edition}, {Storage},        ││
│  │  {Color}, {Condition}, {Cond}, {input}                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │  CATEGORY                    │  │  CONDITION                         │  │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────────┐   │  │
│  │  │Video Games > Consoles  │  │  │  │ [ Select Condition     ▼] │   │  │
│  │  └────────────────────────┘  │  │  │ ○ New                       │   │  │
│  │  [Change Category]           │  │  │ ○ Open Box                  │   │  │
│  │                              │  │  │ ● Used - Like New           │   │  │
│  │  Category ID: 139971         │  │  │ ○ Used - Good               │   │  │
│  └──────────────────────────────┘  │  │ ○ For Parts                 │   │  │
│                                      │  └────────────────────────────┘   │  │
│                                      └────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ITEM SPECIFICS                                         [+ Add Specific]││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │   Name                 Value                    Required  Locked        ││
│  │  ───────────────────────────────────────────────────────────────────   ││
│  │   Brand               [Sony                  ]    ☑        ☑           ││
│  │   Platform            [PlayStation 5         ]    ☑        ☑           ││
│  │   Model               [{input}               ]    ☑        ☐           ││
│  │   Storage Capacity    [{input}               ]    ☑        ☐           ││
│  │   Edition             [{input}               ]    ☐        ☐           ││
│  │   Color               [{input}               ]    ☐        ☐           ││
│  │   Connectivity        [Wi-Fi, Bluetooth      ]    ☐        ☑           ││
│  │                                                                         ││
│  │   {input} = User must provide    Locked = Cannot be changed            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  DESCRIPTION TEMPLATE                              [Visual] [HTML]      ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │<h2>{Title}</h2>                                                     │││
│  │  │<p>Authentic {Brand} {Platform} console in {Condition} condition.    │││
│  │  │This is the {Edition} edition with {Storage} storage.</p>            │││
│  │  │                                                                     │││
│  │  │<h3>What's Included:</h3>                                            │││
│  │  │<ul>                                                                 │││
│  │  │  <li>PlayStation 5 Console</li>                                     │││
│  │  │  <li>DualSense Controller</li>                                      │││
│  │  │  <li>Power Cable</li>                                               │││
│  │  │  <li>HDMI Cable</li>                                                │││
│  │  │</ul>                                                                │││
│  │  │                                                                     │││
│  │  │<p>Ships within 1 business day. See our other listings!</p>          │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌───────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  PRICING GUIDANCE             │  │  SHIPPING DEFAULTS               │   │
│  │                               │  │                                  │   │
│  │  Suggested Min: [$350.00   ]  │  │  Est. Shipping: [$15.99      ]  │   │
│  │  Suggested Max: [$550.00   ]  │  │  Est. Weight:   [10.5 lbs    ]  │   │
│  │                               │  │                                  │   │
│  │  Default Type:                │  │  Package Dimensions:             │   │
│  │  ● Buy It Now                 │  │  L: [18"] W: [15"] H: [8"   ]   │   │
│  │  ○ Auction                    │  │                                  │   │
│  │                               │  │  Shipping Profile:               │   │
│  │  Default Duration: [GTC    ▼] │  │  [Standard Ground           ▼]  │   │
│  └───────────────────────────────┘  └──────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  REFERENCE IMAGES (optional - for visual reference only)                ││
│  │                                                                         ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐                                              ││
│  │  │ ░░░ │ │ ░░░ │ │  +  │  These images are NOT used in listings.     ││
│  │  │ ░░░ │ │ ░░░ │ │ Add │  They help users identify this item type.   ││
│  │  └─────┘ └─────┘ └─────┘                                              ││
│  │                                                                         ││
│  │  ☑ Require photos when using this template                             ││
│  │  Minimum photos required: [3     ]                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Delete Template]                              [Preview] [Save Template]   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:

1. **Placeholders**: Use `{placeholder}` syntax in title, description, and item specifics
   - `{Brand}`, `{Model}`, `{Condition}` - Auto-filled from item data
   - `{input}` - User must provide value when using template
   - `{Title}` - Expands to the final generated title

2. **Locked Specifics**: Mark item specifics as "locked" so they can't be changed
   - E.g., Brand=Sony is locked for PS5 template

3. **Required Specifics**: Mark specifics as required for listing completion

4. **Pricing Guidance**: Suggest price range for this item type

5. **Shipping Defaults**: Pre-fill estimated shipping cost and dimensions

---

## Screen 12: Create from Template

**Purpose**: Use a template to quickly create a new item

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATE FROM TEMPLATE                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Template: [PS5 Console Template                                         ▼] │
│                                                                              │
│  Or enter eBay Item #: [________________] [Fetch from eBay]                 │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  FILL IN PLACEHOLDERS                                                   ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  The template requires the following values:                            ││
│  │                                                                         ││
│  │  Edition *         [Disc                                            ]  ││
│  │                    ○ Disc  ○ Digital                                    ││
│  │                                                                         ││
│  │  Storage *         [825GB                                           ]  ││
│  │                                                                         ││
│  │  Model             [CFI-1215A                                       ]  ││
│  │                    (Model # from back of console)                       ││
│  │                                                                         ││
│  │  Color             [White                                           ]  ││
│  │                    ○ White  ○ Black  ○ Other                            ││
│  │                                                                         ││
│  │  Condition *       [Used - Like New                              ▼]    ││
│  │                                                                         ││
│  │                                                 * Required              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PREVIEW                                                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Title:                                                                 ││
│  │  Sony PlayStation 5 Disc Edition 825GB White - Used Like New           ││
│  │                                                                         ││
│  │  Category: Video Games > Consoles                                       ││
│  │                                                                         ││
│  │  Item Specifics:                                                        ││
│  │  • Brand: Sony (locked)                                                 ││
│  │  • Platform: PlayStation 5 (locked)                                     ││
│  │  • Model: CFI-1215A                                                     ││
│  │  • Storage: 825GB                                                       ││
│  │  • Edition: Disc                                                        ││
│  │  • Color: White                                                         ││
│  │                                                                         ││
│  │  Suggested Price Range: $350 - $550                                     ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Cancel]                               [Create Item & Add Photos →]        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Workflow**:
1. Select existing template OR enter eBay item # to fetch
2. Fill in any placeholder values the template requires
3. Preview the generated listing content
4. Click "Create Item" → Proceeds to photo capture
5. AI may refine suggestions based on actual photos
6. Complete pricing and list

---

## Screen 13: User Switch / PIN Login

**Purpose**: Quick user switching on shared workstations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SELECT USER                                          Listing Station 1     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         Who's working?                                       │
│                                                                              │
│     ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                 │
│     │               │  │               │  │               │                 │
│     │      👤       │  │      👤       │  │      👤       │                 │
│     │               │  │               │  │               │                 │
│     │     Bob       │  │    Alice      │  │    Carol      │                 │
│     │   (Lister)    │  │   (Admin)     │  │  (Shipper)    │                 │
│     │               │  │               │  │               │                 │
│     └───────────────┘  └───────────────┘  └───────────────┘                 │
│                                                                              │
│     ┌───────────────┐                                                        │
│     │               │                                                        │
│     │      ➕       │  [Other User...]                                       │
│     │               │                                                        │
│     └───────────────┘                                                        │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│                         Enter PIN for Bob:                                   │
│                                                                              │
│                    ┌─────────────────────────┐                              │
│                    │    ●  ●  ●  ●  _  _     │                              │
│                    └─────────────────────────┘                              │
│                                                                              │
│                    ┌─────┬─────┬─────┐                                      │
│                    │  1  │  2  │  3  │                                      │
│                    ├─────┼─────┼─────┤                                      │
│                    │  4  │  5  │  6  │                                      │
│                    ├─────┼─────┼─────┤                                      │
│                    │  7  │  8  │  9  │                                      │
│                    ├─────┼─────┼─────┤                                      │
│                    │  ←  │  0  │  ✓  │                                      │
│                    └─────┴─────┴─────┘                                      │
│                                                                              │
│                    [Cancel]                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features**:
- Recent users shown as large buttons for quick access
- PIN entry (4-6 digits) - faster than password
- Session persists until explicit logout or timeout
- Each action is attributed to logged-in user
- Shared workstation tracks recent users

---

## Screen 11: Performance Dashboard

**Purpose**: Track user productivity for compensation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE                                      Period: [This Week    ▼]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────┐                      │
│  │  YOUR STATS (Bob)                     Today: 23   │                      │
│  │                                                   │                      │
│  │  ████████████████████████░░░░░░  23/30 goal      │                      │
│  │                                                   │                      │
│  │  This Week: 89 items    │  Avg/Day: 17.8         │                      │
│  │  This Month: 342 items  │  Best Day: 31 (Mon)    │                      │
│  └───────────────────────────────────────────────────┘                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  TEAM LEADERBOARD (This Week)                                           ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │   #   User        Items    Avg Time    Edits    Earnings*              ││
│  │  ─────────────────────────────────────────────────────────────         ││
│  │   1   Alice        127      42s         12       $254.00               ││
│  │   2   Bob (you)     89      51s         18       $178.00               ││
│  │   3   Carol         67      48s          8       $134.00               ││
│  │   4   Dave          45      63s         22        $90.00               ││
│  │                                                                         ││
│  │  * Based on $2.00 per item listed                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  DAILY BREAKDOWN                                                        ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │   Day        Items    Time Worked    Avg/Item    Quality Score         ││
│  │  ─────────────────────────────────────────────────────────────         ││
│  │   Monday       31      4h 12m          49s          94%                ││
│  │   Tuesday      18      2h 30m          51s          92%                ││
│  │   Wednesday    22      3h 05m          48s          96%                ││
│  │   Thursday     18      2h 45m          54s          91%                ││
│  │   Friday       --         --            --           --                ││
│  │                                                                         ││
│  │   TOTAL        89     12h 32m         Avg: 51s     Avg: 93%           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Export Report]  [View Details]                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Metrics Tracked**:
- Items completed per step (ingest, identify, review, price, list)
- Time per item (avg, min, max)
- Quality score (% accepted without edits, AI redo requests)
- Earnings calculation (if paid per item)

---

## Mobile Screens (React Native)

### Mobile: Camera Capture

```
┌─────────────────────────────┐
│  ◄  NEW ITEM                │
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │                     │   │
│   │                     │   │
│   │      CAMERA         │   │
│   │       VIEW          │   │
│   │                     │   │
│   │                     │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   Photos: ○ ○ ○ ○ ○         │
│           1 2 3 4 5         │
│                             │
│   ┌───────────────────────┐ │
│   │                       │ │
│   │    [ ◉ CAPTURE ]      │ │
│   │                       │ │
│   └───────────────────────┘ │
│                             │
│   [Scan UPC] [Done (3)]     │
│                             │
└─────────────────────────────┘
```

### Mobile: Quick Review (Swipe)

```
┌─────────────────────────────┐
│  ◄  REVIEW (5 of 12)        │
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │      PHOTO          │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   Sony PlayStation 5        │
│   Console Disc Edition      │
│                             │
│   Category: Video Games     │
│   Condition: Like New       │
│   Price: $449.99            │
│                             │
│   AI Confidence: 94% ●●●    │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │  ← REDO    ACCEPT → │   │
│   │                     │   │
│   │    SWIPE TO ACT     │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   [Edit Details]            │
│                             │
└─────────────────────────────┘
```

---

## Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New item |
| `Ctrl+I` | Import photos |
| `Ctrl+Enter` | Accept current / List selected |
| `Ctrl+R` | Redo with context |
| `→` | Next item |
| `←` | Previous item |
| `Ctrl+S` | Force sync |
| `Ctrl+F` | Search |
| `Escape` | Close modal / Cancel |

---

## Color Coding

| Color | Meaning |
|-------|---------|
| Green | High confidence (90%+), ready |
| Yellow | Medium confidence (70-89%), review |
| Red | Low confidence (<70%), needs attention |
| Blue | In progress, AI processing |
| Gray | Inactive, archived |
