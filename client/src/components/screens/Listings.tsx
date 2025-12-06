import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  Clock,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2
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

  const listings = activeTab === 'active' ? activeListings : soldListings;

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.ebayId.includes(searchQuery)
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadListings();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: 'active' | 'sold') => {
    setActiveTab(tab);
    navigate(`/listings/${tab}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500">Manage your eBay listings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          Sync with eBay
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package size={16} />
            <span className="text-sm">Active Listings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle size={16} />
            <span className="text-sm">Sold (30 days)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSold}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign size={16} />
            <span className="text-sm">Revenue (30 days)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp size={16} />
            <span className="text-sm">Avg Sale Price</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.avgSalePrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('active')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Active ({activeListings.length})
        </button>
        <button
          onClick={() => handleTabChange('sold')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'sold'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Sold ({soldListings.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No listings found</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image placeholder */}
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                <Package size={40} className="text-gray-300" />
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{listing.title}</h3>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {listing.status === 'sold' ? (
                      <>
                        <p className="text-lg font-bold text-green-600">${listing.soldPrice?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 line-through">${listing.price.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-gray-900">${listing.price.toFixed(2)}</p>
                    )}
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    listing.status === 'active' ? 'bg-green-100 text-green-700' :
                    listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {listing.status === 'active' ? 'Active' : 'Sold'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
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
                  <p className="text-sm text-gray-500 mb-3">
                    Sold to: {listing.buyer}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <a
                    href={`https://www.ebay.com/itm/${listing.ebayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                  {listing.status === 'active' && (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Edit size={14} />
                        Edit
                      </button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
    </div>
  );
};
