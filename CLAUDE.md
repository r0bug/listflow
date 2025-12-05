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
- [ ] Complete React frontend setup with Vite
- [ ] Implement drag-and-drop with react-dropzone
- [ ] Set up PostgreSQL database with Prisma
- [ ] Create Docker compose for local development
- [ ] Implement queue system with Bull for batch processing
- [ ] Add comprehensive error handling
- [ ] Set up testing infrastructure
- [ ] Create API documentation
- [ ] Implement rate limiting for API calls
- [ ] Add image optimization pipeline

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