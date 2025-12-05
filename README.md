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
- **Photo Import** - Drag-and-drop with automatic AI grouping
- **Queue/Kanban View** - Visual workflow management
- **Item Detail/Review** - Full listing editor with AI assistance
- **Template Manager** - Reusable listing blueprints with placeholders
- **PIN Authentication** - Quick user switching on shared workstations

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
- **AI/Vision**: Segmind API (LLaVA)
- **State Management**: Zustand
- **Routing**: React Router 7
- **eBay Integration**: @hendt/ebay-api
- **Image Processing**: Sharp, Puppeteer (sold data scraping)

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
│   │   ├── ebay.service.ts       # eBay API integration
│   │   ├── ai.service.ts         # AI/vision models
│   │   ├── soldData.service.ts   # Sold data scraping
│   │   └── cleanup.service.ts    # File maintenance
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
├── prisma/
│   ├── schema.prisma             # Current schema
│   └── schema.v2.prisma          # V2 multi-tenant schema
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

## Documentation

- **SPEC.md** - Full platform specification
- **GUI_WIREFRAMES.md** - ASCII wireframes for all screens
- **CLAUDE.md** - Development guidelines and security rules

## License

ISC
