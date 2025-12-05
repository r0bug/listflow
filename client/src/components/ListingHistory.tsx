import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, ExternalLink, Package } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ListingHistory: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/listings/history`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Failed to load listing history. Please try again.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Listings Yet
        </h3>
        <p className="text-gray-600">
          Your created listings will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Listing History
      </h2>
      <div className="grid gap-4">
        {data.map((listing: any) => (
          <div 
            key={listing.id} 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Price:</span> ${listing.price}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${listing.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'}
                    `}>
                      {listing.status}
                    </span>
                  </div>
                  {listing.ebayId && (
                    <div>
                      <span className="font-medium">eBay ID:</span> {listing.ebayId}
                    </div>
                  )}
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {listing.imageUrls && listing.imageUrls[0] && (
                <img 
                  src={listing.imageUrls[0]} 
                  alt={listing.title}
                  className="w-24 h-24 object-cover rounded-md ml-4"
                />
              )}
            </div>
            {listing.ebayId && (
              <div className="mt-4 pt-4 border-t">
                <a 
                  href={`https://www.ebay.com/itm/${listing.ebayId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View on eBay
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};