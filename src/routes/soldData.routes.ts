import { Router, Request, Response } from 'express';
import { soldDataService } from '../services/soldData.service';
import { scraperLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Search for sold items (with scraping)
router.post('/search', scraperLimiter, async (req: Request, res: Response) => {
  try {
    const { query, maxPages = 2, headless = true } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const items = await soldDataService.searchSoldItems(query, {
      maxPages,
      headless,
      saveToDb: true
    });

    res.json({
      success: true,
      data: {
        query,
        count: items.length,
        items
      }
    });
  } catch (error: any) {
    console.error('Error searching sold items:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search sold items'
    });
  }
});

// Get price statistics for a search query
router.get('/price-stats', scraperLimiter, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const stats = await soldDataService.getPriceStats(query, {
      maxPages: 2,
      saveToDb: true
    });

    res.json({
      success: true,
      data: {
        query,
        stats: {
          average: stats.average,
          median: stats.median,
          min: stats.min,
          max: stats.max,
          count: stats.count,
          percentile25: stats.percentile25,
          percentile75: stats.percentile75
        },
        sampleItems: stats.items.slice(0, 10)
      }
    });
  } catch (error: any) {
    console.error('Error getting price stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price statistics'
    });
  }
});

// Get suggested pricing for an item
router.post('/suggest-price', scraperLimiter, async (req: Request, res: Response) => {
  try {
    const { title, condition } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const suggestion = await soldDataService.getSuggestedPrice(title, condition);

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error: any) {
    console.error('Error getting price suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price suggestion'
    });
  }
});

// Get recent sold items from database (no scraping)
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const {
      q: query,
      limit = '50',
      minPrice,
      maxPrice
    } = req.query;

    const items = await soldDataService.getRecentSoldItems({
      query: query as string,
      limit: parseInt(limit as string) || 50,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    });

    res.json({
      success: true,
      data: {
        count: items.length,
        items
      }
    });
  } catch (error: any) {
    console.error('Error getting recent sold items:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent sold items'
    });
  }
});

// Cleanup - close browser instance
router.post('/cleanup', async (_req: Request, res: Response) => {
  try {
    await soldDataService.close();
    res.json({
      success: true,
      message: 'Browser instance closed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
