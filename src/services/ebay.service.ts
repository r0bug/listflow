// import EbayAuthToken from '@hendt/ebay-api/lib/auth/eBayAuthToken';
import eBayApi from '@hendt/ebay-api';
import dotenv from 'dotenv';

dotenv.config();

interface ListingData {
  title: string;
  description: string;
  price: number;
  buyNowPrice?: number;
  category: string;
  condition: string;
  imageUrls: string[];
  quantity?: number;
  shippingCost?: number;
  listingFormat?: string;
  listingDuration?: string;
  handlingTime?: number;
  returnPolicy?: { returnsAccepted?: string; refundType?: string; returnDays?: string; shippingCostPaidBy?: string };
  shippingService?: string;
  shippingType?: string;
  weight?: number;
  packageDimensions?: { length?: number; width?: number; height?: number };
  postalCode?: string;
}

class EbayService {
  private ebayApi: any = null;
  private isConfigured: boolean = false;

  constructor() {
    if (process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID) {
      try {
        this.ebayApi = new eBayApi({
          appId: process.env.EBAY_APP_ID,
          certId: process.env.EBAY_CERT_ID,
          devId: process.env.EBAY_DEV_ID,
          sandbox: process.env.EBAY_SANDBOX === 'true',
          siteId: eBayApi.SiteId.EBAY_US,
          authToken: process.env.EBAY_AUTH_TOKEN
        });
        this.isConfigured = true;
      } catch (error) {
        console.error('Error configuring eBay API:', error);
      }
    }
  }

  async createListing(data: ListingData) {
    if (!this.isConfigured) {
      throw new Error('eBay API is not configured. Set EBAY_APP_ID, EBAY_CERT_ID, and EBAY_SANDBOX in your .env file. Use CSV Export to list items via eBay File Exchange instead.');
    }

    try {
      // Determine eBay listing type
      const format = data.listingFormat || (data.buyNowPrice ? 'FixedPrice' : 'Auction');
      const ebayListingType = format === 'FixedPrice' ? 'FixedPriceItem' : 'Chinese';
      const ebayDuration = data.listingDuration === 'GTC' ? 'GTC'
        : data.listingDuration ? `Days_${data.listingDuration}`
        : (format === 'FixedPrice' ? 'GTC' : 'Days_7');

      // Build return policy
      const returnPol = data.returnPolicy || {};
      const returnsAccepted = returnPol.returnsAccepted === 'false' ? 'ReturnsNotAccepted' : 'ReturnsAccepted';

      const postalCode = data.postalCode || process.env.SELLER_POSTAL_CODE || '98902';

      const pictureUrls = (data.imageUrls || []).map(u => `<PictureURL>${u}</PictureURL>`).join('\n    ');

      // Always use Flat/USPSPriority/free — eBay auto-maps to seller's business policies
      const shippingXml = `<ShippingDetails>
    <ShippingType>Flat</ShippingType>
    <ShippingServiceOptions>
      <ShippingServicePriority>1</ShippingServicePriority>
      <ShippingService>USPSPriority</ShippingService>
      <ShippingServiceCost>0</ShippingServiceCost>
    </ShippingServiceOptions>
  </ShippingDetails>`;

      const authToken = process.env.EBAY_AUTH_TOKEN || '';
      const apiUrl = process.env.EBAY_SANDBOX === 'true'
        ? 'https://api.sandbox.ebay.com/ws/api.dll'
        : 'https://api.ebay.com/ws/api.dll';
      const { clientId } = this.getCredentials();

      const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${authToken}</eBayAuthToken>
  </RequesterCredentials>
  <Item>
    <Title>${this.escapeXml(data.title)}</Title>
    <Description><![CDATA[${data.description || ''}]]></Description>
    <PrimaryCategory>
      <CategoryID>${data.category}</CategoryID>
    </PrimaryCategory>
    <StartPrice>${data.price}</StartPrice>
    ${data.buyNowPrice && ebayListingType === 'Chinese' ? `<BuyItNowPrice>${data.buyNowPrice}</BuyItNowPrice>` : ''}
    <Country>US</Country>
    <Currency>USD</Currency>
    <DispatchTimeMax>${data.handlingTime || 3}</DispatchTimeMax>
    <ListingDuration>${ebayDuration}</ListingDuration>
    <ListingType>${ebayListingType}</ListingType>
    <PictureDetails>
    ${pictureUrls}
    </PictureDetails>
    <PostalCode>${postalCode}</PostalCode>
    <Quantity>${data.quantity || 1}</Quantity>
    <ReturnPolicy>
      <ReturnsAcceptedOption>${returnsAccepted}</ReturnsAcceptedOption>
      <RefundOption>${returnPol.refundType || 'MoneyBack'}</RefundOption>
      <ReturnsWithinOption>${returnPol.returnDays ? `Days_${returnPol.returnDays}` : 'Days_30'}</ReturnsWithinOption>
      <ShippingCostPaidByOption>${returnPol.shippingCostPaidBy || 'Buyer'}</ShippingCostPaidByOption>
    </ReturnPolicy>
    ${shippingXml}
    <ConditionID>${this.mapCondition(data.condition)}</ConditionID>
  </Item>
</AddItemRequest>`;

      console.log('eBay AddItem: category=' + data.category + ' images=' + (data.imageUrls?.length || 0) + ' shipping=' + data.shippingType);

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'X-EBAY-API-COMPATIBILITY-LEVEL': '1271',
          'X-EBAY-API-CALL-NAME': 'AddItem',
          'X-EBAY-API-SITEID': '0',
          'X-EBAY-API-APP-NAME': clientId,
        },
        body: xmlBody,
      });
      const respText = await resp.text();

      const ackMatch = respText.match(/<Ack>(.*?)<\/Ack>/);
      const ack = ackMatch?.[1] || '';
      if (ack === 'Failure') {
        const errMessages: string[] = [];
        const longMsgRegex = /<LongMessage>(.*?)<\/LongMessage>/g;
        let match;
        while ((match = longMsgRegex.exec(respText)) !== null) {
          errMessages.push(match[1]);
        }
        console.error('eBay AddItem failed:', errMessages.join(' | '));
        throw new Error(errMessages.join(' | ') || 'eBay listing creation failed');
      }

      const itemIdMatch = respText.match(/<ItemID>(.*?)<\/ItemID>/);
      const ebayItemId = itemIdMatch?.[1] || '';

      return {
        success: true,
        listingId: ebayItemId,
        listingUrl: this.getListingUrl(ebayItemId),
        fees: null,
        response: { ItemID: ebayItemId, Ack: ack }
      };
    } catch (error) {
      console.error('Error creating eBay listing:', error);
      throw error;
    }
  }

  async reviseListing(ebayItemId: string, data: Partial<ListingData>) {
    if (!this.isConfigured) {
      throw new Error('eBay API is not configured.');
    }

    try {
      // Start with just ItemID and Title to test
      const itemPayload: Record<string, unknown> = {
        ItemID: ebayItemId,
      };

      if (data.title) itemPayload.Title = data.title;
      if (data.price) itemPayload.StartPrice = data.price;

      console.log('eBay ReviseItem payload:', JSON.stringify(itemPayload));

      // Use raw XML call to avoid library serialization issues
      const authToken = process.env.EBAY_AUTH_TOKEN || '';
      const sandbox = process.env.EBAY_SANDBOX === 'true';
      const apiUrl = sandbox
        ? 'https://api.sandbox.ebay.com/ws/api.dll'
        : 'https://api.ebay.com/ws/api.dll';

      const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${authToken}</eBayAuthToken>
  </RequesterCredentials>
  <Item>
    <ItemID>${ebayItemId}</ItemID>
    ${data.title ? `<Title>${this.escapeXml(data.title)}</Title>` : ''}
    ${data.description !== undefined ? `<Description><![CDATA[${data.description || ''}]]></Description>` : ''}
    ${data.price ? `<StartPrice>${data.price}</StartPrice>` : ''}
    ${data.quantity ? `<Quantity>${data.quantity}</Quantity>` : ''}
    ${data.imageUrls && data.imageUrls.length > 0 ? `<PictureDetails>${data.imageUrls.map(u => `<PictureURL>${u}</PictureURL>`).join('')}</PictureDetails>` : ''}
  </Item>
</ReviseItemRequest>`;

      const { clientId } = this.getCredentials();
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'X-EBAY-API-COMPATIBILITY-LEVEL': '1271',
          'X-EBAY-API-CALL-NAME': 'ReviseItem',
          'X-EBAY-API-SITEID': '0',
          'X-EBAY-API-APP-NAME': clientId,
        },
        body: xmlBody,
      });
      const respText = await resp.text();
      console.log('eBay ReviseItem response:', respText.substring(0, 500));

      const ackMatch = respText.match(/<Ack>(.*?)<\/Ack>/);
      const ack = ackMatch?.[1] || '';
      if (ack === 'Failure') {
        const errMatch = respText.match(/<LongMessage>(.*?)<\/LongMessage>/);
        throw new Error(errMatch?.[1] || 'eBay revision failed');
      }

      const itemIdMatch = respText.match(/<ItemID>(.*?)<\/ItemID>/);
      const response = { ItemID: itemIdMatch?.[1] || ebayItemId };

      return {
        success: true,
        listingId: response.ItemID || ebayItemId,
        response,
      };
    } catch (error) {
      console.error('Error revising eBay listing:', error);
      throw error;
    }
  }

  async getCategories(query?: string) {
    if (!query) return [];

    // Try the Trading API GetSuggestedCategories first
    if (this.isConfigured) {
      try {
        const response = await this.ebayApi.trading.GetSuggestedCategories({
          Query: query.substring(0, 350)
        });

        const catArray = response.SuggestedCategoryArray?.SuggestedCategory ||
                         response.CategoryArray?.Category ||
                         response.CategoryArray ||
                         [];
        const cats = Array.isArray(catArray) ? catArray : [catArray];
        if (cats.length > 0 && cats[0]) return cats;
      } catch (error) {
        console.warn('GetSuggestedCategories failed, trying Browse API:', (error as Error).message);
      }
    }

    // Fallback: use Browse API search to infer category from real listings
    try {
      const clientId = process.env.EBAY_APP_ID || process.env.EBAY_CLIENT_ID || '';
      const clientSecret = process.env.EBAY_CERT_ID || process.env.EBAY_CLIENT_SECRET || '';
      if (!clientId || !clientSecret) return [];

      const sandbox = process.env.EBAY_SANDBOX === 'true';
      const tokenUrl = sandbox
        ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
        : 'https://api.ebay.com/identity/v1/oauth2/token';

      const tokenResp = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }),
      });
      const tokenData = await tokenResp.json() as { access_token?: string };
      if (!tokenData.access_token) return [];

      const apiBase = sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
      const searchUrl = `${apiBase}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query.substring(0, 100))}&limit=3`;
      const searchResp = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });
      const searchData = await searchResp.json() as { itemSummaries?: { leafCategoryIds?: string[]; categories?: { categoryId?: string; categoryName?: string }[] }[] };
      const items = searchData.itemSummaries || [];
      if (items.length > 0) {
        // Use leafCategoryIds (most specific) from first result
        const first = items[0];
        const leafId = first.leafCategoryIds?.[0];
        const cats = first.categories || [];
        const leafCat = cats.find(c => c.categoryId === leafId) || cats[0];
        if (leafId) {
          return [{
            CategoryID: leafId,
            CategoryName: leafCat?.categoryName || '',
            Category: { CategoryID: leafId, CategoryName: leafCat?.categoryName || '' },
          }];
        }
      }
    } catch (err) {
      console.warn('Browse API category fallback failed:', (err as Error).message);
    }

    return [];
  }

  async validateListing(data: ListingData) {
    if (!this.isConfigured) {
      return { valid: true, errors: [], warnings: [] };
    }

    try {
      const response = await this.ebayApi.trading.VerifyAddItem({
        Item: {
          Title: data.title,
          Description: data.description,
          PrimaryCategory: {
            CategoryID: data.category
          },
          StartPrice: data.price
        }
      });

      return {
        valid: response.Ack === 'Success',
        errors: response.Errors || [],
        warnings: response.Warnings || [],
        fees: response.Fees
      };
    } catch (error) {
      console.error('Error validating listing:', error);
      return { valid: false, errors: [error], warnings: [] };
    }
  }

  private buildSellerProfiles(data: ListingData): Record<string, unknown> {
    // Business policy profile IDs from seller account
    const paymentProfileId = process.env.EBAY_PAYMENT_PROFILE_ID || '323050659021';
    const returnProfileId = process.env.EBAY_RETURN_PROFILE_ID || '323050657021';
    const shippingProfileId = process.env.EBAY_SHIPPING_PROFILE_ID || '323050634021';

    return {
      SellerPaymentProfile: { PaymentProfileID: paymentProfileId },
      SellerReturnProfile: { ReturnProfileID: returnProfileId },
      SellerShippingProfile: { ShippingProfileID: shippingProfileId },
    };
  }

  private buildShippingDetails(data: ListingData): Record<string, unknown> {
    const isCalculated = (data.shippingType || 'Flat').toLowerCase() === 'calculated';
    const service = this.mapShippingService(data.shippingService || 'USPSPriority');

    if (isCalculated) {
      return {
        ShippingType: 'Calculated',
        ShippingServiceOptions: {
          ShippingServicePriority: 1,
          ShippingService: service,
          ShippingServiceAdditionalCost: 0,
          FreeShipping: false,
        },
        CalculatedShippingRate: {
          OriginatingPostalCode: data.postalCode || process.env.SELLER_POSTAL_CODE || '98902',
          PackagingHandlingCosts: 0,
        },
      };
    }

    // Flat rate or free shipping
    return {
      ShippingType: 'Flat',
      ShippingServiceOptions: {
        ShippingServicePriority: 1,
        ShippingService: service,
        ShippingServiceCost: data.shippingCost || 0,
        FreeShipping: !data.shippingCost || data.shippingCost === 0,
      },
    };
  }

  private escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private getCredentials() {
    return {
      clientId: process.env.EBAY_APP_ID || process.env.EBAY_CLIENT_ID || '',
      clientSecret: process.env.EBAY_CERT_ID || process.env.EBAY_CLIENT_SECRET || '',
    };
  }

  private mapShippingService(service: string): string {
    const map: Record<string, string> = {
      'USPSGround': 'USPSGroundAdvantage',
      'USPSGroundAdvantage': 'USPSGroundAdvantage',
      'USPSFirstClass': 'USPSFirstClass',
      'USPSPriority': 'USPSPriority',
      'USPSPriorityExpress': 'USPSExpressMail',
      'USPSMedia': 'USPSMedia',
      'USPSParcel': 'USPSGroundAdvantage',
      'UPSGround': 'UPSGround',
      'UPS3rdDay': 'UPS3rdDay',
      'UPS2ndDay': 'UPS2Day',
      'UPSNextDay': 'UPSNextDay',
      'FedExGround': 'FedExHomeDelivery',
      'FedEx2Day': 'FedEx2Day',
      'Other': 'Other',
    };
    return map[service] || service;
  }

  private mapCondition(condition: string): number {
    const conditionMap: Record<string, number> = {
      'new': 1000,
      'new other': 1500,
      'open box': 1500,
      'new with defects': 1750,
      'remanufactured': 2000,
      'refurbished': 2500,
      'seller refurbished': 2500,
      'used': 3000,
      'used - like new': 3000,
      'used - very good': 3000,
      'used - good': 3000,
      'used - acceptable': 3000,
      'very good': 3000,
      'good': 3000,
      'acceptable': 3000,
      'for parts': 7000,
      'for parts or not working': 7000
    };

    return conditionMap[condition.toLowerCase()] || 3000;
  }

  private getListingUrl(itemId: string): string {
    const baseUrl = process.env.EBAY_SANDBOX === 'true' 
      ? 'https://sandbox.ebay.com/itm/' 
      : 'https://www.ebay.com/itm/';
    return `${baseUrl}${itemId}`;
  }

  private mockCreateListing(data: ListingData) {
    return {
      success: true,
      listingId: `MOCK-${Date.now()}`,
      listingUrl: `https://sandbox.ebay.com/itm/MOCK-${Date.now()}`,
      fees: {
        InsertionFee: 0.35,
        FinalValueFee: 0
      },
      response: {
        message: 'Mock listing created - Configure eBay API keys for real listings'
      }
    };
  }

  private mockGetCategories() {
    return [];
  }

  // Get seller's own transaction history (sold items)
  async getSellerTransactions(options: {
    daysBack?: number;
    status?: 'Active' | 'Completed' | 'All';
    limit?: number;
  } = {}): Promise<any[]> {
    const { daysBack = 30, status = 'Completed', limit = 100 } = options;

    if (!this.isConfigured) {
      return this.mockGetSellerTransactions();
    }

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const response = await this.ebayApi.trading.GetSellerTransactions({
        NumberOfDays: daysBack,
        IncludeFinalValueFee: true,
        IncludeContainingOrder: true,
        Pagination: {
          EntriesPerPage: limit,
          PageNumber: 1
        }
      });

      const transactions = response.TransactionArray?.Transaction || [];

      return transactions.map((tx: any) => ({
        transactionId: tx.TransactionID,
        itemId: tx.Item?.ItemID,
        title: tx.Item?.Title,
        sku: tx.Item?.SKU,
        quantitySold: tx.QuantityPurchased,
        soldPrice: parseFloat(tx.TransactionPrice?.value || 0),
        currency: tx.TransactionPrice?.currencyID || 'USD',
        finalValueFee: parseFloat(tx.FinalValueFee?.value || 0),
        soldDate: tx.CreatedDate ? new Date(tx.CreatedDate) : null,
        paidDate: tx.PaidTime ? new Date(tx.PaidTime) : null,
        shippedDate: tx.ShippedTime ? new Date(tx.ShippedTime) : null,
        buyer: {
          userId: tx.Buyer?.UserID,
          email: tx.Buyer?.Email
        },
        shippingCost: parseFloat(tx.ActualShippingCost?.value || 0),
        orderStatus: tx.Status?.CompleteStatus
      }));
    } catch (error) {
      console.error('Error fetching seller transactions:', error);
      return [];
    }
  }

  // Get seller's active listings
  async getMyActiveListings(limit: number = 100): Promise<any[]> {
    if (!this.isConfigured) {
      return this.mockGetActiveListings();
    }

    try {
      const response = await this.ebayApi.trading.GetMyeBaySelling({
        ActiveList: {
          Include: true,
          Pagination: {
            EntriesPerPage: limit,
            PageNumber: 1
          }
        }
      });

      const items = response.ActiveList?.ItemArray?.Item || [];

      return items.map((item: any) => ({
        itemId: item.ItemID,
        title: item.Title,
        sku: item.SKU,
        currentPrice: parseFloat(item.SellingStatus?.CurrentPrice?.value || 0),
        bidCount: parseInt(item.SellingStatus?.BidCount || 0),
        watchCount: parseInt(item.WatchCount || 0),
        quantityAvailable: parseInt(item.QuantityAvailable || 0),
        quantitySold: parseInt(item.SellingStatus?.QuantitySold || 0),
        listingType: item.ListingType,
        startTime: item.ListingDetails?.StartTime ? new Date(item.ListingDetails.StartTime) : null,
        endTime: item.ListingDetails?.EndTime ? new Date(item.ListingDetails.EndTime) : null,
        viewCount: parseInt(item.ListingDetails?.ViewItemURLForNaturalSearch || 0)
      }));
    } catch (error) {
      console.error('Error fetching active listings:', error);
      return [];
    }
  }

  // Get seller's sold items (completed listings)
  async getMySoldItems(daysBack: number = 30): Promise<any[]> {
    if (!this.isConfigured) {
      return this.mockGetSoldItems();
    }

    try {
      const response = await this.ebayApi.trading.GetMyeBaySelling({
        SoldList: {
          Include: true,
          DurationInDays: daysBack,
          Pagination: {
            EntriesPerPage: 100,
            PageNumber: 1
          }
        }
      });

      const items = response.SoldList?.ItemArray?.Item || [];

      return items.map((item: any) => ({
        itemId: item.ItemID,
        title: item.Title,
        sku: item.SKU,
        soldPrice: parseFloat(item.SellingStatus?.CurrentPrice?.value || 0),
        quantitySold: parseInt(item.SellingStatus?.QuantitySold || 0),
        soldDate: item.SellingStatus?.EndTime ? new Date(item.SellingStatus.EndTime) : null,
        totalSales: parseFloat(item.SellingStatus?.CurrentPrice?.value || 0) *
                    parseInt(item.SellingStatus?.QuantitySold || 0)
      }));
    } catch (error) {
      console.error('Error fetching sold items:', error);
      return [];
    }
  }

  // Get single item details
  async getItemDetails(itemId: string): Promise<any | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const response = await this.ebayApi.trading.GetItem({
        ItemID: itemId,
        IncludeItemSpecifics: true
      });

      return {
        itemId: response.Item?.ItemID,
        title: response.Item?.Title,
        description: response.Item?.Description,
        price: parseFloat(response.Item?.SellingStatus?.CurrentPrice?.value || 0),
        condition: response.Item?.ConditionDisplayName,
        category: response.Item?.PrimaryCategory?.CategoryName,
        categoryId: response.Item?.PrimaryCategory?.CategoryID,
        status: response.Item?.SellingStatus?.ListingStatus,
        bidCount: parseInt(response.Item?.SellingStatus?.BidCount || 0),
        quantitySold: parseInt(response.Item?.SellingStatus?.QuantitySold || 0),
        watchCount: parseInt(response.Item?.WatchCount || 0),
        viewCount: parseInt(response.Item?.HitCount || 0),
        startTime: response.Item?.ListingDetails?.StartTime,
        endTime: response.Item?.ListingDetails?.EndTime,
        imageUrls: response.Item?.PictureDetails?.PictureURL || [],
        specifics: response.Item?.ItemSpecifics?.NameValueList || []
      };
    } catch (error) {
      console.error('Error fetching item details:', error);
      return null;
    }
  }

  private mockGetSellerTransactions() {
    return [
      {
        transactionId: 'MOCK-TX-001',
        itemId: 'MOCK-ITEM-001',
        title: 'Sample Sold Item 1',
        quantitySold: 1,
        soldPrice: 29.99,
        currency: 'USD',
        finalValueFee: 3.90,
        soldDate: new Date(Date.now() - 86400000),
        buyer: { userId: 'buyer123' },
        shippingCost: 5.99,
        orderStatus: 'Complete'
      },
      {
        transactionId: 'MOCK-TX-002',
        itemId: 'MOCK-ITEM-002',
        title: 'Sample Sold Item 2',
        quantitySold: 2,
        soldPrice: 15.99,
        currency: 'USD',
        finalValueFee: 2.08,
        soldDate: new Date(Date.now() - 172800000),
        buyer: { userId: 'buyer456' },
        shippingCost: 4.99,
        orderStatus: 'Complete'
      }
    ];
  }

  private mockGetActiveListings() {
    return [
      {
        itemId: 'MOCK-ACTIVE-001',
        title: 'Sample Active Listing 1',
        currentPrice: 49.99,
        bidCount: 3,
        watchCount: 12,
        quantityAvailable: 1,
        quantitySold: 0,
        listingType: 'Chinese'
      }
    ];
  }

  private mockGetSoldItems() {
    return [
      {
        itemId: 'MOCK-SOLD-001',
        title: 'Sample Sold Item',
        soldPrice: 35.00,
        quantitySold: 1,
        soldDate: new Date(Date.now() - 86400000 * 3),
        totalSales: 35.00
      }
    ];
  }
}

export const ebayService = new EbayService();