import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import uploadRoutes from './routes/upload.routes';
import workflowRoutes from './routes/workflow.routes';
import soldDataRoutes from './routes/soldData.routes';
import ebayRoutes from './routes/ebay.routes';
import dashboardRoutes from './routes/dashboard.routes';
import itemRoutes from './routes/item.routes';
import templateRoutes from './routes/template.routes';
import inventoryRoutes from './routes/inventory.routes';
import sellSimilarRoutes from './routes/sellSimilar.routes';
import { generalLimiter } from './middleware/rateLimit.middleware';

dotenv.config();

// Validate required environment variables at startup
function validateEnv() {
  const required: string[] = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const prodRequired = ['JWT_SECRET'];
    const prodMissing = prodRequired.filter(key => !process.env[key]);
    if (prodMissing.length > 0) {
      console.error(`FATAL: Missing required production environment variables: ${prodMissing.join(', ')}`);
      process.exit(1);
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.error('FATAL: JWT_SECRET must be at least 32 characters in production');
      process.exit(1);
    }
  }

  // Warn about optional but recommended vars
  const recommended = ['SEGMIND_API_KEY', 'EBAY_CLIENT_ID'];
  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(`WARNING: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
}

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS with specific origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:5176'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow any localhost origin
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ebay', ebayRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/sell-similar', sellSimilarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/sold-data', soldDataRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
