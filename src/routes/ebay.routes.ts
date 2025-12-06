import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

// eBay OAuth configuration
const EBAY_OAUTH_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
].join(' ');

// Generate OAuth authorization URL
// POST /api/v1/ebay/auth/url
router.post('/auth/url', async (req, res) => {
  try {
    const { clientId, sandbox } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'Client ID is required' });
    }

    // Get the redirect URI from environment or use default
    const redirectUri = process.env.EBAY_REDIRECT_URI ||
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/ebay/callback`;

    // Build the authorization URL
    const baseUrl = sandbox
      ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
      : 'https://auth.ebay.com/oauth2/authorize';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: EBAY_OAUTH_SCOPES,
      prompt: 'login',
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    res.json({
      success: true,
      authUrl,
      redirectUri,
      note: 'Make sure this redirect URI is registered in your eBay Developer Portal app settings'
    });
  } catch (error) {
    console.error('Error generating eBay auth URL:', error);
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
});

// Exchange authorization code for tokens
// POST /api/v1/ebay/auth/token
router.post('/auth/token', async (req, res) => {
  try {
    const { code, clientId: reqClientId, clientSecret: reqClientSecret, sandbox: reqSandbox } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }

    // Use credentials from request or fall back to environment variables
    const clientId = reqClientId || process.env.EBAY_CLIENT_ID;
    const clientSecret = reqClientSecret || process.env.EBAY_CLIENT_SECRET;
    const redirectUri = process.env.EBAY_REDIRECT_URI ||
      `${process.env.CLIENT_URL || 'http://localhost:5176'}/settings/ebay/callback`;
    // Use sandbox preference from request (if provided) or fall back to env
    const sandbox = reqSandbox !== undefined ? reqSandbox : (process.env.EBAY_SANDBOX === 'true');

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Server not configured with eBay credentials. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to .env'
      });
    }

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
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('eBay token exchange error:', tokenData);
      return res.status(400).json({
        success: false,
        error: tokenData.error_description || 'Token exchange failed'
      });
    }

    // Store the tokens (in production, store these securely in database)
    console.log('eBay OAuth successful. Tokens obtained.');
    console.log('Access token expires in:', tokenData.expires_in, 'seconds');

    // TODO: Store tokens in database
    // For now, we'll just return success
    // The tokens should be:
    // - access_token: Use for API calls
    // - refresh_token: Use to get new access tokens
    // - expires_in: Seconds until access token expires

    res.json({
      success: true,
      message: 'Successfully connected to eBay',
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error exchanging eBay token:', error);
    res.status(500).json({ success: false, error: 'Server error during token exchange' });
  }
});

// Handle OAuth callback (browser redirect from eBay)
// GET /api/v1/ebay/auth/callback
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      console.error('eBay OAuth error:', error, error_description);
      return res.redirect(`/settings?ebay_error=${encodeURIComponent(error_description as string || 'Authorization failed')}`);
    }

    if (!code) {
      return res.redirect('/settings?ebay_error=No authorization code received');
    }

    // Exchange the code for tokens
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const redirectUri = process.env.EBAY_REDIRECT_URI ||
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/ebay/callback`;
    const sandbox = process.env.EBAY_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
      return res.redirect('/settings?ebay_error=Server not configured with eBay credentials');
    }

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
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('eBay token exchange error:', tokenData);
      return res.redirect(`/settings?ebay_error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    // Store the tokens (in production, store these securely in database)
    // For now, we'll just redirect with success
    // The tokens should be stored in the EbayAccount model

    console.log('eBay OAuth successful. Access token obtained.');

    // TODO: Store tokens in database
    // await prisma.ebayAccount.upsert({...})

    res.redirect('/settings?ebay_success=true');
  } catch (error) {
    console.error('Error handling eBay OAuth callback:', error);
    res.redirect('/settings?ebay_error=Server error during authorization');
  }
});

// Save eBay credentials (from Settings page)
// POST /api/v1/ebay/credentials
router.post('/credentials', async (req, res) => {
  try {
    const { clientId, clientSecret, devId, sandbox, locationId } = req.body;

    if (!clientId || !clientSecret || !devId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID, Client Secret, and Dev ID are required'
      });
    }

    // In production, store these encrypted in the database
    // For now, we'll indicate they should go in .env
    res.json({
      success: true,
      message: 'Credentials received. For security, add these to your .env file:',
      envVars: {
        EBAY_CLIENT_ID: clientId,
        EBAY_CLIENT_SECRET: '***hidden***',
        EBAY_DEV_ID: devId,
        EBAY_SANDBOX: sandbox ? 'true' : 'false',
      },
      note: 'Then restart the server for changes to take effect.'
    });
  } catch (error) {
    console.error('Error saving eBay credentials:', error);
    res.status(500).json({ success: false, error: 'Failed to save credentials' });
  }
});

// Get OAuth application access token (for Browse API)
async function getApplicationToken(): Promise<string | null> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const sandbox = process.env.EBAY_SANDBOX === 'true';

  if (!clientId || !clientSecret) return null;

  const tokenUrl = sandbox
    ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
    : 'https://api.ebay.com/identity/v1/oauth2/token';

  try {
    const response = await fetch(tokenUrl, {
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

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    console.error('Failed to get application token:', data);
    return null;
  } catch (error) {
    console.error('Error getting application token:', error);
    return null;
  }
}

// Fetch listing details from eBay
// GET /api/v1/ebay/listing/:itemId
router.get('/listing/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Item ID is required' });
    }

    // Get application token for Browse API
    const accessToken = await getApplicationToken();
    if (!accessToken) {
      return res.status(500).json({ success: false, error: 'Failed to authenticate with eBay' });
    }

    const sandbox = process.env.EBAY_SANDBOX === 'true';
    const apiUrl = sandbox
      ? `https://api.sandbox.ebay.com/buy/browse/v1/item/v1|${itemId}|0`
      : `https://api.ebay.com/buy/browse/v1/item/v1|${itemId}|0`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>',
      },
    });

    if (!response.ok) {
      // Try alternate format without legacy conversion
      const altApiUrl = sandbox
        ? `https://api.sandbox.ebay.com/buy/browse/v1/item/${itemId}`
        : `https://api.ebay.com/buy/browse/v1/item/${itemId}`;

      const altResponse = await fetch(altApiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });

      if (!altResponse.ok) {
        const errorData = await altResponse.json().catch(() => ({}));
        console.error('eBay API error:', errorData);
        return res.status(altResponse.status).json({
          success: false,
          error: errorData.errors?.[0]?.message || 'Failed to fetch listing from eBay'
        });
      }

      const data = await altResponse.json();
      return res.json({
        success: true,
        listing: {
          itemId: data.itemId || itemId,
          title: data.title,
          description: data.description || data.shortDescription || '',
          price: parseFloat(data.price?.value || '0'),
          currency: data.price?.currency || 'USD',
          condition: data.condition || 'Used',
          category: data.categoryPath || '',
          imageUrls: data.image?.imageUrl ? [data.image.imageUrl] : (data.additionalImages?.map((img: any) => img.imageUrl) || []),
          specifics: data.localizedAspects?.reduce((acc: any, aspect: any) => {
            acc[aspect.name] = aspect.value;
            return acc;
          }, {}) || {},
          seller: data.seller?.username || '',
          itemWebUrl: data.itemWebUrl,
        }
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      listing: {
        itemId: data.itemId || itemId,
        title: data.title,
        description: data.description || data.shortDescription || '',
        price: parseFloat(data.price?.value || '0'),
        currency: data.price?.currency || 'USD',
        condition: data.condition || 'Used',
        category: data.categoryPath || '',
        imageUrls: data.image?.imageUrl ? [data.image.imageUrl] : (data.additionalImages?.map((img: any) => img.imageUrl) || []),
        specifics: data.localizedAspects?.reduce((acc: any, aspect: any) => {
          acc[aspect.name] = aspect.value;
          return acc;
        }, {}) || {},
        seller: data.seller?.username || '',
        itemWebUrl: data.itemWebUrl,
      }
    });
  } catch (error) {
    console.error('Error fetching eBay listing:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
});

// Search eBay for SOLD/COMPLETED items (for price research)
// GET /api/v1/ebay/search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'eBay not configured. Add EBAY_CLIENT_ID to .env'
      });
    }

    const sandbox = process.env.EBAY_SANDBOX === 'true';

    // Use Finding API's findCompletedItems to get SOLD listings
    // This is the correct API for getting sold/completed items
    const apiUrl = sandbox
      ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.ebay.com/services/search/FindingService/v1';

    const searchParams = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': clientId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': q,
      'paginationInput.entriesPerPage': String(Math.min(Number(limit), 100)),
      // Filter to only show items that actually sold (not just ended)
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'sortOrder': 'EndTimeSoonest',
    });

    const response = await fetch(`${apiUrl}?${searchParams}`, {
      headers: {
        'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay Finding API error:', errorText);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to search eBay sold items'
      });
    }

    const data = await response.json();

    // Check for API errors
    const ack = data.findCompletedItemsResponse?.[0]?.ack?.[0];
    if (ack === 'Failure') {
      const errorMsg = data.findCompletedItemsResponse?.[0]?.errorMessage?.[0]?.error?.[0]?.message?.[0];
      console.error('eBay Finding API failure:', errorMsg);
      return res.status(400).json({
        success: false,
        error: errorMsg || 'eBay search failed'
      });
    }

    // Extract items from the response
    const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    const rawItems = searchResult?.item || [];

    // Transform the results
    const items = rawItems.map((item: any) => {
      // Get the selling status to find actual sold price
      const sellingStatus = item.sellingStatus?.[0];
      const soldPrice = parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0');
      const soldState = sellingStatus?.sellingState?.[0]; // 'EndedWithSales' for sold items

      return {
        itemId: item.itemId?.[0],
        title: item.title?.[0],
        price: soldPrice,
        currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
        imageUrl: item.galleryURL?.[0],
        itemWebUrl: item.viewItemURL?.[0],
        seller: item.sellerInfo?.[0]?.sellerUserName?.[0],
        location: item.location?.[0],
        endTime: item.listingInfo?.[0]?.endTime?.[0],
        soldState,
      };
    });

    // Calculate price statistics from sold prices
    const prices = items.map((item: any) => item.price).filter((p: number) => p > 0);
    const sortedPrices = [...prices].sort((a: number, b: number) => a - b);
    const stats = prices.length > 0 ? {
      count: prices.length,
      average: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
      median: sortedPrices[Math.floor(sortedPrices.length / 2)],
      min: Math.min(...prices),
      max: Math.max(...prices),
    } : null;

    res.json({
      success: true,
      query: q,
      total: parseInt(searchResult?.['@count'] || items.length),
      items,
      stats,
    });
  } catch (error) {
    console.error('Error searching eBay sold items:', error);
    res.status(500).json({ success: false, error: 'Failed to search eBay' });
  }
});

// Create Item from eBay listing (Sell Similar)
// POST /api/v1/ebay/create-item
router.post('/create-item', async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      category,
      imageUrls,
      specifics,
      sourceEbayId,  // Original eBay item ID for reference
      userId,        // User creating the item (from auth)
      locationId,    // Location for the item
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // Get default location if not provided
    let location = locationId ? await prisma.location.findUnique({ where: { id: locationId } }) : null;
    if (!location) {
      location = await prisma.location.findFirst({ where: { isActive: true } });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'No active location found. Please create a location first.'
      });
    }

    // Get default user if not provided (find first admin or manager)
    let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'MANAGER', 'PROCESSOR'] } }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'No user found. Please create a user first.'
      });
    }

    // Generate a SKU
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `SS-${timestamp}-${random}`; // SS = Sell Similar

    // Create the item in REVIEW_EDIT stage since it already has title/description
    const item = await prisma.item.create({
      data: {
        sku,
        stage: 'REVIEW_EDIT',
        status: 'ACTIVE',
        locationId: location.id,
        createdById: user.id,
        title,
        description: description || '',
        category: category || '',
        condition: condition || 'Used',
        startingPrice: price || null,
        aiAnalysis: {
          source: 'sell_similar',
          sourceEbayId,
          specifics,
          imageUrls,
          importedAt: new Date().toISOString(),
        },
      },
      include: {
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
      }
    });

    // Create a workflow action to track this import
    await prisma.workflowAction.create({
      data: {
        itemId: item.id,
        userId: user.id,
        fromStage: 'PHOTO_UPLOAD',
        toStage: 'REVIEW_EDIT',
        action: 'import_from_ebay',
        notes: `Imported from eBay listing ${sourceEbayId || 'unknown'}`,
        changes: { sourceEbayId, title, price, condition },
      }
    });

    res.json({
      success: true,
      item: {
        id: item.id,
        sku: item.sku,
        title: item.title,
        stage: item.stage,
        status: item.status,
      },
      message: 'Item added to queue at Review stage'
    });
  } catch (error) {
    console.error('Error creating item from eBay:', error);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  }
});

// Check eBay connection status
// GET /api/v1/ebay/status
router.get('/status', async (req, res) => {
  try {
    const isConfigured = !!(
      process.env.EBAY_CLIENT_ID &&
      process.env.EBAY_CLIENT_SECRET &&
      process.env.EBAY_DEV_ID
    );

    const hasUserToken = !!process.env.EBAY_USER_TOKEN;
    const isSandbox = process.env.EBAY_SANDBOX === 'true';

    res.json({
      success: true,
      status: {
        configured: isConfigured,
        authenticated: hasUserToken,
        sandbox: isSandbox,
        clientId: process.env.EBAY_CLIENT_ID ?
          process.env.EBAY_CLIENT_ID.substring(0, 15) + '...' : null,
      }
    });
  } catch (error) {
    console.error('Error checking eBay status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

export default router;
