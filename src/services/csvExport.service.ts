import { prisma } from '../config/database';
import { WorkflowStage } from '../../src/generated/prisma';

/**
 * eBay File Exchange CSV column headers.
 */
const CSV_HEADERS = [
  'Action',
  'Category',
  'Title',
  'Description',
  'ConditionID',
  'Format',
  'Duration',
  'StartPrice',
  'BuyItNowPrice',
  'Quantity',
  'PicURL',
  'Location',
  'ShippingType',
  'ShippingService',
  'ShippingCost',
  'HandlingTime',
  '*ReturnsAcceptedOption',
  'ReturnsWithinOption',
  'RefundOption',
  'ShippingCostPaidByOption',
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
    case 'open box': return 1500;
    case 'used - like new': return 3000;
    case 'used - good': return 4000;
    case 'used - acceptable': return 5000;
    case 'for parts': return 7000;
    default: return 3000; // Default to Used - Like New
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
  category: string;
  title: string;
  description: string;
  conditionId: number;
  format: string;
  duration: string;
  startPrice: number;
  buyItNowPrice: number;
  quantity: number;
  picUrl: string;
  location: string;
  shippingType: string;
  shippingService: string;
  shippingCost: number;
  handlingTime: number;
  returnsAccepted: string;
  returnsWithin: string;
  refundOption: string;
  shippingCostPaidBy: string;
  weightMajor: string;
  weightMinor: string;
  packageLength: string;
  packageWidth: string;
  packageDepth: string;
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

  // Build pipe-delimited PicURL from public URLs
  const picUrls = item.photos
    .map(p => p.publicUrl)
    .filter(Boolean)
    .join('|');

  const postalCode = item.postalCode || process.env.SELLER_POSTAL_CODE || '10001';

  // Parse return policy JSON
  const returnPolicy = (item.returnPolicy as Record<string, string>) || {};
  const returnsAccepted = returnPolicy.returnsAccepted === 'false' ? 'ReturnsNotAccepted' : 'ReturnsAccepted';
  const returnsWithin = returnPolicy.returnDays ? `Days_${returnPolicy.returnDays}` : 'Days_30';
  const refundOption = returnPolicy.refundType || 'MoneyBack';
  const shippingCostPaidBy = returnPolicy.shippingCostPaidBy || 'Buyer';

  // Use item's listing format/duration instead of deriving from price
  const format = item.listingFormat || (item.buyNowPrice ? 'FixedPrice' : 'Auction');
  const duration = item.listingDuration || (format === 'FixedPrice' ? 'GTC' : '7');

  // Weight: convert oz to lbs + oz
  const totalOz = item.weight || 0;
  const weightLbs = Math.floor(totalOz / 16);
  const weightOz = Math.round(totalOz % 16);

  // Package dimensions
  const dims = (item.packageDimensions as Record<string, number>) || {};

  return {
    itemId: item.id,
    action: 'Add',
    category: item.category || '',
    title: (item.title || '').substring(0, 80),
    description: item.description || '',
    conditionId: getConditionId(item.condition),
    format,
    duration,
    startPrice: item.startingPrice || item.buyNowPrice || 0,
    buyItNowPrice: format === 'FixedPrice' ? (item.buyNowPrice || item.startingPrice || 0) : (item.buyNowPrice || 0),
    quantity: item.quantity || 1,
    picUrl: picUrls,
    location: postalCode,
    shippingType: item.shippingType || 'Flat',
    shippingService: item.shippingService || 'USPSPriority',
    shippingCost: item.shippingCost || 0,
    handlingTime: item.handlingTime || 3,
    returnsAccepted,
    returnsWithin,
    refundOption,
    shippingCostPaidBy,
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
 * Generate eBay File Exchange CSV for a batch of item IDs.
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
      rowData.category,
      rowData.title,
      rowData.description,
      rowData.conditionId,
      rowData.format,
      rowData.duration,
      rowData.startPrice,
      rowData.buyItNowPrice,
      rowData.quantity,
      rowData.picUrl,
      rowData.location,
      rowData.shippingType,
      rowData.shippingService,
      rowData.shippingCost,
      rowData.handlingTime,
      rowData.returnsAccepted,
      rowData.returnsWithin,
      rowData.refundOption,
      rowData.shippingCostPaidBy,
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
