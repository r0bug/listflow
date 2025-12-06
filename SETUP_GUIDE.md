# ListFlow Setup Guide

## What is ListFlow?

ListFlow is a **modern, production-ready reboot** of your eBaytools project with:
- ✅ **Real-time web interface** (React + TypeScript)
- ✅ **Modern API backend** (Node.js + Express)
- ✅ **Proper database** (PostgreSQL with Prisma ORM)
- ✅ **Queue system** (Redis + Bull for background jobs)
- ✅ **11-stage workflow** from photo import to fulfillment
- ✅ **Multi-tenant support** for multiple sellers/teams
- ✅ **AI integration** (Segmind API for image analysis)
- ✅ **eBay API integration** (official SDK)

## Comparison with Old eBaytools

| Feature | Old eBaytools | ListFlow |
|---------|---------------|----------|
| UI | Python Tkinter | React Web App |
| Database | JSON files | PostgreSQL |
| Architecture | Desktop app | Web + API + Desktop |
| Multi-user | No | Yes (multi-tenant) |
| Workflow | Manual | 11-stage pipeline |
| Pricing Data | **Simulated** | **Real** (via API integration) |
| Deployment | Local only | Docker, cloud-ready |
| Modern | No | Yes |

## Current Status

**Dependencies Needed:**
- ✅ Node.js 20.19.4 (installed)
- ✅ npm 9.2.0 (installed)
- ✅ Git (installed)
- ❌ PostgreSQL (needs installation)
- ❌ Redis (needs installation)

## Installation Steps

### Step 1: Install PostgreSQL and Redis

Run the dependency installer with sudo:

```bash
cd /home/ynebay/listflow
sudo ./INSTALL_DEPENDENCIES.sh
```

This will:
- Install PostgreSQL 14+
- Install Redis 6+
- Create database user: `listflow`
- Create database: `listflow`
- Start both services

### Step 2: Run the ListFlow Installer

After dependencies are installed:

```bash
cd /home/ynebay/listflow
./install.sh
```

The installer will:
- Install Node.js dependencies (npm install)
- Set up the database schema (Prisma migrations)
- Create configuration files
- Build the frontend
- Offer to create system services

### Step 3: Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
nano .env
```

**Required Configuration:**

```bash
# Database (auto-configured by installer)
DATABASE_URL=postgresql://listflow:listflow123@localhost:5432/listflow

# Redis (auto-configured)
REDIS_URL=redis://localhost:6379

# Security (auto-generated or set manually)
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# AI Integration (REQUIRED - get from Segmind)
SEGMIND_API_KEY=your_segmind_api_key_here
SEGMIND_MODEL=llava-v1.6

# eBay API (REQUIRED - get from eBay Developer)
EBAY_APP_ID=your_ebay_app_id_here
EBAY_CERT_ID=your_ebay_cert_id_here
EBAY_DEV_ID=your_ebay_dev_id_here
EBAY_AUTH_TOKEN=your_ebay_auth_token_here
EBAY_SANDBOX=true

# PayPal
PAYPAL_EMAIL=your_paypal_email@example.com

# Seller Info
SELLER_POSTAL_CODE=98012
```

### Step 4: Get API Keys

#### Segmind API Key (for AI image analysis)
1. Go to https://www.segmind.com/
2. Create an account
3. Get API key from dashboard
4. Add to `.env` file

#### eBay Developer Credentials
1. Go to https://developer.ebay.com/
2. Create developer account
3. Create application
4. Get App ID, Cert ID, Dev ID
5. Generate OAuth token
6. Add to `.env` file

### Step 5: Start ListFlow

```bash
cd /home/ynebay/listflow
./start.sh
```

This will:
- Start the backend API (port 3001)
- Start the web interface (port 5173)
- Open your browser automatically

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ListFlow Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │  Web Client  │────▶│   Backend    │───▶│  PostgreSQL  │ │
│  │   (React)    │     │  (Node.js)   │    │   Database   │ │
│  │  Port 5173   │     │  Port 3001   │    │              │ │
│  └──────────────┘     └──────────────┘    └──────────────┘ │
│         │                     │                             │
│         │                     ├───▶ Redis (Queue)          │
│         │                     │                             │
│         │                     ├───▶ Segmind AI             │
│         │                     │                             │
│         │                     └───▶ eBay API               │
│         │                                                   │
│  ┌──────────────┐                                          │
│  │Desktop Client│ (optional)                               │
│  │  (Electron)  │                                          │
│  └──────────────┘                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 11-Stage Workflow

1. **INGEST** - Photos uploaded via web interface
2. **IDENTIFY** - AI identifies the item from photos
3. **POPULATE** - AI generates title, description, specifics
4. **PRICE** - AI suggests pricing from market data
5. **REVIEW** - Human reviews AI-generated content
6. **APPROVE** - Human assigns storage location
7. **LIST** - System pushes to eBay
8. **LISTED** - Live on eBay marketplace
9. **SOLD** - Item sold, awaiting fulfillment
10. **FULFILL** - Pick, pack, ship process
11. **COMPLETE** - Order completed, metrics tracked

## Key Features vs Old eBaytools

### 1. Real Pricing Data
**Old:** Simulated random data
**New:** Real eBay sold listings via:
- Segmind API for sold data scraping
- eBay Marketplace Insights API (if approved)
- SerpAPI integration (optional)

### 2. Multi-User Workflow
**Old:** Single user desktop app
**New:** Multiple users with roles:
- **Photographer:** Upload photos via mobile
- **Processor:** Review AI results
- **Pricer:** Set final prices
- **Publisher:** Approve for eBay
- **Fulfillment:** Handle shipping

### 3. Queue Management
**Old:** Manual list
**New:** Kanban board with:
- Drag & drop between stages
- Bulk operations
- Filtering and search
- Real-time updates

### 4. Template System
**Old:** None
**New:** Reusable listing templates:
- Save common item configurations
- Import from existing eBay listings
- Placeholders for dynamic content
- Category-specific templates

### 5. Performance Tracking
**Old:** None
**New:** Metrics dashboard:
- Items processed per user
- Processing time per stage
- Error rates
- Revenue tracking

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Test connection
psql -U listflow -d listflow -h localhost
# Password: listflow123
```

### Redis Connection Failed

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Check what's using port 3001 (backend)
sudo lsof -i :3001

# Check what's using port 5173 (frontend)
sudo lsof -i :5173

# Kill the process
sudo kill -9 <PID>
```

### NPM Install Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps After Installation

1. **Access the Web Interface:**
   - Open http://localhost:5173 in your browser
   - Default login will be created on first run

2. **Upload Your First Photos:**
   - Go to Import screen
   - Drag & drop photos
   - AI will analyze and group them

3. **Review AI Results:**
   - Go to Queue screen
   - Click on items in IDENTIFY stage
   - Review AI-generated content

4. **Configure eBay Integration:**
   - Go to Settings
   - Enter eBay credentials
   - Test connection

5. **Create Templates:**
   - Go to Templates screen
   - Create templates for common item types
   - Import from existing eBay listings

## Migration from Old eBaytools

If you have data in the old eBaytools:

1. **Export from old system:**
   ```bash
   cd /home/ynebay/Ebaytools/Ebaytools
   # Export queue data, templates, etc.
   ```

2. **Import to ListFlow:**
   ```bash
   cd /home/ynebay/listflow
   npm run migrate -- --from-ebaytools /path/to/old/data
   ```

## Docker Alternative (Optional)

If you prefer Docker instead of local PostgreSQL/Redis:

```bash
cd /home/ynebay/listflow
cp .env.example .env
# Edit .env with your API keys
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend (port 3001)
- Frontend (port 5173)

Access: http://localhost:5173

## Production Deployment

For production deployment:

```bash
# Build frontend
cd client && npm run build

# Set production environment
export NODE_ENV=production

# Start with PM2 (process manager)
npm install -g pm2
pm2 start src/server.ts --name listflow-api
pm2 start "cd client && npm run preview" --name listflow-web
pm2 save
pm2 startup
```

## Support & Documentation

- **Full Spec:** See `SPEC.md`
- **GUI Wireframes:** See `GUI_WIREFRAMES.md`
- **Development Guide:** See `CLAUDE.md`
- **API Reference:** See `SEGMIND_API_REFERENCE.md`

## Comparison: What You Get with ListFlow

### eBaytools (Old)
- ❌ Simulated pricing data (unusable for production)
- ❌ Desktop-only Python/Tkinter UI
- ❌ Single user workflow
- ❌ JSON file "database"
- ❌ No queue management
- ❌ No templates
- ❌ No metrics
- ❌ Difficult to deploy
- ✅ Good search extraction logic

### ListFlow (New)
- ✅ **Real pricing data** (Segmind, eBay API, SerpAPI)
- ✅ **Modern web UI** (React, responsive)
- ✅ **Multi-user** with roles and permissions
- ✅ **PostgreSQL database** (production-ready)
- ✅ **Queue management** (Kanban board)
- ✅ **Template system** (reusable blueprints)
- ✅ **Performance metrics** (tracking & analytics)
- ✅ **Cloud-ready** (Docker, PM2, scalable)
- ✅ **Uses old eBaytools search logic** (imported and enhanced)

## Summary

**Time to Production:**
- Install dependencies: 5-10 minutes
- Run installer: 5 minutes
- Configure API keys: 10 minutes
- Test & verify: 10 minutes
- **Total: ~30 minutes**

**vs Old eBaytools:**
- Old: 15 minutes to install, but **unusable** (fake data)
- New: 30 minutes to install, **production-ready** (real data)

**ROI:**
- Old: $0 investment, $0 value (can't use fake data)
- New: $50-200/month APIs, immediately useful for real business

**Recommendation:**
Switch to ListFlow for production use. The old eBaytools has good ideas but fundamentally broken pricing (simulated data). ListFlow fixes this and adds multi-user workflow, proper database, and modern architecture.
