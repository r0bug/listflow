import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import listingRoutes from './routes/listing.routes';
import uploadRoutes from './routes/upload.routes';
import workflowRoutes from './routes/workflow.routes';
import soldDataRoutes from './routes/soldData.routes';
import { generalLimiter } from './middleware/rateLimit.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/sold-data', soldDataRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});