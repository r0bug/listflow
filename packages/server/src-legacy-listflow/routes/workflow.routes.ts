import { Router } from 'express';
import { 
  moveToNextStage,
  getItemsForStage,
  getNextItem,
  rejectItem,
  sendBackItem,
  getWorkflowStats
} from '../controllers/workflow.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get items for a specific stage
router.get('/stage/:stage', getItemsForStage);

// Get workflow statistics
router.get('/stats', getWorkflowStats);

// Get next item in queue for current user
router.get('/next-item', getNextItem);

// Move item to next stage
router.post('/item/:id/advance', moveToNextStage);

// Reject an item
router.post('/item/:id/reject', rejectItem);

// Send item back for revision
router.post('/item/:id/send-back', sendBackItem);

export default router;