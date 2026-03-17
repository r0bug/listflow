import React, { useState } from 'react';
import { Search, Copy, ArrowRight, Package, DollarSign, Tag, FileText, Image, AlertCircle, CheckCircle, Database, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface FetchedListing {
  ebayItemId: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  imageUrls: string[];
  specifics: Record<string, string>;
}

interface InventoryItem {
  id: string;
  displayId: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: number | null;
  buyNowPrice: number | null;
  photos: { id: string; url: string }[];
}

type SourceTab = 'ebay' | 'inventory';

export const SellSimilar: React.FC = () => {
  const navigate = useNavigate();
  const [sourceTab, setSourceTab] = useState<SourceTab>('ebay');

  // eBay fetch state
  const [ebayUrl, setEbayUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedListing, setFetchedListing] = useState<FetchedListing | null>(null);

  // Inventory clone state
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryResults, setInventoryResults] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Shared state
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdItem, setCreatedItem] = useState<{ id: string; sku: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
  });

  // eBay fetch
  const handleFetch = async () => {
    if (!ebayUrl.trim()) {
      setError('Please enter an eBay URL or item ID');
      return;
    }

    setIsFetching(true);
    setError('');
    setFetchedListing(null);
    setCreated(false);

    const itemIdMatch = ebayUrl.match(/itm\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : ebayUrl.replace(/\D/g, '');

    if (!itemId || itemId.length < 10) {
      setError('Invalid eBay URL or item ID');
      setIsFetching(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/ebay/listing/${itemId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch listing from eBay');
        setIsFetching(false);
        return;
      }

      const listing = data.listing;
      const fetchedData: FetchedListing = {
        ebayItemId: listing.itemId || itemId,
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price || 0,
        condition: listing.condition || 'Used',
        category: listing.category || '',
        imageUrls: listing.imageUrls || [],
        specifics: listing.specifics || {},
      };

      setFetchedListing(fetchedData);
      setFormData({
        title: fetchedData.title,
        description: fetchedData.description,
        price: fetchedData.price.toString(),
        condition: fetchedData.condition,
      });
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to connect to server');
    }

    setIsFetching(false);
  };

  // Inventory search
  const handleInventorySearch = async () => {
    if (!inventorySearch.trim()) return;
    setIsSearching(true);
    setError('');

    try {
      const result = await api.searchDashboardItems(inventorySearch.trim());
      const items = (result as any).data || [];
      setInventoryResults(items);
      if (items.length === 0) {
        setError('No items found matching your search');
      }
    } catch (err) {
      console.error('Error searching inventory:', err);
      setError('Failed to search inventory');
    }

    setIsSearching(false);
  };

  // Select inventory item for cloning
  const selectInventoryItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      price: (item.startingPrice || item.buyNowPrice || 0).toString(),
      condition: item.condition || 'Used',
    });
  };

  // Create from eBay
  const handleCreateFromEbay = async () => {
    if (!fetchedListing) return;
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/v1/ebay/create-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          condition: formData.condition,
          category: fetchedListing.category,
          imageUrls: fetchedListing.imageUrls,
          specifics: fetchedListing.specifics,
          sourceEbayId: fetchedListing.ebayItemId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Failed to create item');
      } else {
        setCreatedItem({ id: data.item.id, sku: data.item.sku });
        setCreated(true);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }

    setIsCreating(false);
  };

  // Clone from inventory
  const handleCloneItem = async () => {
    if (!selectedItem) return;
    setIsCreating(true);
    setError('');

    try {
      const result = await api.cloneItem(selectedItem.id, {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || undefined,
        condition: formData.condition,
      });

      if ((result as any).success) {
        setCreatedItem({ id: (result as any).data.id, sku: (result as any).data.sku });
        setCreated(true);
      } else {
        setError((result as any).error || 'Failed to clone item');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to clone item');
    }

    setIsCreating(false);
  };

  const resetAll = () => {
    setFetchedListing(null);
    setSelectedItem(null);
    setEbayUrl('');
    setInventorySearch('');
    setInventoryResults([]);
    setCreated(false);
    setCreatedItem(null);
    setError('');
  };

  const hasSource = sourceTab === 'ebay' ? !!fetchedListing : !!selectedItem;
  const sourceImages = sourceTab === 'ebay'
    ? (fetchedListing?.imageUrls || [])
    : (selectedItem?.photos?.map(p => p.url) || []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sell Similar</h1>
        <p className="text-slate-500 mt-1">Create a new listing from an eBay item or clone from your inventory</p>
      </div>

      {/* Source tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setSourceTab('ebay'); resetAll(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sourceTab === 'ebay' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ExternalLink size={16} />
          From eBay
        </button>
        <button
          onClick={() => { setSourceTab('inventory'); resetAll(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sourceTab === 'inventory' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Database size={16} />
          From Inventory
        </button>
      </div>

      {/* Search / URL Input */}
      <div className="card p-6">
        {sourceTab === 'ebay' ? (
          <>
            <h2 className="text-lg font-medium text-slate-900 mb-4">Enter eBay Listing</h2>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Paste eBay URL or Item ID (e.g., https://www.ebay.com/itm/123456789)"
                  value={ebayUrl}
                  onChange={(e) => { setEbayUrl(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="input pl-12"
                />
              </div>
              <button onClick={handleFetch} disabled={isFetching} className="btn-primary px-6 disabled:opacity-50">
                {isFetching ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Fetching...</>
                ) : (
                  <><Copy size={20} /> Fetch</>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium text-slate-900 mb-4">Search Your Inventory</h2>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, or category..."
                  value={inventorySearch}
                  onChange={(e) => { setInventorySearch(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleInventorySearch()}
                  className="input pl-12"
                />
              </div>
              <button onClick={handleInventorySearch} disabled={isSearching} className="btn-primary px-6 disabled:opacity-50">
                {isSearching ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
                ) : (
                  <><Search size={20} /> Search</>
                )}
              </button>
            </div>

            {/* Inventory search results */}
            {inventoryResults.length > 0 && !selectedItem && (
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {inventoryResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectInventoryItem(item)}
                    className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    {item.photos?.[0]?.url ? (
                      <img src={item.photos[0].url} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                        <Image size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.sku} · {item.condition}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      ${(item.startingPrice || item.buyNowPrice || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Source + Form side by side */}
      {hasSource && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original / Source */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-slate-400" />
              <h2 className="text-lg font-medium text-slate-900">
                {sourceTab === 'ebay' ? 'Original Listing' : 'Source Item'}
              </h2>
            </div>

            {/* Images */}
            {sourceImages.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {sourceImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-20 h-20 rounded-lg flex-shrink-0 object-cover bg-slate-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}

            <h3 className="font-medium text-slate-900 mb-2">
              {sourceTab === 'ebay' ? fetchedListing?.title : selectedItem?.title}
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-xl font-bold text-slate-900">
                ${sourceTab === 'ebay'
                  ? (fetchedListing?.price || 0).toFixed(2)
                  : (selectedItem?.startingPrice || selectedItem?.buyNowPrice || 0).toFixed(2)
                }
              </span>
              <span className="badge bg-slate-100 text-slate-600">
                {sourceTab === 'ebay' ? fetchedListing?.condition : selectedItem?.condition}
              </span>
            </div>

            {sourceTab === 'ebay' && fetchedListing?.category && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Tag size={14} />
                {fetchedListing.category}
              </div>
            )}

            {sourceTab === 'ebay' && fetchedListing?.specifics && Object.keys(fetchedListing.specifics).length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Item Specifics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(fetchedListing.specifics).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-slate-500">{key}:</span>{' '}
                      <span className="text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Listing Form */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-medium text-slate-900">Your New Listing</h2>
            </div>

            {created ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Item Created!</h3>
                {createdItem && (
                  <p className="text-sm text-slate-600 mb-2">SKU: <span className="font-mono font-medium">{createdItem.sku}</span></p>
                )}
                <p className="text-slate-500 mb-4">Your item is in the Review queue</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate(`/item/${createdItem?.id}`)} className="btn-primary">
                    View Item
                  </button>
                  <button onClick={resetAll} className="btn-secondary">
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={6} className="input resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                    <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="input">
                      <option value="New">New</option>
                      <option value="New Other">New Other</option>
                      <option value="Open Box">Open Box</option>
                      <option value="Used - Like New">Used - Like New</option>
                      <option value="Used - Very Good">Used - Very Good</option>
                      <option value="Used - Good">Used - Good</option>
                      <option value="Used - Acceptable">Used - Acceptable</option>
                      <option value="For Parts">For Parts</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={sourceTab === 'ebay' ? handleCreateFromEbay : handleCloneItem}
                    disabled={isCreating}
                    className="w-full btn-primary py-3 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                    ) : (
                      <>Add to Queue <ArrowRight size={20} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasSource && !isFetching && !isSearching && inventoryResults.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Copy size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-1.5">
            {sourceTab === 'ebay' ? 'Find an eBay listing to copy' : 'Search your inventory to clone'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            {sourceTab === 'ebay'
              ? 'Enter an eBay URL or item ID above to fetch listing details and create a similar item.'
              : 'Search for an existing item to use as a starting point for a new listing.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
