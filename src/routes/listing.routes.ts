import { Router } from 'express';
import {
  generateListing,
  createEbayListing,
  getListingHistory,
  getListingById
} from '../controllers/listing.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/generate', generateListing);
router.post('/create', createEbayListing);
router.get('/history', getListingHistory);
router.get('/:id', getListingById);

export default router;