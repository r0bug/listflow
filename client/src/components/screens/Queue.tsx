import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Filter, CheckSquare, DollarSign, List, Grid3X3, RefreshCw, Loader2 } from 'lucide-react';
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

export const Queue: React.FC = () => {
  useParams<{ step?: string }>();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Filter items by search query
  const filterItems = (items: ItemCardProps[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => item.title.toLowerCase().includes(query));
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
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="flex gap-4 pb-4">
              <Column title="IDENTIFY" count={counts.identify} items={filterItems(queueItems.identify)} />
              <Column title="REVIEW" count={counts.review} items={filterItems(queueItems.review)} />
              <Column title="PRICE" count={counts.price} items={filterItems(queueItems.price)} />
              <Column title="READY" count={counts.ready} items={filterItems(queueItems.ready)} />
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
                        setSelectedItems(Object.values(queueItems).flat().map((i) => i.id));
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
                filterItems(items as ItemCardProps[]).map((item) => (
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
