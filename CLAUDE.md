# ConsoleEbay Project Guidelines

## Project Overview
Multi-platform eBay listing workflow system with:
- **Web Interface (Port 80)**: Mobile-optimized for photo capture using device cameras
- **CLI Tool**: Desktop console application for processing items
- **Shared Backend**: Unified API serving both web and CLI interfaces
- **Role-Based Workflow**: Different employees handle different stages of processing

## Security Guidelines
**CRITICAL: Never commit secrets or API keys to the repository**

### Environment Variables to Keep Secret
The following must ONLY exist in `.env` files and NEVER in committed code:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4 Vision
- `EBAY_APP_ID` - eBay application ID
- `EBAY_CERT_ID` - eBay certificate ID  
- `EBAY_DEV_ID` - eBay developer ID
- `EBAY_AUTH_TOKEN` - eBay authentication token
- `PAYPAL_EMAIL` - PayPal email for payments
- `DATABASE_URL` - PostgreSQL connection string
- Any other API keys or credentials

### Before Committing
1. Always check that `.env` is in `.gitignore`
2. Never hardcode API keys, use `process.env.KEY_NAME`
3. Review all changes for accidental credential exposure
4. Use example values in documentation (`.env.example`)

## Architecture

### Dual Interface System
1. **Web Application (Port 80)**
   - Mobile-optimized camera interface for photographers
   - Accessible from phones/tablets for photo capture
   - Runs through nginx reverse proxy
   - Real-time camera access using getUserMedia API

2. **CLI Tool (Console)**
   - Desktop application for processors, pricers, publishers
   - Interactive command-line interface
   - Batch processing capabilities
   - Can be run locally or over SSH

### Workflow Stages
1. **Photo Upload** (Web/Mobile) - Photographers capture images
2. **AI Processing** (Automatic) - Segmind API analyzes images
3. **Review & Edit** (CLI/Web) - Processors verify AI results
4. **Manual Pricing** (CLI/Web) - Pricers set prices
5. **Final Review** (CLI/Web) - Publishers approve for eBay

## Project Tasks

### ✅ Completed Features
- [x] Multi-stage workflow system with role-based access
- [x] Segmind API integration (LLaVA, Claude models)
- [x] Database schema with user roles and audit trail
- [x] Mobile-optimized photo capture interface
- [x] CLI tool for desktop processing
- [x] Nginx configuration for port 80
- [x] Docker compose setup
- [x] Unified backend serving both interfaces

### Technical Tasks
- [x] Complete React frontend setup with Vite
- [ ] Implement drag-and-drop with react-dropzone
- [x] Set up PostgreSQL database with Prisma
- [ ] Create Docker compose for local development
- [ ] Implement queue system with Bull for batch processing
- [x] Add comprehensive error handling
- [ ] Set up testing infrastructure
- [x] Create API documentation
- [x] Implement rate limiting for API calls
- [x] Add image optimization pipeline (Sharp)

### Workflow Overhaul (Completed)
- [x] Extended Item schema with shipping, listing format, returns, weight, dimensions fields
- [x] Add photos to existing items (upload endpoint + UI)
- [x] Full pricing stage with AI price suggestions (Claude Sonnet 4)
- [x] CSV export in eBay Seller Hub Reports format (correct column headers)
- [x] eBay API push (single + bulk) with Listing record creation
- [x] Settings page with listing defaults (format, shipping, returns, location)
- [x] Location-level settings persistence (Json field on Location model)
- [x] Photo pool: attach ungrouped photos to existing items

### Photo Editing & Management (Completed)
- [x] Photo editor modal with crop (react-easy-crop), rotate, brightness, contrast
- [x] Server-side image processing with Sharp (crop, rotate, brightness, contrast)
- [x] Drag-to-reorder photo thumbnails (@dnd-kit/sortable)
- [x] Set primary photo
- [x] Delete individual photos with file cleanup
- [x] Mobile-friendly touch controls (pinch-to-zoom, arrow reorder)
- [x] Edited images preferred in CSV export and image hosting
- [x] Apply brightness/contrast to all photos in group
- [x] Output scale selector (Original/1600/1200/800/600px)

### Product Identifiers & CSV Fix (Completed)
- [x] UPC and ISBN fields on Item model (AI-detected + manual entry)
- [x] AI barcode/UPC/ISBN detection in photo analysis prompts
- [x] CSV export rewritten to match eBay Seller Hub Reports spec exactly
- [x] eBay CSV reference doc added (docs/EBAY_CSV_REFERENCE.md)

### eBay Integration & Push to eBay (Completed)
- [x] Raw XML Trading API integration (bypasses library serialization issues)
- [x] eBay category auto-lookup via Browse API (from item title)
- [x] "Find Category" button on item detail page
- [x] AI auto-sets eBay category ID after processing
- [x] Push to eBay with image hosting, business policy auto-mapping
- [x] ReviseItem support — "Update eBay" button on published items
- [x] Condition ID mapping (all Used variants → 3000 for electronics)
- [x] Item Specifics in CSV export (C:Brand, C:Model, C:Type)
- [x] Item Specifics sent in AddItem/ReviseItem XML (Brand, Model, all aiAnalysis.specifics)
- [x] Detailed eBay error messages surfaced to UI
- [x] VerifyAddItem pre-check — "Verify" button validates listing before pushing
- [x] Verify errors show quick-add buttons for missing required specifics
- [x] eBay Motors support — Taxonomy API tries tree 0 (US) then tree 100 (Motors)
- [x] Auto-fill required specifics via AI on category lookup

### Workflow Flexibility (Completed)
- [x] Stage dropdown on item detail — move items to any stage
- [x] Flexible set-stage endpoint (POST /api/dashboard/item/:id/set-stage)
- [x] Rejected items can be moved back into pipeline
- [x] "Send to AI" button — unified AI call with full context (replaces "Process AI")
- [x] Published items locked — cannot change stage on items with ebayId

### ListFlow Snap PWA (Completed)
- [x] Installable PWA for mobile photo upload (manifest.json, service worker)
- [x] Two modes: New Item (creates item, skips AI) and Photo Pool
- [x] Auth check with returnTo redirect after login
- [x] PWA icons, standalone display, dark theme
- [x] Accessible at /snap route and sidebar nav link

### Sell Similar & Clone (Completed)
- [x] Sell Similar from eBay — paste URL, fetch listing, create item
- [x] Clone from Inventory — search items, clone with all data + photos
- [x] Search endpoint (GET /api/dashboard/items/search)
- [x] Clone endpoint (POST /api/dashboard/item/:id/clone)

### eBay Required Item Specifics (Completed)
- [x] Taxonomy API integration — fetch required/recommended specifics per category
- [x] `getCategorySpecifics(categoryId)` method on ebayService
- [x] `GET /api/dashboard/category/:categoryId/specifics` endpoint
- [x] Category lookup auto-returns required specifics
- [x] Auto-populate missing required specifics as empty fields on category set
- [x] UI: required/missing badge, red indicators, "Add Required" button
- [x] Dropdown selectors for specifics with eBay-provided value lists
- [x] Quick-add buttons in Add Specific modal for missing required fields
- [x] Completeness tracking utility (`src/utils/completeness.ts`)

### Completeness Model & Inventory-Centric Refactor (Completed)
- [x] Completeness calculator (`src/utils/completeness.ts`) — 7 checks: photos, AI, category, specifics, price, shipping, weight
- [x] Completeness bar on item detail with per-check indicators
- [x] Completeness score/percentage on inventory table rows
- [x] Default sort: completeness ascending (least complete first, published last)
- [x] Context notes — per-section free-text notes for AI context (photos, category, description, pricing, shipping)
- [x] Unified AI call — one Claude call with photos + context notes + existing data
- [x] AI Journal — logged per-item with prompt context, response, tokens, cost
- [x] Inventory is default route (`/` → Inventory, `/queue` → redirects to `/inventory`)
- [x] Queue removed from sidebar navigation
- [x] Schema: `contextNotes`, `aiJournal`, `completeness` Json fields on Item model

### UI Improvements (Completed)
- [x] Weight field split into lbs + oz (stores total oz internally)
- [x] Inventory filter: multi-select checkboxes for stage filtering
- [x] Shipping service code mapping (USPSGround → USPSGroundAdvantage)

### Upload & Listing Fixes (Completed)
- [x] HEIC/HEIF photo support — accepted in all upload routes (dashboard, pool, upload)
- [x] Upload file size limit raised to 25MB for large phone photos
- [x] Fix multipart upload boundary bug — removed explicit Content-Type header on FormData uploads
- [x] UPC/ISBN sent in eBay ProductListingDetails XML (push + verify endpoints)

### Development Commands
```bash
# Backend
npm run dev        # Start development server
npm run build      # Build TypeScript
npm run start      # Start production server
npm run lint       # Run linter
npm run test       # Run tests

# Frontend (in client/ directory)
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build

# Database
npx prisma migrate dev    # Run migrations
npx prisma studio        # Open Prisma Studio
npx prisma generate      # Generate Prisma client

# Docker
docker-compose up        # Start all services
docker-compose down      # Stop all services
```

### API Endpoints
- `POST /api/upload/image` - Upload and analyze image
- `POST /api/listings/generate` - Generate listing from analysis
- `POST /api/listings/create` - Create eBay listing
- `GET /api/listings/history` - Get listing history
- `GET /api/listings/:id` - Get specific listing
- `POST /api/dashboard/item/:id/photos` - Upload photos to existing item
- `PATCH /api/dashboard/item/:id/photos/reorder` - Reorder item photos
- `PATCH /api/dashboard/item/:id/photos/:photoId/primary` - Set primary photo
- `DELETE /api/dashboard/item/:id/photos/:photoId` - Delete a photo
- `POST /api/dashboard/item/:id/photos/:photoId/edit` - Edit photo (crop/brightness/contrast/rotate)
- `POST /api/dashboard/item/:id/suggest-price` - AI price suggestion
- `POST /api/dashboard/item/:id/unified-ai` - Unified AI analysis (one call, full context, journals result)
- `POST /api/dashboard/item/:id/verify-ebay` - Validate listing with eBay (VerifyAddItem) without creating it
- `POST /api/dashboard/item/:id/push-to-ebay` - Push item to eBay
- `POST /api/dashboard/items/bulk-push-to-ebay` - Batch push to eBay
- `POST /api/v1/export/csv` - Export items as eBay Seller Hub CSV
- `GET /api/v1/export/preview/:itemId` - Preview CSV data for item
- `GET/PUT /api/dashboard/listing-defaults` - Listing defaults
- `POST /api/pool/attach-to-item` - Attach pooled photos to item
- `POST /api/dashboard/item/:id/set-stage` - Move item to any workflow stage
- `POST /api/dashboard/item/:id/lookup-category` - Find eBay category from title
- `POST /api/dashboard/item/:id/revise-ebay` - Update existing eBay listing
- `POST /api/dashboard/item/:id/clone` - Clone item with photos
- `GET /api/dashboard/items/search` - Search items by title/SKU/category
- `GET /api/dashboard/category/:categoryId/specifics` - Fetch required/recommended eBay item specifics for category

### Testing Checklist
- [ ] Image upload works with various formats (JPG, PNG, WebP)
- [ ] AI analysis provides accurate item descriptions
- [ ] Listing generation creates SEO-optimized titles
- [ ] eBay API integration works in sandbox mode
- [ ] Database operations are transactional
- [ ] Error states are handled gracefully
- [ ] Frontend displays appropriate loading states
- [ ] Rate limiting prevents API abuse

### Deployment Preparation
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Docker images optimized
- [ ] SSL certificates configured
- [ ] Backup strategy implemented
- [ ] Monitoring and logging set up
- [ ] Rate limits configured
- [ ] CORS settings appropriate

## Code Style
- Use TypeScript strict mode
- Implement proper error boundaries
- Follow RESTful API conventions
- Use Zod for runtime validation
- Keep components small and focused
- Write self-documenting code
- Add JSDoc comments for complex functions

## Performance Considerations
- Optimize images before upload to eBay
- Implement caching for AI responses
- Use database indexing appropriately
- Lazy load frontend components
- Batch API requests when possible
- Use connection pooling for database

## Notes for Future Development
- Consider implementing ML model for price prediction
- Add support for multiple marketplaces (Amazon, Etsy)
- Implement inventory management features
- Add analytics dashboard
- Consider mobile app development
- Implement webhook support for eBay events
## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
