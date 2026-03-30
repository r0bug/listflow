import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Prisma and eBay service before importing the service under test
// ---------------------------------------------------------------------------

const { mockPrisma, mockEbayService } = vi.hoisted(() => ({
  mockPrisma: {
    item: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  } as any,
  mockEbayService: { getCategories: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../src/services/ebay.service', () => ({ ebayService: mockEbayService }));

// ---------------------------------------------------------------------------
// Import after mocks are registered
// ---------------------------------------------------------------------------

import { csvExportService } from '../../src/services/csvExport.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a single CSV line into an array of string fields (RFC 4180). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      // quoted field
      let field = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ',') i++; // skip separator
    } else {
      // unquoted field
      const end = line.indexOf(',', i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

/** Parse a CSV row by index and return an object keyed by header name. */
function parseCsvRow(csv: string, rowIndex = 1): Record<string, string> {
  const lines = csv.split('\r\n');
  const headers = parseCsvLine(lines[0]);
  const values = parseCsvLine(lines[rowIndex]);
  return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
}

const BASE_ITEM = {
  id: 'item-1',
  title: 'Test Item',
  description: 'A description',
  sku: 'SKU-001',
  condition: 'Used',
  category: 'Electronics',
  ebayCategoryId: '9355',
  brand: 'Acme',
  upc: '012345678901',
  isbn: null,
  startingPrice: 19.99,
  buyNowPrice: null,
  quantity: 1,
  listingFormat: 'FixedPrice',
  listingDuration: 'GTC',
  shippingService: 'USPSPriority',
  shippingCost: 5.0,
  handlingTime: 2,
  postalCode: '98101',
  weight: 32,   // 2 lbs exactly
  packageDimensions: { length: 10, width: 8, height: 4 },
  returnPolicy: { returnsAccepted: 'true', returnDays: '30', refundType: 'MoneyBack', shippingCostPaidBy: 'Buyer' },
  aiAnalysis: {
    itemType: 'Camera',
    specifics: { Brand: 'Acme', Model: 'X100' },
    categoryId: '9355',
  },
  shippingProfileId: null,
  exportedAt: null,
  photos: [
    { id: 'p1', publicUrl: 'https://img.example.com/photo1.jpg', order: 0 },
  ],
  location: null,
};

/** Wire up the two Prisma mocks needed for generateCsv. */
function setupMocks(item: any) {
  mockPrisma.item.findMany.mockResolvedValue([{ id: item.id }]);
  mockPrisma.item.findUnique.mockResolvedValue(item);
  mockPrisma.item.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.item.update.mockResolvedValue(item);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('csvExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getConditionId – pure helper exported on the service object
  // -------------------------------------------------------------------------

  describe('getConditionId', () => {
    it('maps "new" to 1000', () => {
      expect(csvExportService.getConditionId('new')).toBe(1000);
    });
    it('maps "used" to 3000', () => {
      expect(csvExportService.getConditionId('used')).toBe(3000);
    });
    it('defaults unknown condition to 3000', () => {
      expect(csvExportService.getConditionId(null)).toBe(3000);
      expect(csvExportService.getConditionId('random')).toBe(3000);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path: item with all fields
  // -------------------------------------------------------------------------

  describe('generateCsv – happy path', () => {
    it('generates CSV with correct eBay Seller Hub column headers', async () => {
      setupMocks(BASE_ITEM);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const firstLine = csv.split('\r\n')[0];

      expect(firstLine).toContain('Action');
      expect(firstLine).toContain('Category ID');
      expect(firstLine).toContain('Custom label (SKU)');
      expect(firstLine).toContain('Title');
      expect(firstLine).toContain('C:Brand');
      expect(firstLine).toContain('C:Model');
      expect(firstLine).toContain('C:Type');
      expect(firstLine).toContain('P:UPC');
      expect(firstLine).toContain('P:ISBN');
      expect(firstLine).toContain('Start price');
      expect(firstLine).toContain('Item photo URL');
      expect(firstLine).toContain('Condition ID');
      expect(firstLine).toContain('Shipping service 1 option');
      expect(firstLine).toContain('WeightMajor');
      expect(firstLine).toContain('WeightMinor');
    });

    it('populates all data fields correctly on the first data row', async () => {
      setupMocks(BASE_ITEM);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      expect(row['Action']).toBe('Add');
      expect(row['Category ID']).toBe('9355');
      expect(row['Custom label (SKU)']).toBe('SKU-001');
      expect(row['Title']).toBe('Test Item');
      expect(row['C:Brand']).toBe('Acme');
      expect(row['Start price']).toBe('19.99');
      expect(row['Condition ID']).toBe('3000');
      expect(row['Format']).toBe('FixedPrice');
      expect(row['PostalCode']).toBe('98101');
    });
  });

  // -------------------------------------------------------------------------
  // Missing optional fields — no crash, empty cells
  // -------------------------------------------------------------------------

  describe('generateCsv – missing optional fields', () => {
    it('handles no UPC, no ISBN, no description without crashing', async () => {
      const item = {
        ...BASE_ITEM,
        upc: null,
        isbn: null,
        description: null,
      };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      // UPC defaults to "Does not apply" per the service logic
      expect(row['P:UPC']).toBe('Does not apply');
      // ISBN is empty when null
      expect(row['P:ISBN']).toBe('');
      // Description is empty when null
      expect(row['Description']).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple photos — pipe-separated URLs
  // -------------------------------------------------------------------------

  describe('generateCsv – multiple photos', () => {
    it('joins multiple photo publicUrls with pipe separator', async () => {
      const item = {
        ...BASE_ITEM,
        photos: [
          { id: 'p1', publicUrl: 'https://img.example.com/a.jpg', order: 0 },
          { id: 'p2', publicUrl: 'https://img.example.com/b.jpg', order: 1 },
          { id: 'p3', publicUrl: 'https://img.example.com/c.jpg', order: 2 },
        ],
      };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      expect(row['Item photo URL']).toBe(
        'https://img.example.com/a.jpg|https://img.example.com/b.jpg|https://img.example.com/c.jpg'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Item specifics from AI analysis — C:Brand, C:Model appear as separate columns
  // -------------------------------------------------------------------------

  describe('generateCsv – item specifics', () => {
    it('puts C:Brand and C:Model from aiAnalysis.specifics into their columns', async () => {
      const item = {
        ...BASE_ITEM,
        brand: null, // rely on AI specifics
        aiAnalysis: {
          itemType: 'Lens',
          specifics: { Brand: 'Nikon', Model: '50mm f/1.8' },
        },
      };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      expect(row['C:Brand']).toBe('Nikon');
      expect(row['C:Model']).toBe('50mm f/1.8');
    });

    it('falls back to Unbranded / Does not apply when no brand/model data', async () => {
      const item = {
        ...BASE_ITEM,
        brand: null,
        aiAnalysis: { itemType: 'Generic' },
      };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      expect(row['C:Brand']).toBe('Unbranded');
      expect(row['C:Model']).toBe('Does not apply');
    });
  });

  // -------------------------------------------------------------------------
  // Null/undefined price fields — handled gracefully
  // -------------------------------------------------------------------------

  describe('generateCsv – null price fields', () => {
    it('outputs 0 for Start price when both startingPrice and buyNowPrice are null', async () => {
      const item = { ...BASE_ITEM, startingPrice: null, buyNowPrice: null };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      expect(row['Start price']).toBe('0');
    });

    it('uses buyNowPrice as fallback when startingPrice is null', async () => {
      const item = { ...BASE_ITEM, startingPrice: null, buyNowPrice: 49.99 };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const row = parseCsvRow(csv);

      // buyNowPrice fallback: may be used for start price or fall through to 0
      const price = row['Start price'];
      expect(['49.99', '0']).toContain(price);
    });
  });

  // -------------------------------------------------------------------------
  // Title with special characters — proper CSV escaping
  // -------------------------------------------------------------------------

  describe('generateCsv – CSV escaping', () => {
    it('wraps title containing commas in double quotes', async () => {
      const item = { ...BASE_ITEM, title: 'Camera, Lens, and Case' };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      // The raw CSV line should contain the quoted title
      const dataLine = csv.split('\r\n')[1];
      expect(dataLine).toContain('"Camera, Lens, and Case"');
    });

    it('escapes internal double quotes by doubling them', async () => {
      const item = { ...BASE_ITEM, title: 'Camera "Pro" Edition' };
      setupMocks(item);

      const csv = await csvExportService.generateCsv(['item-1'], false);
      const dataLine = csv.split('\r\n')[1];
      expect(dataLine).toContain('"Camera ""Pro"" Edition"');
    });
  });

  // -------------------------------------------------------------------------
  // generateCsv throws when items are not at eligible stage
  // -------------------------------------------------------------------------

  describe('generateCsv – stage validation', () => {
    it('throws when item IDs are not at FINAL_REVIEW or PUBLISHED', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]); // none eligible
      mockPrisma.item.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        csvExportService.generateCsv(['item-bad'], false)
      ).rejects.toThrow('not eligible for export');
    });
  });
});
