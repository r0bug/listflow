import { prisma } from '../config/database';
import { WorkflowStage } from '../../src/generated/prisma';
import { ebayService } from './ebay.service';

/**
 * eBay Seller Hub Reports CSV column headers.
 * Must match eBay's exact expected names — case and spacing matter.
 */
const CSV_HEADERS = [
  'Action',
  'Category ID',
  'Custom label (SKU)',
  'Title',
  'C:Brand',
  'C:Model',
  'C:Type',
  'P:UPC',
  'P:ISBN',
  'Start price',
  'Quantity',
  'Item photo URL',
  'Condition ID',
  'Description',
  'Format',
  'Duration',
  'PostalCode',
  'Shipping service 1 option',
  'Shipping service 1 cost',
  'Shipping service 1 priority',
  'Max dispatch time',
  'Returns accepted option',
  'Returns within option',
  'Refund option',
  'Return shipping cost paid by',
  'WeightMajor',
  'WeightMinor',
  'PackageLength',
  'PackageWidth',
  'PackageDepth',
];

/**
 * Map condition strings to eBay ConditionID values.
 */
function getConditionId(condition: string | null): number {
  switch (condition?.toLowerCase()) {
    case 'new': return 1000;
    case 'new other':
    case 'open box': return 1500;
    case 'new with defects': return 1750;
    case 'remanufactured': return 2000;
    case 'seller refurbished':
    case 'refurbished': return 2500;
    case 'used':
    case 'used - like new':
    case 'very good':
    case 'used - very good':
    case 'used - good':
    case 'good':
    case 'acceptable':
    case 'used - acceptable': return 3000;
    case 'for parts':
    case 'for parts or not working': return 7000;
    default: return 3000;
  }
}

/**
 * Escape a CSV field value (wrap in quotes, escape internal quotes).
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface CsvRowData {
  itemId: string;
  action: string;
  categoryId: string;
  sku: string;
  title: string;
  brand: string;
  model: string;
  type: string;
  upc: string;
  isbn: string;
  startPrice: number;
  quantity: number;
  picUrl: string;
  conditionId: number;
  description: string;
  format: string;
  duration: string;
  postalCode: string;
  shippingService: string;
  shippingCost: number;
  shippingPriority: string;
  maxDispatchTime: number;
  returnsAccepted: string;
  returnsWithin: string;
  refundOption: string;
  returnShippingCostPaidBy: string;
  weightMajor: string;
  weightMinor: string;
  packageLength: string;
  packageWidth: string;
  packageDepth: string;
}

/**
 * Look up eBay numeric category ID from item title using GetSuggestedCategories.
 * Caches the result on the item's ebayCategoryId field.
 */
async function resolveEbayCategoryId(item: { id: string; title: string | null; category: string | null; ebayCategoryId: string | null; aiAnalysis: unknown }): Promise<string> {
  // 1. Already have a numeric ID stored
  if (item.ebayCategoryId && /^\d+$/.test(item.ebayCategoryId)) {
    return item.ebayCategoryId;
  }

  // 2. Check aiAnalysis for a numeric categoryId
  const ai = (item.aiAnalysis as Record<string, unknown>) || {};
  if (ai.categoryId && /^\d+$/.test(String(ai.categoryId))) {
    const catId = String(ai.categoryId);
    // Cache it
    await prisma.item.update({ where: { id: item.id }, data: { ebayCategoryId: catId } }).catch(() => {});
    return catId;
  }

  // 3. Look up from eBay API using title
  if (item.title) {
    try {
      const categories = await ebayService.getCategories(item.title);
      if (Array.isArray(categories) && categories.length > 0) {
        // GetSuggestedCategories returns {Category: {CategoryID, CategoryName}} or {CategoryID, CategoryName}
        const first = categories[0];
        const catId = String(first.CategoryID || first.Category?.CategoryID || '');
        if (catId && /^\d+$/.test(catId)) {
          // Cache it
          await prisma.item.update({ where: { id: item.id }, data: { ebayCategoryId: catId } }).catch(() => {});
          return catId;
        }
      }
    } catch (err) {
      console.error('Failed to look up eBay category for:', item.title, err);
    }
  }

  // 4. Fallback — return whatever we have (may cause eBay rejection)
  return item.ebayCategoryId || '';
}

/**
 * Build CSV row data for an item.
 */
async function buildItemRow(itemId: string): Promise<CsvRowData | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      photos: { orderBy: { order: 'asc' } },
      location: true,
    },
  });

  if (!item) return null;

  // Build pipe-delimited image URLs from public URLs
  const picUrls = item.photos
    .map(p => p.publicUrl)
    .filter(Boolean)
    .join('|');

  const postalCode = item.postalCode || process.env.SELLER_POSTAL_CODE || '98901';

  // Parse return policy JSON
  const returnPolicy = (item.returnPolicy as Record<string, string>) || {};
  const returnsAccepted = returnPolicy.returnsAccepted === 'false' ? 'ReturnsNotAccepted' : 'ReturnsAccepted';
  const returnsWithin = returnPolicy.returnDays ? `Days_${returnPolicy.returnDays}` : 'Days_30';
  const refundOption = returnPolicy.refundType || 'MoneyBack';
  const returnShippingCostPaidBy = returnPolicy.shippingCostPaidBy || 'Buyer';

  // Listing format/duration
  const format = item.listingFormat || (item.buyNowPrice ? 'FixedPrice' : 'Auction');
  const duration = item.listingDuration || (format === 'FixedPrice' ? 'GTC' : '7');

  // Weight: convert oz to lbs + oz
  const totalOz = item.weight || 0;
  const weightLbs = Math.floor(totalOz / 16);
  const weightOz = Math.round(totalOz % 16);

  // Package dimensions
  const dims = (item.packageDimensions as Record<string, number>) || {};

  // Resolve numeric eBay category ID
  const categoryId = await resolveEbayCategoryId(item);

  // Extract item specifics from AI analysis
  const ai = (item.aiAnalysis as Record<string, unknown>) || {};
  const specifics = (ai.specifics as Record<string, string>) || {};
  const brand = item.brand || specifics.Brand || specifics.brand || 'Unbranded';
  const model = specifics.Model || specifics.model || 'Does not apply';
  // Type: derive from category or item type in AI analysis
  const itemType = (ai.itemType as string) || item.category || 'Other';

  return {
    itemId: item.id,
    action: 'Add',
    categoryId,
    sku: item.sku || '',
    title: (item.title || '').substring(0, 80),
    brand,
    model,
    type: itemType,
    upc: item.upc || 'Does not apply',
    isbn: item.isbn || '',
    startPrice: item.startingPrice || item.buyNowPrice || 0,
    quantity: item.quantity || 1,
    picUrl: picUrls,
    conditionId: getConditionId(item.condition),
    description: item.description || '',
    format,
    duration,
    postalCode,
    shippingService: item.shippingService || 'USPSPriority',
    shippingCost: item.shippingCost || 0,
    shippingPriority: '1',
    maxDispatchTime: item.handlingTime || 3,
    returnsAccepted,
    returnsWithin,
    refundOption,
    returnShippingCostPaidBy,
    weightMajor: weightLbs > 0 ? String(weightLbs) : '',
    weightMinor: totalOz > 0 ? String(weightOz) : '',
    packageLength: dims.length ? String(dims.length) : '',
    packageWidth: dims.width ? String(dims.width) : '',
    packageDepth: dims.height ? String(dims.height) : '',
  };
}

/**
 * Preview CSV data for a single item (returns structured data, not CSV string).
 */
export async function previewExport(itemId: string): Promise<CsvRowData | null> {
  return buildItemRow(itemId);
}

/**
 * Generate eBay Seller Hub Reports CSV for a batch of item IDs.
 * Only items at FINAL_REVIEW stage or later are eligible.
 * Optionally marks items with exportedAt timestamp.
 */
export async function generateCsv(
  itemIds: string[],
  markExported: boolean = true
): Promise<string> {
  // Validate all items are at FINAL_REVIEW or PUBLISHED
  const items = await prisma.item.findMany({
    where: {
      id: { in: itemIds },
      stage: { in: [WorkflowStage.FINAL_REVIEW, WorkflowStage.PUBLISHED] },
    },
    select: { id: true },
  });

  const validIds = new Set(items.map(i => i.id));
  const invalidIds = itemIds.filter(id => !validIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error(`Items not eligible for export (must be at FINAL_REVIEW or PUBLISHED stage): ${invalidIds.join(', ')}`);
  }

  // Build CSV rows
  const rows: string[] = [];
  rows.push(CSV_HEADERS.map(h => escapeCSV(h)).join(','));

  for (const itemId of itemIds) {
    const rowData = await buildItemRow(itemId);
    if (!rowData) continue;

    const row = [
      rowData.action,
      rowData.categoryId,
      rowData.sku,
      rowData.title,
      rowData.brand,
      rowData.model,
      rowData.type,
      rowData.upc,
      rowData.isbn,
      rowData.startPrice,
      rowData.quantity,
      rowData.picUrl,
      rowData.conditionId,
      rowData.description,
      rowData.format,
      rowData.duration,
      rowData.postalCode,
      rowData.shippingService,
      rowData.shippingCost,
      rowData.shippingPriority,
      rowData.maxDispatchTime,
      rowData.returnsAccepted,
      rowData.returnsWithin,
      rowData.refundOption,
      rowData.returnShippingCostPaidBy,
      rowData.weightMajor,
      rowData.weightMinor,
      rowData.packageLength,
      rowData.packageWidth,
      rowData.packageDepth,
    ];

    rows.push(row.map(v => escapeCSV(v)).join(','));
  }

  // Mark items as exported
  if (markExported) {
    await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: { exportedAt: new Date() },
    });
  }

  return rows.join('\r\n');
}

export const csvExportService = { generateCsv, previewExport, getConditionId };
