import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Filter, CheckSquare, DollarSign, List, Grid3X3, Loader2, X, ChevronDown, Download, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import { cn } from '../../utils/cn';
import { useIsMobile } from '../../hooks/useIsMobile';

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
      ? 'bg-slate-100'
      : confidence >= 90
        ? 'badge-sage'
        : confidence >= 70
          ? 'badge-amber'
          : 'badge-coral';

  return (
    <Link
      to={`/item/${id}`}
      className="block card-hover p-3"
    >
      <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            No image
          </div>
        )}
      </div>
      <h3 className="font-medium text-sm text-slate-900 truncate">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        {confidence !== undefined && (
          <span className={cn('text-xs px-2 py-0.5 rounded-md', confidenceColor)}>
            {confidence}%
          </span>
        )}
        {price !== undefined && (
          <span className="text-sm font-semibold text-sage-600">${price.toFixed(2)}</span>
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
    <div className="flex items-center justify-between px-3 py-3 bg-slate-100 rounded-t-xl border border-b-0 border-slate-200">
      <h3 className="font-semibold text-slate-700 text-sm tracking-wide">{title}</h3>
      <span className="badge text-xs">{count}</span>
    </div>
    <div className="flex-1 bg-slate-50 rounded-b-xl border border-t-0 border-slate-200 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-300px)]">
      {items.map((item) => (
        <ItemCard key={item.id} {...item} />
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No items
        </div>
      )}
    </div>
  </div>
);

interface QueueData {
  identify: ItemCardProps[];
  review: ItemCardProps[];
  price: ItemCardProps[];
  ready: ItemCardProps[];
  published: ItemCardProps[];
}

interface QueueCounts {
  identify: number;
  review: number;
  price: number;
  ready: number;
  published: number;
}

interface FilterOptions {
  step: string;
  confidenceMin: number | null;
  confidenceMax: number | null;
  hasPrice: boolean | null;
}

export const Queue: React.FC = () => {
  useParams<{ step?: string }>();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(isMobile ? 'list' : 'kanban');
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
    published: [],
  });
  const [counts, setCounts] = useState<QueueCounts>({
    identify: 0,
    review: 0,
    price: 0,
    ready: 0,
    published: 0,
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

  const handleExportCsv = async () => {
    if (selectedItems.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const blob = await api.exportCsv(selectedItems);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listflow-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSelectedItems([]);
      loadQueueData();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
    setIsBulkProcessing(false);
  };

  const handlePushToEbay = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Push ${selectedItems.length} item(s) to eBay? This will create live listings.`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await api.bulkPushToEbay(selectedItems);
      if (result.success) {
        setSelectedItems([]);
        loadQueueData();
      } else {
        console.error('Bulk push to eBay failed:', (result as any).error);
      }
    } catch (error) {
      console.error('Failed to push to eBay:', error);
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
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Queue</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search - full width on mobile */}
          <div className="relative flex-1 md:max-w-[256px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 pr-4 py-2 w-full"
            />
          </div>

          {/* Filters + View toggle row */}
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={cn(
                  "p-2 border rounded-lg transition-colors flex items-center gap-1 min-w-[44px] min-h-[44px] justify-center",
                  hasActiveFilters
                    ? "border-ink-300 bg-ink-50 text-ink-600"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                <Filter size={18} />
                {hasActiveFilters && (
                  <span className="text-xs bg-ink-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    !
                  </span>
                )}
                <ChevronDown size={14} />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-72 card p-4 z-20 shadow-lg animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-xs text-ink-600 hover:text-ink-800 font-medium"
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Step Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Step</label>
                    <select
                      value={filters.step}
                      onChange={(e) => setFilters({ ...filters, step: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="all">All Steps</option>
                      <option value="identify">Identify</option>
                      <option value="review">Review</option>
                      <option value="price">Price</option>
                      <option value="ready">Ready</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* Confidence Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confidence</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.confidenceMin ?? ''}
                        onChange={(e) => setFilters({
                          ...filters,
                          confidenceMin: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="input w-full text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-slate-400 font-medium">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.confidenceMax ?? ''}
                        onChange={(e) => setFilters({
                          ...filters,
                          confidenceMax: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="input w-full text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Has Price Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pricing Status</label>
                    <select
                      value={filters.hasPrice === null ? 'all' : filters.hasPrice ? 'priced' : 'unpriced'}
                      onChange={(e) => setFilters({
                        ...filters,
                        hasPrice: e.target.value === 'all' ? null : e.target.value === 'priced'
                      })}
                      className="input w-full text-sm"
                    >
                      <option value="all">All</option>
                      <option value="priced">Has Price</option>
                      <option value="unpriced">No Price</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="btn-primary w-full text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center',
                  viewMode === 'kanban' ? 'bg-ink-100 text-ink-600' : 'hover:bg-slate-50 text-slate-500'
                )}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center',
                  viewMode === 'list' ? 'bg-ink-100 text-ink-600' : 'hover:bg-slate-50 text-slate-500'
                )}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-ink-600" />
            </div>
          ) : (
            <div className="flex gap-4 pb-4">
              <Column title="IDENTIFY" count={counts.identify} items={filterItems(queueItems.identify, 'identify')} />
              <Column title="REVIEW" count={counts.review} items={filterItems(queueItems.review, 'review')} />
              <Column title="PRICE" count={counts.price} items={filterItems(queueItems.price, 'price')} />
              <Column title="READY" count={counts.ready} items={filterItems(queueItems.ready, 'ready')} />
              <Column title="PUBLISHED" count={counts.published} items={filterItems(queueItems.published, 'published')} />
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-ink-600 focus:ring-ink-500"
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 hidden md:table-cell">Photo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Step</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 hidden md:table-cell">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-ink-600 mx-auto" />
                  </td>
                </tr>
              ) : Object.entries(queueItems).flatMap(([step, items]) =>
                filterItems(items as ItemCardProps[], step).map((item) => (
                  <tr key={item.id} className="table-row">
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
                        className="rounded border-slate-300 text-ink-600 focus:ring-ink-500"
                      />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-lg" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="badge text-sm capitalize">
                        {step}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.confidence !== undefined && (
                        <span
                          className={cn(
                            'px-2 py-1 rounded-md text-sm font-medium',
                            item.confidence >= 90
                              ? 'badge-sage'
                              : item.confidence >= 70
                                ? 'badge-amber'
                                : 'badge-coral'
                          )}
                        >
                          {item.confidence}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.price !== undefined && (
                        <span className="font-semibold text-sage-600">${item.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/item/${item.id}`}
                        className="text-ink-600 hover:text-ink-800 text-sm font-medium transition-colors"
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
        <div className="fixed bottom-0 md:bottom-12 left-0 md:left-1/2 right-0 md:right-auto md:-translate-x-1/2 bg-slate-900 text-white px-4 md:px-6 py-3 md:rounded-xl shadow-xl flex flex-wrap items-center justify-center gap-3 md:gap-4 animate-slide-up z-30">
          <span className="text-sm font-medium">{selectedItems.length} selected</span>
          <button
            onClick={handleBulkReview}
            disabled={isBulkProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-ink-600 rounded-lg hover:bg-ink-700 transition-colors disabled:opacity-50 text-sm font-medium"
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
            className="flex items-center gap-2 px-3 py-1.5 bg-sage-600 rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isBulkProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <DollarSign size={16} />
            )}
            Bulk Price
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isBulkProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isBulkProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export CSV
          </button>
          <button
            onClick={handlePushToEbay}
            disabled={isBulkProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-ink-500 rounded-lg hover:bg-ink-600 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isBulkProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ExternalLink size={16} />
            )}
            Push to eBay
          </button>
          <button
            onClick={() => setSelectedItems([])}
            className="text-slate-400 hover:text-white transition-colors ml-2 text-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50">
          <div className="card shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Bulk Pricing</h2>
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Apply pricing changes to {selectedItems.length} selected items. Items will be moved to the Pricing stage.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price Adjustment Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={bulkPriceSettings.type === 'percentage'}
                      onChange={() => setBulkPriceSettings({ ...bulkPriceSettings, type: 'percentage' })}
                      className="rounded-full border-slate-300 text-ink-600 focus:ring-ink-500"
                    />
                    <span className="text-sm text-slate-700">Percentage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={bulkPriceSettings.type === 'fixed'}
                      onChange={() => setBulkPriceSettings({ ...bulkPriceSettings, type: 'fixed' })}
                      className="rounded-full border-slate-300 text-ink-600 focus:ring-ink-500"
                    />
                    <span className="text-sm text-slate-700">Fixed Price</span>
                  </label>
                </div>
              </div>

              {bulkPriceSettings.type === 'percentage' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                      className="input w-full"
                      placeholder="e.g., 10 for +10%, -10 for -10%"
                    />
                    <span className="text-slate-500 font-medium">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Positive values increase price, negative decrease. Use 0 to just move items to pricing stage.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Fixed Price ($)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">$</span>
                    <input
                      type="number"
                      value={bulkPriceSettings.fixedPrice}
                      onChange={(e) => setBulkPriceSettings({
                        ...bulkPriceSettings,
                        fixedPrice: parseFloat(e.target.value) || 0
                      })}
                      className="input w-full"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    All selected items will be set to this price.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPriceSubmit}
                disabled={isBulkProcessing}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
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
