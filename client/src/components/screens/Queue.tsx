import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Filter, CheckSquare, DollarSign, List, Grid3X3 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ItemCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  confidence?: number;
  price?: number;
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

export const Queue: React.FC = () => {
  useParams<{ step?: string }>();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Mock data
  const mockItems = {
    identify: [
      { id: '1', title: 'PS5 Console', confidence: 94, step: 'identify' },
      { id: '2', title: 'Xbox Series X', confidence: 91, step: 'identify' },
      { id: '3', title: 'Vinyl Record', confidence: 65, step: 'identify' },
    ],
    review: [
      { id: '4', title: 'Nintendo Switch', confidence: 87, step: 'review' },
      { id: '5', title: 'iPad Pro', confidence: 78, step: 'review' },
      { id: '6', title: 'Camera', confidence: 82, step: 'review' },
    ],
    price: [
      { id: '7', title: 'iPhone 14', price: 299, step: 'price' },
      { id: '8', title: 'Samsung TV', price: 149, step: 'price' },
      { id: '9', title: 'Laptop', price: 450, step: 'price' },
    ],
    ready: [
      { id: '10', title: 'MacBook Pro', price: 899, step: 'ready' },
      { id: '11', title: 'Monitor', price: 199, step: 'ready' },
    ],
  };

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
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter size={18} />
          </button>
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
          <div className="flex gap-4 pb-4">
            <Column title="IDENTIFY" count={12} items={mockItems.identify} />
            <Column title="REVIEW" count={18} items={mockItems.review} />
            <Column title="PRICE" count={9} items={mockItems.price} />
            <Column title="READY" count={8} items={mockItems.ready} />
          </div>
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
                        setSelectedItems(Object.values(mockItems).flat().map((i) => i.id));
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
              {Object.entries(mockItems).flatMap(([step, items]) =>
                items.map((item) => (
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
                      <div className="w-12 h-12 bg-gray-100 rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                        {step}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {'confidence' in item && item.confidence !== undefined && (
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
                      {'price' in item && item.price !== undefined && (
                        <span className="font-medium text-green-600">${item.price}</span>
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
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-700">
            <CheckSquare size={16} />
            Bulk Review
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 rounded hover:bg-green-700">
            <DollarSign size={16} />
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
    </div>
  );
};
