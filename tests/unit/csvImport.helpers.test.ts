import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service (vi.hoisted so the factory can see it)
const mockPrisma = vi.hoisted(() => ({
  ebayAccount: { findUnique: vi.fn() },
  sale: { findFirst: vi.fn(), create: vi.fn() },
  listing: { findUnique: vi.fn(), update: vi.fn() },
}));
vi.mock('../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../src/services/commission.service', () => ({
  commissionService: { createForSale: vi.fn() },
}));

import { csvImportService } from '../../src/services/csvImport.service';

const HEADER =
  'Sales Record Number,Order Number,Buyer Username,Buyer Name,Sale Date,Item Number,Item Title,Quantity,Sold For,Shipping And Handling,Total Price,Transaction ID';

function csv(...rows: string[]): Buffer {
  return Buffer.from([HEADER, ...rows].join('\n'), 'utf8');
}

describe('csvImportService.importOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.ebayAccount.findUnique.mockResolvedValue({ id: 'acct1' });
    mockPrisma.sale.findFirst.mockResolvedValue(null);
    mockPrisma.listing.findUnique.mockResolvedValue(null);
    mockPrisma.sale.create.mockImplementation(async ({ data }: any) => ({ id: 'sale1', ...data }));
  });

  it('maps a standard Seller Hub row', async () => {
    const result = await csvImportService.importOrders(
      csv('101,12-34567-89012,buyer_1,"Smith, Pat",Jul-21-25,335001234567,"Vintage Lamp, brass",1,$45.99,$12.00,$57.99,2857301'),
      'acct1'
    );
    expect(result.created).toBe(1);
    expect(result.errors).toEqual([]);
    const data = mockPrisma.sale.create.mock.calls[0][0].data;
    expect(data.ebayOrderId).toBe('12-34567-89012');
    expect(data.lineItemId).toBe('2857301');
    expect(data.legacyItemId).toBe('335001234567');
    expect(data.title).toBe('Vintage Lamp, brass');
    expect(data.itemPrice).toBe(45.99);
    expect(data.shippingPrice).toBe(12);
    expect(data.totalPrice).toBe(57.99);
    expect(data.buyerName).toBe('Smith, Pat');
    expect(data.soldAt.getFullYear()).toBe(2025);
    expect(data.source).toBe('csv');
  });

  it('handles BOM and skips rows without an order number (preamble/totals)', async () => {
    const withBom = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      csv(',,,,,,,,,,,', '102,12-11111-22222,b2,Buyer Two,07/04/2025,335009,Widget,2,$10.00,$0.00,$20.00,999'),
    ]);
    const result = await csvImportService.importOrders(withBom, 'acct1');
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    const data = mockPrisma.sale.create.mock.calls[0][0].data;
    expect(data.quantity).toBe(2);
  });

  it('detects duplicates and counts them without creating', async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'existing' });
    const result = await csvImportService.importOrders(
      csv('103,12-33333-44444,b3,Buyer,Jul-01-25,335010,Thing,1,$5.00,$0.00,$5.00,777'),
      'acct1'
    );
    expect(result.duplicates).toBe(1);
    expect(result.created).toBe(0);
    expect(mockPrisma.sale.create).not.toHaveBeenCalled();
  });

  it('dryRun counts but never writes', async () => {
    const result = await csvImportService.importOrders(
      csv('104,12-55555-66666,b4,Buyer,Jul-02-25,335011,Thing,1,$5.00,$0.00,$5.00,888'),
      'acct1',
      true
    );
    expect(result.created).toBe(1);
    expect(result.dryRun).toBe(true);
    expect(mockPrisma.sale.create).not.toHaveBeenCalled();
  });

  it('reports unparseable rows with row numbers', async () => {
    const result = await csvImportService.importOrders(
      csv('105,12-77777-88888,b5,Buyer,NOT-A-DATE,335012,Thing,1,$5.00,$0.00,$5.00,111'),
      'acct1'
    );
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].reason).toMatch(/date/i);
  });

  it('falls back lineItemId to item number when no transaction id', async () => {
    await csvImportService.importOrders(
      csv('106,12-99999-00000,b6,Buyer,Jul-03-25,335013,Thing,1,$5.00,$0.00,$5.00,'),
      'acct1'
    );
    const data = mockPrisma.sale.create.mock.calls[0][0].data;
    expect(data.lineItemId).toBe('335013');
  });
});
