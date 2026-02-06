import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/sell-similar/fetch/:id - Fetch eBay listing details for sell similar
router.get('/fetch/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id: ebayItemId } = req.params;

    if (!ebayItemId) {
      return res.status(400).json({ success: false, error: 'eBay item ID is required' });
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        error: 'eBay not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to .env',
      });
    }

    const sandbox = process.env.EBAY_SANDBOX === 'true';

    // Get application token
    const tokenUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ success: false, error: 'Failed to authenticate with eBay' });
    }

    // Fetch item details
    const apiUrl = sandbox
      ? `https://api.sandbox.ebay.com/buy/browse/v1/item/v1|${ebayItemId}|0`
      : `https://api.ebay.com/buy/browse/v1/item/v1|${ebayItemId}|0`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });

    if (!response.ok) {
      // Try alternate format
      const altApiUrl = sandbox
        ? `https://api.sandbox.ebay.com/buy/browse/v1/item/${ebayItemId}`
        : `https://api.ebay.com/buy/browse/v1/item/${ebayItemId}`;

      const altResponse = await fetch(altApiUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });

      if (!altResponse.ok) {
        return res.status(404).json({
          success: false,
          error: 'eBay listing not found',
        });
      }

      const data = await altResponse.json();
      return res.json({ success: true, data: formatEbayListing(data, ebayItemId) });
    }

    const data = await response.json();
    res.json({ success: true, data: formatEbayListing(data, ebayItemId) });
  } catch (error) {
    console.error('Error fetching eBay listing for sell similar:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
});

function formatEbayListing(data: Record<string, unknown>, ebayItemId: string) {
  const price = data.price as { value?: string; currency?: string } | undefined;
  const image = data.image as { imageUrl?: string } | undefined;
  const additionalImages = data.additionalImages as { imageUrl?: string }[] | undefined;
  const localizedAspects = data.localizedAspects as { name: string; value: string }[] | undefined;

  const allImages: string[] = [];
  if (image?.imageUrl) allImages.push(image.imageUrl);
  if (additionalImages) {
    additionalImages.forEach(img => {
      if (img.imageUrl) allImages.push(img.imageUrl);
    });
  }

  return {
    ebayItemId: (data.itemId as string) || ebayItemId,
    title: data.title || '',
    description: data.description || data.shortDescription || '',
    price: parseFloat(price?.value || '0'),
    currency: price?.currency || 'USD',
    condition: data.condition || 'Used',
    category: data.categoryPath || '',
    categoryId: (data.categoryId as string) || '',
    imageUrls: allImages,
    specifics: localizedAspects?.reduce((acc: Record<string, string>, aspect) => {
      acc[aspect.name] = aspect.value;
      return acc;
    }, {}) || {},
    itemWebUrl: data.itemWebUrl || '',
  };
}

// POST /api/v1/sell-similar/create - Create item from eBay listing
router.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    const {
      ebayItemId,
      title,
      description,
      price,
      condition,
      category,
      imageUrls,
      specifics,
      copyFields,
      saveAsTemplate,
    } = req.body;

    if (!ebayItemId) {
      return res.status(400).json({
        success: false,
        error: 'eBay item ID is required',
      });
    }

    const userId = req.user!.id;

    // Find default location
    const location = await prisma.location.findFirst({ where: { isActive: true } });
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'No active location found. Please create a location first.',
      });
    }

    // Generate SKU
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `SS-${timestamp}-${random}`;

    // Create the item
    const item = await prisma.item.create({
      data: {
        sku,
        stage: 'REVIEW_EDIT',
        status: 'ACTIVE',
        locationId: location.id,
        createdById: userId,
        title: title || 'Imported from eBay',
        description: description || '',
        category: category || '',
        condition: condition || 'Used',
        startingPrice: price || null,
        aiAnalysis: {
          source: 'sell_similar',
          sourceEbayId: ebayItemId,
          specifics,
          imageUrls,
          copyFields,
          importedAt: new Date().toISOString(),
        },
      },
      include: {
        location: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create workflow action
    await prisma.workflowAction.create({
      data: {
        itemId: item.id,
        userId,
        fromStage: 'PHOTO_UPLOAD',
        toStage: 'REVIEW_EDIT',
        action: 'import_from_ebay',
        notes: `Sell Similar from eBay listing ${ebayItemId}`,
        changes: { ebayItemId, title, price, condition },
      },
    });

    // Optionally save as template
    if (saveAsTemplate && typeof saveAsTemplate === 'string') {
      await prisma.listingTemplate.create({
        data: {
          name: saveAsTemplate,
          sourceType: 'SELL_SIMILAR',
          sourceEbayItemId: ebayItemId,
          titleTemplate: title || undefined,
          categoryName: category || undefined,
          defaultCondition: condition || undefined,
          itemSpecifics: specifics || undefined,
          descriptionTemplate: description || undefined,
          suggestedPriceMin: price ? price * 0.8 : undefined,
          suggestedPriceMax: price ? price * 1.2 : undefined,
          referenceImageUrls: imageUrls || [],
          tags: ['sell-similar', 'auto-created'],
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: item.id,
        sku: item.sku,
        title: item.title,
        stage: item.stage,
        status: item.status,
      },
      message: 'Item created from eBay listing and placed in Review queue',
    });
  } catch (error) {
    console.error('Error creating from eBay listing:', error);
    res.status(500).json({ success: false, error: 'Failed to create item from eBay listing' });
  }
});

export default router;
