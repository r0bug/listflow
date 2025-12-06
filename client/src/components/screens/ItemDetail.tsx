import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Plus,
  Trash2,
  Camera,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ItemData {
  id: string;
  displayId: string;
  currentStep: string;
  title: string;
  category: string;
  categoryId: string | null;
  condition: string;
  conditionId: number;
  brand: string;
  model: string;
  itemSpecifics: { name: string; value: string }[];
  description: string;
  aiAnalysis: {
    confidence: number;
    model: string;
    justification: string;
  };
  suggestedPrice: number;
  photos: { id: string; url: string; isPrimary: boolean }[];
  location: string;
  locationCode: string;
  createdBy: string;
  createdAt: string;
}

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [redoContext, setRedoContext] = useState('');
  const [showRedoInput, setShowRedoInput] = useState(false);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setError('No item ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/item/${id}`);
        const data = await response.json();

        if (data.success) {
          setItem(data.data);
        } else {
          setError(data.error || 'Failed to load item');
        }
      } catch (err) {
        console.error('Error loading item:', err);
        setError('Failed to connect to server');
      }

      setIsLoading(false);
    };

    loadItem();
  }, [id]);

  const handleAccept = () => {
    // Move to next step
    navigate('/queue/price');
  };

  const handleRedo = () => {
    if (!redoContext.trim()) return;
    // Submit redo request with context
    console.log('Redo with context:', redoContext);
    setShowRedoInput(false);
    setRedoContext('');
  };

  const handleReject = () => {
    // Reject item
    navigate('/queue');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || 'Item not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            ITEM: {item.displayId}
          </h1>
          <p className="text-sm text-gray-500">
            Step: {item.currentStep}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
        {/* Left Column - Photos & AI Analysis */}
        <div className="space-y-4">
          {/* Photo Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              {item.photos[selectedPhotoIndex] ? (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <Camera size={48} />
                </div>
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>
            <div className="flex gap-2">
              {item.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={cn(
                    'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 transition-colors',
                    index === selectedPhotoIndex
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  )}
                >
                  <span className="text-xs text-gray-500">{index + 1}</span>
                </button>
              ))}
              <button className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">AI Analysis</h3>
            <p className="text-sm text-gray-600 mb-4 italic">
              "{item.aiAnalysis.justification}"
            </p>
            <div className="flex items-center justify-between text-sm">
              <span>
                Confidence:{' '}
                <span
                  className={cn(
                    'font-medium',
                    item.aiAnalysis.confidence >= 90
                      ? 'text-green-600'
                      : item.aiAnalysis.confidence >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {item.aiAnalysis.confidence}%
                </span>
              </span>
              <span className="text-gray-500">
                Model: {item.aiAnalysis.model}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Listing Details */}
        <div className="space-y-4">
          {/* Title */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Title</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  AI Confidence: {item.aiAnalysis.confidence}%
                </span>
                <button className="text-blue-600 text-sm hover:text-blue-800">
                  Edit
                </button>
                <button className="text-blue-600 text-sm hover:text-blue-800">
                  Redo
                </button>
              </div>
            </div>
            <p className="text-gray-700">{item.title}</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Category</h3>
              <button className="text-blue-600 text-sm hover:text-blue-800">
                Change Category
              </button>
            </div>
            <p className="text-gray-700">{item.category}</p>
          </div>

          {/* Condition */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Condition</h3>
            <select
              value={item.condition}
              onChange={(e) => setItem({ ...item, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New">New</option>
              <option value="Open Box">Open Box</option>
              <option value="Used - Like New">Used - Like New</option>
              <option value="Used - Good">Used - Good</option>
              <option value="Used - Acceptable">Used - Acceptable</option>
              <option value="For Parts">For Parts</option>
            </select>
          </div>

          {/* Item Specifics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Item Specifics</h3>
              <button className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800">
                <Plus size={14} />
                Add Specific
              </button>
            </div>
            <div className="space-y-2">
              {item.itemSpecifics.map((specific, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">
                    {specific.name}:
                  </span>
                  <input
                    type="text"
                    value={specific.value}
                    onChange={(e) => {
                      const newSpecifics = [...item.itemSpecifics];
                      newSpecifics[index].value = e.target.value;
                      setItem({ ...item, itemSpecifics: newSpecifics });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Description</h3>
              <button className="text-blue-600 text-sm hover:text-blue-800">
                Edit
              </button>
            </div>
            <div
              className="prose prose-sm max-h-40 overflow-auto text-gray-600"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
        </div>
      </div>

      {/* Redo Context Input */}
      {showRedoInput && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Context for AI (if redoing):
          </label>
          <textarea
            value={redoContext}
            onChange={(e) => setRedoContext(e.target.value)}
            placeholder="This is actually the digital edition, not the disc version..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <X size={18} />
            Reject
          </button>
          <button
            onClick={() => setShowRedoInput(!showRedoInput)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={18} />
            Redo with Context
          </button>
          {showRedoInput && redoContext.trim() && (
            <button
              onClick={handleRedo}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Submit Redo
            </button>
          )}
          <button
            onClick={handleAccept}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Accept & Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
