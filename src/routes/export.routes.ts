import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { generateCsv, previewExport } from '../services/csvExport.service';
import { hostItemImages } from '../services/imageHosting.service';

const router = Router();

// POST /api/v1/export/csv - Batch export selected items as eBay File Exchange CSV
router.post('/csv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemIds, markExported = true } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'itemIds must be a non-empty array',
      });
    }

    // Host images for each item before export
    for (const itemId of itemIds) {
      try {
        await hostItemImages(itemId);
      } catch (err) {
        console.warn(`Image hosting skipped for item ${itemId}:`, (err as Error).message);
      }
    }

    const csv = await generateCsv(itemIds, markExported);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="listflow-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message || 'Export failed',
    });
  }
});

// GET /api/v1/export/preview/:itemId - Preview CSV data for a single item
router.get('/preview/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const data = await previewExport(itemId);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview export',
    });
  }
});

export default router;
