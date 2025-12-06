import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Search, Filter, Grid, List, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

interface Location {
  id: string;
  name: string;
  code: string;
  itemCount: number;
  capacity?: number;
}

interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  location: string;
  locationName: string;
  stage: string;
  price?: number;
  createdAt: string;
  thumbnail?: string;
}

interface FilterOptions {
  stage: string;
  sortBy: 'recent' | 'sku' | 'price_asc' | 'price_desc';
}

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    stage: 'all',
    sortBy: 'recent'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locRes, itemsRes] = await Promise.all([
        fetch('/api/dashboard/inventory/locations'),
        fetch(`/api/dashboard/inventory/items${selectedLocation ? `?location=${selectedLocation}` : ''}`)
      ]);

      const [locData, itemsData] = await Promise.all([
        locRes.json(),
        itemsRes.json()
      ]);

      if (locData.success) {
        setLocations(locData.data);
      }
      if (itemsData.success) {
        setItems(itemsData.data);
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedLocation]);

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

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Stage filter
      if (filters.stage !== 'all' && item.stage !== filters.stage) return false;

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'sku':
          return a.sku.localeCompare(b.sku);
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const resetFilters = () => {
    setFilters({ stage: 'all', sortBy: 'recent' });
  };

  const hasActiveFilters = filters.stage !== 'all' || filters.sortBy !== 'recent';

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'FINAL_REVIEW': return 'bg-emerald-100 text-emerald-800';
      case 'REVIEW_EDIT': return 'bg-yellow-100 text-yellow-800';
      case 'PRICING': return 'bg-blue-100 text-blue-800';
      case 'AI_PROCESSING': return 'bg-indigo-100 text-indigo-800';
      case 'PHOTO_UPLOAD': return 'bg-purple-100 text-purple-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage items by location</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
            )}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {locations.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No locations configured. Add locations in Settings.
          </div>
        )}
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => setSelectedLocation(selectedLocation === location.code ? null : location.code)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              selectedLocation === location.code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-gray-100">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mt-3">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.code}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{location.itemCount}</span>
              {location.capacity && (
                <span className="text-sm text-gray-500">/ {location.capacity}</span>
              )}
            </div>
            {location.capacity && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(location.itemCount / location.capacity) * 100}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by SKU, title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50",
              hasActiveFilters ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200"
            )}
          >
            <Filter size={20} />
            Filters
            {hasActiveFilters && (
              <span className="text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
            <ChevronDown size={16} />
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

              {/* Stage Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">All Stages</option>
                  <option value="PHOTO_UPLOAD">Photo Upload</option>
                  <option value="AI_PROCESSING">AI Processing</option>
                  <option value="REVIEW_EDIT">Review Edit</option>
                  <option value="PRICING">Pricing</option>
                  <option value="FINAL_REVIEW">Final Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="sku">SKU (A-Z)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
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
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <Package size={40} className="mx-auto mb-2 text-gray-300" />
                  No items found
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.location}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStageColor(item.stage))}>
                      {item.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.price ? `$${item.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
