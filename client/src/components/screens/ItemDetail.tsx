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
  Download,
  DollarSign,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import api from '../../api/client';
import { cn } from '../../utils/cn';
import { PhotoEditor } from '../PhotoEditor';
import { SortablePhotoStrip } from '../SortablePhotoStrip';

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
  photos: { id: string; url: string; fullUrl?: string; isPrimary: boolean; order?: number }[];
  location: string;
  locationCode: string;
  createdBy: string;
  createdAt: string;
  aiCost?: number;
  startingPrice: number;
  buyNowPrice: number;
  shippingCost: number;
  shippingService: string;
  shippingType: string;
  weight: number | null;
  packageDimensions: { length?: number; width?: number; height?: number } | null;
  handlingTime: number;
  listingFormat: string;
  listingDuration: string;
  returnPolicy: { returnsAccepted?: string; refundType?: string; returnDays?: string; shippingCostPaidBy?: string } | null;
  quantity: number;
  postalCode: string;
  aiPriceSuggestion: { min: number; max: number; confidence: string; reasoning: string } | null;
  upc: string;
  isbn: string;
  ebayId: string | null;
  publishedAt: string | null;
  exportedAt: string | null;
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

  // Redo / reanalyze context
  const [redoContext, setRedoContext] = useState('');
  const [showRedoInput, setShowRedoInput] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isPushingToEbay, setIsPushingToEbay] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

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
          itemSpecifics: item.itemSpecifics,
          startingPrice: item.startingPrice,
          buyNowPrice: item.buyNowPrice,
          shippingCost: item.shippingCost,
          shippingService: item.shippingService,
          shippingType: item.shippingType,
          weight: item.weight,
          packageDimensions: item.packageDimensions,
          handlingTime: item.handlingTime,
          listingFormat: item.listingFormat,
          listingDuration: item.listingDuration,
          returnPolicy: item.returnPolicy,
          quantity: item.quantity,
          postalCode: item.postalCode,
          upc: item.upc,
          isbn: item.isbn,
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

  // Redo AI analysis (full reprocess or targeted reanalyze with prompt)
  const handleRedo = async () => {
    if (!item) return;

    setIsSaving(true);
    setError(null);
    try {
      let result;
      if (redoContext.trim()) {
        // Targeted reanalyze with correction prompt + optional selected photos
        result = await api.reanalyzeItem(
          item.id,
          redoContext.trim(),
          selectedPhotoIds.length > 0 ? selectedPhotoIds : undefined
        );
      } else {
        // Full reprocess from scratch
        result = await api.reprocessAi(item.id);
      }
      if (result.success) {
        setSuccessMessage('AI analysis complete - reloading...');
        setShowRedoInput(false);
        setRedoContext('');
        setSelectedPhotoIds([]);
        loadItem();
      } else {
        setError((result as any).error || 'AI processing failed');
      }
    } catch (err) {
      console.error('Error running AI:', err);
      setError('Failed to run AI analysis');
    }
    setIsSaving(false);
  };

  // Export to CSV
  const handleExportCsv = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const blob = await api.exportCsv([item.id]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listflow-${item.displayId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('CSV exported');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to export CSV';
      setError(msg);
    }
    setIsSaving(false);
  };

  // AI Price Suggestion
  const handleSuggestPrice = async () => {
    if (!item) return;
    setIsSuggestingPrice(true);
    try {
      const result = await api.suggestItemPrice(item.id);
      if (result.success) {
        setItem({ ...item, aiPriceSuggestion: result.data as any });
        setSuccessMessage('Price suggestion received');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError((result as any).error || 'Failed to get price suggestion');
      }
    } catch (err) {
      console.error('Error getting price suggestion:', err);
      setError('Failed to get AI price suggestion');
    }
    setIsSuggestingPrice(false);
  };

  // Push to eBay
  const handlePushToEbay = async () => {
    if (!item) return;
    if (!window.confirm('Push this item to eBay? This action will create a live listing.')) return;

    setIsPushingToEbay(true);
    try {
      const result = await api.pushToEbay(item.id);
      if (result.success) {
        setSuccessMessage('Successfully pushed to eBay!');
        loadItem(); // Reload to get updated state
      } else {
        setError((result as any).error || 'Failed to push to eBay');
      }
    } catch (err: any) {
      console.error('Error pushing to eBay:', err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to push to eBay';
      setError(msg);
    }
    setIsPushingToEbay(false);
  };

  // Upload additional photos
  const handleUploadMorePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsSaving(true);
    try {
      const result = await api.uploadPhotosToItem(item.id, files);
      if (result.success) {
        setSuccessMessage('Photos uploaded');
        loadItem();
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError((result as any).error || 'Failed to upload photos');
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError('Failed to upload photos');
    }
    setIsSaving(false);
    e.target.value = '';
  };

  // Photo management handlers
  const handleReorderPhotos = async (photoIds: string[]) => {
    if (!item) return;
    try {
      await api.reorderPhotos(item.id, photoIds);
      loadItem();
    } catch (err) {
      console.error('Error reordering photos:', err);
      setError('Failed to reorder photos');
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!item) return;
    try {
      await api.setPhotoPrimary(item.id, photoId);
      setSuccessMessage('Primary photo updated');
      loadItem();
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error setting primary:', err);
      setError('Failed to set primary photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!item) return;
    if (!window.confirm('Delete this photo?')) return;
    try {
      await api.deleteDashboardPhoto(item.id, photoId);
      // Adjust selected index if needed
      const deletedIndex = item.photos.findIndex(p => p.id === photoId);
      if (deletedIndex !== -1 && selectedPhotoIndex >= deletedIndex && selectedPhotoIndex > 0) {
        setSelectedPhotoIndex(selectedPhotoIndex - 1);
      }
      setSuccessMessage('Photo deleted');
      loadItem();
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo');
    }
  };

  const handleEditPhoto = (photoId: string) => {
    setEditingPhotoId(photoId);
  };

  const handlePhotoEditSaved = () => {
    setEditingPhotoId(null);
    setSuccessMessage('Photo edited');
    loadItem();
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
      <div className="h-full flex items-center justify-center animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-ink-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-fade-in">
        <p className="text-coral-600 mb-4">{error || 'Item not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ITEM: {item.displayId}
          </h1>
          <p className="text-sm text-slate-500">
            Step: {item.currentStep}
            {hasChanges && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Save button */}
          {hasChanges && (
            <button
              onClick={saveChanges}
              disabled={isSaving}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          )}
          {/* Success message */}
          {successMessage && (
            <span className="flex items-center gap-1 text-sage-600 text-sm font-medium">
              <Check size={16} />
              {successMessage}
            </span>
          )}
          {/* Navigation */}
          <button
            onClick={() => handleNavigate('prev')}
            disabled={!navigation.prevId}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous item"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            disabled={!navigation.nextId}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next item"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
        {/* Left Column - Photos & AI Analysis */}
        <div className="space-y-4 animate-slide-up">
          {/* Photo Gallery */}
          <div className="card p-4">
            <div className="aspect-square bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative group">
              {item.photos[selectedPhotoIndex]?.url ? (
                <>
                  <img
                    src={item.photos[selectedPhotoIndex].fullUrl || item.photos[selectedPhotoIndex].url}
                    alt={`Photo ${selectedPhotoIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Edit button */}
                  <button
                    onClick={() => handleEditPhoto(item.photos[selectedPhotoIndex].id)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Camera size={48} />
                  <span className="mt-2">No image</span>
                </div>
              )}
            </div>
            <SortablePhotoStrip
              photos={item.photos}
              selectedIndex={selectedPhotoIndex}
              onSelect={setSelectedPhotoIndex}
              onReorder={handleReorderPhotos}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDeletePhoto}
              onEdit={handleEditPhoto}
              onUpload={handleUploadMorePhotos}
              isMobile={isMobile}
            />
          </div>

          {/* Photo Editor Modal */}
          {editingPhotoId && (() => {
            const editingPhoto = item.photos.find(p => p.id === editingPhotoId);
            if (!editingPhoto) return null;
            return (
              <PhotoEditor
                photoUrl={editingPhoto.fullUrl || editingPhoto.url}
                photoId={editingPhotoId}
                itemId={item.id}
                allPhotos={item.photos}
                onSave={handlePhotoEditSaved}
                onClose={() => setEditingPhotoId(null)}
              />
            );
          })()}

          {/* AI Analysis */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-3">AI Analysis</h3>
            <p className="text-sm text-slate-600 mb-4 italic">
              "{item.aiAnalysis.justification}"
            </p>
            <div className="flex items-center justify-between text-sm">
              <span>
                Confidence:{' '}
                <span
                  className={cn(
                    'font-medium',
                    item.aiAnalysis.confidence >= 90
                      ? 'text-sage-600'
                      : item.aiAnalysis.confidence >= 70
                        ? 'text-amber-600'
                        : 'text-coral-600'
                  )}
                >
                  {item.aiAnalysis.confidence}%
                </span>
              </span>
              <span className="badge-plum">
                {item.aiAnalysis.model}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Listing Details */}
        <div className="space-y-4 animate-slide-up">
          {/* Title */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Title</h3>
              <div className="flex items-center gap-2">
                <span className="badge-ink">
                  AI: {item.aiAnalysis.confidence}%
                </span>
                {item.aiCost != null && item.aiCost > 0 && (
                  <span className="text-xs text-slate-400" title="Total AI cost for this item">
                    ${item.aiCost.toFixed(4)}
                  </span>
                )}
                <button
                  onClick={() => setEditingTitle(!editingTitle)}
                  className="text-ink-600 text-sm hover:text-ink-800 flex items-center gap-1 transition-colors"
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
                className="input"
                autoFocus
              />
            ) : (
              <p className="text-slate-700">{item.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Category</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-ink-600 text-sm hover:text-ink-800 transition-colors"
              >
                Change Category
              </button>
            </div>
            <p className="text-slate-700">{item.category}</p>
          </div>

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
              <div className="card p-6 w-full max-w-md max-h-[80vh] overflow-auto animate-slide-up">
                <h3 className="font-semibold text-slate-900 mb-4">Select Category</h3>
                <div className="space-y-1">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        updateField('category', cat);
                        setShowCategoryModal(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        item.category === cat
                          ? 'bg-ink-100 text-ink-700 font-medium'
                          : 'text-slate-700 hover:bg-ink-50'
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
                    className="input"
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
                  className="btn-secondary mt-4 w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Condition */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Condition</h3>
            <select
              value={item.condition}
              onChange={(e) => updateField('condition', e.target.value)}
              className="input"
            >
              <option value="New">New</option>
              <option value="Open Box">Open Box</option>
              <option value="Used - Like New">Used - Like New</option>
              <option value="Used - Good">Used - Good</option>
              <option value="Used - Acceptable">Used - Acceptable</option>
              <option value="For Parts">For Parts</option>
            </select>
          </div>

          {/* UPC / ISBN */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Product Identifiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-500 mb-1 block">UPC</label>
                <input
                  type="text"
                  value={item.upc}
                  onChange={(e) => updateField('upc', e.target.value)}
                  placeholder="12-13 digit barcode"
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">ISBN</label>
                <input
                  type="text"
                  value={item.isbn}
                  onChange={(e) => updateField('isbn', e.target.value)}
                  placeholder="10 or 13 digit ISBN"
                  className="input"
                />
              </div>
            </div>
            {(item.upc || item.isbn) && (
              <p className="text-xs text-slate-400 mt-2">AI-detected or manually entered. Used in CSV export.</p>
            )}
          </div>

          {/* Item Specifics */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Item Specifics</h3>
              <button
                onClick={() => setShowAddSpecificModal(true)}
                className="flex items-center gap-1 text-ink-600 text-sm hover:text-ink-800 transition-colors"
              >
                <Plus size={14} />
                Add Specific
              </button>
            </div>
            <div className="space-y-2">
              {item.itemSpecifics.length === 0 ? (
                <p className="text-slate-500 text-sm">No item specifics added</p>
              ) : (
                item.itemSpecifics.map((specific, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <span className="text-slate-500 md:w-28 flex-shrink-0 text-sm">
                      {specific.name}:
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={specific.value}
                        onChange={(e) => handleUpdateSpecific(index, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-ink-500/20 focus:border-ink-500 transition-colors min-h-[44px]"
                      />
                      <button
                        onClick={() => handleRemoveSpecific(index)}
                        className="text-slate-400 hover:text-coral-500 p-1 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Specific Modal */}
          {showAddSpecificModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
              <div className="card p-6 w-full max-w-sm animate-slide-up">
                <h3 className="font-semibold text-slate-900 mb-4">Add Item Specific</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newSpecific.name}
                      onChange={(e) => setNewSpecific({ ...newSpecific, name: e.target.value })}
                      placeholder="e.g., Brand, Color, Size"
                      className="input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                    <input
                      type="text"
                      value={newSpecific.value}
                      onChange={(e) => setNewSpecific({ ...newSpecific, value: e.target.value })}
                      placeholder="e.g., Sony, Blue, Large"
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowAddSpecificModal(false);
                      setNewSpecific({ name: '', value: '' });
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSpecific}
                    disabled={!newSpecific.name.trim()}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Description Preview */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Description</h3>
              <button
                onClick={() => setEditingDescription(!editingDescription)}
                className="text-ink-600 text-sm hover:text-ink-800 flex items-center gap-1 transition-colors"
              >
                <Edit2 size={14} />
                {editingDescription ? 'Done' : 'Edit'}
              </button>
            </div>
            {editingDescription ? (
              <textarea
                value={item.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="input min-h-[150px]"
              />
            ) : (
              <div
                className="prose prose-sm max-h-40 overflow-auto text-slate-600"
                dangerouslySetInnerHTML={{ __html: item.description || '<em>No description</em>' }}
              />
            )}
          </div>

          {/* Pricing & Listing Form - always visible so details can be set at any stage */}
              {/* Listing Format Card */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Listing Format</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                    <div className="flex gap-3">
                      {['FixedPrice', 'Auction', 'AuctionWithBIN'].map((fmt) => (
                        <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="listingFormat"
                            value={fmt}
                            checked={item.listingFormat === fmt}
                            onChange={(e) => updateField('listingFormat', e.target.value)}
                            className="text-ink-600"
                          />
                          <span className="text-sm text-slate-700">{fmt === 'AuctionWithBIN' ? 'Auction + BIN' : fmt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                      <select
                        value={item.listingDuration}
                        onChange={(e) => updateField('listingDuration', e.target.value)}
                        className="input w-full"
                      >
                        <option value="GTC">Good 'Til Cancelled</option>
                        <option value="3">3 Days</option>
                        <option value="5">5 Days</option>
                        <option value="7">7 Days</option>
                        <option value="10">10 Days</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                        className="input w-full"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Pricing</h3>
                  <button
                    onClick={handleSuggestPrice}
                    disabled={isSuggestingPrice}
                    className="flex items-center gap-1 text-sm text-ink-600 hover:text-ink-800 transition-colors"
                  >
                    {isSuggestingPrice ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                    AI Suggest
                  </button>
                </div>
                {item.aiPriceSuggestion && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-amber-800">
                        ${item.aiPriceSuggestion.min} - ${item.aiPriceSuggestion.max}
                      </span>
                      <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                        {item.aiPriceSuggestion.confidence}
                      </span>
                    </div>
                    <p className="text-amber-700 text-xs">{item.aiPriceSuggestion.reasoning}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {(item.listingFormat === 'Auction' || item.listingFormat === 'AuctionWithBIN') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Starting Price ($)</label>
                      <input
                        type="number"
                        value={item.startingPrice || ''}
                        onChange={(e) => updateField('startingPrice', parseFloat(e.target.value) || 0)}
                        className="input w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  {(item.listingFormat === 'FixedPrice' || item.listingFormat === 'AuctionWithBIN') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {item.listingFormat === 'FixedPrice' ? 'Price ($)' : 'Buy It Now Price ($)'}
                      </label>
                      <input
                        type="number"
                        value={item.buyNowPrice || ''}
                        onChange={(e) => updateField('buyNowPrice', parseFloat(e.target.value) || 0)}
                        className="input w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Card */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Shipping</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <div className="flex gap-3">
                        {['Flat', 'Calculated'].map((t) => (
                          <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="shippingType"
                              value={t}
                              checked={item.shippingType === t}
                              onChange={(e) => updateField('shippingType', e.target.value)}
                              className="text-ink-600"
                            />
                            <span className="text-sm text-slate-700">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                    <select
                      value={item.shippingService}
                      onChange={(e) => updateField('shippingService', e.target.value)}
                      className="input w-full"
                    >
                      <option value="USPSPriority">USPS Priority Mail</option>
                      <option value="USPSFirstClass">USPS First Class</option>
                      <option value="USPSGround">USPS Ground Advantage</option>
                      <option value="FedExGround">FedEx Ground</option>
                      <option value="FedExHomeDelivery">FedEx Home Delivery</option>
                      <option value="UPSGround">UPS Ground</option>
                      <option value="UPS3Day">UPS 3 Day Select</option>
                    </select>
                  </div>
                  {item.shippingType === 'Flat' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                      <input
                        type="number"
                        value={item.shippingCost || ''}
                        onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                        className="input w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight (oz)</label>
                      <input
                        type="number"
                        value={item.weight || ''}
                        onChange={(e) => updateField('weight', parseFloat(e.target.value) || null)}
                        className="input w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Handling (days)</label>
                      <input
                        type="number"
                        value={item.handlingTime}
                        onChange={(e) => updateField('handlingTime', parseInt(e.target.value) || 3)}
                        className="input w-full"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dimensions (L x W x H inches)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="L"
                        value={item.packageDimensions?.length || ''}
                        onChange={(e) => updateField('packageDimensions', { ...item.packageDimensions, length: parseFloat(e.target.value) || undefined })}
                        className="input w-full"
                        min="0"
                        step="0.1"
                      />
                      <input
                        type="number"
                        placeholder="W"
                        value={item.packageDimensions?.width || ''}
                        onChange={(e) => updateField('packageDimensions', { ...item.packageDimensions, width: parseFloat(e.target.value) || undefined })}
                        className="input w-full"
                        min="0"
                        step="0.1"
                      />
                      <input
                        type="number"
                        placeholder="H"
                        value={item.packageDimensions?.height || ''}
                        onChange={(e) => updateField('packageDimensions', { ...item.packageDimensions, height: parseFloat(e.target.value) || undefined })}
                        className="input w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Returns Card */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Returns</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Accepted:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="returnsAccepted"
                        checked={item.returnPolicy?.returnsAccepted !== 'false'}
                        onChange={() => updateField('returnPolicy', { ...item.returnPolicy, returnsAccepted: 'true' })}
                        className="text-ink-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="returnsAccepted"
                        checked={item.returnPolicy?.returnsAccepted === 'false'}
                        onChange={() => updateField('returnPolicy', { ...item.returnPolicy, returnsAccepted: 'false' })}
                        className="text-ink-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                  {item.returnPolicy?.returnsAccepted !== 'false' && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                        <select
                          value={item.returnPolicy?.returnDays || '30'}
                          onChange={(e) => updateField('returnPolicy', { ...item.returnPolicy, returnDays: e.target.value })}
                          className="input w-full"
                        >
                          <option value="14">14 Days</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Refund</label>
                        <select
                          value={item.returnPolicy?.refundType || 'MoneyBack'}
                          onChange={(e) => updateField('returnPolicy', { ...item.returnPolicy, refundType: e.target.value })}
                          className="input w-full"
                        >
                          <option value="MoneyBack">Money Back</option>
                          <option value="Exchange">Exchange</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Return Ship</label>
                        <select
                          value={item.returnPolicy?.shippingCostPaidBy || 'Buyer'}
                          onChange={(e) => updateField('returnPolicy', { ...item.returnPolicy, shippingCostPaidBy: e.target.value })}
                          className="input w-full"
                        >
                          <option value="Buyer">Buyer</option>
                          <option value="Seller">Seller</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Item Location</h3>
                <input
                  type="text"
                  value={item.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  placeholder="Postal code (e.g., 10001)"
                  className="input w-full"
                />
              </div>
        </div>
      </div>

      {/* Reanalyze Panel */}
      {showRedoInput && (
        <div className="card p-4 mt-4 animate-slide-up space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Re-analyze with Correction</h4>
            <button onClick={() => { setShowRedoInput(false); setSelectedPhotoIds([]); setRedoContext(''); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>

          {/* Photo selection */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Select photos to send (or leave empty for all):
            </label>
            <div className="flex flex-wrap gap-2">
              {item.photos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoIds(prev =>
                      isSelected ? prev.filter(pid => pid !== photo.id) : [...prev, photo.id]
                    )}
                    className={cn(
                      'relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                      isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-400'
                    )}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                        <Check size={20} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedPhotoIds.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">{selectedPhotoIds.length} photo(s) selected</p>
            )}
          </div>

          {/* Correction prompt */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Correction / instruction for AI:
            </label>
            <textarea
              value={redoContext}
              onChange={(e) => setRedoContext(e.target.value)}
              placeholder='e.g. "The brand is Sony, not Samsung. Look at the label in photo 3."'
              className="input"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setRedoContext(''); setSelectedPhotoIds([]); handleRedo(); }}
              disabled={isSaving}
              className="btn-secondary text-sm min-h-[36px]"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Full Re-run
            </button>
            <button
              onClick={handleRedo}
              disabled={isSaving || !redoContext.trim()}
              className="btn-primary text-sm min-h-[36px]"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Send Correction
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 text-coral-700 px-4 py-2 rounded-lg mt-4 animate-fade-in">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-coral-500 hover:text-coral-700 transition-colors">×</button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 md:space-y-0">
        {/* Navigation row on mobile */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary min-h-[44px]"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Back to Queue</span>
            <span className="sm:hidden">Back</span>
          </button>
          {/* Mobile: prev/next here too */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => handleNavigate('prev')}
              disabled={!navigation.prevId}
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handleNavigate('next')}
              disabled={!navigation.nextId}
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        {/* Action buttons row */}
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
          {item.currentStep !== 'PUBLISHED' && (
          <>
          <button
            onClick={handleReject}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 border border-coral-200 text-coral-600 font-medium rounded-lg hover:bg-coral-50 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            <X size={18} />
            Reject
          </button>
          <button
            onClick={() => setShowRedoInput(!showRedoInput)}
            disabled={isSaving}
            className={cn('btn-secondary min-h-[44px]', showRedoInput && 'ring-2 ring-primary-300')}
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">Re-run AI</span>
            <span className="sm:hidden">AI</span>
          </button>
          </>
          )}
          {item.currentStep === 'FINAL_REVIEW' && (
            <>
              <button
                onClick={handleExportCsv}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 font-medium rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                <Download size={18} />
                Export CSV
              </button>
              <button
                onClick={handlePushToEbay}
                disabled={isPushingToEbay || isSaving}
                className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-ink-600 text-white font-medium rounded-lg hover:bg-ink-700 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isPushingToEbay ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={18} />}
                Push to eBay
              </button>
            </>
          )}
          {item.currentStep === 'PUBLISHED' ? (
            <div className="flex items-center gap-3">
              {item.ebayId && (
                <a
                  href={`https://www.ebay.com/itm/${item.ebayId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-ink-600 text-white font-medium rounded-lg hover:bg-ink-700 transition-colors min-h-[44px]"
                >
                  <ExternalLink size={18} />
                  View on eBay
                </a>
              )}
              {item.publishedAt && (
                <span className="text-sm text-slate-500">Published {new Date(item.publishedAt).toLocaleDateString()}</span>
              )}
            </div>
          ) : (
            <button
              onClick={handleAccept}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 hover:shadow-md disabled:opacity-50 transition-all duration-150 min-h-[44px]"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Accept & Next
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
