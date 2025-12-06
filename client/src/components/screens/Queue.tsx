import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Filter, CheckSquare, DollarSign, List, Grid3X3, Loader2, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ItemCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  confidence?: number;
  price?: number;
  step?: string;
}

const ItemCard: React.FC<ItemCardProps> = ({ id, title, thumbnail, confidence, price }) => {
  const confidenceColor =
    confidence === undefined
      ? 'bg-gray-100'
      : confidence >= 90
        ? 'bg-green-100 text-green-800'
        : confidence >= 70
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';

  return (
    <Link
      to={`/item/${id}`}
      className="block bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <h3 className="font-medium text-sm text-gray-900 truncate">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        {confidence !== undefined && (
          <span className={cn('text-xs px-2 py-0.5 rounded', confidenceColor)}>
            {confidence}%
          </span>
        )}
        {price !== undefined && (
          <span className="text-sm font-medium text-green-600">${price.toFixed(2)}</span>
        )}
      </div>
    </Link>
  );
};

interface ColumnProps {
  title: string;
  count: number;
  items: ItemCardProps[];
}

const Column: React.FC<ColumnProps> = ({ title, count, items }) => (
  <div className="flex flex-col min-w-[280px] max-w-[320px]">
    <div className="flex items-center justify-between px-2 py-3 bg-gray-100 rounded-t-lg">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <span className="bg-gray-200 text-gray-600 text-sm px-2 py-0.5 rounded">{count}</span>
    </div>
    <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
      {items.map((item) => (
        <ItemCard key={item.id} {...item} />
      ))}
    </div>
  </div>
);

interface QueueData {
  identify: ItemCardProps[];
  review: ItemCardProps[];
  price: ItemCardProps[];
  ready: ItemCardProps[];
}

interface QueueCounts {
  identify: number;
  review: number;
  price: number;
  ready: number;
}

interface FilterOptions {
  step: string;
  confidenceMin: number | null;
  confidenceMax: number | null;
  hasPrice: boolean | null;
}

export const Queue: React.FC = () => {
  useParams<{ step?: string }>();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    step: 'all',
    confidenceMin: null,
    confidenceMax: null,
    hasPrice: null,
  });

  const [bulkPriceSettings, setBulkPriceSettings] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    fixedPrice: 0,
  });

  const [queueItems, setQueueItems] = useState<QueueData>({
    identify: [],
    review: [],
    price: [],
    ready: [],
  });
  const [counts, setCounts] = useState<QueueCounts>({
    identify: 0,
    review: 0,
    price: 0,
    ready: 0,
  });

  const loadQueueData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/queue');
      const data = await response.json();
      if (data.success) {
        setQueueItems(data.data);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to load queue data:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadQueueData();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items by search query and filters
  const filterItems = (items: ItemCardProps[], step?: string) => {
    let filtered = items;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.title.toLowerCase().includes(query));
    }

    // Step filter
    if (filters.step !== 'all' && step) {
      if (filters.step !== step) {
        return [];
      }
    }

    // Confidence filter
    if (filters.confidenceMin !== null) {
      filtered = filtered.filter(item =>
        item.confidence !== undefined && item.confidence >= filters.confidenceMin!
      );
    }
    if (filters.confidenceMax !== null) {
      filtered = filtered.filter(item =>
        item.confidence !== undefined && item.confidence <= filters.confidenceMax!
      );
    }

    // Has price filter
    if (filters.hasPrice === true) {
      filtered = filtered.filter(item => item.price !== undefined);
    } else if (filters.hasPrice === false) {
      filtered = filtered.filter(item => item.price === undefined);
    }

    return filtered;
  };

  const handleBulkReview = async () => {
    if (selectedItems.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/dashboard/items/bulk-advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedItems,
          targetStage: 'REVIEW_EDIT'
        })
      });

      const result = await response.json();
      if (result.success) {
        setSelectedItems([]);
        loadQueueData(); // Refresh the queue
      } else {
        console.error('Bulk review failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to bulk review:', error);
    }
    setIsBulkProcessing(false);
  };

  const handleBulkPrice = async () => {
    if (selectedItems.length === 0) return;
    setShowBulkPriceModal(true);
  };

  const handleBulkPriceSubmit = async () => {
    setIsBulkProcessing(true);
    try {
      const priceAdjustment = bulkPriceSettings.type === 'percentage'
        ? { type: 'percentage', value: bulkPriceSettings.value }
        : { type: 'fixed', startingPrice: bulkPriceSettings.fixedPrice, buyNowPrice: bulkPriceSettings.fixedPrice };

      const response = await fetch('/api/dashboard/items/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedItems,
          priceAdjustment: bulkPriceSettings.value !== 0 || bulkPriceSettings.fixedPrice !== 0
            ? priceAdjustment
            : null
        })
      });

      const result = await response.json();
      if (result.success) {
        setSelectedItems([]);
        setShowBulkPriceModal(false);
        setBulkPriceSettings({ type: 'percentage', value: 0, fixedPrice: 0 });
        loadQueueData(); // Refresh the queue
      } else {
        console.error('Bulk price failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to bulk price:', error);
    }
    setIsBulkProcessing(false);
  };

  const resetFilters = () => {
    setFilters({
      step: 'all',
      confidenceMin: null,
      confidenceMax: null,
      hasPrice: null,
    });
  };

  const hasActiveFilters = filters.step !== 'all' ||
    filters.confidenceMin !== null ||
    filters.confidenceMax !== null ||
    filters.hasPrice !== null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Queue</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={cn(
                "p-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1",
                hasActiveFilters ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200"
              )}
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
              <ChevronDown size={14} />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Step Filter */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Step</label>
                  <select
                    value={filters.step}
                    onChange={(e) => setFilters({ ...filters, step: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="all">All Steps</option>
                    <option value="identify">Identify</option>
                    <option value="review">Review</option>
                    <option value="price">Price</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>

                {/* Confidence Filter */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.confidenceMin ?? ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        confidenceMin: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.confidenceMax ?? ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        confidenceMax: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Has Price Filter */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Status</label>
                  <select
                    value={filters.hasPrice === null ? 'all' : filters.hasPrice ? 'priced' : 'unpriced'}
                    onChange={(e) => setFilters({
                      ...filters,
                      hasPrice: e.target.value === 'all' ? null : e.target.value === 'priced'
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="priced">Has Price</option>
                    <option value="unpriced">No Price</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2',
                viewMode === 'kanban' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-50'
              )}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2',
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-50'
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="flex gap-4 pb-4">
              <Column title="IDENTIFY" count={counts.identify} items={filterItems(queueItems.identify, 'identify')} />
              <Column title="REVIEW" count={counts.review} items={filterItems(queueItems.review, 'review')} />
              <Column title="PRICE" count={counts.price} items={filterItems(queueItems.price, 'price')} />
              <Column title="READY" count={counts.ready} items={filterItems(queueItems.ready, 'ready')} />
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allItems = Object.entries(queueItems).flatMap(([step, items]) =>
                          filterItems(items as ItemCardProps[], step).map(i => i.id)
                        );
                        setSelectedItems(allItems);
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Photo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Step</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : Object.entries(queueItems).flatMap(([step, items]) =>
                filterItems(items as ItemCardProps[], step).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter((id) => id !== item.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                        {step}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.confidence !== undefined && (
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-sm',
                            item.confidence >= 90
                              ? 'bg-green-100 text-green-800'
                              : item.confidence >= 70
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          )}
                        >
                          {item.confidence}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.price !== undefined && (
                        <span className="font-medium text-green-600">${item.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/item/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span>{selectedItems.length} selected</span>
          <button
            onClick={handleBulkReview}
            disabled={isBulkProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isBulkProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckSquare size={16} />
            )}
            Bulk Review
          </button>
          <button
            onClick={handleBulkPrice}
            disabled={isBulkProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isBulkProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <DollarSign size={16} />
            )}
            Bulk Price
          </button>
          <button
            onClick={() => setSelectedItems([])}
            className="text-gray-400 hover:text-white ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bulk Pricing</h2>
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Apply pricing changes to {selectedItems.length} selected items. Items will be moved to the Pricing stage.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Adjustment Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="priceType"
                      checked={bulkPriceSettings.type === 'percentage'}
                      onChange={() => setBulkPriceSettings({ ...bulkPriceSettings, type: 'percentage' })}
                      className="rounded-full border-gray-300"
                    />
                    <span className="text-sm">Percentage</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="priceType"
                      checked={bulkPriceSettings.type === 'fixed'}
                      onChange={() => setBulkPriceSettings({ ...bulkPriceSettings, type: 'fixed' })}
                      className="rounded-full border-gray-300"
                    />
                    <span className="text-sm">Fixed Price</span>
                  </label>
                </div>
              </div>

              {bulkPriceSettings.type === 'percentage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bulkPriceSettings.value}
                      onChange={(e) => setBulkPriceSettings({
                        ...bulkPriceSettings,
                        value: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="e.g., 10 for +10%, -10 for -10%"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Positive values increase price, negative decrease. Use 0 to just move items to pricing stage.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fixed Price ($)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={bulkPriceSettings.fixedPrice}
                      onChange={(e) => setBulkPriceSettings({
                        ...bulkPriceSettings,
                        fixedPrice: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    All selected items will be set to this price.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPriceSubmit}
                disabled={isBulkProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkProcessing && <Loader2 size={16} className="animate-spin" />}
                Apply to {selectedItems.length} Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
