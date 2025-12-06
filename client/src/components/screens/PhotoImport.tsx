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
    <div className="space-y-6">
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
        <h1 className="text-2xl font-bold text-gray-900">Import Photos</h1>
        <button
          onClick={handleFolderImport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <FolderOpen size={18} />
          Import Folder
        </button>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the photos here...'
            : 'Drag & drop photos here, or click to select'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Supports JPG, PNG, WebP
        </p>
      </div>

      {/* Photo Grouping Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Photo Grouping</h2>

        {/* Ungrouped Photos */}
        {ungroupedPhotos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Ungrouped ({ungroupedPhotos.length} photos)
              </h3>
              <div className="flex gap-2">
                {selectedPhotos.size > 0 && (
                  <button
                    onClick={createNewGroup}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    New Group ({selectedPhotos.size})
                  </button>
                )}
                <button
                  onClick={autoGroup}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-sm rounded hover:bg-gray-50"
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
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  )}
                >
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedPhotos.has(index) && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Item Groups ({itemGroups.length} items created)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemGroups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      Item #{groupIndex + 1} ({group.photos.length} photos)
                    </span>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.photos.map((photo, photoIndex) => (
                      <div
                        key={photoIndex}
                        className="relative w-14 h-14 rounded overflow-hidden group"
                      >
                        <img
                          src={URL.createObjectURL(photo)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFromGroup(group.id, photoIndex)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {selectedPhotos.size > 0 && (
                      <button
                        onClick={() => addToGroup(group.id)}
                        className="w-14 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"
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
          <div className="text-center py-8 text-gray-500">
            <Image size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No photos imported yet</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {itemGroups.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={createEmptyGroup}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Plus size={18} />
              New Item Group
            </button>
            <span className="text-gray-500">
              Selected: {selectedPhotos.size} photos
            </span>
          </div>
          <button
            onClick={processItems}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
