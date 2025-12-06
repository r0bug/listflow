import React, { useState } from 'react';
import { Search, Copy, ArrowRight, Package, DollarSign, Tag, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

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

export const SellSimilar: React.FC = () => {
  const [ebayUrl, setEbayUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedListing, setFetchedListing] = useState<FetchedListing | null>(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Form state for modifications
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
  });

  const handleFetch = async () => {
    if (!ebayUrl.trim()) {
      setError('Please enter an eBay URL or item ID');
      return;
    }

    setIsFetching(true);
    setError('');
    setFetchedListing(null);
    setCreated(false);

    // Extract item ID from URL or use directly
    const itemIdMatch = ebayUrl.match(/itm\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : ebayUrl.replace(/\D/g, '');

    if (!itemId || itemId.length < 10) {
      setError('Invalid eBay URL or item ID. Please enter a valid eBay listing URL or 12-digit item number.');
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
      setError('Failed to connect to server. Please try again.');
    }

    setIsFetching(false);
  };

  const [createdItem, setCreatedItem] = useState<{ id: string; sku: string } | null>(null);

  const handleCreate = async () => {
    if (!fetchedListing) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/v1/ebay/create-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        setIsCreating(false);
        return;
      }

      setCreatedItem({ id: data.item.id, sku: data.item.sku });
      setCreated(true);
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to connect to server. Please try again.');
    }

    setIsCreating(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sell Similar</h1>
        <p className="text-gray-500">Create a new listing from an existing eBay item</p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Enter eBay Listing</h2>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Paste eBay URL or Item ID (e.g., https://www.ebay.com/itm/123456789 or 123456789)"
              value={ebayUrl}
              onChange={(e) => {
                setEbayUrl(e.target.value);
                setError('');
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={isFetching}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isFetching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Copy size={20} />
                Fetch Listing
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Fetched Listing Preview */}
      {fetchedListing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Listing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">Original Listing</h2>
            </div>

            {/* Images */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {fetchedListing.imageUrls.map((_, index) => (
                <div
                  key={index}
                  className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center"
                >
                  <Image size={24} className="text-gray-400" />
                </div>
              ))}
            </div>

            <h3 className="font-medium text-gray-900 mb-2">{fetchedListing.title}</h3>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-xl font-bold text-gray-900">${fetchedListing.price.toFixed(2)}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {fetchedListing.condition}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Tag size={14} />
              {fetchedListing.category}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Item Specifics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(fetchedListing.specifics).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-500">{key}:</span>{' '}
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Listing Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Your New Listing</h2>
            </div>

            {created ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Item Added to Queue!</h3>
                {createdItem && (
                  <p className="text-sm text-gray-600 mb-2">SKU: <span className="font-mono font-medium">{createdItem.sku}</span></p>
                )}
                <p className="text-gray-500 mb-4">Your item is now in the Review queue for processing</p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="/queue/review"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    View Queue
                  </a>
                  <button
                    onClick={() => {
                      setFetchedListing(null);
                      setEbayUrl('');
                      setCreated(false);
                      setCreatedItem(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="New">New</option>
                      <option value="Open Box">Open Box</option>
                      <option value="Used">Used</option>
                      <option value="For Parts">For Parts</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding to Queue...
                      </>
                    ) : (
                      <>
                        Add to Queue
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!fetchedListing && !isFetching && (
        <div className="text-center py-16">
          <Copy size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Find an eBay listing to copy</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter an eBay URL or item ID above to fetch listing details and create a similar item in your inventory.
          </p>
        </div>
      )}
    </div>
  );
};
