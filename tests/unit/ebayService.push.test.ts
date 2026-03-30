import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// eBayService.pushItem and reviseItem tests
//
// pushItem and reviseItem exist in src/services/ebay.service.ts on the
// exported `ebayService` singleton.  We spy on private methods that make
// external calls (createListing, reviseListing, getCategories, etc.) so
// tests run without hitting real eBay APIs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock dependencies before importing the service.
// vi.hoisted() ensures variables are available inside vi.mock() factories,
// which are hoisted to the top of the file by Vitest.
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    item: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    photo: {
      findMany: vi.fn(),
    },
    listing: {
      create: vi.fn(),
    },
  } as any,
}));

vi.mock('../../src/config/database', () => ({ prisma: mockPrisma }));

// Image hosting – not needed for these tests
vi.mock('../../src/services/imageHosting.service', () => ({
  hostItemImages: vi.fn().mockResolvedValue(undefined),
}));

// aiService is imported inside ebay.service.ts at module level
vi.mock('../../src/services/ai.service', () => ({
  aiService: {
    fillItemSpecifics: vi.fn().mockResolvedValue({ specifics: [], cost: 0 }),
    analyzeImages: vi.fn(),
  },
  AiAnalysisSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { ebayService } from '../../src/services/ebay.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_ITEM = {
  id: 'item-1',
  title: 'Vintage Camera',
  description: 'Works great',
  stage: 'FINAL_REVIEW',
  ebayCategoryId: '9355',
  ebayId: null,
  brand: 'Nikon',
  condition: 'Used',
  startingPrice: 49.99,
  buyNowPrice: null,
  quantity: 1,
  listingFormat: 'FixedPrice',
  listingDuration: 'GTC',
  shippingService: 'USPSPriority',
  shippingCost: 5.0,
  handlingTime: 2,
  postalCode: '98101',
  weight: 32,
  packageDimensions: { length: 10, width: 8, height: 4 },
  returnPolicy: {},
  aiAnalysis: { specifics: { Brand: 'Nikon' } },
  shippingProfileId: 'sp-1',
  returnProfileId: 'rp-1',
  upc: null,
  isbn: null,
  category: 'Film Photography',
  photos: [
    { id: 'p1', publicUrl: 'https://img.example.com/photo1.jpg', order: 0 },
  ],
};

/** Spy helpers — the private methods live on the ebayService instance */
function spyCreate(returnValue: any) {
  return vi.spyOn(ebayService as any, 'createListing').mockResolvedValue(returnValue);
}
function spyGetCats(returnValue: any = []) {
  return vi.spyOn(ebayService as any, 'getCategories').mockResolvedValue(returnValue);
}
function spyGetSpecifics(required: any[] = []) {
  return vi.spyOn(ebayService as any, 'getCategorySpecifics').mockResolvedValue({ required, recommended: [] });
}
function spyDetectSite(siteId = '0') {
  return vi.spyOn(ebayService as any, 'detectSiteId').mockResolvedValue(siteId);
}

const SUCCESS_LISTING = {
  success: true,
  listingId: '123456789',
  listingUrl: 'https://www.ebay.com/itm/123456789',
  fees: null,
  response: { ItemID: '123456789', Ack: 'Success' },
};

// ---------------------------------------------------------------------------
// pushItem tests
// ---------------------------------------------------------------------------

describe('ebayService.pushItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Item NOT at FINAL_REVIEW → throws with clear message
  // -------------------------------------------------------------------------

  it('throws with clear message when item is not at FINAL_REVIEW stage', async () => {
    mockPrisma.item.findUnique.mockResolvedValue({ ...BASE_ITEM, stage: 'PRICING' });

    await expect(ebayService.pushItem('item-1')).rejects.toThrow('FINAL_REVIEW');
  });

  it('throws "Item not found" when item does not exist in DB', async () => {
    mockPrisma.item.findUnique.mockResolvedValue(null);

    await expect(ebayService.pushItem('missing-id')).rejects.toThrow('Item not found');
  });

  // -------------------------------------------------------------------------
  // Happy path: item at FINAL_REVIEW → resolves with { platformId, listingUrl }
  // -------------------------------------------------------------------------

  it('resolves with { platformId, listingUrl, platform } on success', async () => {
    mockPrisma.item.findUnique.mockResolvedValue(BASE_ITEM);
    mockPrisma.photo.findMany.mockResolvedValue(BASE_ITEM.photos);
    mockPrisma.item.update.mockResolvedValue({});
    mockPrisma.listing.create.mockResolvedValue({});

    spyCreate(SUCCESS_LISTING);
    spyGetCats([]);
    spyGetSpecifics([]);
    spyDetectSite('0');

    const result = await ebayService.pushItem('item-1');

    expect(result).toMatchObject({
      platformId: '123456789',
      listingUrl: expect.stringContaining('ebay.com'),
      platform: 'ebay',
    });
  });

  // -------------------------------------------------------------------------
  // eBay API error → throws with eBay error message surfaced
  // -------------------------------------------------------------------------

  it('throws with eBay error message when createListing throws', async () => {
    mockPrisma.item.findUnique.mockResolvedValue(BASE_ITEM);
    mockPrisma.photo.findMany.mockResolvedValue(BASE_ITEM.photos);

    spyCreate(undefined); // will be replaced by mockRejectedValue below
    vi.spyOn(ebayService as any, 'createListing').mockRejectedValue(
      new Error('37115 | Item Specifics are required for this category')
    );
    spyGetCats([]);
    spyGetSpecifics([]);
    spyDetectSite('0');

    await expect(ebayService.pushItem('item-1')).rejects.toThrow(
      'Item Specifics are required'
    );
  });

  // -------------------------------------------------------------------------
  // Category lookup fallback when ebayCategoryId is empty
  // -------------------------------------------------------------------------

  it('calls getCategories when ebayCategoryId is empty', async () => {
    const item = { ...BASE_ITEM, ebayCategoryId: '', aiAnalysis: {} };
    mockPrisma.item.findUnique.mockResolvedValue(item);
    mockPrisma.photo.findMany.mockResolvedValue(BASE_ITEM.photos);
    mockPrisma.item.update.mockResolvedValue({});

    const catsSpy = vi.spyOn(ebayService as any, 'getCategories').mockResolvedValue([
      { CategoryID: '9355', CategoryName: 'Film Photography' },
    ]);
    spyGetSpecifics([]);
    spyDetectSite('0');

    // Stop after category step; createListing will still be called.
    vi.spyOn(ebayService as any, 'createListing').mockRejectedValue(
      new Error('eBay API is not configured')
    );

    await expect(ebayService.pushItem('item-1')).rejects.toThrow();
    expect(catsSpy).toHaveBeenCalledWith(item.title);
  });

  // -------------------------------------------------------------------------
  // No category found after lookup → throws with clear message
  // -------------------------------------------------------------------------

  it('throws with clear message about missing Category ID when lookup returns nothing', async () => {
    const item = { ...BASE_ITEM, ebayCategoryId: '', aiAnalysis: {} };
    mockPrisma.item.findUnique.mockResolvedValue(item);
    mockPrisma.photo.findMany.mockResolvedValue(BASE_ITEM.photos);

    vi.spyOn(ebayService as any, 'getCategories').mockResolvedValue([]); // no results

    await expect(ebayService.pushItem('item-1')).rejects.toThrow(
      /Missing eBay Category ID/
    );
  });

  // -------------------------------------------------------------------------
  // Item with no photos — service proceeds (no early guard), imageUrls is []
  // -------------------------------------------------------------------------

  it('still calls createListing when item has no photos (imageUrls is empty)', async () => {
    mockPrisma.item.findUnique.mockResolvedValue({ ...BASE_ITEM, photos: [] });
    mockPrisma.photo.findMany.mockResolvedValue([]);
    mockPrisma.item.update.mockResolvedValue({});
    mockPrisma.listing.create.mockResolvedValue({});

    const createSpy = spyCreate(SUCCESS_LISTING);
    spyGetCats([]);
    spyGetSpecifics([]);
    spyDetectSite('0');

    await ebayService.pushItem('item-1');

    // createListing should be called with an empty imageUrls array
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrls: [] })
    );
  });
});

// ---------------------------------------------------------------------------
// reviseItem tests (ReviseItem path for already-listed items)
// ---------------------------------------------------------------------------

describe('ebayService.reviseItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls reviseListing (not createListing) and returns { platformId, listingUrl }', async () => {
    mockPrisma.item.findUnique.mockResolvedValue({ ...BASE_ITEM, ebayId: '987654321' });

    const reviseSpy = vi.spyOn(ebayService as any, 'reviseListing').mockResolvedValue({ success: true });
    vi.spyOn(ebayService as any, 'getListingUrl').mockReturnValue('https://www.ebay.com/itm/987654321');
    const createSpy = vi.spyOn(ebayService as any, 'createListing');

    const result = await ebayService.reviseItem('987654321', 'item-1');

    expect(reviseSpy).toHaveBeenCalledWith(
      '987654321',
      expect.objectContaining({ title: expect.any(String) })
    );
    expect(createSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      platformId: '987654321',
      platform: 'ebay',
    });
  });

  it('throws "Item not found" when item does not exist', async () => {
    mockPrisma.item.findUnique.mockResolvedValue(null);

    await expect(ebayService.reviseItem('999', 'missing-item')).rejects.toThrow(
      'Item not found'
    );
  });
});
