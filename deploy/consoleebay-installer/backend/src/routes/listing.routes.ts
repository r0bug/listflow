import { Router } from 'express';
import { 
  generateListing, 
  createEbayListing, 
  getListingHistory,
  getListingById 
} from '../controllers/listing.controller';

const router = Router();

router.post('/generate', generateListing);
router.post('/create', createEbayListing);
router.get('/history', getListingHistory);
router.get('/:id', getListingById);

export default router;