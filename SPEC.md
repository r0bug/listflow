# ConsoleEbay Platform Specification

**Version**: 2.0
**Status**: Draft
**Last Updated**: 2025-12-05

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Multi-Tenancy Model](#multi-tenancy-model)
4. [Workflow Engine](#workflow-engine)
5. [AI Agent System](#ai-agent-system)
6. [Security Model](#security-model)
7. [Data Model](#data-model)
8. [API Specification](#api-specification)
9. [Client Architecture](#client-architecture)
10. [Sync Protocol](#sync-protocol)
11. [External Integrations](#external-integrations)
12. [Deployment](#deployment)
13. [Templates & Sell Similar](#templates--sell-similar)

---

## 1. Executive Summary

### Vision
ConsoleEbay is a **multi-tenant eBay operations platform** that leverages AI to automate the listing process while maintaining human oversight. The goal is to reduce per-item listing time from 10+ minutes to under 60 seconds through intelligent automation.

### Core Principles
- **AI-First**: AI handles identification, content generation, and pricing research
- **Human-Final**: A human always makes the final decision to list
- **Client-Agnostic**: Any client that speaks the API works
- **Offline-Capable**: Desktop and mobile clients work without connectivity
- **Audit Everything**: Every step completion is logged with user attribution
- **LTS Foundation**: Core schema and API are stable, features layer on top

### Scale Targets
| Metric | Initial | Growth Target |
|--------|---------|---------------|
| Domains (Organizations) | 1 | 4+ |
| eBay Accounts | 2 | 15+ |
| Users | 1-4 | 30+ |
| Warehouses | 2 | 5+ |
| Items/Day | 10-50 | 500+ |

---

## 2. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Web Client  │  │   Desktop    │  │    Mobile    │                   │
│  │   (React)    │  │  (Electron)  │  │ (React Ntv)  │                   │
│  │              │  │              │  │              │                   │
│  │ - Dashboard  │  │ - Photo      │  │ - Photo      │                   │
│  │ - Admin      │  │   Processing │  │   Capture    │                   │
│  │ - Reports    │  │ - Bulk List  │  │ - Quick List │                   │
│  │              │  │ - Offline    │  │ - Offline    │                   │
│  │ Online Only  │  │   Capable    │  │   Capable    │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                            │
│         └─────────────────┴─────────────────┘                            │
│                           │                                              │
│                           ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        CORE API (v1)                               │  │
│  │                                                                    │  │
│  │  /api/v1/auth/*        - Authentication & sessions                 │  │
│  │  /api/v1/domains/*     - Domain/tenant management                  │  │
│  │  /api/v1/users/*       - User management                           │  │
│  │  /api/v1/items/*       - Item CRUD & workflow                      │  │
│  │  /api/v1/listings/*    - eBay listing operations                   │  │
│  │  /api/v1/inventory/*   - Location & inventory tracking             │  │
│  │  /api/v1/ai/*          - AI agent endpoints                        │  │
│  │  /api/v1/sync/*        - Client sync operations                    │  │
│  │  /api/v1/research/*    - Pricing research & sold data              │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                           │                                              │
│         ┌─────────────────┼─────────────────┐                           │
│         ▼                 ▼                 ▼                            │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────┐                   │
│  │  Database  │  │   AI Services  │  │   External   │                   │
│  │ PostgreSQL │  │                │  │     APIs     │                   │
│  │            │  │ - Vision LLM   │  │              │                   │
│  │ - Domains  │  │ - Text LLM     │  │ - eBay       │                   │
│  │ - Users    │  │ - Embeddings   │  │ - Discogs    │                   │
│  │ - Items    │  │   (Segmind)    │  │ - UPC DB     │                   │
│  │ - Audit    │  │                │  │ - ISBN       │                   │
│  └────────────┘  └────────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Database | PostgreSQL | Robust, JSONB support, proven at scale |
| ORM | Prisma | Type-safe, migrations, good DX |
| API Server | Node.js + Express | Existing codebase, team familiarity |
| Web Client | React + Vite | Modern, fast, component ecosystem |
| Desktop Client | Electron | Cross-platform, web tech reuse |
| Mobile Client | React Native | Code sharing with web |
| AI/Vision | Segmind (LLaVA) | Proven in early versions |
| Queue | Bull + Redis | Background job processing |
| Cache | Redis | Session, rate limiting, caching |

---

## 3. Multi-Tenancy Model

### Domain Structure

A **Domain** represents an independent eBay operation (business entity). Domains are isolated but can establish trust relationships.

```
Platform
├── Domain: "Alpha Operations"
│   ├── eBay Accounts: [alpha_main, alpha_secondary]
│   ├── Warehouses: [Warehouse A, Warehouse B]
│   ├── Users: [alice (Admin), bob (Lister), carol (Shipper)]
│   ├── Items: [...] (belong to this domain permanently)
│   └── Trusts: [Beta (fulfillment)]
│
├── Domain: "Beta Ventures"
│   ├── eBay Accounts: [beta_store, beta_outlet, beta_vintage]
│   ├── Warehouses: [Beta HQ, Beta Annex]
│   ├── Users: [...]
│   └── Trusts: [Alpha (fulfillment)]
│
└── Domain: "Gamma Family"
    ├── eBay Accounts: [gamma_collectibles]
    ├── Warehouses: [Gamma Storage]
    ├── Users: [...]
    └── Trusts: [Alpha (fulfillment), Beta (fulfillment)]
```

### Trust Relationships

Trusts allow cross-domain collaboration with specific permission grants:

| Trust Type | Description | Example |
|------------|-------------|---------|
| `fulfillment` | Can pick/pack/ship orders | Team A ships Team B's sold items |
| `listing_overflow` | Can create listings for other domain | Team A lists for Team B during busy period |
| `read_only` | Can view items/stats | Manager views all domains |

**Rules:**
- Items **never change domain ownership**
- Shipping costs remain with **listing domain**
- Trust must be **bidirectional** to be active (A trusts B AND B trusts A)

### Shared Warehouses

A warehouse can be accessible to multiple domains:

```
Warehouse: "Main Storage Facility"
├── Accessible by: [Alpha, Beta, Gamma]
├── Locations: [A-1, A-2, B-1, B-2, ...]
└── Items:
    ├── Item X (Domain: Alpha, Location: A-1)
    ├── Item Y (Domain: Beta, Location: A-2)
    └── Item Z (Domain: Gamma, Location: B-1)
```

---

## 4. Workflow Engine

### Workflow Steps

Each step is a **discrete, auditable routine**:

| Step | Name | Description | Automation | Human Role |
|------|------|-------------|------------|------------|
| 1 | `INGEST` | Photos/identifiers enter system | Manual | Groups photos, enters identifiers |
| 2 | `IDENTIFY` | Determine what the item is | AI (90%+) | Provides context if AI uncertain |
| 3 | `POPULATE` | Generate listing content | AI (95%) | Reviews, may request redo |
| 4 | `PRICE` | Suggest price from market data | AI (90%) | Adjusts price, may request redo |
| 5 | `REVIEW` | Final review of all fields | N/A | Reviews complete listing |
| 6 | `APPROVE` | Approve and assign location | N/A | Assigns physical location |
| 7 | `LIST` | Push to eBay | Triggered | Clicks "List Now" |
| 8 | `LISTED` | Live on eBay | N/A | Monitors |
| 9 | `SOLD` | Item sold | Auto (webhook) | N/A |
| 10 | `FULFILL` | Pick, pack, ship | Manual | Physical fulfillment |
| 11 | `COMPLETE` | Shipped, tracking uploaded | Manual | Marks complete |

### Iterative AI Steps

Steps 2, 3, and 4 support **human-in-the-loop iteration**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI PROCESSING LOOP                            │
│                                                                  │
│   ┌─────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│   │  INPUT  │───►│  AI AGENT   │───►│  RESULT + CONFIDENCE    │ │
│   │ (photos,│    │             │    │                         │ │
│   │  UPC,   │    │ - Analyze   │    │  Confidence: 87%        │ │
│   │  etc.)  │    │ - API calls │    │  Title: "Sony PS5..."   │ │
│   └─────────┘    │ - Generate  │    │  Category: "Video Games"│ │
│                  └─────────────┘    └───────────┬─────────────┘ │
│                                                 │               │
│                        ┌────────────────────────┘               │
│                        ▼                                        │
│                  ┌───────────┐                                  │
│                  │  HUMAN    │                                  │
│                  │  REVIEW   │                                  │
│                  └─────┬─────┘                                  │
│                        │                                        │
│           ┌────────────┼────────────┐                          │
│           ▼            ▼            ▼                          │
│      ┌────────┐   ┌────────┐   ┌─────────┐                     │
│      │ ACCEPT │   │  EDIT  │   │  REDO   │                     │
│      │        │   │        │   │ w/context│                     │
│      └────┬───┘   └────┬───┘   └────┬────┘                     │
│           │            │            │                           │
│           ▼            ▼            │                           │
│      ┌─────────────────────┐        │                          │
│      │   NEXT STEP         │◄───────┘                          │
│      └─────────────────────┘   (loops back with new context)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step Completion Record

Every step completion is logged:

```typescript
interface StepCompletion {
  id: string;                    // UUID
  itemId: string;                // Item this applies to
  step: WorkflowStep;            // IDENTIFY, POPULATE, etc.
  completedBy: string;           // User ID
  completedAt: Date;             // Timestamp
  action: 'accept' | 'edit' | 'redo' | 'skip';
  aiConfidence?: number;         // 0-100 if AI-generated
  aiJustification?: string;      // AI's reasoning
  humanContext?: string;         // Context provided for redo
  duration: number;              // Seconds spent on this step
}
```

---

## 5. AI Agent System

### Agent Architecture

The AI agent is not a simple "call and response" but an **autonomous agent** that:
1. Receives a task (identify, populate, price)
2. Analyzes available data
3. Decides which tools/APIs to call
4. Iterates until confident
5. Returns result with justification

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI AGENT                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ORCHESTRATOR LLM                       │   │
│  │                                                           │   │
│  │  "I have photos of an item. Let me analyze them..."      │   │
│  │  "The image shows a vinyl record. I see a matrix number" │   │
│  │  "Let me query Discogs with matrix: ABC-123-A"           │   │
│  │  "Found match: Pink Floyd - Dark Side of the Moon"       │   │
│  │  "Confidence: 94%"                                        │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   VISION    │     │   DISCOGS   │     │  UPC LOOKUP │       │
│  │    TOOL     │     │    TOOL     │     │    TOOL     │       │
│  │             │     │             │     │             │       │
│  │ Analyze     │     │ Search by   │     │ Lookup by   │       │
│  │ images,     │     │ matrix,     │     │ barcode     │       │
│  │ read text,  │     │ artist,     │     │             │       │
│  │ identify    │     │ title       │     │             │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ SOLD DATA   │     │   ISBN DB   │     │  FUTURE     │       │
│  │   TOOL      │     │    TOOL     │     │   TOOLS     │       │
│  │             │     │             │     │             │       │
│  │ Search eBay │     │ Book lookup │     │ Amazon,     │       │
│  │ sold items  │     │             │     │ PriceChart, │       │
│  │             │     │             │     │ etc.        │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `vision_analyze` | Analyze item photos | Image(s) | Description, identifiers, condition |
| `discogs_search` | Find vinyl/CD releases | Matrix#, artist, title | Release details, market value |
| `upc_lookup` | Lookup barcode | UPC/EAN | Product name, brand, details |
| `isbn_lookup` | Lookup book | ISBN | Book details, author, publisher |
| `ebay_sold_search` | Find sold comparables | Search query | Sold items with prices |
| `ebay_category_suggest` | Get category ID | Item title | eBay category ID |
| `generate_title` | Create eBay title | Item details | 80-char optimized title |
| `generate_description` | Create listing description | Item details | HTML description |

### Confidence Scoring

Every AI output includes a confidence score:

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100% | High confidence | Auto-advance available |
| 70-89% | Medium confidence | Human review recommended |
| 50-69% | Low confidence | Human input required |
| <50% | Uncertain | Manual identification needed |

---

## 6. Security Model

### Permission Structure (AD-Like)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLATFORM                                 │
│                                                                  │
│  Platform Admins: [superadmin@platform]                         │
│  - Can create/delete domains                                    │
│  - Can view all data                                            │
│  - Cannot modify domain data directly                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DOMAIN: Alpha                         │    │
│  │                                                          │    │
│  │  Domain Admins: [alice@alpha]                           │    │
│  │  - Full control within domain                           │    │
│  │  - Manage users, eBay accounts, warehouses              │    │
│  │  - Configure trusts                                     │    │
│  │                                                          │    │
│  │  Users:                                                  │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ bob@alpha                                          │ │    │
│  │  │ Role: Lister                                       │ │    │
│  │  │ Permissions:                                       │ │    │
│  │  │   - INGEST: yes                                    │ │    │
│  │  │   - IDENTIFY: yes                                  │ │    │
│  │  │   - POPULATE: yes                                  │ │    │
│  │  │   - PRICE: yes                                     │ │    │
│  │  │   - REVIEW: yes                                    │ │    │
│  │  │   - APPROVE: yes                                   │ │    │
│  │  │   - LIST: yes                                      │ │    │
│  │  │   - FULFILL: no                                    │ │    │
│  │  │ eBay Accounts: [alpha_main, alpha_secondary]       │ │    │
│  │  │ Warehouses: [Warehouse A]                          │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ carol@alpha                                        │ │    │
│  │  │ Role: Shipper                                      │ │    │
│  │  │ Permissions:                                       │ │    │
│  │  │   - FULFILL: yes                                   │ │    │
│  │  │   - (all others): no                               │ │    │
│  │  │ eBay Accounts: [alpha_main] (view only)            │ │    │
│  │  │ Warehouses: [Warehouse A, Warehouse B]             │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  Trusts:                                                │    │
│  │  - Beta: fulfillment (Carol can ship Beta's orders)     │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Types

| Permission | Description |
|------------|-------------|
| `step:{STEP_NAME}` | Can perform workflow step |
| `ebay_account:{ACCOUNT_ID}` | Can list to this eBay account |
| `warehouse:{WAREHOUSE_ID}` | Can access this warehouse |
| `domain:admin` | Domain administrator |
| `domain:read` | Read-only access to domain |
| `trust:{DOMAIN_ID}:{TYPE}` | Cross-domain permission |

### Authentication

| Method | Use Case |
|--------|----------|
| JWT (short-lived) | Web client, API calls |
| Refresh Token | Token renewal |
| API Key | Server-to-server, integrations |
| Session Token | Desktop/mobile offline storage |

---

## 7. Data Model

### Entity Relationship Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Platform   │       │    Domain    │       │     User     │
│              │◄──────│              │◄──────│              │
│ - settings   │  1:N  │ - name       │  N:1  │ - email      │
│              │       │ - settings   │       │ - password   │
└──────────────┘       │              │       │ - role       │
                       └──────┬───────┘       └──────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ EbayAccount │  │  Warehouse  │  │    Item     │
     │             │  │             │  │             │
     │ - name      │  │ - name      │  │ - status    │
     │ - creds     │  │ - address   │  │ - step      │
     │ - sandbox   │  │ - locations │  │ - photos    │
     └─────────────┘  └─────────────┘  │ - listing   │
                                       │ - location  │
                                       └──────┬──────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │               │               │
                              ▼               ▼               ▼
                       ┌───────────┐  ┌───────────────┐  ┌─────────┐
                       │   Photo   │  │ StepCompletion│  │ Listing │
                       │           │  │               │  │         │
                       │ - path    │  │ - step        │  │ - ebayId│
                       │ - order   │  │ - user        │  │ - price │
                       │ - ai_data │  │ - timestamp   │  │ - status│
                       └───────────┘  │ - action      │  └─────────┘
                                      └───────────────┘
```

### Core Entities

See Section 8 (API) for full schema. Key entities:

- **Domain**: Tenant/organization
- **User**: Person with permissions
- **EbayAccount**: eBay seller credentials
- **Warehouse**: Physical location
- **WarehouseLocation**: Bin/shelf within warehouse
- **Item**: Thing being listed
- **Photo**: Image associated with item
- **ItemListing**: eBay listing details
- **StepCompletion**: Audit record
- **DomainTrust**: Cross-domain permission

---

## 8. API Specification

### Base URL
```
Production: https://api.consoleebay.com/api/v1
Development: http://localhost:3001/api/v1
```

### Authentication
All endpoints require authentication except `/auth/login` and `/auth/register`.

```
Authorization: Bearer <jwt_token>
```

### Endpoints Overview

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, get tokens |
| POST | `/auth/logout` | Invalidate tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

#### Domains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/domains` | List accessible domains |
| GET | `/domains/:id` | Get domain details |
| POST | `/domains` | Create domain (platform admin) |
| PATCH | `/domains/:id` | Update domain |
| GET | `/domains/:id/users` | List domain users |
| POST | `/domains/:id/trusts` | Create trust relationship |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (in accessible domains) |
| GET | `/users/:id` | Get user details |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| PATCH | `/users/:id/permissions` | Update permissions |

#### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | List items (filtered by domain, step, etc.) |
| GET | `/items/:id` | Get item details |
| POST | `/items` | Create item (INGEST step) |
| PATCH | `/items/:id` | Update item |
| DELETE | `/items/:id` | Delete item |
| POST | `/items/:id/photos` | Upload photos |
| DELETE | `/items/:id/photos/:photoId` | Delete photo |
| POST | `/items/:id/step` | Complete workflow step |
| POST | `/items/:id/redo` | Request AI redo with context |

#### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/identify` | Identify item from photos/identifiers |
| POST | `/ai/populate` | Generate listing content |
| POST | `/ai/price` | Get price suggestion |
| POST | `/ai/analyze-photo` | Analyze single photo |
| GET | `/ai/status/:jobId` | Check async job status |

#### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/listings` | Create eBay listing (LIST step) |
| GET | `/listings/:id` | Get listing details |
| PATCH | `/listings/:id` | Update listing |
| DELETE | `/listings/:id` | End listing |
| POST | `/listings/:id/revise` | Revise live listing |

#### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List warehouses |
| GET | `/warehouses/:id/locations` | List locations in warehouse |
| POST | `/inventory/assign` | Assign item to location |
| GET | `/inventory/search` | Search items by location |

#### Research
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/research/sold` | Search sold items |
| GET | `/research/price-stats` | Get pricing statistics |
| POST | `/research/suggest-price` | Get AI price suggestion |

#### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates for domain |
| GET | `/templates/:id` | Get template details |
| POST | `/templates` | Create template |
| PATCH | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Delete template |
| POST | `/templates/from-ebay` | Create template from eBay listing |
| POST | `/templates/:id/use` | Create item from template |

#### Sell Similar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell-similar/fetch/:ebayItemId` | Fetch eBay listing details |
| POST | `/sell-similar/create` | Create item from eBay listing |
| GET | `/sell-similar/cache/:ebayItemId` | Get cached listing (if exists) |

#### Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync/push` | Push local changes |
| GET | `/sync/pull` | Pull remote changes |
| GET | `/sync/status` | Get sync status |
| POST | `/sync/resolve` | Resolve conflicts |

---

## 9. Client Architecture

### Web Client (React)

**Purpose**: Dashboard, administration, anywhere access

**Features**:
- Domain/user management
- Real-time workflow queue
- Reporting and analytics
- Bulk operations
- Always-online (no offline capability)

**Key Screens**:
1. Dashboard - Queue overview, stats
2. Item Queue - Kanban or list view of items by step
3. Item Detail - Full item view with AI results
4. Listings - Active/sold listings
5. Inventory - Location browser
6. Settings - Domain, users, eBay accounts

### Desktop Client (Electron)

**Purpose**: Primary listing workstation, photo processing, bulk operations

**Features**:
- Full offline capability
- Local SQLite database
- SD card import and photo grouping
- Local AI inference (photo normalization)
- Batch processing
- Sync when connected

**Key Screens**:
1. Photo Importer - SD card ingestion, grouping
2. Processing Queue - Items awaiting AI/review
3. Review Station - Full-screen item review
4. Bulk Pricer - Set prices for multiple items
5. Listing Queue - Ready to list, one-click publish
6. Sync Status - Connection, pending changes

### Mobile Client (React Native)

**Purpose**: Photo capture, quick listings, fulfillment

**Features**:
- Camera integration
- Barcode scanning (UPC, ISBN)
- Offline capable
- Location assignment (scan item, scan bin)
- Order fulfillment (pick list)

**Key Screens**:
1. Camera - Capture photos for new item
2. Scan - UPC/ISBN/matrix entry
3. Quick Review - Swipe through AI results
4. Fulfill - Pick list, scan to confirm
5. Sync - Manual sync trigger

---

## 10. Sync Protocol

### Change Tracking

Each syncable entity has:
- `localId`: Client-generated UUID
- `serverId`: Server-assigned ID (null until synced)
- `version`: Incrementing version number
- `modifiedAt`: Timestamp of last modification
- `syncStatus`: `synced` | `pending` | `conflict`

### Sync Flow

```
CLIENT                                    SERVER
   │                                         │
   │  1. Collect pending changes             │
   │     (new items, edits, photos)          │
   │                                         │
   ├──────── POST /sync/push ───────────────►│
   │         {changes: [...]}                │
   │                                         │
   │         2. Server processes changes     │
   │            - Validates permissions      │
   │            - Detects conflicts          │
   │            - Applies non-conflicts      │
   │                                         │
   │◄─────── Response ──────────────────────┤
   │         {applied: [...],               │
   │          conflicts: [...]}             │
   │                                         │
   │  3. If conflicts, show to user          │
   │     User chooses: keep local | server   │
   │                                         │
   ├──────── POST /sync/resolve ────────────►│
   │         {resolutions: [...]}            │
   │                                         │
   │◄─────── Confirmed ─────────────────────┤
   │                                         │
   ├──────── GET /sync/pull ────────────────►│
   │         ?since=<last_sync_timestamp>    │
   │                                         │
   │◄─────── Remote changes ────────────────┤
   │         {changes: [...]}               │
   │                                         │
   │  4. Apply remote changes locally        │
   │                                         │
```

### Conflict Resolution

**Rule**: If there are conflicts, user broke the protocol. They must resolve.

**UI**: Show side-by-side comparison:
```
┌─────────────────────────────────────────────┐
│            SYNC CONFLICT                     │
├─────────────────────────────────────────────┤
│                                             │
│  Item: "Sony PlayStation 5 Console"         │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │   LOCAL         │  │   SERVER        │  │
│  │                 │  │                 │  │
│  │ Price: $499.99  │  │ Price: $449.99  │  │
│  │ Modified: 2:30pm│  │ Modified: 2:45pm│  │
│  │ By: You         │  │ By: Alice       │  │
│  │                 │  │                 │  │
│  │  [ KEEP THIS ]  │  │  [ KEEP THIS ]  │  │
│  └─────────────────┘  └─────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 11. External Integrations

### eBay API

**APIs Used**:
- Trading API (legacy, still required for some operations)
- Inventory API (modern RESTful)
- Browse API (search)
- Taxonomy API (categories)

**Operations**:
- OAuth flow for account connection
- Create/revise/end listings
- Upload images
- Get orders (sold notifications)
- Upload tracking

### Discogs API

**Purpose**: Vinyl record and CD identification

**Operations**:
- Search by matrix number
- Search by artist/title
- Get release details (tracks, year, label)
- Get marketplace statistics

### UPC Database API

**Purpose**: Barcode lookup

**Operations**:
- Lookup by UPC/EAN
- Returns product name, brand, category

### Segmind API (Vision/LLM)

**Purpose**: Image analysis and content generation

**Models**:
- LLaVA (vision-language model)
- Claude (text generation)

**Operations**:
- Analyze product photos
- Read text/labels in images
- Generate titles and descriptions

---

## 12. Deployment

### Development
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Services:
# - PostgreSQL (5432)
# - Redis (6379)
# - API Server (3001)
# - Web Client (5173)
```

### Production

**Infrastructure**:
- PostgreSQL (managed: AWS RDS or similar)
- Redis (managed: AWS ElastiCache or similar)
- API Server (containerized, auto-scaling)
- Web Client (static hosting: Cloudflare, Vercel)
- File Storage (S3 for photos, temporary)

**Environment Variables**:
```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
JWT_SECRET=<random-32-chars>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# eBay
EBAY_CLIENT_ID=...
EBAY_CLIENT_SECRET=...
EBAY_REDIRECT_URI=...

# AI
SEGMIND_API_KEY=...

# External APIs
DISCOGS_TOKEN=...
UPC_API_KEY=...
```

---

## 13. Templates & Sell Similar

### Overview

Templates and Sell Similar are **productivity accelerators** that allow users to create listings faster by reusing existing listing data. They reduce per-item time significantly for frequently listed item types.

### Template System

#### What is a Template?

A **ListingTemplate** is a reusable blueprint for creating listings. It contains:

- **Title Template**: With placeholder support (`{Brand} {Model} {Condition}`)
- **Category**: Pre-selected eBay category
- **Item Specifics**: Pre-filled with locked/required flags
- **Description Template**: HTML with placeholders
- **Pricing Guidance**: Suggested price range
- **Shipping Defaults**: Estimated weight, dimensions, cost

#### Template Sources

Templates can be created from multiple sources:

| Source | Description |
|--------|-------------|
| `MANUAL` | Created from scratch in template editor |
| `SELL_SIMILAR` | Created from an eBay listing fetch |
| `AI_GENERATED` | AI creates based on product category |
| `IMPORTED` | Imported from CSV/external source |

#### Placeholder System

Templates support placeholders in title and description:

```
Title Template: "Sony PlayStation 5 {Edition} Edition {Storage} - {Condition}"
         ↓
Rendered Title: "Sony PlayStation 5 Disc Edition 825GB - Used Like New"
```

**Standard Placeholders**:
- `{Brand}`, `{Model}`, `{Manufacturer}` - From item specifics
- `{Condition}`, `{Cond}` - Condition name (short/long)
- `{Title}` - Full generated title (in description)
- `{input}` - User must provide value

**Item Specific Placeholders**:
- `{Storage}`, `{Color}`, `{Edition}` - Any item specific name

#### Item Specifics Configuration

Each item specific in a template can be:

| Flag | Meaning |
|------|---------|
| `locked` | Value cannot be changed by user |
| `required` | Value must be provided before listing |
| `{input}` | Placeholder - user must enter value |

Example configuration:
```json
[
  {"name": "Brand", "value": "Sony", "locked": true, "required": true},
  {"name": "Model", "value": "{input}", "locked": false, "required": true},
  {"name": "Color", "value": "{input}", "locked": false, "required": false}
]
```

### Sell Similar

#### What is Sell Similar?

**Sell Similar** allows creating a new item by cloning data from an existing eBay listing. This is useful when:

- You're selling the same item type as another seller
- You want to match a competitor's listing format
- You're relisting your own sold items

#### Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER                           SYSTEM                    EBAY API      │
│    │                               │                          │         │
│    │  1. Enter eBay Item ID        │                          │         │
│    │ ───────────────────────────►  │                          │         │
│    │                               │  2. Check cache           │         │
│    │                               │ ──────────────────────►  │         │
│    │                               │  3. Fetch via Browse API │         │
│    │                               │ ◄────────────────────────│         │
│    │  4. Display fetched data      │                          │         │
│    │ ◄───────────────────────────  │                          │         │
│    │                               │                          │         │
│    │  5. Select what to copy       │                          │         │
│    │ ───────────────────────────►  │                          │         │
│    │                               │  6. Create Item          │         │
│    │  7. Proceed to photo capture  │                          │         │
│    │ ◄───────────────────────────  │                          │         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Fetched from eBay

| Field | Copied | Notes |
|-------|--------|-------|
| Title | ✓ | User can modify |
| Category | ✓ | Category ID and name |
| Condition | ✓ | Condition ID and name |
| Item Specifics | ✓ | All available specifics |
| Description | ✓ | HTML content |
| Price | ○ | Optional - user sets own price |
| Images | ✗ | Never copied - user must take own photos |
| Shipping | ○ | Optional - estimated cost |

#### Caching

Fetched eBay listings are cached in `SellSimilarCache` for 24 hours to:
- Reduce API calls
- Speed up repeated lookups
- Store data for multiple users

#### Save as Template

When using Sell Similar, users can optionally save the listing data as a reusable template:

```
☐ Save as reusable template: [PS5 Console Template    ]
```

This creates a `ListingTemplate` with `sourceType: SELL_SIMILAR`.

### Using Templates vs. Sell Similar

| Feature | Template | Sell Similar |
|---------|----------|--------------|
| Source | Internal database | Live eBay API |
| Reusable | ✓ (unlimited uses) | ○ (one-time) |
| Placeholders | ✓ | ✗ |
| Locked fields | ✓ | ✗ |
| Cached | Permanent | 24 hours |
| Best for | Frequently listed items | One-off similar items |

### Template Best Practices

1. **Create templates for high-volume items**: If you list >5 of the same item type, make a template
2. **Lock unchanging specifics**: Brand, Platform, etc. should be locked
3. **Use placeholders wisely**: Model numbers, storage sizes, colors should be `{input}`
4. **Set realistic price ranges**: Update as market changes
5. **Include shipping estimates**: Speeds up pricing step
6. **Add reference images**: Helps users identify correct item type (not used in listings)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Domain | A tenant/organization using the platform |
| Trust | Permission grant between domains |
| Step | A discrete phase in the listing workflow |
| Item | A product being listed |
| Listing | The eBay listing created from an item |
| Location | A physical storage position (bin, shelf) |
| Confidence | AI's certainty in its output (0-100%) |
| Template | A reusable listing blueprint with pre-filled fields |
| Sell Similar | Creating an item by cloning data from an existing eBay listing |
| Placeholder | A variable in templates (`{Brand}`) replaced with actual values |
| Locked Specific | An item specific that cannot be changed when using a template |

---

## Appendix B: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-01 | Initial CLI-focused version |
| 2.0 | 2025-12-05 | Multi-tenant platform redesign |
| 2.1 | 2025-12-05 | Added Templates & Sell Similar functionality |
