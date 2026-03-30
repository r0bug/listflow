import { PrismaClient } from '@prisma/client';

// Comptool has its own DB — use separate connection
let comptoolPrisma: PrismaClient | null = null;

function getComptoolPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL_COMPTOOL) return null;
  if (!comptoolPrisma) {
    comptoolPrisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_COMPTOOL }
      }
    });
  }
  return comptoolPrisma;
}

export interface CompResult {
  title: string;
  price: number;
  soldDate: string;
  condition?: string;
  source: string;
}

export interface CompSuggestion {
  median: number;
  average: number;
  low: number;
  high: number;
  count: number;
  comps: CompResult[];
}

function calcMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function getCompsForItem(title: string): Promise<CompSuggestion | null> {
  if (!process.env.DATABASE_URL_COMPTOOL) return null;

  const db = getComptoolPrisma();
  if (!db) return null;

  // Extract keywords from title (remove stop words, take significant terms)
  const keywords = title.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'and', 'the', 'for', 'from', 'that', 'this', 'used', 'very', 'good'].includes(w))
    .slice(0, 5);

  if (keywords.length === 0) return null;

  try {
    // Build OR conditions using ILIKE for each keyword
    // We use raw query for ILIKE support across keyword terms
    const whereClauses = keywords.map(kw => `title ILIKE '%${kw.replace(/'/g, "''")}%'`).join(' AND ');

    const rows: { title: string; soldPrice: number; soldDate: Date | null; condition: string | null }[] =
      await (db as any).$queryRawUnsafe(
        `SELECT title, "soldPrice", "soldDate", condition
         FROM "SoldComp"
         WHERE ${whereClauses}
           AND "soldPrice" > 0
         ORDER BY "soldDate" DESC NULLS LAST
         LIMIT 50`
      );

    if (!rows || rows.length === 0) return null;

    const prices = rows.map(r => r.soldPrice);
    const median = calcMedian(prices);
    const average = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
    const low = Math.min(...prices);
    const high = Math.max(...prices);

    // Return top 5 most recent comps
    const comps: CompResult[] = rows.slice(0, 5).map(r => ({
      title: r.title,
      price: r.soldPrice,
      soldDate: r.soldDate ? r.soldDate.toISOString().split('T')[0] : '',
      condition: r.condition || undefined,
      source: 'comptool',
    }));

    return { median, average, low, high, count: rows.length, comps };
  } catch (e) {
    console.warn('Comptool query failed:', e);
    return null;
  }
}
