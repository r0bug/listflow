import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FolderOpen,
  Image,
  Plus,
  X,
  Wand2,
  Trash2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobilePhotoCapture } from '../MobilePhotoCapture';
import api from '../../api/client';

interface PooledPhoto {
  id: string;
  originalPath: string;
  thumbnailPath: string | null;
  filename: string;
  groupTag: string | null;
  createdAt: string;
}

interface PhotoGroup {
  tag: string;
  photos: PooledPhoto[];
}

export const PhotoImport: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [ungroupedPhotos, setUngroupedPhotos] = useState<PooledPhoto[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [queueItems, setQueueItems] = useState<{ id: string; title: string; thumbnail?: string }[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Load pool data from server
  const loadPool = useCallback(async () => {
    try {
      const [photosRes, groupsRes] = await Promise.all([
        api.getPoolPhotos(),
        api.getPoolGroups(),
      ]);

      if (photosRes.success) {
        setUngroupedPhotos(photosRes.data as PooledPhoto[]);
      }

      if (groupsRes.success) {
        const groupData = groupsRes.data as Record<string, PooledPhoto[]>;
        setGroups(
          Object.entries(groupData).map(([tag, photos]) => ({ tag, photos }))
        );
      }
    } catch (error) {
      console.error('Failed to load pool:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  // Upload files to the server pool
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const result = await api.uploadToPool(files);
      if (result.success) {
        setUngroupedPhotos((prev) => [...prev, ...(result.data as PooledPhoto[])]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setIsUploading(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles);
  }, []);

  const handleFolderImport = () => {
    folderInputRef.current?.click();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') && /\.(jpe?g|png|webp)$/i.test(file.name)
    );
    if (imageFiles.length > 0) uploadFiles(imageFiles);
    e.target.value = '';
  };

  const handleMobilePhotoCaptured = (file: File) => {
    uploadFiles([file]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  });

  // Selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create a new group from selected photos
  const createNewGroup = async () => {
    const selected = ungroupedPhotos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;

    const groupTag = `group-${Date.now()}`;
    try {
      const result = await api.groupPoolPhotos(
        selected.map((p) => p.id),
        groupTag
      );
      if (result.success) {
        setGroups((prev) => [...prev, { tag: groupTag, photos: selected }]);
        setUngroupedPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  // Create empty group
  const createEmptyGroup = () => {
    if (selectedIds.size > 0) {
      createNewGroup();
    } else {
      const groupTag = `group-${Date.now()}`;
      setGroups((prev) => [...prev, { tag: groupTag, photos: [] }]);
    }
  };

  // Add selected photos to existing group
  const addToGroup = async (groupTag: string) => {
    const selected = ungroupedPhotos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;

    try {
      const result = await api.groupPoolPhotos(
        selected.map((p) => p.id),
        groupTag
      );
      if (result.success) {
        setGroups((prev) =>
          prev.map((g) =>
            g.tag === groupTag ? { ...g, photos: [...g.photos, ...selected] } : g
          )
        );
        setUngroupedPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Failed to add to group:', error);
    }
  };

  // Remove photo from group (back to ungrouped)
  const removeFromGroup = async (groupTag: string, photo: PooledPhoto) => {
    try {
      const result = await api.ungroupPoolPhotos([photo.id]);
      if (result.success) {
        setUngroupedPhotos((prev) => [...prev, { ...photo, groupTag: null }]);
        setGroups((prev) =>
          prev.map((g) =>
            g.tag === groupTag
              ? { ...g, photos: g.photos.filter((p) => p.id !== photo.id) }
              : g
          )
        );
      }
    } catch (error) {
      console.error('Failed to remove from group:', error);
    }
  };

  // Delete a group (photos go back to ungrouped)
  const deleteGroup = async (groupTag: string) => {
    const group = groups.find((g) => g.tag === groupTag);
    if (!group) return;

    try {
      const result = await api.deletePoolGroup(groupTag);
      if (result.success) {
        setUngroupedPhotos((prev) => [
          ...prev,
          ...group.photos.map((p) => ({ ...p, groupTag: null })),
        ]);
        setGroups((prev) => prev.filter((g) => g.tag !== groupTag));
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  // Delete a single ungrouped photo permanently
  const deletePhoto = async (photo: PooledPhoto) => {
    try {
      const result = await api.deletePoolPhoto(photo.id);
      if (result.success) {
        setUngroupedPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  // Auto-group: randomly group ungrouped photos
  const autoGroup = async () => {
    const photos = [...ungroupedPhotos];
    if (photos.length === 0) return;

    const newGroups: { tag: string; photos: PooledPhoto[] }[] = [];
    let idx = 0;

    while (photos.length > 0) {
      const groupSize = Math.min(3 + Math.floor(Math.random() * 2), photos.length);
      const batch = photos.splice(0, groupSize);
      const tag = `group-${Date.now()}-${idx++}`;
      newGroups.push({ tag, photos: batch });
    }

    // Save all groups to server
    try {
      await Promise.all(
        newGroups.map((g) =>
          api.groupPoolPhotos(
            g.photos.map((p) => p.id),
            g.tag
          )
        )
      );
      setGroups((prev) => [...prev, ...newGroups]);
      setUngroupedPhotos([]);
    } catch (error) {
      console.error('Auto-group failed:', error);
    }
  };

  const processItems = async () => {
    if (groups.length === 0) return;
    setIsProcessing(true);
    setProcessStatus(`Creating ${groups.length} item(s) and running AI analysis...`);

    try {
      const groupTags = groups.map((g) => g.tag);
      const result = await api.createItemsFromPool(groupTags);

      if (result.success) {
        const { totalCreated, totalErrors, errors } = result.data;
        if (totalErrors > 0) {
          setProcessStatus(
            `Created ${totalCreated} item(s). ${totalErrors} failed: ${errors.map((e) => e.error).join(', ')}`
          );
          // Reload pool to show remaining groups
          await loadPool();
        } else {
          setProcessStatus(`Successfully created ${totalCreated} item(s)!`);
          setGroups([]);
          // Navigate to queue after brief delay
          setTimeout(() => navigate('/queue'), 1500);
        }
      } else {
        setProcessStatus('Failed to create items. Please try again.');
      }
    } catch (error: any) {
      console.error('Process items failed:', error);
      setProcessStatus(`Error: ${error.message || 'Failed to create items'}`);
    }
    setIsProcessing(false);
  };

  const loadQueueItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch('/api/dashboard/queue');
      const data = await response.json();
      if (data.success) {
        const allItems = [
          ...(data.data.identify || []),
          ...(data.data.review || []),
          ...(data.data.price || []),
          ...(data.data.ready || []),
        ];
        setQueueItems(allItems);
      }
    } catch (error) {
      console.error('Failed to load queue items:', error);
    }
    setIsLoadingItems(false);
  };

  const handleAddToExistingItem = async (itemId: string) => {
    const selected = Array.from(selectedIds);
    if (selected.length === 0) return;

    setIsProcessing(true);
    setProcessStatus('Attaching photos to item...');
    try {
      const result = await api.attachPoolPhotosToItem(selected, itemId);
      if (result.success) {
        setProcessStatus(`Attached ${selected.length} photo(s) to item`);
        setSelectedIds(new Set());
        setShowItemPicker(false);
        await loadPool();
        setTimeout(() => setProcessStatus(null), 2000);
      } else {
        setProcessStatus('Failed to attach photos');
      }
    } catch (error: any) {
      console.error('Failed to attach photos:', error);
      setProcessStatus(`Error: ${error.message || 'Failed to attach photos'}`);
    }
    setIsProcessing(false);
  };

  const getThumbUrl = (photo: PooledPhoto) =>
    photo.thumbnailPath || photo.originalPath;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-ink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        /* @ts-expect-error webkitdirectory is not in standard types */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
        accept="image/*"
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Import Photos</h1>
        <div className="flex items-center gap-2">
          {isUploading && (
            <span className="flex items-center gap-1.5 text-sm text-ink-600">
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </span>
          )}
          {!isMobile && (
            <button onClick={handleFolderImport} className="btn-secondary">
              <FolderOpen size={18} />
              Import Folder
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Camera Capture / Desktop: Drop Zone */}
      {isMobile ? (
        <div className="card p-4">
          <MobilePhotoCapture onPhotoCaptured={handleMobilePhotoCaptured} />
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            isDragActive
              ? 'border-ink-400 bg-ink-50'
              : 'border-slate-300 hover:border-slate-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">
            {isDragActive
              ? 'Drop the photos here...'
              : 'Drag & drop photos here, or click to select'}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Supports JPG, PNG, WebP — photos are saved to the server automatically
          </p>
        </div>
      )}

      {/* Photo Grouping Section */}
      <div className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-4">Photo Grouping</h2>

        {/* Ungrouped Photos */}
        {ungroupedPhotos.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-700">
                Ungrouped ({ungroupedPhotos.length} photos)
              </h3>
              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <>
                  <button
                    onClick={createNewGroup}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-600 text-white text-sm rounded-lg hover:bg-ink-700 transition-colors min-h-[36px]"
                  >
                    <Plus size={16} />
                    New Group ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => { setShowItemPicker(true); loadQueueItems(); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sage-600 text-white text-sm rounded-lg hover:bg-sage-700 transition-colors min-h-[36px]"
                  >
                    <ArrowRight size={16} />
                    Add to Item ({selectedIds.size})
                  </button>
                  </>
                )}
                <button
                  onClick={autoGroup}
                  className="btn-secondary text-sm py-1.5 min-h-[36px]"
                >
                  <Wand2 size={16} />
                  Auto-Group
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ungroupedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={cn(
                    'relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors group',
                    selectedIds.has(photo.id)
                      ? 'border-ink-500'
                      : 'border-transparent hover:border-slate-300'
                  )}
                >
                  <img
                    src={getThumbUrl(photo)}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    onClick={() => toggleSelection(photo.id)}
                  />
                  {selectedIds.has(photo.id) && (
                    <div
                      className="absolute inset-0 bg-ink-500/20 flex items-center justify-center"
                      onClick={() => toggleSelection(photo.id)}
                    >
                      <div className="w-6 h-6 bg-ink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo);
                    }}
                    className="absolute top-0.5 right-0.5 p-1 bg-slate-900/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Item Groups */}
        {groups.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Item Groups ({groups.length} items created)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, groupIndex) => (
                <div
                  key={group.tag}
                  className="border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-800">
                      Item #{groupIndex + 1} ({group.photos.length} photos)
                    </span>
                    <button
                      onClick={() => deleteGroup(group.tag)}
                      className="text-slate-400 hover:text-coral-500 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative w-14 h-14 rounded-lg overflow-hidden group"
                      >
                        <img
                          src={getThumbUrl(photo)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFromGroup(group.tag, photo)}
                          className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => addToGroup(group.tag)}
                        className="w-14 h-14 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:border-ink-500 hover:text-ink-500 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ungroupedPhotos.length === 0 && groups.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Image size={48} className="mx-auto mb-2 text-slate-300" />
            <p>No photos imported yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Photos you upload are saved and will persist across sessions
            </p>
          </div>
        )}
      </div>

      {/* Status Message */}
      {processStatus && (
        <div className={cn(
          'card p-3 text-sm font-medium animate-fade-in',
          processStatus.includes('Error') || processStatus.includes('failed')
            ? 'bg-coral-50 text-coral-700 border-coral-200'
            : processStatus.includes('Successfully')
              ? 'bg-sage-50 text-sage-700 border-sage-200'
              : 'bg-ink-50 text-ink-700 border-ink-200'
        )}>
          {isProcessing && <Loader2 size={16} className="inline animate-spin mr-2" />}
          {processStatus}
        </div>
      )}

      {/* Action Bar */}
      {groups.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
          <div className="flex items-center gap-4">
            <button onClick={createEmptyGroup} className="btn-secondary min-h-[44px]" disabled={isProcessing}>
              <Plus size={18} />
              New Item Group
            </button>
            <span className="text-slate-500 text-sm">
              Selected: {selectedIds.size} photos
            </span>
          </div>
          <button
            onClick={processItems}
            disabled={isProcessing || groups.every((g) => g.photos.length === 0)}
            className="btn-primary disabled:opacity-50 min-h-[44px]"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Create Items & Process AI
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-md max-h-[80vh] overflow-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Add to Existing Item</h3>
              <button onClick={() => setShowItemPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="input w-full mb-3"
              autoFocus
            />
            {isLoadingItems ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-ink-600" />
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-auto">
                {queueItems
                  .filter(item => !itemSearchQuery || item.title.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddToExistingItem(item.id)}
                      disabled={isProcessing}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink-50 transition-colors flex items-center gap-3"
                    >
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                          <Image size={16} className="text-slate-400" />
                        </div>
                      )}
                      <span className="text-sm text-slate-800 truncate">{item.title}</span>
                    </button>
                  ))}
                {queueItems.length === 0 && (
                  <p className="text-center py-4 text-slate-500 text-sm">No items found</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
