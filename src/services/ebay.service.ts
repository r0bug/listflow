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
}

class EbayService {
  private ebayApi: any = null;
  private isConfigured: boolean = false;

  constructor() {
    if (process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID && process.env.EBAY_SANDBOX === 'true') {
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
      return this.mockCreateListing(data);
    }

    try {
      const listing = {
        Item: {
          Title: data.title,
          Description: data.description,
          PrimaryCategory: {
            CategoryID: data.category
          },
          StartPrice: data.price,
          BuyItNowPrice: data.buyNowPrice,
          Country: 'US',
          Currency: 'USD',
          DispatchTimeMax: 3,
          ListingDuration: 'Days_7',
          ListingType: data.buyNowPrice ? 'FixedPriceItem' : 'Chinese',
          PaymentMethods: 'PayPal',
          PayPalEmailAddress: process.env.PAYPAL_EMAIL,
          PictureDetails: {
            PictureURL: data.imageUrls
          },
          PostalCode: process.env.SELLER_POSTAL_CODE || '10001',
          Quantity: data.quantity || 1,
          ReturnPolicy: {
            ReturnsAcceptedOption: 'ReturnsAccepted',
            RefundOption: 'MoneyBack',
            ReturnsWithinOption: 'Days_30',
            ShippingCostPaidByOption: 'Buyer'
          },
          ShippingDetails: {
            ShippingType: 'Flat',
            ShippingServiceOptions: {
              ShippingServicePriority: 1,
              ShippingService: 'USPSPriority',
              ShippingServiceCost: data.shippingCost || 9.99
            }
          },
          ConditionID: this.mapCondition(data.condition)
        }
      };

      const response = await this.ebayApi.trading.AddItem(listing);
      
      return {
        success: true,
        listingId: response.ItemID,
        listingUrl: this.getListingUrl(response.ItemID),
        fees: response.Fees,
        response: response
      };
    } catch (error) {
      console.error('Error creating eBay listing:', error);
      throw error;
    }
  }

  async getCategories(query?: string) {
    if (!this.isConfigured) {
      return this.mockGetCategories();
    }

    try {
      const response = await this.ebayApi.trading.GetSuggestedCategories({
        Query: query || 'electronics'
      });
      
      return response.CategoryArray || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.mockGetCategories();
    }
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

  private mapCondition(condition: string): number {
    const conditionMap: Record<string, number> = {
      'new': 1000,
      'new other': 1500,
      'new with defects': 1750,
      'remanufactured': 2000,
      'refurbished': 2500,
      'used - like new': 3000,
      'used - very good': 4000,
      'used - good': 5000,
      'used - acceptable': 6000,
      'for parts': 7000
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
    return [
      { CategoryID: '58058', CategoryName: 'Computers/Tablets & Networking' },
      { CategoryID: '293', CategoryName: 'Consumer Electronics' },
      { CategoryID: '11232', CategoryName: 'Clothing, Shoes & Accessories' },
      { CategoryID: '11700', CategoryName: 'Home & Garden' },
      { CategoryID: '220', CategoryName: 'Toys & Hobbies' }
    ];
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