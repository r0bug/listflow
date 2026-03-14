import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface Photo {
  id: string;
  url: string;
  fullUrl?: string;
  isPrimary: boolean;
  order?: number;
}

interface SortablePhotoStripProps {
  photos: Photo[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onReorder: (photoIds: string[]) => void;
  onSetPrimary: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onEdit: (photoId: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
}

interface SortableThumbProps {
  photo: Photo;
  index: number;
  isSelected: boolean;
  showActions: boolean;
  onSelect: () => void;
  onToggleActions: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirst: boolean;
  isLast: boolean;
  isMobile: boolean;
}

const SortableThumb: React.FC<SortableThumbProps> = ({
  photo,
  index,
  isSelected,
  showActions,
  onSelect,
  onToggleActions,
  onSetPrimary,
  onDelete,
  onEdit,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
  isMobile,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group shrink-0"
    >
      <button
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault();
          onToggleActions();
        }}
        {...(isMobile ? {} : { ...attributes, ...listeners })}
        className={cn(
          'w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 transition-all overflow-hidden relative',
          isSelected
            ? 'border-ink-500 shadow-sm'
            : 'border-transparent hover:border-slate-300'
        )}
      >
        {photo.url ? (
          <img src={photo.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-slate-500">{index + 1}</span>
        )}
        {photo.isPrimary && (
          <div className="absolute top-0.5 left-0.5">
            <Star size={12} className="text-amber-400 fill-amber-400" />
          </div>
        )}
      </button>

      {/* Action overlay */}
      {showActions && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800 rounded-lg px-1.5 py-1 shadow-lg z-10">
          <button
            onClick={onSetPrimary}
            className="p-1 hover:bg-slate-700 rounded text-amber-400"
            title="Set as primary"
          >
            <Star size={12} />
          </button>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-slate-700 rounded text-white"
            title="Edit photo"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-slate-700 rounded text-red-400"
            title="Delete photo"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Mobile reorder arrows */}
      {isMobile && showActions && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800 rounded-lg px-1 py-0.5 shadow-lg z-10">
          <button
            onClick={onMoveLeft}
            disabled={isFirst}
            className="p-0.5 hover:bg-slate-700 rounded text-white disabled:opacity-30"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={onMoveRight}
            disabled={isLast}
            className="p-0.5 hover:bg-slate-700 rounded text-white disabled:opacity-30"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export const SortablePhotoStrip: React.FC<SortablePhotoStripProps> = ({
  photos,
  selectedIndex,
  onSelect,
  onReorder,
  onSetPrimary,
  onDelete,
  onEdit,
  onUpload,
  isMobile = false,
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onReorder(reordered.map((p) => p.id));
  };

  const handleMovePhoto = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((p) => p.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={photos.map((p) => p.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          className="flex gap-2 flex-wrap"
          onClick={(e) => {
            // Close action overlay when clicking outside
            if ((e.target as HTMLElement).closest('.relative.group')) return;
            setActiveActionId(null);
          }}
        >
          {photos.map((photo, index) => (
            <SortableThumb
              key={photo.id}
              photo={photo}
              index={index}
              isSelected={index === selectedIndex}
              showActions={activeActionId === photo.id}
              onSelect={() => {
                onSelect(index);
                setActiveActionId(null);
              }}
              onToggleActions={() =>
                setActiveActionId(activeActionId === photo.id ? null : photo.id)
              }
              onSetPrimary={() => {
                onSetPrimary(photo.id);
                setActiveActionId(null);
              }}
              onDelete={() => {
                onDelete(photo.id);
                setActiveActionId(null);
              }}
              onEdit={() => {
                onEdit(photo.id);
                setActiveActionId(null);
              }}
              onMoveLeft={() => handleMovePhoto(index, -1)}
              onMoveRight={() => handleMovePhoto(index, 1)}
              isFirst={index === 0}
              isLast={index === photos.length - 1}
              isMobile={isMobile}
            />
          ))}
          {/* Add photo button */}
          <label className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:border-ink-500 hover:text-ink-500 cursor-pointer transition-colors shrink-0">
            <Plus size={20} />
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={onUpload}
              className="hidden"
            />
          </label>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortablePhotoStrip;
