import puppeteer, { Browser, Page } from 'puppeteer';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface SoldItemData {
  ebayItemId: string;
  title: string;
  soldPrice: number;
  shippingPrice?: number;
  totalPrice?: number;
  condition?: string;
  seller?: string;
  sellerFeedback?: number;
  listingType?: string;
  bidCount?: number;
  imageUrl?: string;
  soldDate: Date;
  category?: string;
  categoryId?: string;
}

export interface PriceStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
  percentile25: number;
  percentile75: number;
  items: SoldItemData[];
}

export interface ScraperOptions {
  headless?: boolean;
  maxPages?: number;
  delayBetweenPages?: number;
  saveToDb?: boolean;
}

class SoldDataService {
  private browser: Browser | null = null;
  private isInitialized: boolean = false;

  async initialize(headless: boolean = true): Promise<void> {
    if (this.browser) {
      return;
    }

    console.log('Initializing Puppeteer browser...');

    this.browser = await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    this.isInitialized = true;
    console.log('Browser initialized successfully');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('Browser closed');
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  async searchSoldItems(
    query: string,
    options: ScraperOptions = {}
  ): Promise<SoldItemData[]> {
    const {
      headless = true,
      maxPages = 3,
      delayBetweenPages = 2000,
      saveToDb = true
    } = options;

    await this.initialize(headless);

    const page = await this.createPage();
    const allItems: SoldItemData[] = [];

    try {
      console.log(`Searching eBay sold items for: "${query}"`);

      // Build eBay sold items search URL
      const encodedQuery = encodeURIComponent(query);
      const baseUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=0&LH_Complete=1&LH_Sold=1&rt=nc`;

      let currentPage = 1;

      while (currentPage <= maxPages) {
        const pageUrl = currentPage === 1
          ? baseUrl
          : `${baseUrl}&_pgn=${currentPage}`;

        console.log(`Fetching page ${currentPage}...`);

        await page.goto(pageUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for results to load
        await page.waitForSelector('.srp-results', { timeout: 10000 }).catch(() => {
          console.log('No results found or page structure changed');
        });

        // Extract items from current page
        const pageItems = await this.extractItemsFromPage(page, query);

        if (pageItems.length === 0) {
          console.log('No more items found, stopping pagination');
          break;
        }

        allItems.push(...pageItems);
        console.log(`Found ${pageItems.length} items on page ${currentPage}`);

        // Check if there's a next page
        const hasNextPage = await page.$('.pagination__next');
        if (!hasNextPage) {
          console.log('No more pages available');
          break;
        }

        currentPage++;

        // Be nice to eBay - add delay between pages
        if (currentPage <= maxPages) {
          await this.delay(delayBetweenPages);
        }
      }

      console.log(`Total items scraped: ${allItems.length}`);

      // Save to database if requested
      if (saveToDb && allItems.length > 0) {
        await this.saveItemsToDb(allItems, query);
      }

      return allItems;

    } catch (error) {
      console.error('Error scraping sold items:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async extractItemsFromPage(page: Page, searchQuery: string): Promise<SoldItemData[]> {
    return await page.evaluate((query) => {
      const items: any[] = [];

      // Find all listing items
      const listingElements = document.querySelectorAll('.s-item');

      listingElements.forEach((element) => {
        try {
          // Skip the first "Shop on eBay" placeholder
          const titleEl = element.querySelector('.s-item__title');
          if (!titleEl || titleEl.textContent?.includes('Shop on eBay')) {
            return;
          }

          // Extract item ID from link
          const linkEl = element.querySelector('.s-item__link') as HTMLAnchorElement;
          const itemUrl = linkEl?.href || '';
          const itemIdMatch = itemUrl.match(/\/itm\/(\d+)/);
          const ebayItemId = itemIdMatch ? itemIdMatch[1] : `unknown-${Date.now()}-${Math.random()}`;

          // Extract title
          const title = titleEl?.textContent?.trim() || '';

          // Extract sold price
          const priceEl = element.querySelector('.s-item__price');
          let soldPrice = 0;
          if (priceEl) {
            const priceText = priceEl.textContent || '';
            // Handle price ranges (take the first/lower price)
            const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
            if (priceMatch) {
              soldPrice = parseFloat(priceMatch[1].replace(',', ''));
            }
          }

          // Extract shipping price
          const shippingEl = element.querySelector('.s-item__shipping, .s-item__freeXDays');
          let shippingPrice: number | undefined;
          if (shippingEl) {
            const shippingText = shippingEl.textContent || '';
            if (shippingText.toLowerCase().includes('free')) {
              shippingPrice = 0;
            } else {
              const shippingMatch = shippingText.match(/\$?([\d,]+\.?\d*)/);
              if (shippingMatch) {
                shippingPrice = parseFloat(shippingMatch[1].replace(',', ''));
              }
            }
          }

          // Extract condition
          const conditionEl = element.querySelector('.SECONDARY_INFO');
          const condition = conditionEl?.textContent?.trim();

          // Extract seller info
          const sellerEl = element.querySelector('.s-item__seller-info-text');
          let seller: string | undefined;
          let sellerFeedback: number | undefined;
          if (sellerEl) {
            const sellerText = sellerEl.textContent || '';
            const sellerMatch = sellerText.match(/^([^\(]+)/);
            seller = sellerMatch ? sellerMatch[1].trim() : undefined;

            const feedbackMatch = sellerText.match(/\((\d+)\)/);
            sellerFeedback = feedbackMatch ? parseInt(feedbackMatch[1]) : undefined;
          }

          // Extract listing type and bids
          const bidEl = element.querySelector('.s-item__bids');
          let listingType = 'buy_it_now';
          let bidCount: number | undefined;
          if (bidEl) {
            listingType = 'auction';
            const bidMatch = bidEl.textContent?.match(/(\d+)\s*bid/);
            bidCount = bidMatch ? parseInt(bidMatch[1]) : undefined;
          }

          // Extract image URL
          const imageEl = element.querySelector('.s-item__image-img') as HTMLImageElement;
          const imageUrl = imageEl?.src;

          // Extract sold date (usually shown as "Sold [date]")
          const soldDateEl = element.querySelector('.s-item__caption--signal, .POSITIVE');
          let soldDate = new Date();
          if (soldDateEl) {
            const dateText = soldDateEl.textContent || '';
            const dateMatch = dateText.match(/Sold\s+(.+)/i);
            if (dateMatch) {
              const parsedDate = new Date(dateMatch[1]);
              if (!isNaN(parsedDate.getTime())) {
                soldDate = parsedDate;
              }
            }
          }

          // Calculate total price
          const totalPrice = shippingPrice !== undefined
            ? soldPrice + shippingPrice
            : soldPrice;

          items.push({
            ebayItemId,
            title,
            soldPrice,
            shippingPrice,
            totalPrice,
            condition,
            seller,
            sellerFeedback,
            listingType,
            bidCount,
            imageUrl,
            soldDate: soldDate.toISOString(),
            searchQuery: query
          });

        } catch (err) {
          // Skip items that fail to parse
          console.error('Error parsing item:', err);
        }
      });

      return items;
    }, searchQuery);
  }

  private async saveItemsToDb(items: SoldItemData[], searchQuery: string): Promise<void> {
    console.log(`Saving ${items.length} items to database...`);

    let savedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      try {
        await prisma.soldItem.upsert({
          where: { ebayItemId: item.ebayItemId },
          update: {
            title: item.title,
            soldPrice: item.soldPrice,
            shippingPrice: item.shippingPrice,
            totalPrice: item.totalPrice,
            condition: item.condition,
            seller: item.seller,
            sellerFeedback: item.sellerFeedback,
            listingType: item.listingType,
            bidCount: item.bidCount,
            imageUrl: item.imageUrl,
            soldDate: new Date(item.soldDate),
            searchQuery,
            source: 'scraper',
            updatedAt: new Date()
          },
          create: {
            ebayItemId: item.ebayItemId,
            title: item.title,
            soldPrice: item.soldPrice,
            shippingPrice: item.shippingPrice,
            totalPrice: item.totalPrice,
            condition: item.condition,
            seller: item.seller,
            sellerFeedback: item.sellerFeedback,
            listingType: item.listingType,
            bidCount: item.bidCount,
            imageUrl: item.imageUrl,
            soldDate: new Date(item.soldDate),
            searchQuery,
            source: 'scraper'
          }
        });
        savedCount++;
      } catch (error) {
        skippedCount++;
        // Item might already exist with same ID
      }
    }

    console.log(`Saved ${savedCount} items, skipped ${skippedCount} duplicates`);
  }

  async getPriceStats(query: string, options: ScraperOptions = {}): Promise<PriceStats> {
    // First check if we have cached data
    const cached = await this.getCachedPriceStats(query);
    if (cached) {
      console.log('Using cached price stats');
      return cached;
    }

    // Scrape fresh data
    const items = await this.searchSoldItems(query, options);

    if (items.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
        percentile25: 0,
        percentile75: 0,
        items: []
      };
    }

    // Calculate statistics
    const prices = items.map(i => i.totalPrice || i.soldPrice).sort((a, b) => a - b);
    const count = prices.length;

    const stats: PriceStats = {
      average: prices.reduce((a, b) => a + b, 0) / count,
      median: this.getMedian(prices),
      min: prices[0],
      max: prices[count - 1],
      count,
      percentile25: this.getPercentile(prices, 25),
      percentile75: this.getPercentile(prices, 75),
      items
    };

    // Cache the results
    await this.cachePriceStats(query, stats);

    return stats;
  }

  private async getCachedPriceStats(query: string): Promise<PriceStats | null> {
    try {
      const cached = await prisma.priceResearch.findUnique({
        where: { searchQuery: query }
      });

      if (!cached || cached.expiresAt < new Date()) {
        return null;
      }

      // Get the associated sold items
      const items = await prisma.soldItem.findMany({
        where: {
          searchQuery: query
        },
        orderBy: { soldDate: 'desc' },
        take: 100
      });

      return {
        average: cached.averagePrice,
        median: cached.medianPrice,
        min: cached.minPrice,
        max: cached.maxPrice,
        count: cached.sampleSize,
        percentile25: cached.price25th || 0,
        percentile75: cached.price75th || 0,
        items: items.map(i => ({
          ebayItemId: i.ebayItemId,
          title: i.title,
          soldPrice: i.soldPrice,
          shippingPrice: i.shippingPrice || undefined,
          totalPrice: i.totalPrice || undefined,
          condition: i.condition || undefined,
          seller: i.seller || undefined,
          sellerFeedback: i.sellerFeedback || undefined,
          listingType: i.listingType || undefined,
          bidCount: i.bidCount || undefined,
          imageUrl: i.imageUrl || undefined,
          soldDate: i.soldDate
        }))
      };
    } catch (error) {
      return null;
    }
  }

  private async cachePriceStats(query: string, stats: PriceStats): Promise<void> {
    try {
      // Cache for 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.priceResearch.upsert({
        where: { searchQuery: query },
        update: {
          averagePrice: stats.average,
          medianPrice: stats.median,
          minPrice: stats.min,
          maxPrice: stats.max,
          sampleSize: stats.count,
          price25th: stats.percentile25,
          price75th: stats.percentile75,
          lastUpdated: new Date(),
          expiresAt,
          soldItemIds: stats.items.map(i => i.ebayItemId)
        },
        create: {
          searchQuery: query,
          averagePrice: stats.average,
          medianPrice: stats.median,
          minPrice: stats.min,
          maxPrice: stats.max,
          sampleSize: stats.count,
          price25th: stats.percentile25,
          price75th: stats.percentile75,
          expiresAt,
          soldItemIds: stats.items.map(i => i.ebayItemId)
        }
      });
    } catch (error) {
      console.error('Error caching price stats:', error);
    }
  }

  private getMedian(sortedArr: number[]): number {
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0
      ? sortedArr[mid]
      : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  }

  private getPercentile(sortedArr: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get suggested price for an item based on historical data
  async getSuggestedPrice(
    title: string,
    condition?: string
  ): Promise<{
    suggestedStartPrice: number;
    suggestedBuyNowPrice: number;
    confidence: 'high' | 'medium' | 'low';
    basedOn: number;
    priceRange: { min: number; max: number };
  }> {
    // Clean up title for search
    const searchQuery = title
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    const stats = await this.getPriceStats(searchQuery, {
      maxPages: 2,
      saveToDb: true
    });

    if (stats.count === 0) {
      return {
        suggestedStartPrice: 9.99,
        suggestedBuyNowPrice: 29.99,
        confidence: 'low',
        basedOn: 0,
        priceRange: { min: 0, max: 0 }
      };
    }

    // Calculate suggested prices
    // Starting price: 25th percentile (conservative)
    // Buy Now price: 75th percentile or median + 20%
    const suggestedStartPrice = Math.max(0.99, Math.round(stats.percentile25 * 100) / 100);
    const suggestedBuyNowPrice = Math.max(
      suggestedStartPrice * 1.5,
      Math.round(Math.max(stats.percentile75, stats.median * 1.2) * 100) / 100
    );

    // Determine confidence based on sample size
    let confidence: 'high' | 'medium' | 'low';
    if (stats.count >= 20) {
      confidence = 'high';
    } else if (stats.count >= 5) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      suggestedStartPrice,
      suggestedBuyNowPrice,
      confidence,
      basedOn: stats.count,
      priceRange: { min: stats.min, max: stats.max }
    };
  }

  // Get recent sold items from database
  async getRecentSoldItems(options: {
    query?: string;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<SoldItemData[]> {
    const { query, limit = 50, minPrice, maxPrice } = options;

    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { searchQuery: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.soldPrice = {};
      if (minPrice !== undefined) where.soldPrice.gte = minPrice;
      if (maxPrice !== undefined) where.soldPrice.lte = maxPrice;
    }

    const items = await prisma.soldItem.findMany({
      where,
      orderBy: { soldDate: 'desc' },
      take: limit
    });

    return items.map(i => ({
      ebayItemId: i.ebayItemId,
      title: i.title,
      soldPrice: i.soldPrice,
      shippingPrice: i.shippingPrice || undefined,
      totalPrice: i.totalPrice || undefined,
      condition: i.condition || undefined,
      seller: i.seller || undefined,
      sellerFeedback: i.sellerFeedback || undefined,
      listingType: i.listingType || undefined,
      bidCount: i.bidCount || undefined,
      imageUrl: i.imageUrl || undefined,
      soldDate: i.soldDate,
      category: i.category || undefined,
      categoryId: i.categoryId || undefined
    }));
  }
}

export const soldDataService = new SoldDataService();
