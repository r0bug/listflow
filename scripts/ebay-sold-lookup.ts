#!/usr/bin/env ts-node
/**
 * eBay Sold Items Lookup Tool
 *
 * Uses Playwright (Firefox) to scrape eBay's completed/sold listings
 * for price research on items.
 *
 * Usage:
 *   npx ts-node scripts/ebay-sold-lookup.ts "Nintendo 64 console"
 *   npx ts-node scripts/ebay-sold-lookup.ts "iPhone 15 Pro Max" --limit 20
 *   npx ts-node scripts/ebay-sold-lookup.ts "vintage leather jacket" --json
 */

import { firefox, type Page, type BrowserContext } from 'playwright';

interface SoldItem {
  title: string;
  price: string;
  priceValue: number;
  shippingCost: string;
  dateSold: string;
  condition: string;
  url: string;
}

interface LookupResult {
  query: string;
  itemCount: number;
  items: SoldItem[];
  averagePrice: number;
  medianPrice: number;
  priceRange: { low: number; high: number };
  timestamp: string;
}

async function searchEbaySoldItems(
  query: string,
  options: { limit?: number; headless?: boolean } = {}
): Promise<LookupResult> {
  const { limit = 10, headless = true } = options;

  const browser = await firefox.launch({ headless });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    const searchParams = new URLSearchParams({
      _nkw: query,
      _sacat: '0',
      LH_Sold: '1',
      LH_Complete: '1',
      _sop: '13', // Sort by end date: recent first
    });
    const url = `https://www.ebay.com/sch/i.html?${searchParams.toString()}`;

    console.log(`Searching eBay sold listings for: "${query}"`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for results to render
    await page.waitForTimeout(5000);

    // Check for bot challenge
    if (page.url().includes('challenge') || page.url().includes('splash')) {
      console.log('Bot detection triggered. Waiting for challenge to resolve...');
      await page.waitForTimeout(10000);
      if (page.url().includes('challenge') || page.url().includes('splash')) {
        throw new Error('eBay bot detection could not be bypassed. Try again later or use --show-browser.');
      }
    }

    // Extract items using locator API
    const cardLocators = page.locator('ul.srp-results > li.s-card');
    const totalCards = await cardLocators.count();
    const itemsToProcess = Math.min(totalCards, limit);

    const items: SoldItem[] = [];

    for (let i = 0; i < itemsToProcess; i++) {
      const card = cardLocators.nth(i);

      // Title
      const titleLoc = card.locator('.s-card__title');
      const title = (await titleLoc.count()) > 0
        ? (await titleLoc.first().evaluate(el => el.textContent?.trim() || '')).replace(/Opens in a new window or tab/g, '').replace(/^New Listing/g, '').trim()
        : '';

      if (!title || title === 'Shop on eBay') continue;

      // Price
      const priceLoc = card.locator('.s-card__price');
      const price = (await priceLoc.count()) > 0
        ? await priceLoc.first().evaluate(el => el.textContent?.trim() || '')
        : '';

      // Shipping
      const shippingLoc = card.locator('span.su-styled-text.secondary.large');
      let shippingCost = 'Not specified';
      const shippingCount = await shippingLoc.count();
      for (let s = 0; s < shippingCount; s++) {
        const txt = await shippingLoc.nth(s).evaluate(el => el.textContent?.trim() || '');
        if (txt.includes('delivery') || txt.includes('shipping') || txt.toLowerCase().includes('free')) {
          shippingCost = txt;
          break;
        }
      }

      // Date sold
      const dateLoc = card.locator('span.su-styled-text.positive');
      let dateSold = '';
      const dateCount = await dateLoc.count();
      for (let d = 0; d < dateCount; d++) {
        const txt = await dateLoc.nth(d).evaluate(el => el.textContent?.trim() || '');
        if (txt.includes('Sold')) {
          dateSold = txt;
          break;
        }
      }

      // Condition (from subtitle)
      const subtitleLoc = card.locator('.s-card__subtitle');
      const condition = (await subtitleLoc.count()) > 0
        ? await subtitleLoc.first().evaluate(el => el.textContent?.trim() || '')
        : '';

      // URL
      const linkLoc = card.locator('a.s-card__link');
      let itemUrl = '';
      if ((await linkLoc.count()) > 0) {
        itemUrl = await linkLoc.first().getAttribute('href') || '';
      } else {
        // Fallback: first anchor
        const anyLink = card.locator('a[href*="/itm/"]');
        if ((await anyLink.count()) > 0) {
          itemUrl = await anyLink.first().getAttribute('href') || '';
        }
      }

      // Parse numeric price
      const priceMatch = price.match(/\$?([\d,]+\.?\d*)/);
      const priceValue = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

      items.push({
        title,
        price,
        priceValue,
        shippingCost,
        dateSold,
        condition,
        url: itemUrl,
      });
    }

    // Calculate stats
    const prices = items.map(i => i.priceValue).filter(p => p > 0);
    prices.sort((a, b) => a - b);

    const averagePrice = prices.length > 0
      ? Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100) / 100
      : 0;

    const medianPrice = prices.length > 0
      ? prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)]
      : 0;

    const priceRange = prices.length > 0
      ? { low: prices[0], high: prices[prices.length - 1] }
      : { low: 0, high: 0 };

    return {
      query,
      itemCount: items.length,
      items,
      averagePrice,
      medianPrice,
      priceRange,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function printResults(result: LookupResult): void {
  console.log('\n' + '='.repeat(70));
  console.log(`  eBay Sold Listings: "${result.query}"`);
  console.log('='.repeat(70));

  if (result.itemCount === 0) {
    console.log('\n  No sold items found for this search.\n');
    return;
  }

  console.log(`\n  Found: ${result.itemCount} sold items`);
  console.log(`  Average Price:  ${formatCurrency(result.averagePrice)}`);
  console.log(`  Median Price:   ${formatCurrency(result.medianPrice)}`);
  console.log(`  Price Range:    ${formatCurrency(result.priceRange.low)} - ${formatCurrency(result.priceRange.high)}`);
  console.log('-'.repeat(70));

  for (let i = 0; i < result.items.length; i++) {
    const item = result.items[i];
    console.log(`\n  [${i + 1}] ${item.title}`);
    console.log(`      Price: ${item.price}  |  Shipping: ${item.shippingCost}`);
    if (item.condition) console.log(`      Condition: ${item.condition}`);
    if (item.dateSold) console.log(`      Sold: ${item.dateSold}`);
  }

  console.log('\n' + '='.repeat(70));
}

// --- CLI ---
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx ts-node scripts/ebay-sold-lookup.ts <search query> [options]

Options:
  --limit <n>     Number of results to return (default: 10)
  --json          Output raw JSON instead of formatted text
  --show-browser  Run with visible browser (useful for debugging)
  -h, --help      Show this help

Examples:
  npx ts-node scripts/ebay-sold-lookup.ts "Nintendo 64 console"
  npx ts-node scripts/ebay-sold-lookup.ts "vintage leather jacket" --limit 20
  npx ts-node scripts/ebay-sold-lookup.ts "iPhone 15 Pro" --json
`);
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const showBrowser = args.includes('--show-browser');
  let limit = 10;

  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10) || 10;
  }

  // Everything that isn't a flag is part of the query
  const query = args
    .filter((a, idx) => !a.startsWith('--') && (limitIdx === -1 || idx !== limitIdx + 1))
    .join(' ');

  if (!query) {
    console.error('Error: No search query provided.');
    process.exit(1);
  }

  try {
    const result = await searchEbaySoldItems(query, {
      limit,
      headless: !showBrowser,
    });

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printResults(result);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

export { searchEbaySoldItems, type SoldItem, type LookupResult };
