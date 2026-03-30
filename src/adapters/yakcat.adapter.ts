import { PlatformAdapter, PlatformResult } from './platform.adapter';

export class YakcatAdapter implements PlatformAdapter {
  readonly platform = 'yakcat';
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.YAKCAT_API_URL || 'https://webcat.yakimafinds.com';
    this.apiKey = process.env.YAKCAT_API_KEY || '';
  }

  async pushItem(itemId: string): Promise<PlatformResult> {
    // TODO: implement when Yakcat exposes external item creation API
    // Will call: POST ${this.apiUrl}/api/external/items
    // With: title, description, category, price, images (via Uploadthing)
    throw new Error('YakcatAdapter: not yet implemented — waiting for Yakcat API endpoints');
  }

  async reviseItem(platformId: string, itemId: string): Promise<PlatformResult> {
    throw new Error('YakcatAdapter: not yet implemented');
  }

  getListingUrl(platformId: string): string {
    return `${this.apiUrl}/items/${platformId}`;
  }
}
