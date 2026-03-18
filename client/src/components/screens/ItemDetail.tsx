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
  Sparkles,
  Search,
  ChevronDown,
  BookOpen,
  MessageSquare,
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
  ebayCategoryId: string;
  ebayId: string | null;
  shippingProfileId: string | null;
  returnProfileId: string | null;
  publishedAt: string | null;
  exportedAt: string | null;
  contextNotes: Record<string, string> | null;
  aiJournal: AiJournalEntry[];
  completeness: {
    hasPhotos: boolean;
    aiProcessed: boolean;
    categorySet: boolean;
    specificsPopulated: boolean;
    priceSet: boolean;
    shippingPolicyChosen: boolean;
    weightEntered: boolean;
    readyToList: boolean;
    score: number;
    percentage: number;
  };
}

interface AiJournalEntry {
  id: string;
  timestamp: string;
  type: string;
  prompt: {
    systemPrompt?: string;
    contextNotes?: Record<string, string> | null;
    photoCount?: number;
    existingData?: Record<string, unknown> | null;
  };
  response: {
    raw?: string;
    parsed?: Record<string, unknown>;
    model?: string;
    tokens?: { input: number; output: number };
    cost?: number;
  };
}

interface NavigationData {
  prevId: string | null;
  nextId: string | null;
}

// eBay Business Policy Profiles
const SHIPPING_PROFILES = [
  { id: '323050634021', label: 'Calculated USPS Ground Advantage' },
  { id: '323061009021', label: 'Calculated USPSParcel, 1 day' },
  { id: '323311715021', label: 'Calculated USPSMedia, 1 day' },
  { id: '324166003021', label: 'Calculated USPSMedia free, 1 day' },
  { id: '323361705021', label: 'Free Ground Advantage, 1 day' },
  { id: '324166001021', label: 'Flat USPSMedia free, 1 day' },
];

const RETURN_PROFILES = [
  { id: '323050657021', label: '30 day returns' },
  { id: '324166002021', label: '30 day + intl 30 day' },
  { id: '324166000021', label: '30 day + intl 14 day' },
  { id: '323061008021', label: 'Free 30 day money back' },
  { id: '324166011021', label: 'No returns' },
];

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

  // AI Journal & Context Notes
  const [showAiJournal, setShowAiJournal] = useState(false);
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
  const [showContextNote, setShowContextNote] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isPushingToEbay, setIsPushingToEbay] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; errors: string[]; warnings: string[]; fees: { name: string; amount: string }[] } | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [requiredSpecifics, setRequiredSpecifics] = useState<{ name: string; values?: string[] }[]>([]);
  const [isLoadingSpecifics, setIsLoadingSpecifics] = useState(false);

  // Fetch required specifics when category ID changes
  const fetchRequiredSpecifics = useCallback(async (categoryId: string) => {
    if (!categoryId || !/^\d+$/.test(categoryId)) {
      setRequiredSpecifics([]);
      return;
    }
    setIsLoadingSpecifics(true);
    try {
      const result = await api.getCategorySpecifics(categoryId);
      if (result.success && result.data) {
        setRequiredSpecifics(result.data.required || []);
      }
    } catch (err) {
      console.warn('Failed to fetch category specifics:', err);
    }
    setIsLoadingSpecifics(false);
  }, []);

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

  // Fetch required specifics on initial item load (only once per item)
  const [lastFetchedCategoryId, setLastFetchedCategoryId] = useState<string | null>(null);
  useEffect(() => {
    if (item?.ebayCategoryId && item.ebayCategoryId !== lastFetchedCategoryId && !isLoading) {
      // Only auto-fetch on initial load, not on every keystroke
      if (lastFetchedCategoryId === null && /^\d{3,}$/.test(item.ebayCategoryId)) {
        setLastFetchedCategoryId(item.ebayCategoryId);
        fetchRequiredSpecifics(item.ebayCategoryId);
      }
    }
  }, [item?.ebayCategoryId, isLoading, lastFetchedCategoryId, fetchRequiredSpecifics]);

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
          ebayCategoryId: item.ebayCategoryId,
          shippingProfileId: item.shippingProfileId,
          returnProfileId: item.returnProfileId,
          contextNotes: item.contextNotes,
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

  // Update a context note section
  const updateContextNote = (section: string, value: string) => {
    if (!item) return;
    const notes = { ...(item.contextNotes || {}) };
    if (value.trim()) {
      notes[section] = value;
    } else {
      delete notes[section];
    }
    setItem({ ...item, contextNotes: Object.keys(notes).length > 0 ? notes : null });
    setHasChanges(true);
  };

  // Render context note toggle for a section
  const renderContextNote = (section: string) => {
    if (!item) return null;
    const noteValue = item.contextNotes?.[section] || '';
    const isOpen = showContextNote === section;
    return (
      <div className="mt-2">
        <button
          onClick={() => setShowContextNote(isOpen ? null : section)}
          className={cn('flex items-center gap-1 text-xs', noteValue ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600')}
        >
          <MessageSquare size={12} />
          {noteValue ? 'Note' : 'Add note'}
        </button>
        {isOpen && (
          <textarea
            value={noteValue}
            onChange={(e) => updateContextNote(section, e.target.value)}
            placeholder={`Notes for AI about ${section}...`}
            className="mt-1 w-full text-xs input min-h-[60px]"
          />
        )}
      </div>
    );
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

  // Verify listing with eBay (dry run)
  const handleVerifyEbay = async () => {
    if (!item) return;
    setIsVerifying(true);
    setVerifyResult(null);
    setError(null);
    try {
      const result = await api.verifyEbay(item.id) as any;
      if (result.success) {
        setVerifyResult(result.data);
        if (result.data.valid) {
          setSuccessMessage('eBay validation passed!');
        }
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Verification failed';
      setError(msg);
    }
    setIsVerifying(false);
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
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Step:</span>
            <select
              value={item.currentStep}
              onChange={async (e) => {
                const newStage = e.target.value;
                try {
                  const result = await api.setItemStage(item.id, newStage);
                  if ((result as any).success) {
                    setSuccessMessage(`Moved to ${newStage}`);
                    // Reload item
                    const fresh = await api.getDashboardItem(item.id);
                    if ((fresh as any).success) setItem((fresh as any).data);
                  }
                } catch (err: any) {
                  setError(err?.response?.data?.error || 'Failed to change stage');
                }
              }}
              className="bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="PHOTO_UPLOAD">PHOTO_UPLOAD</option>
              <option value="AI_PROCESSING">AI_PROCESSING</option>
              <option value="REVIEW_EDIT">REVIEW_EDIT</option>
              <option value="PRICING">PRICING</option>
              <option value="FINAL_REVIEW">FINAL_REVIEW</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            {hasChanges && <span className="text-amber-600">• Unsaved changes</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Send to AI button */}
          <button
            onClick={async () => {
              setIsSaving(true);
              setError(null);
              try {
                const result = await api.sendToAI(item.id);
                if ((result as any).success) {
                  setSuccessMessage('AI analysis complete');
                  const fresh = await api.getDashboardItem(item.id);
                  if ((fresh as any).success) setItem((fresh as any).data);
                }
              } catch (err: any) {
                setError(err?.response?.data?.error || 'AI processing failed');
              }
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="btn bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 text-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Send to AI
          </button>
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

      {/* Completeness Bar */}
      {item.completeness && (
        <div className="card p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">
                  {item.completeness.readyToList ? 'Ready to list' : `${item.completeness.score}/7 complete`}
                </span>
                <span className="text-xs text-slate-400">{item.completeness.percentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', {
                    'bg-green-500': item.completeness.readyToList,
                    'bg-amber-400': item.completeness.percentage >= 50 && !item.completeness.readyToList,
                    'bg-red-400': item.completeness.percentage < 50,
                  })}
                  style={{ width: `${item.completeness.percentage}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'hasPhotos', label: 'Photos', done: item.completeness.hasPhotos },
                { key: 'aiProcessed', label: 'AI', done: item.completeness.aiProcessed },
                { key: 'categorySet', label: 'Category', done: item.completeness.categorySet },
                { key: 'specificsPopulated', label: 'Specifics', done: item.completeness.specificsPopulated },
                { key: 'priceSet', label: 'Price', done: item.completeness.priceSet },
                { key: 'shippingPolicyChosen', label: 'Shipping', done: item.completeness.shippingPolicyChosen },
                { key: 'weightEntered', label: 'Weight', done: item.completeness.weightEntered },
              ].map(({ key, label, done }) => (
                <span
                  key={key}
                  className={cn('text-xs px-1.5 py-0.5 rounded', {
                    'bg-green-100 text-green-700': done,
                    'bg-slate-100 text-slate-400': !done,
                  })}
                >
                  {done ? '\u2713' : '\u2717'} {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
            {renderContextNote('photos')}
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

          {/* AI Journal */}
          {item.aiJournal && item.aiJournal.length > 0 && (
            <div className="card p-4">
              <button
                onClick={() => setShowAiJournal(!showAiJournal)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen size={16} />
                  AI Journal ({item.aiJournal.length})
                </h3>
                <ChevronDown size={16} className={cn('text-slate-400 transition-transform', showAiJournal && 'rotate-180')} />
              </button>
              {showAiJournal && (
                <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                  {[...item.aiJournal].reverse().map((entry) => (
                    <div key={entry.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{entry.type}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{entry.prompt?.photoCount || 0} photos</span>
                        {entry.response?.tokens && (
                          <span>{entry.response.tokens.input + entry.response.tokens.output} tokens</span>
                        )}
                        {entry.response?.cost != null && (
                          <span className="text-amber-600">${entry.response.cost.toFixed(4)}</span>
                        )}
                      </div>
                      {expandedJournalId === entry.id ? (
                        <div className="mt-2">
                          <button onClick={() => setExpandedJournalId(null)} className="text-xs text-ink-600 mb-1">Hide details</button>
                          <pre className="text-xs bg-slate-50 p-2 rounded max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-600">
                            {entry.response?.raw || 'No response data'}
                          </pre>
                        </div>
                      ) : (
                        <button onClick={() => setExpandedJournalId(entry.id)} className="text-xs text-ink-600 mt-1">Show details</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-slate-500 shrink-0">eBay Category ID:</label>
              <input
                type="text"
                value={item.ebayCategoryId || ''}
                onChange={(e) => updateField('ebayCategoryId', e.target.value)}
                placeholder="e.g. 38034"
                className="input text-sm py-1 flex-1"
              />
              <button
                onClick={async () => {
                  try {
                    const result = await api.lookupCategory(item.id);
                    if ((result as any).success) {
                      const catId = (result as any).data.categoryId;
                      updateField('ebayCategoryId', catId);
                      setSuccessMessage(`Category: ${catId}`);

                      // If the response includes required specifics, use them directly
                      const reqSpecifics = (result as any).data.requiredSpecifics;
                      if (reqSpecifics?.length > 0) {
                        setRequiredSpecifics(reqSpecifics);
                        // Auto-add missing required specifics as empty fields
                        const currentNames = new Set(item.itemSpecifics.map(s => s.name.toLowerCase()));
                        const newSpecifics = [...item.itemSpecifics];
                        let added = 0;
                        for (const req of reqSpecifics) {
                          if (!currentNames.has(req.name.toLowerCase())) {
                            newSpecifics.push({ name: req.name, value: '' });
                            added++;
                          }
                        }
                        if (added > 0) {
                          updateField('itemSpecifics', newSpecifics);
                          setSuccessMessage(`Category: ${catId} — ${added} required specifics added`);
                        }
                      }
                    } else {
                      setError((result as any).error || 'No category found');
                    }
                  } catch (err: any) {
                    setError(err?.response?.data?.error || 'Category lookup failed');
                  }
                }}
                className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs py-1 px-2 shrink-0"
                title="Find eBay category from item title"
              >
                <Search size={14} />
                Find
              </button>
            </div>
            {item.ebayCategoryId && /^\d{3,}$/.test(item.ebayCategoryId) && requiredSpecifics.length === 0 && !isLoadingSpecifics && (
              <button
                onClick={() => {
                  setLastFetchedCategoryId(item.ebayCategoryId);
                  fetchRequiredSpecifics(item.ebayCategoryId);
                }}
                className="text-xs text-ink-600 hover:text-ink-800 mt-1 transition-colors"
              >
                Load required specifics for this category
              </button>
            )}
            {renderContextNote('category')}
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Item Specifics</h3>
                {requiredSpecifics.length > 0 && (() => {
                  const currentNames = new Set(item.itemSpecifics.map(s => s.name.toLowerCase()));
                  const missingCount = requiredSpecifics.filter(r => {
                    const existing = item.itemSpecifics.find(s => s.name.toLowerCase() === r.name.toLowerCase());
                    return !existing || !existing.value.trim();
                  }).length;
                  return missingCount > 0 ? (
                    <span className="text-xs bg-coral-100 text-coral-700 px-2 py-0.5 rounded-full font-medium">
                      {missingCount} required missing
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      All required filled
                    </span>
                  );
                })()}
                {isLoadingSpecifics && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>
              <div className="flex items-center gap-2">
                {item.ebayCategoryId && requiredSpecifics.length > 0 && (() => {
                  const currentNames = new Set(item.itemSpecifics.map(s => s.name.toLowerCase()));
                  const missing = requiredSpecifics.filter(r => !currentNames.has(r.name.toLowerCase()));
                  return missing.length > 0 ? (
                    <button
                      onClick={() => {
                        const newSpecifics = [...item.itemSpecifics];
                        for (const req of missing) {
                          newSpecifics.push({ name: req.name, value: '' });
                        }
                        updateField('itemSpecifics', newSpecifics);
                        setSuccessMessage(`Added ${missing.length} required specifics`);
                      }}
                      className="flex items-center gap-1 text-amber-600 text-xs hover:text-amber-800 transition-colors"
                    >
                      <Plus size={12} />
                      Add Required
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => setShowAddSpecificModal(true)}
                  className="flex items-center gap-1 text-ink-600 text-sm hover:text-ink-800 transition-colors"
                >
                  <Plus size={14} />
                  Add Specific
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {item.itemSpecifics.length === 0 ? (
                <p className="text-slate-500 text-sm">No item specifics added</p>
              ) : (
                item.itemSpecifics.map((specific, index) => {
                  const isRequired = requiredSpecifics.some(r => r.name.toLowerCase() === specific.name.toLowerCase());
                  const isMissing = isRequired && !specific.value.trim();
                  const suggestedValues = requiredSpecifics.find(r => r.name.toLowerCase() === specific.name.toLowerCase())?.values;
                  return (
                    <div key={index} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className={cn(
                        "md:w-32 flex-shrink-0 text-sm flex items-center gap-1",
                        isMissing ? "text-coral-600 font-medium" : isRequired ? "text-slate-700" : "text-slate-500"
                      )}>
                        {specific.name}:
                        {isRequired && <span className="text-coral-500 text-xs" title="Required by eBay">*</span>}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        {suggestedValues && suggestedValues.length > 0 && suggestedValues.length <= 30 ? (
                          <select
                            value={specific.value}
                            onChange={(e) => handleUpdateSpecific(index, e.target.value)}
                            className={cn(
                              "flex-1 px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-500/20 focus:border-ink-500 transition-colors min-h-[44px]",
                              isMissing ? "border-coral-300 bg-coral-50 text-slate-800" : "border-slate-300 text-slate-800"
                            )}
                          >
                            <option value="">— Select —</option>
                            {suggestedValues.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={specific.value}
                            onChange={(e) => handleUpdateSpecific(index, e.target.value)}
                            placeholder={isMissing ? 'Required — fill before pushing to eBay' : ''}
                            className={cn(
                              "flex-1 px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-500/20 focus:border-ink-500 transition-colors min-h-[44px]",
                              isMissing ? "border-coral-300 bg-coral-50 text-slate-800 placeholder:text-coral-400" : "border-slate-300 text-slate-800"
                            )}
                          />
                        )}
                        <button
                          onClick={() => handleRemoveSpecific(index)}
                          className="text-slate-400 hover:text-coral-500 p-1 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Specific Modal */}
          {showAddSpecificModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
              <div className="card p-6 w-full max-w-sm animate-slide-up">
                <h3 className="font-semibold text-slate-900 mb-4">Add Item Specific</h3>
                <div className="space-y-3">
                  {/* Quick-add buttons for missing required specifics */}
                  {(() => {
                    const currentNames = new Set(item.itemSpecifics.map(s => s.name.toLowerCase()));
                    const missingRequired = requiredSpecifics.filter(r => !currentNames.has(r.name.toLowerCase()));
                    return missingRequired.length > 0 ? (
                      <div>
                        <label className="block text-xs font-medium text-coral-600 mb-1">Required by eBay:</label>
                        <div className="flex flex-wrap gap-1">
                          {missingRequired.slice(0, 10).map(req => (
                            <button
                              key={req.name}
                              onClick={() => setNewSpecific({ ...newSpecific, name: req.name })}
                              className="text-xs px-2 py-1 bg-coral-50 text-coral-700 border border-coral-200 rounded hover:bg-coral-100 transition-colors"
                            >
                              {req.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
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
            {renderContextNote('description')}
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
                {renderContextNote('pricing')}
              </div>

              {/* Shipping Card */}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Shipping & Policies</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shipping Policy</label>
                    <select
                      value={item.shippingProfileId || '323050634021'}
                      onChange={(e) => updateField('shippingProfileId', e.target.value)}
                      className="input w-full"
                    >
                      {SHIPPING_PROFILES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Return Policy</label>
                    <select
                      value={item.returnProfileId || '323050657021'}
                      onChange={(e) => updateField('returnProfileId', e.target.value)}
                      className="input w-full"
                    >
                      {RETURN_PROFILES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            value={item.weight ? Math.floor(item.weight / 16) : ''}
                            onChange={(e) => {
                              const lbs = parseInt(e.target.value) || 0;
                              const currentOz = (item.weight || 0) % 16;
                              updateField('weight', lbs * 16 + currentOz);
                            }}
                            className="input w-full pr-8"
                            min="0"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">lbs</span>
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            value={item.weight ? Math.round(item.weight % 16) : ''}
                            onChange={(e) => {
                              const oz = parseFloat(e.target.value) || 0;
                              const currentLbs = Math.floor((item.weight || 0) / 16);
                              updateField('weight', currentLbs * 16 + oz);
                            }}
                            className="input w-full pr-7"
                            min="0"
                            max="15"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">oz</span>
                        </div>
                      </div>
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
                {renderContextNote('shipping')}
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
                onClick={handleVerifyEbay}
                disabled={isVerifying || isSaving}
                className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                Verify
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
            <div className="flex items-center gap-3 flex-wrap">
              {item.ebayId ? (
                <>
                  <a
                    href={`https://www.ebay.com/itm/${item.ebayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-ink-600 text-white font-medium rounded-lg hover:bg-ink-700 transition-colors min-h-[44px]"
                  >
                    <ExternalLink size={18} />
                    View on eBay
                  </a>
                  <button
                    onClick={async () => {
                      if (hasChanges) await saveChanges();
                      setIsSaving(true);
                      try {
                        const result = await api.reviseEbayListing(item.id);
                        if ((result as any).success) {
                          setSuccessMessage('eBay listing updated');
                        } else {
                          setError((result as any).error || 'Failed to update');
                        }
                      } catch (err: any) {
                        setError(err?.response?.data?.error || 'Failed to update eBay listing');
                      }
                      setIsSaving(false);
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                    Update eBay
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="eBay Item ID or URL"
                    className="input text-sm py-2 w-64"
                    onKeyDown={async (e) => {
                      if (e.key !== 'Enter') return;
                      const val = (e.target as HTMLInputElement).value.trim();
                      const idMatch = val.match(/(\d{10,})/);
                      if (!idMatch) { setError('Enter a valid eBay item ID or URL'); return; }
                      const ebayId = idMatch[1];
                      try {
                        await api.updateDashboardItem(item.id, { ebayId });
                        updateField('ebayId', ebayId);
                        setSuccessMessage(`Linked to eBay item ${ebayId}`);
                        const fresh = await api.getDashboardItem(item.id);
                        if ((fresh as any).success) setItem((fresh as any).data);
                      } catch (err: any) {
                        setError(err?.response?.data?.error || 'Failed to save eBay ID');
                      }
                    }}
                  />
                  <span className="text-xs text-slate-400">Press Enter to link</span>
                </div>
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

        {/* Verify Result Panel */}
        {verifyResult && (
          <div className={cn('mt-3 p-3 rounded-lg border text-sm', verifyResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('font-semibold', verifyResult.valid ? 'text-green-700' : 'text-red-700')}>
                {verifyResult.valid ? 'Listing is valid — ready to push' : 'Listing has errors'}
              </span>
              <button onClick={() => setVerifyResult(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
            {verifyResult.errors.length > 0 && (
              <div className="space-y-2 mb-2">
                {verifyResult.errors.map((err, i) => {
                  // Parse "The item specific X is missing" to offer quick-add
                  const missingMatch = err.match(/item specific (\w[\w\s]*?) is missing/i);
                  const specificName = missingMatch?.[1]?.trim();
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <p className="text-red-600 text-xs flex-1">{err}</p>
                      {specificName && (
                        <button
                          onClick={() => {
                            setNewSpecific({ name: specificName, value: '' });
                            setShowAddSpecificModal(true);
                          }}
                          className="shrink-0 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          + Add {specificName}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {verifyResult.warnings.length > 0 && (
              <div className="space-y-1 mb-2">
                {verifyResult.warnings.map((warn, i) => (
                  <p key={i} className="text-amber-600 text-xs">{warn}</p>
                ))}
              </div>
            )}
            {verifyResult.fees.length > 0 && (
              <div className="text-xs text-slate-600">
                Fees: {verifyResult.fees.filter(f => parseFloat(f.amount) > 0).map(f => `${f.name}: $${f.amount}`).join(', ') || 'None'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
