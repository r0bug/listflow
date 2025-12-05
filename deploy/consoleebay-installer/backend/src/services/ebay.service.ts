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
}

export const ebayService = new EbayService();