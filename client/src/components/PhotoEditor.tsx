import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, RotateCw, Sun, Contrast, Loader2, Copy, Maximize } from 'lucide-react';
import api from '../api/client';

interface PhotoEditorProps {
  photoUrl: string;
  photoId: string;
  itemId: string;
  allPhotos: { id: string; url: string; fullUrl?: string; isPrimary: boolean }[];
  onSave: () => void;
  onClose: () => void;
}

const ASPECT_OPTIONS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

const SCALE_OPTIONS = [
  { label: 'Original', value: 0 },
  { label: '1600px', value: 1600 },
  { label: '1200px', value: 1200 },
  { label: '800px', value: 800 },
  { label: '600px', value: 600 },
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photoUrl,
  photoId,
  itemId,
  allPhotos,
  onSave,
  onClose,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [aspectIndex, setAspectIndex] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingToAll, setApplyingToAll] = useState(false);

  // Track if user manually adjusted the crop (zoom, pan, or aspect change)
  const userCropped = useRef(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
    // Only mark as user-cropped if they actually moved the crop (not just the initial auto-position)
    if (newCrop.x !== 0 || newCrop.y !== 0) {
      userCropped.current = true;
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (newZoom !== 1) {
      userCropped.current = true;
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAspectChange = () => {
    const newIndex = (aspectIndex + 1) % ASPECT_OPTIONS.length;
    setAspectIndex(newIndex);
    if (newIndex !== 0) {
      userCropped.current = true;
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBrightness(1.0);
    setContrast(1.0);
    setAspectIndex(0);
    setScaleIndex(0);
    setError(null);
    userCropped.current = false;
  };

  const buildEdits = () => {
    const edits: Record<string, unknown> = {};
    // Only send crop if user explicitly cropped/zoomed/changed aspect
    if (userCropped.current && croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
      edits.crop = croppedAreaPixels;
    }
    if (brightness !== 1.0) edits.brightness = brightness;
    if (contrast !== 1.0) edits.contrast = contrast;
    if (rotation !== 0) edits.rotation = rotation;
    const maxSize = SCALE_OPTIONS[scaleIndex].value;
    if (maxSize > 0) edits.maxSize = maxSize;
    return edits;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const edits = buildEdits();
      const result = await api.editPhoto(itemId, photoId, edits as any);
      if (!(result as any).success) {
        setError((result as any).error || 'Save failed');
        setIsSaving(false);
        return;
      }
      onSave();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save photo edit';
      setError(msg);
      console.error('Failed to save photo edit:', err);
    }
    setIsSaving(false);
  };

  const handleApplyToAll = async () => {
    if (brightness === 1.0 && contrast === 1.0) return;

    const otherPhotos = allPhotos.filter(p => p.id !== photoId);
    if (otherPhotos.length === 0) return;

    if (!window.confirm(`Apply brightness (${brightness.toFixed(2)}) and contrast (${contrast.toFixed(2)}) to ${otherPhotos.length} other photo(s)?`)) return;

    setApplyingToAll(true);
    setError(null);

    const edits: Record<string, unknown> = {};
    if (brightness !== 1.0) edits.brightness = brightness;
    if (contrast !== 1.0) edits.contrast = contrast;

    let failed = 0;
    for (const photo of otherPhotos) {
      try {
        await api.editPhoto(itemId, photo.id, edits as any);
      } catch {
        failed++;
      }
    }

    setApplyingToAll(false);
    if (failed > 0) {
      setError(`Applied to ${otherPhotos.length - failed} photos, ${failed} failed`);
    } else {
      // Save current photo too, then close
      await handleSave();
    }
  };

  const aspect = ASPECT_OPTIONS[aspectIndex].value;
  const hasBrightnessContrastChanges = brightness !== 1.0 || contrast !== 1.0;
  const otherPhotoCount = allPhotos.filter(p => p.id !== photoId).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <X size={20} />
        </button>
        <span className="font-semibold text-sm">Edit Photo</span>
        <button
          onClick={handleSave}
          disabled={isSaving || applyingToAll}
          className="px-4 py-1.5 bg-ink-500 hover:bg-ink-600 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-900/80 text-red-200 text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Crop area */}
      <div className="flex-1 relative min-h-0">
        <Cropper
          image={photoUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={handleCropChange}
          onZoomChange={handleZoomChange}
          onCropComplete={onCropComplete}
          style={{
            mediaStyle: {
              filter: `brightness(${brightness}) contrast(${contrast})`,
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-slate-900 text-white px-4 py-4 space-y-3 shrink-0">
        {/* Rotate + Aspect + Scale */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleRotate}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            <RotateCw size={16} />
            Rotate
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Aspect:</span>
            <button
              onClick={handleAspectChange}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              {ASPECT_OPTIONS[aspectIndex].label}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Maximize size={14} className="text-slate-400" />
            <button
              onClick={() => setScaleIndex((i) => (i + 1) % SCALE_OPTIONS.length)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              {SCALE_OPTIONS[scaleIndex].label}
            </button>
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-16">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-ink-500"
          />
          <span className="text-xs text-slate-300 w-10 text-right">{zoom.toFixed(1)}x</span>
        </div>

        {/* Brightness */}
        <div className="flex items-center gap-3">
          <Sun size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 w-12">Bright</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1 accent-ink-500"
          />
          <span className="text-xs text-slate-300 w-10 text-right">{brightness.toFixed(2)}</span>
        </div>

        {/* Contrast */}
        <div className="flex items-center gap-3">
          <Contrast size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 w-12">Contrast</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="flex-1 accent-ink-500"
          />
          <span className="text-xs text-slate-300 w-10 text-right">{contrast.toFixed(2)}</span>
        </div>

        {/* Apply to all + Reset */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Reset All
          </button>
          {hasBrightnessContrastChanges && otherPhotoCount > 0 && (
            <button
              onClick={handleApplyToAll}
              disabled={applyingToAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-600 hover:bg-ink-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {applyingToAll ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
              Apply to all {otherPhotoCount} photos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
