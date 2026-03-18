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
  completeness?: number;
  completenessPercent?: number;
}

interface FilterOptions {
  stages: string[];
  sortBy: 'recent' | 'sku' | 'price_asc' | 'price_desc' | 'completeness';
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
    stages: [],
    sortBy: 'completeness'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locRes, itemsRes] = await Promise.all([
        fetch('/api/dashboard/inventory/locations'),
        fetch(`/api/dashboard/inventory/items${selectedLocation ? `?location=${selectedLocation}` : ''}`)
      ]);
      const [locData, itemsData] = await Promise.all([locRes.json(), itemsRes.json()]);
      if (locData.success) setLocations(locData.data);
      if (itemsData.success) setItems(itemsData.data);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedLocation]);

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
      if (filters.stages.length > 0 && !filters.stages.includes(item.stage)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'sku': return a.sku.localeCompare(b.sku);
        case 'price_asc': return (a.price || 0) - (b.price || 0);
        case 'price_desc': return (b.price || 0) - (a.price || 0);
        case 'completeness': {
          // Published items go last, then sort by completeness ascending (least complete first)
          const aPub = a.stage === 'PUBLISHED' ? 1 : 0;
          const bPub = b.stage === 'PUBLISHED' ? 1 : 0;
          if (aPub !== bPub) return aPub - bPub;
          return (a.completeness || 0) - (b.completeness || 0);
        }
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const resetFilters = () => setFilters({ stages: [], sortBy: 'completeness' });
  const hasActiveFilters = filters.stages.length > 0 || filters.sortBy !== 'completeness';

  const toggleStage = (stage: string) => {
    setFilters(prev => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter(s => s !== stage)
        : [...prev.stages, stage]
    }));
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PUBLISHED': return 'badge-sage';
      case 'FINAL_REVIEW': return 'badge-sage';
      case 'REVIEW_EDIT': return 'badge-amber';
      case 'PRICING': return 'badge-ink';
      case 'AI_PROCESSING': return 'badge-plum';
      case 'PHOTO_UPLOAD': return 'badge-plum';
      case 'REJECTED': return 'badge-coral';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage items by location</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-white text-ink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-white text-ink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {locations.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-8 text-slate-500">
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
                ? 'border-ink-500 bg-ink-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                'p-2 rounded-lg',
                selectedLocation === location.code ? 'bg-ink-100' : 'bg-slate-100'
              )}>
                <MapPin size={18} className={selectedLocation === location.code ? 'text-ink-600' : 'text-slate-500'} />
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mt-3 text-sm">{location.name}</h3>
            <p className="text-xs text-slate-400">{location.code}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-900 text-display">{location.itemCount}</span>
              {location.capacity && (
                <span className="text-xs text-slate-400">/ {location.capacity}</span>
              )}
            </div>
            {location.capacity && (
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink-500 rounded-full transition-all"
                  style={{ width: `${Math.min((location.itemCount / location.capacity) * 100, 100)}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={cn(
              "btn-secondary",
              hasActiveFilters && "border-ink-500 bg-ink-50 text-ink-600"
            )}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="text-xs bg-ink-600 text-white rounded-full w-4 h-4 flex items-center justify-center">{filters.stages.length || '!'}</span>
            )}
            <ChevronDown size={14} />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-72 card p-4 z-20 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-ink-600 hover:text-ink-800">Reset all</button>
                )}
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-600 mb-2">Stage</label>
                <div className="space-y-1">
                  {[
                    { value: 'PHOTO_UPLOAD', label: 'Photo Upload' },
                    { value: 'AI_PROCESSING', label: 'AI Processing' },
                    { value: 'REVIEW_EDIT', label: 'Review / Edit' },
                    { value: 'PRICING', label: 'Pricing' },
                    { value: 'FINAL_REVIEW', label: 'Final Review' },
                    { value: 'PUBLISHED', label: 'Published' },
                    { value: 'REJECTED', label: 'Rejected' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={filters.stages.includes(value)}
                        onChange={() => toggleStage(value)}
                        className="w-4 h-4 rounded border-slate-300 text-ink-600 focus:ring-ink-500"
                      />
                      <span className={cn('inline-block w-2 h-2 rounded-full', {
                        'bg-purple-400': value === 'PHOTO_UPLOAD' || value === 'AI_PROCESSING',
                        'bg-amber-400': value === 'REVIEW_EDIT',
                        'bg-blue-400': value === 'PRICING',
                        'bg-green-400': value === 'FINAL_REVIEW' || value === 'PUBLISHED',
                        'bg-red-400': value === 'REJECTED',
                      })} />
                      <span className="text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-600 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
                  className="input text-sm"
                >
                  <option value="completeness">Completeness (least first)</option>
                  <option value="recent">Most Recent</option>
                  <option value="sku">SKU (A-Z)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilterDropdown(false)}
                className="w-full btn-primary text-sm"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left table-header">SKU</th>
              <th className="px-4 py-3 text-left table-header">Title</th>
              <th className="px-4 py-3 text-left table-header">Location</th>
              <th className="px-4 py-3 text-left table-header">Stage</th>
              <th className="px-4 py-3 text-left table-header">Ready</th>
              <th className="px-4 py-3 text-left table-header">Price</th>
              <th className="px-4 py-3 text-left table-header">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-600 mx-auto" />
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  <Package size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No items found</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="table-row cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{item.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{item.location}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', getStageColor(item.stage))}>
                      {item.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', {
                            'bg-green-500': (item.completenessPercent || 0) === 100,
                            'bg-amber-400': (item.completenessPercent || 0) >= 50 && (item.completenessPercent || 0) < 100,
                            'bg-red-400': (item.completenessPercent || 0) < 50,
                          })}
                          style={{ width: `${item.completenessPercent || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{item.completeness || 0}/7</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {item.price ? `$${item.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{item.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
