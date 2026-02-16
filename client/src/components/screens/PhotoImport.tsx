import React, { useState, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface PhotoGroup {
  id: string;
  photos: File[];
}

export const PhotoImport: React.FC = () => {
  const [ungroupedPhotos, setUngroupedPhotos] = useState<File[]>([]);
  const [itemGroups, setItemGroups] = useState<PhotoGroup[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUngroupedPhotos((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const handleFolderImport = () => {
    folderInputRef.current?.click();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Filter for image files only
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/') &&
      /\.(jpe?g|png|webp)$/i.test(file.name)
    );

    if (imageFiles.length > 0) {
      setUngroupedPhotos(prev => [...prev, ...imageFiles]);
    }

    // Reset the input so the same folder can be selected again
    e.target.value = '';
  };

  const createEmptyGroup = () => {
    // If there are selected photos, use them; otherwise create empty group
    if (selectedPhotos.size > 0) {
      createNewGroup();
    } else {
      setItemGroups(prev => [
        ...prev,
        { id: `group-${Date.now()}`, photos: [] }
      ]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
  });

  const createNewGroup = () => {
    const selectedFiles = Array.from(selectedPhotos).map((index) => ungroupedPhotos[index]);
    if (selectedFiles.length === 0) return;

    setItemGroups((prev) => [
      ...prev,
      { id: `group-${Date.now()}`, photos: selectedFiles },
    ]);
    setUngroupedPhotos((prev) =>
      prev.filter((_, index) => !selectedPhotos.has(index))
    );
    setSelectedPhotos(new Set());
  };

  const addToGroup = (groupId: string) => {
    const selectedFiles = Array.from(selectedPhotos).map((index) => ungroupedPhotos[index]);
    if (selectedFiles.length === 0) return;

    setItemGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, photos: [...group.photos, ...selectedFiles] }
          : group
      )
    );
    setUngroupedPhotos((prev) =>
      prev.filter((_, index) => !selectedPhotos.has(index))
    );
    setSelectedPhotos(new Set());
  };

  const removeFromGroup = (groupId: string, photoIndex: number) => {
    setItemGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const photo = group.photos[photoIndex];
        setUngroupedPhotos((p) => [...p, photo]);
        return {
          ...group,
          photos: group.photos.filter((_, i) => i !== photoIndex),
        };
      })
    );
  };

  const deleteGroup = (groupId: string) => {
    const group = itemGroups.find((g) => g.id === groupId);
    if (group) {
      setUngroupedPhotos((prev) => [...prev, ...group.photos]);
    }
    setItemGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const autoGroup = async () => {
    // In real implementation, this would call AI to suggest groupings
    // For demo, we'll just group every 3-4 photos together
    const groups: PhotoGroup[] = [];
    const photos = [...ungroupedPhotos];

    while (photos.length > 0) {
      const groupSize = Math.min(3 + Math.floor(Math.random() * 2), photos.length);
      groups.push({
        id: `group-${Date.now()}-${groups.length}`,
        photos: photos.splice(0, groupSize),
      });
    }

    setItemGroups((prev) => [...prev, ...groups]);
    setUngroupedPhotos([]);
  };

  const processItems = async () => {
    setIsProcessing(true);
    // In real implementation, this would create items and start AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // Navigate to queue
  };

  const togglePhotoSelection = (index: number) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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
        <button
          onClick={handleFolderImport}
          className="btn-secondary"
        >
          <FolderOpen size={18} />
          Import Folder
        </button>
      </div>

      {/* Drop Zone */}
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
          Supports JPG, PNG, WebP
        </p>
      </div>

      {/* Photo Grouping Section */}
      <div className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-4">Photo Grouping</h2>

        {/* Ungrouped Photos */}
        {ungroupedPhotos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">
                Ungrouped ({ungroupedPhotos.length} photos)
              </h3>
              <div className="flex gap-2">
                {selectedPhotos.size > 0 && (
                  <button
                    onClick={createNewGroup}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-600 text-white text-sm rounded-lg hover:bg-ink-700 transition-colors"
                  >
                    <Plus size={16} />
                    New Group ({selectedPhotos.size})
                  </button>
                )}
                <button
                  onClick={autoGroup}
                  className="btn-secondary text-sm py-1.5"
                >
                  <Wand2 size={16} />
                  Auto-Group
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ungroupedPhotos.map((photo, index) => (
                <div
                  key={index}
                  onClick={() => togglePhotoSelection(index)}
                  className={cn(
                    'relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors',
                    selectedPhotos.has(index)
                      ? 'border-ink-500'
                      : 'border-transparent hover:border-slate-300'
                  )}
                >
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedPhotos.has(index) && (
                    <div className="absolute inset-0 bg-ink-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-ink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Item Groups */}
        {itemGroups.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Item Groups ({itemGroups.length} items created)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemGroups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-800">
                      Item #{groupIndex + 1} ({group.photos.length} photos)
                    </span>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="text-slate-400 hover:text-coral-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.photos.map((photo, photoIndex) => (
                      <div
                        key={photoIndex}
                        className="relative w-14 h-14 rounded-lg overflow-hidden group"
                      >
                        <img
                          src={URL.createObjectURL(photo)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFromGroup(group.id, photoIndex)}
                          className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {selectedPhotos.size > 0 && (
                      <button
                        onClick={() => addToGroup(group.id)}
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

        {ungroupedPhotos.length === 0 && itemGroups.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Image size={48} className="mx-auto mb-2 text-slate-300" />
            <p>No photos imported yet</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {itemGroups.length > 0 && (
        <div className="flex items-center justify-between card p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={createEmptyGroup}
              className="btn-secondary"
            >
              <Plus size={18} />
              New Item Group
            </button>
            <span className="text-slate-500 text-sm">
              Selected: {selectedPhotos.size} photos
            </span>
          </div>
          <button
            onClick={processItems}
            disabled={isProcessing}
            className="btn-primary disabled:opacity-50"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                Create Items & Process AI
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
