export interface PlatformResult {
  platformId: string;
  listingUrl: string;
  platform: 'ebay' | 'yakcat' | string;
}

export interface PlatformAdapter {
  readonly platform: string;
  pushItem(itemId: string): Promise<PlatformResult>;
  reviseItem(platformId: string, itemId: string): Promise<PlatformResult>;
  getListingUrl(platformId: string): string;
}
