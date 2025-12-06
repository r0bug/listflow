import React, { useState, useEffect, useCallback } from 'react';
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
  Save,
  Check,
  Edit2,
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

interface NavigationData {
  prevId: string | null;
  nextId: string | null;
}

// Common eBay categories
const COMMON_CATEGORIES = [
  'Video Games & Consoles > Video Games',
  'Video Games & Consoles > Consoles',
  'Cell Phones & Accessories > Cell Phones & Smartphones',
  'Computers/Tablets & Networking > Laptops & Netbooks',
  'Consumer Electronics > TV, Video & Home Audio',
  'Clothing, Shoes & Accessories > Men > Shirts',
  'Clothing, Shoes & Accessories > Women > Dresses',
  'Toys & Hobbies > Action Figures',
  'Collectibles > Trading Cards',
  'Books & Magazines > Books',
  'Music > Records',
  'Movies & TV > DVDs & Blu-ray Discs',
  'Sporting Goods > Outdoor Sports',
  'Home & Garden > Tools & Workshop Equipment',
  'Other',
];

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data state
  const [item, setItem] = useState<ItemData | null>(null);
  const [navigation, setNavigation] = useState<NavigationData>({ prevId: null, nextId: null });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Edit modes
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddSpecificModal, setShowAddSpecificModal] = useState(false);
  const [newSpecific, setNewSpecific] = useState({ name: '', value: '' });

  // Redo context
  const [redoContext, setRedoContext] = useState('');
  const [showRedoInput, setShowRedoInput] = useState(false);

  // Load item data
  const loadItem = useCallback(async () => {
    if (!id) {
      setError('No item ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [itemRes, navRes] = await Promise.all([
        fetch(`/api/dashboard/item/${id}`),
        fetch(`/api/dashboard/item/${id}/navigation`)
      ]);

      const [itemData, navData] = await Promise.all([
        itemRes.json(),
        navRes.json()
      ]);

      if (itemData.success) {
        setItem(itemData.data);
        setHasChanges(false);
      } else {
        setError(itemData.error || 'Failed to load item');
      }

      if (navData.success) {
        setNavigation(navData.data);
      }
    } catch (err) {
      console.error('Error loading item:', err);
      setError('Failed to connect to server');
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // Save changes to API
  const saveChanges = async () => {
    if (!item || !hasChanges) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/item/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          category: item.category,
          condition: item.condition,
          brand: item.brand,
          itemSpecifics: item.itemSpecifics
        })
      });

      const result = await response.json();
      if (result.success) {
        setHasChanges(false);
        setSuccessMessage('Changes saved');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError(result.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save changes');
    }
    setIsSaving(false);
  };

  // Update item field
  const updateField = (field: keyof ItemData, value: any) => {
    if (!item) return;
    setItem({ ...item, [field]: value });
    setHasChanges(true);
  };

  // Accept and advance to next stage
  const handleAccept = async () => {
    if (!item) return;

    // Save any pending changes first
    if (hasChanges) {
      await saveChanges();
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/item/${item.id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved and advanced' })
      });

      const result = await response.json();
      if (result.success) {
        // Navigate to next item or back to queue
        if (navigation.nextId) {
          navigate(`/item/${navigation.nextId}`);
        } else {
          navigate('/queue');
        }
      } else {
        setError(result.error || 'Failed to advance item');
      }
    } catch (err) {
      console.error('Error advancing item:', err);
      setError('Failed to advance item');
    }
    setIsSaving(false);
  };

  // Redo AI analysis
  const handleRedo = async () => {
    if (!item || !redoContext.trim()) return;

    setIsSaving(true);
    try {
      // For now, just save the context as a note and keep item in same stage
      // In a real implementation, this would trigger AI re-analysis
      const response = await fetch(`/api/dashboard/item/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Store redo context in description or separate field
          description: item.description + `\n\n[Redo context: ${redoContext}]`
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('Redo context saved - AI will reprocess');
        setShowRedoInput(false);
        setRedoContext('');
        loadItem();
      } else {
        setError(result.error || 'Failed to submit redo');
      }
    } catch (err) {
      console.error('Error submitting redo:', err);
      setError('Failed to submit redo');
    }
    setIsSaving(false);
  };

  // Reject item
  const handleReject = async () => {
    if (!item) return;

    const reason = window.prompt('Enter rejection reason (optional):');

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/item/${item.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const result = await response.json();
      if (result.success) {
        // Navigate to next item or back to queue
        if (navigation.nextId) {
          navigate(`/item/${navigation.nextId}`);
        } else {
          navigate('/queue');
        }
      } else {
        setError(result.error || 'Failed to reject item');
      }
    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Failed to reject item');
    }
    setIsSaving(false);
  };

  // Add new item specific
  const handleAddSpecific = () => {
    if (!item || !newSpecific.name.trim()) return;

    const updatedSpecifics = [
      ...item.itemSpecifics,
      { name: newSpecific.name.trim(), value: newSpecific.value.trim() }
    ];
    updateField('itemSpecifics', updatedSpecifics);
    setNewSpecific({ name: '', value: '' });
    setShowAddSpecificModal(false);
  };

  // Remove item specific
  const handleRemoveSpecific = (index: number) => {
    if (!item) return;
    const updatedSpecifics = item.itemSpecifics.filter((_, i) => i !== index);
    updateField('itemSpecifics', updatedSpecifics);
  };

  // Update item specific value
  const handleUpdateSpecific = (index: number, value: string) => {
    if (!item) return;
    const updatedSpecifics = [...item.itemSpecifics];
    updatedSpecifics[index] = { ...updatedSpecifics[index], value };
    updateField('itemSpecifics', updatedSpecifics);
  };

  // Navigate to previous/next item
  const handleNavigate = (direction: 'prev' | 'next') => {
    const targetId = direction === 'prev' ? navigation.prevId : navigation.nextId;
    if (targetId) {
      if (hasChanges) {
        if (window.confirm('You have unsaved changes. Save before navigating?')) {
          saveChanges().then(() => navigate(`/item/${targetId}`));
        } else {
          navigate(`/item/${targetId}`);
        }
      } else {
        navigate(`/item/${targetId}`);
      }
    }
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
            {hasChanges && <span className="ml-2 text-orange-500">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Save button */}
          {hasChanges && (
            <button
              onClick={saveChanges}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          )}
          {/* Success message */}
          {successMessage && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Check size={16} />
              {successMessage}
            </span>
          )}
          {/* Navigation */}
          <button
            onClick={() => handleNavigate('prev')}
            disabled={!navigation.prevId}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous item"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            disabled={!navigation.nextId}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next item"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
        {/* Left Column - Photos & AI Analysis */}
        <div className="space-y-4">
          {/* Photo Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {item.photos[selectedPhotoIndex]?.url ? (
                <img
                  src={item.photos[selectedPhotoIndex].url}
                  alt={`Photo ${selectedPhotoIndex + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Camera size={48} />
                  <span className="mt-2">No image</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {item.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={cn(
                    'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 transition-colors overflow-hidden',
                    index === selectedPhotoIndex
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  )}
                >
                  {photo.url ? (
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  )}
                </button>
              ))}
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
                <button
                  onClick={() => setEditingTitle(!editingTitle)}
                  className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  {editingTitle ? 'Done' : 'Edit'}
                </button>
              </div>
            </div>
            {editingTitle ? (
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <p className="text-gray-700">{item.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Category</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                Change Category
              </button>
            </div>
            <p className="text-gray-700">{item.category}</p>
          </div>

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-auto">
                <h3 className="font-semibold text-gray-900 mb-4">Select Category</h3>
                <div className="space-y-2">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        updateField('category', cat);
                        setShowCategoryModal(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50',
                        item.category === cat ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Or enter custom category..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        updateField('category', e.currentTarget.value);
                        setShowCategoryModal(false);
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="mt-4 w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Condition */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Condition</h3>
            <select
              value={item.condition}
              onChange={(e) => updateField('condition', e.target.value)}
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
              <button
                onClick={() => setShowAddSpecificModal(true)}
                className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
              >
                <Plus size={14} />
                Add Specific
              </button>
            </div>
            <div className="space-y-2">
              {item.itemSpecifics.length === 0 ? (
                <p className="text-gray-500 text-sm">No item specifics added</p>
              ) : (
                item.itemSpecifics.map((specific, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 w-28 flex-shrink-0 text-sm">
                      {specific.name}:
                    </span>
                    <input
                      type="text"
                      value={specific.value}
                      onChange={(e) => handleUpdateSpecific(index, e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveSpecific(index)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Specific Modal */}
          {showAddSpecificModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Add Item Specific</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newSpecific.name}
                      onChange={(e) => setNewSpecific({ ...newSpecific, name: e.target.value })}
                      placeholder="e.g., Brand, Color, Size"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      value={newSpecific.value}
                      onChange={(e) => setNewSpecific({ ...newSpecific, value: e.target.value })}
                      placeholder="e.g., Sony, Blue, Large"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowAddSpecificModal(false);
                      setNewSpecific({ name: '', value: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSpecific}
                    disabled={!newSpecific.name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Description Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Description</h3>
              <button
                onClick={() => setEditingDescription(!editingDescription)}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
              >
                <Edit2 size={14} />
                {editingDescription ? 'Done' : 'Edit'}
              </button>
            </div>
            {editingDescription ? (
              <textarea
                value={item.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
              />
            ) : (
              <div
                className="prose prose-sm max-h-40 overflow-auto text-gray-600"
                dangerouslySetInnerHTML={{ __html: item.description || '<em>No description</em>' }}
              />
            )}
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mt-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <ChevronLeft size={18} />
          Back to Queue
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
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
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Submit Redo
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Accept & Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
