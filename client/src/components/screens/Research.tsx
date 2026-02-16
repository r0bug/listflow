import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart2, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SoldItem {
  id: string;
  title: string;
  soldPrice: number;
  condition: string;
  imageUrl?: string;
  ebayItemId: string;
  itemWebUrl?: string;
}

interface PriceStats {
  average: number;
  median: number;
  min: number;
  max: number;
  sampleSize: number;
  price25th: number;
  price75th: number;
}

interface SearchResponse {
  success: boolean;
  items: any[];
  stats?: any;
  listingType?: 'sold' | 'active';
  notice?: string;
  error?: string;
}

export const Research: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [error, setError] = useState('');
  const [listingType, setListingType] = useState<'sold' | 'active'>('sold');
  const [notice, setNotice] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/v1/ebay/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data: SearchResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to search eBay');
        setSoldItems([]);
        setStats(null);
      } else {
        setListingType(data.listingType || 'sold');
        setNotice(data.notice || '');

        const items: SoldItem[] = data.items.map((item: any, index: number) => ({
          id: item.itemId || String(index),
          title: item.title,
          soldPrice: item.price,
          condition: item.condition,
          imageUrl: item.imageUrl,
          ebayItemId: item.itemId?.replace(/v1\||\|0/g, '') || '',
          itemWebUrl: item.itemWebUrl,
        }));

        setSoldItems(items);

        if (data.stats) {
          const prices = items.map(i => i.soldPrice).sort((a, b) => a - b);
          const q1Index = Math.floor(prices.length * 0.25);
          const q3Index = Math.floor(prices.length * 0.75);

          setStats({
            average: data.stats.average,
            median: data.stats.median,
            min: data.stats.min,
            max: data.stats.max,
            sampleSize: data.stats.count,
            price25th: prices[q1Index] || data.stats.min,
            price75th: prices[q3Index] || data.stats.max,
          });
        } else {
          setStats(null);
        }
      }
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to server. Please try again.');
    }
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Price Research</h1>
        <p className="text-slate-500 mt-1">Search eBay sold listings to research pricing</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for items (e.g., 'Polaroid SX-70 camera')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ink-500/20 focus:border-ink-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="btn-primary px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search size={18} />
              Search
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-coral-50 border border-coral-200 rounded-xl text-coral-700 text-sm">
          {error}
        </div>
      )}

      {/* Notice */}
      {notice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <strong>Note:</strong> {notice}
        </div>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <>
          {/* Price Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <BarChart2 size={15} />
                  <span className="stat-label">Average</span>
                </div>
                <p className="stat-value">${stats.average.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <DollarSign size={15} />
                  <span className="stat-label">Median</span>
                </div>
                <p className="stat-value">${stats.median.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-sage-600 mb-1.5">
                  <TrendingDown size={15} />
                  <span className="stat-label">Low</span>
                </div>
                <p className="stat-value">${stats.min.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-coral-600 mb-1.5">
                  <TrendingUp size={15} />
                  <span className="stat-label">High</span>
                </div>
                <p className="stat-value">${stats.max.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Price Range Visualization */}
          {stats && (
            <div className="card p-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Price Distribution</h3>
              <div className="relative h-8">
                <div className="absolute inset-0 bg-slate-100 rounded-full" />
                <div
                  className="absolute h-full bg-ink-200 rounded-full"
                  style={{
                    left: `${((stats.price25th - stats.min) / (stats.max - stats.min)) * 100}%`,
                    width: `${((stats.price75th - stats.price25th) / (stats.max - stats.min)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-ink-600 rounded"
                  style={{ left: `${((stats.median - stats.min) / (stats.max - stats.min)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-slate-500">
                <span>${stats.min.toFixed(0)}</span>
                <span>${stats.price25th.toFixed(0)}</span>
                <span className="font-medium text-ink-600">${stats.median.toFixed(0)}</span>
                <span>${stats.price75th.toFixed(0)}</span>
                <span>${stats.max.toFixed(0)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Based on {stats.sampleSize} {listingType === 'sold' ? 'sold' : 'active'} listings
              </p>
            </div>
          )}

          {/* Items List */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-medium text-slate-800 text-sm">
                {listingType === 'sold' ? 'Recent Sold Listings' : 'Current Active Listings'}
              </h3>
              <span className={cn(
                'badge',
                listingType === 'sold' ? 'badge-sage' : 'badge-ink'
              )}>
                {listingType === 'sold' ? 'Sold' : 'Active'}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {soldItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No items found. Try a different search term.
                </div>
              ) : (
                soldItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/50 flex items-center gap-4 transition-colors">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-14 object-cover rounded-lg bg-slate-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).className = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                        <DollarSign size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 truncate text-sm">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          'badge',
                          item.condition?.includes('New') ? 'badge-sage' :
                          item.condition?.includes('Good') ? 'badge-ink' :
                          item.condition?.includes('Used') ? 'badge-amber' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {item.condition || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900 text-display">${item.soldPrice.toFixed(2)}</p>
                    </div>
                    <a
                      href={item.itemWebUrl || `https://www.ebay.com/itm/${item.ebayItemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-ink-600 hover:bg-ink-50 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-1.5">Search for price data</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">
            Enter a search term above to find recently sold items on eBay and get pricing insights.
          </p>
        </div>
      )}
    </div>
  );
};
