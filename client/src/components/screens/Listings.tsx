import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  Clock,
  Eye,
  Edit,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';

type ListingStatus = 'active' | 'sold' | 'ended';

interface Listing {
  id: string;
  ebayId: string;
  title: string;
  price: number;
  soldPrice?: number;
  status: ListingStatus;
  imageUrl?: string;
  views: number;
  watchers: number;
  listedAt: string;
  endedAt?: string;
  soldAt?: string;
  buyer?: string;
  shippingCost?: number;
}

interface ListingStats {
  totalActive: number;
  totalSold: number;
  totalRevenue: number;
  avgSalePrice: number;
}

interface FilterOptions {
  priceMin: number | null;
  priceMax: number | null;
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'views';
}

export const Listings: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>(type === 'sold' ? 'sold' : 'active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats>({
    totalActive: 0,
    totalSold: 0,
    totalRevenue: 0,
    avgSalePrice: 0
  });

  // Filter state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceMin: null,
    priceMax: null,
    sortBy: 'recent'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // End listing confirmation
  const [endingListing, setEndingListing] = useState<Listing | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const [activeRes, soldRes, statsRes] = await Promise.all([
        fetch('/api/dashboard/listings/active'),
        fetch('/api/dashboard/listings/sold'),
        fetch('/api/dashboard/listings/stats')
      ]);

      const [activeData, soldData, statsData] = await Promise.all([
        activeRes.json(),
        soldRes.json(),
        statsRes.json()
      ]);

      if (activeData.success) {
        setActiveListings(activeData.data);
      }
      if (soldData.success) {
        setSoldListings(soldData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadListings();
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

  const listings = activeTab === 'active' ? activeListings : soldListings;

  // Apply filters and search
  const filteredListings = listings
    .filter(listing => {
      // Search filter
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.ebayId.includes(searchQuery);
      if (!matchesSearch) return false;

      // Price filter
      const price = listing.soldPrice || listing.price;
      if (filters.priceMin !== null && price < filters.priceMin) return false;
      if (filters.priceMax !== null && price > filters.priceMax) return false;

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return (a.soldPrice || a.price) - (b.soldPrice || b.price);
        case 'price_desc':
          return (b.soldPrice || b.price) - (a.soldPrice || a.price);
        case 'views':
          return b.views - a.views;
        case 'recent':
        default:
          return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
      }
    });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadListings();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: 'active' | 'sold') => {
    setActiveTab(tab);
    navigate(`/listings/${tab}`);
  };

  const handleEditClick = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm({ title: listing.title, price: listing.price });
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          price: editForm.price,
          buyNowPrice: editForm.price
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setActiveListings(prev => prev.map(l =>
          l.id === editingListing.id
            ? { ...l, title: editForm.title, price: editForm.price }
            : l
        ));
        setEditingListing(null);
      } else {
        console.error('Failed to save:', result.error);
      }
    } catch (error) {
      console.error('Error saving listing:', error);
    }
    setIsSaving(false);
  };

  const handleEndClick = (listing: Listing) => {
    setEndingListing(listing);
  };

  const handleConfirmEnd = async () => {
    if (!endingListing) return;

    setIsEnding(true);
    try {
      const response = await fetch(`/api/dashboard/listings/${endingListing.id}/end`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        // Remove from active listings
        setActiveListings(prev => prev.filter(l => l.id !== endingListing.id));
        setEndingListing(null);
        // Update stats
        setStats(prev => ({ ...prev, totalActive: prev.totalActive - 1 }));
      } else {
        console.error('Failed to end listing:', result.error);
      }
    } catch (error) {
      console.error('Error ending listing:', error);
    }
    setIsEnding(false);
  };

  const resetFilters = () => {
    setFilters({
      priceMin: null,
      priceMax: null,
      sortBy: 'recent'
    });
  };

  const hasActiveFilters = filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.sortBy !== 'recent';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
          <p className="text-slate-500">Manage your eBay listings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          Sync with eBay
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package size={16} />
            <span className="stat-label">Active Listings</span>
          </div>
          <p className="stat-value">{stats.totalActive}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-sage-600 mb-1">
            <CheckCircle size={16} />
            <span className="stat-label">Sold (30 days)</span>
          </div>
          <p className="stat-value">{stats.totalSold}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <DollarSign size={16} />
            <span className="stat-label">Revenue (30 days)</span>
          </div>
          <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp size={16} />
            <span className="stat-label">Avg Sale Price</span>
          </div>
          <p className="stat-value">${stats.avgSalePrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('active')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'active'
              ? 'border-ink-600 text-ink-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Active ({activeListings.length})
        </button>
        <button
          onClick={() => handleTabChange('sold')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'sold'
              ? 'border-ink-600 text-ink-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Sold ({soldListings.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50",
              hasActiveFilters ? "border-ink-500 bg-ink-50 text-ink-600" : "border-slate-200"
            )}
          >
            <Filter size={20} />
            Filters
            {hasActiveFilters && (
              <span className="text-xs bg-ink-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
            <ChevronDown size={16} />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-72 card p-4 z-20 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-ink-600 hover:text-ink-800"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
                  className="input w-full text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="views">Most Views</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Range</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1">
                    <span className="text-slate-500 text-sm mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin ?? ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        priceMin: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      className="input w-full text-sm"
                      min="0"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex items-center flex-1">
                    <span className="text-slate-500 text-sm mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax ?? ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        priceMax: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      className="input w-full text-sm"
                      min="0"
                    />
                  </div>
                </div>
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
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ink-600" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No listings found</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="card-hover overflow-hidden animate-slide-up"
            >
              {/* Image */}
              <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <Package size={40} className="text-slate-300" />
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-slate-900 line-clamp-2 mb-2">{listing.title}</h3>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {listing.status === 'sold' ? (
                      <>
                        <p className="text-lg font-bold text-sage-600">${listing.soldPrice?.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 line-through">${listing.price.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-slate-900">${listing.price.toFixed(2)}</p>
                    )}
                  </div>
                  <span className={cn(
                    listing.status === 'active' ? 'badge-sage' :
                    listing.status === 'sold' ? 'badge-ink' :
                    'badge'
                  )}>
                    {listing.status === 'active' ? 'Active' : 'Sold'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {listing.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {listing.watchers} watching
                  </span>
                </div>

                {listing.status === 'sold' && listing.buyer && (
                  <p className="text-sm text-slate-500 mb-3">
                    Sold to: {listing.buyer}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={`https://www.ebay.com/itm/${listing.ebayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50 rounded-lg"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                  {listing.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleEditClick(listing)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleEndClick(listing)}
                        className="p-1.5 text-coral-500 hover:bg-coral-50 rounded-lg"
                        title="End Listing"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit Listing</h2>
              <button
                onClick={() => setEditingListing(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingListing(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Listing Confirmation Modal */}
      {endingListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">End Listing</h2>
              <button
                onClick={() => setEndingListing(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-600 mb-4">
              Are you sure you want to end this listing?
            </p>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-slate-900 line-clamp-2">{endingListing.title}</p>
              <p className="text-sm text-slate-500 mt-1">Price: ${endingListing.price.toFixed(2)}</p>
            </div>
            <p className="text-sm text-coral-600 mb-4">
              This action cannot be undone. The listing will be removed from eBay.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEndingListing(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnd}
                disabled={isEnding}
                className="px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isEnding && <Loader2 size={16} className="animate-spin" />}
                End Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
