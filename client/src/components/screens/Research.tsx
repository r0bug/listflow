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
        // Set listing type and notice
        setListingType(data.listingType || 'sold');
        setNotice(data.notice || '');

        // Transform API response to match our interface
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

        // Calculate stats with quartiles
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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Research</h1>
        <p className="text-gray-500">Search eBay sold listings to research pricing</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for items (e.g., 'Polaroid SX-70 camera')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search size={20} />
              Search
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Notice Display (e.g., when showing active instead of sold) */}
      {notice && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
          <strong>Note:</strong> {notice}
        </div>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <>
          {/* Price Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <BarChart2 size={16} />
                  <span className="text-sm">Average</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${stats.average.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <DollarSign size={16} />
                  <span className="text-sm">Median</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${stats.median.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingDown size={16} />
                  <span className="text-sm">Low</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${stats.min.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-sm">High</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${stats.max.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Price Range Visualization */}
          {stats && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Price Distribution</h3>
              <div className="relative h-8">
                {/* Background bar */}
                <div className="absolute inset-0 bg-gray-100 rounded-full" />
                {/* IQR range */}
                <div
                  className="absolute h-full bg-blue-200 rounded-full"
                  style={{
                    left: `${((stats.price25th - stats.min) / (stats.max - stats.min)) * 100}%`,
                    width: `${((stats.price75th - stats.price25th) / (stats.max - stats.min)) * 100}%`,
                  }}
                />
                {/* Median marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-600 rounded"
                  style={{ left: `${((stats.median - stats.min) / (stats.max - stats.min)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>${stats.min.toFixed(0)}</span>
                <span>${stats.price25th.toFixed(0)}</span>
                <span className="font-medium text-blue-600">${stats.median.toFixed(0)}</span>
                <span>${stats.price75th.toFixed(0)}</span>
                <span>${stats.max.toFixed(0)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Based on {stats.sampleSize} sold listings
              </p>
            </div>
          )}

          {/* Items List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {listingType === 'sold' ? 'Recent Sold Listings' : 'Current Active Listings'}
              </h3>
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                listingType === 'sold' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              )}>
                {listingType === 'sold' ? 'Sold' : 'Active'}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {soldItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No items found. Try a different search term.
                </div>
              ) : (
                soldItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).className = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DollarSign size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs',
                          item.condition?.includes('New') ? 'bg-green-100 text-green-700' :
                          item.condition?.includes('Good') ? 'bg-blue-100 text-blue-700' :
                          item.condition?.includes('Used') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {item.condition || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${item.soldPrice.toFixed(2)}</p>
                    </div>
                    <a
                      href={item.itemWebUrl || `https://www.ebay.com/itm/${item.ebayItemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <ExternalLink size={20} />
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
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for price data</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a search term above to find recently sold items on eBay and get pricing insights.
          </p>
        </div>
      )}
    </div>
  );
};
