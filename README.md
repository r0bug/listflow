# ListFlow - Multi-Tenant eBay Operations Platform

A comprehensive, AI-powered eBay listing workflow system that automates the listing process while maintaining human oversight. Built for scale with multi-tenant support.

> **Repository**: https://github.com/r0bug/listflow

## Features

### Core Platform
- **Multi-Tenant Architecture** - Domains (organizations) with trust relationships
- **11-Stage Workflow Pipeline** - From photo import to fulfillment
- **AI-First Automation** - Vision models identify items, generate content, suggest pricing
- **Human-Final Review** - All listings require human approval before going live
- **Offline-Capable Clients** - Desktop and mobile apps work without connectivity
- **Performance Tracking** - Per-user metrics for compensation and optimization

### Web Client (React)
- **Dashboard** - Real-time queue overview, stats, and alerts
- **Photo Import** - Drag-and-drop with automatic AI grouping (JPG, PNG, WebP, HEIC)
- **Queue/Kanban View** - Visual workflow management
- **Item Detail/Review** - Full listing editor with AI assistance
- **Photo Editor** - Crop, rotate, brightness/contrast adjustment with live preview
- **Photo Management** - Drag-to-reorder, set primary, delete with mobile touch support
- **Template Manager** - Reusable listing blueprints with placeholders
- **Reports** - Sales analytics with charts and team performance
- **Sell Similar** - Create listings from existing eBay items
- **Price Research** - Sold data lookup with statistics + comptool sold comp integration
- **Analytics Dashboard** - Stage funnel, daily throughput, AI costs, per-lister metrics
- **Platform Adapters** - Multi-platform push (eBay + Yakcat, extensible to Amazon/Etsy)
- **PIN Authentication** - Quick user switching on shared workstations
- **UPC/ISBN Detection** - AI reads barcodes from photos, manual entry supported
- **CSV Export** - eBay Seller Hub Reports compatible batch export
- **Required Specifics** - Auto-fetches eBay-required item specifics per category with value dropdowns

### Design System ("Warm Industrial")
- **Typography**: DM Sans (body) + Fraunces (display/headings)
- **Color Palette**: Slate (neutrals), Ink (primary blue), Amber (warm accent), Sage (success), Coral (error), Plum (tags/badges)
- **Component Library**: Cards, buttons, badges, stat cards, inputs, and table styles via CSS custom properties
- **Built on**: Tailwind CSS v4 with `@theme` directive for design tokens

### Workflow Steps
1. `INGEST` - Photos/identifiers enter system
2. `IDENTIFY` - AI determines what the item is
3. `POPULATE` - AI generates listing content
4. `PRICE` - AI suggests price from market data
5. `REVIEW` - Human reviews all fields
6. `APPROVE` - Human assigns location
7. `LIST` - Push to eBay
8. `LISTED` - Live on eBay
9. `SOLD` - Item sold
10. `FULFILL` - Pick, pack, ship
11. `COMPLETE` - Order completed

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, Vite 5, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with Bull
- **AI/Vision**: Claude Sonnet 4 (via Anthropic API), Segmind API (LLaVA)
- **State Management**: Zustand
- **Routing**: React Router 7
- **eBay Integration**: @hendt/ebay-api
- **Image Processing**: Sharp
- **Price Research**: Playwright (Firefox) for eBay sold data scraping

## Prerequisites

- Node.js 18+ (20+ recommended)
- PostgreSQL 14+
- Redis
- eBay Developer Account
- Segmind API Key

## Installation

### Automated Installer (Recommended)

The installer automatically detects dependencies, handles upgrades, and migrates data.

#### Linux/macOS

```bash
# Clone the repository
git clone https://github.com/r0bug/listflow.git
cd listflow

# Run the installer
chmod +x install.sh
./install.sh
```

#### Windows

```powershell
# Clone the repository
git clone https://github.com/r0bug/listflow.git
cd listflow

# Run the installer (double-click or from PowerShell)
.\install.bat
```

#### Installer Features

- **Dependency Detection**: Checks for Node.js 18+, PostgreSQL 14+, Redis 6+
- **Auto-Install**: Offers to install missing dependencies (Linux/macOS/Windows)
- **Upgrade Detection**: Detects existing installations and preserves data
- **Automatic Backup**: Creates backups before upgrades
- **Database Migration**: Runs Prisma migrations automatically
- **Configuration Wizard**: Interactive setup for database, Redis, and API keys
- **Service Creation**: Optional systemd service (Linux) or desktop shortcuts (Windows)

#### Installer Options

```bash
# Check dependencies only
./install.sh --check

# Show help
./install.sh --help

# Show version
./install.sh --version
```

### Quick Start (After Installation)

```bash
# Linux/macOS
./start.sh

# Windows
start.bat
```

This will start both backend and frontend servers and open your browser.

### Using Docker

```bash
# Clone and configure
git clone https://github.com/r0bug/listflow.git
cd listflow
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d
```

Services:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Backend API: `http://localhost:3001`
- Web Client: `http://localhost:5173`

### Manual Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Generate Prisma client
npx prisma generate

# Run migrations (requires PostgreSQL)
npx prisma migrate dev

# Start backend (Terminal 1)
npm run dev

# Start frontend (Terminal 2)
cd client && npm run dev
```

## Project Structure

```
listflow/
├── install.sh                    # Linux/macOS installer
├── install.ps1                   # Windows PowerShell installer
├── install.bat                   # Windows batch wrapper
├── start.sh                      # Linux/macOS quick start
├── start.bat                     # Windows quick start
├── src/                          # Backend source code
│   ├── controllers/              # Request handlers
│   ├── services/                 # Business logic
│   │   ├── ebay.service.ts       # eBay API integration (PlatformAdapter)
│   │   ├── ai.service.ts         # AI/vision models (+ price suggestions + Zod validation)
│   │   ├── comptool.service.ts   # Comptool sold comp pricing integration
│   │   ├── csvExport.service.ts  # eBay File Exchange CSV export
│   │   ├── imageHosting.service.ts # Public image hosting for exports
│   │   ├── soldData.service.ts   # Sold data scraping
│   │   └── cleanup.service.ts    # File maintenance
│   ├── adapters/                 # Platform adapter interface
│   │   ├── platform.adapter.ts   # PlatformAdapter interface
│   │   └── yakcat.adapter.ts     # Yakcat consignment mall adapter
│   ├── queues/                   # Async job queues (Bull/Redis)
│   │   └── push.queue.ts         # Platform push queue (eBay, Yakcat)
│   ├── routes/                   # API routes
│   ├── middleware/               # Auth, rate limiting
│   └── server.ts                 # Express server
├── client/                       # React web client
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Header, StatusBar
│   │   │   ├── screens/          # Dashboard, Queue, Templates, etc.
│   │   │   └── common/           # Shared components
│   │   ├── stores/               # Zustand state
│   │   ├── types/                # TypeScript definitions
│   │   └── App.tsx               # Main app with routing
├── scripts/
│   └── ebay-sold-lookup.ts      # Playwright eBay sold price lookup tool
├── prisma/
│   └── schema.prisma             # Database schema
├── docs/
│   ├── EBAY_CSV_REFERENCE.md     # eBay Seller Hub Reports CSV spec
│   └── BUG_JOURNAL.md            # Bug tracking and fix log
├── SPEC.md                       # Full platform specification
├── GUI_WIREFRAMES.md             # ASCII wireframes
└── CLAUDE.md                     # Development guidelines
```

## Web Client Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/login` | PIN Login | User authentication |
| `/` | Dashboard | Stats, queue overview |
| `/import` | Photo Import | Upload and group photos |
| `/queue` | Queue | Kanban/list view of items |
| `/queue/:step` | Queue (filtered) | Items at specific step |
| `/item/:id` | Item Detail | Review/edit single item |
| `/templates` | Templates | Manage listing templates |
| `/templates/:id/edit` | Template Editor | Edit template |
| `/inventory` | Inventory | Location browser |
| `/listings/active` | Active Listings | Live eBay listings |
| `/listings/sold` | Sold Listings | Completed sales |
| `/research` | Price Research | Sold data lookup |
| `/analytics` | Analytics | Throughput, costs, stage funnel |
| `/settings` | Settings | Configuration |

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Email/password login
- `POST /api/v1/auth/pin-login` - PIN login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Items
- `GET /api/v1/items` - List items (filtered)
- `GET /api/v1/items/:id` - Get item details
- `POST /api/v1/items` - Create item
- `PATCH /api/v1/items/:id` - Update item
- `POST /api/v1/items/:id/photos` - Upload photos
- `POST /api/v1/items/:id/step` - Complete workflow step
- `POST /api/v1/items/:id/redo` - Request AI redo

### Templates
- `GET /api/v1/templates` - List templates
- `POST /api/v1/templates` - Create template
- `POST /api/v1/templates/from-ebay` - Create from eBay listing
- `POST /api/v1/templates/:id/use` - Use template to create item

### Sell Similar
- `GET /api/v1/sell-similar/fetch/:ebayItemId` - Fetch eBay listing
- `POST /api/v1/sell-similar/create` - Create item from listing

### Export
- `POST /api/v1/export/csv` - Export items as eBay Seller Hub Reports CSV
- `GET /api/v1/export/preview/:itemId` - Preview CSV data for single item

### Photo Pool
- `POST /api/pool/upload` - Upload photos to pool
- `POST /api/pool/create-items` - Create items from pooled photos
- `POST /api/pool/attach-to-item` - Attach pooled photos to existing items

### Dashboard (Extended)
- `POST /api/dashboard/item/:id/photos` - Upload photos to existing items
- `PATCH /api/dashboard/item/:id/photos/reorder` - Reorder photos
- `PATCH /api/dashboard/item/:id/photos/:photoId/primary` - Set primary photo
- `DELETE /api/dashboard/item/:id/photos/:photoId` - Delete photo
- `POST /api/dashboard/item/:id/photos/:photoId/edit` - Edit photo (crop/rotate/brightness/contrast)
- `POST /api/dashboard/item/:id/suggest-price` - AI price suggestion
- `POST /api/dashboard/item/:id/push-to-ebay` - Push single item to eBay
- `POST /api/dashboard/items/bulk-push-to-ebay` - Batch push to eBay
- `GET /api/dashboard/listing-defaults` - Get location listing defaults
- `PUT /api/dashboard/listing-defaults` - Save location listing defaults
- `GET /api/dashboard/category/:categoryId/specifics` - Fetch required eBay item specifics for category
- `GET /api/dashboard/analytics` - Analytics dashboard data (stage funnel, throughput, AI costs)
- `GET /api/dashboard/item/:id/comps` - Get comptool sold comp pricing data
- `GET /api/dashboard/queue/push-status` - Bull queue job status (waiting/active/completed/failed)

### Research
- `POST /api/v1/research/sold` - Search sold items
- `GET /api/v1/research/price-stats` - Get pricing statistics

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/consoleebay

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key

# eBay
EBAY_CLIENT_ID=your-client-id
EBAY_CLIENT_SECRET=your-client-secret

# AI
SEGMIND_API_KEY=your-api-key

# Comptool pricing integration (optional)
DATABASE_URL_COMPTOOL=postgresql://user:pass@localhost:5432/comptool

# Yakcat platform adapter (optional)
YAKCAT_API_URL=https://webcat.yakimafinds.com
YAKCAT_API_KEY=your-yakcat-api-key

# Image hosting (set to public URL for eBay)
PUBLIC_IMAGE_BASE_URL=https://your-server.com
```

## Development

```bash
# Run backend
npm run dev

# Run frontend
cd client && npm run dev

# Build frontend
cd client && npm run build

# Open Prisma Studio
npm run prisma:studio

# Run CLI
npm run cli
```

## Scripts

### eBay Sold Price Lookup

Standalone Playwright-based tool that scrapes eBay sold/completed listings for price research.

```bash
# Basic search
npx ts-node scripts/ebay-sold-lookup.ts "Nintendo 64 console"

# Limit results
npx ts-node scripts/ebay-sold-lookup.ts "vintage leather jacket" --limit 20

# JSON output (for programmatic use)
npx ts-node scripts/ebay-sold-lookup.ts "iPhone 15 Pro" --json

# Debug with visible browser
npx ts-node scripts/ebay-sold-lookup.ts "rare coin" --show-browser
```

Returns per-item title, price, shipping, condition, date sold, and URL, plus aggregate stats (average, median, price range).

## Documentation

- **SPEC.md** - Full platform specification
- **GUI_WIREFRAMES.md** - ASCII wireframes for all screens
- **CLAUDE.md** - Development guidelines and security rules

## License

ISC
