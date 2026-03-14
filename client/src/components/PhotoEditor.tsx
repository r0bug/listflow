import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, RotateCw, Sun, Contrast, Loader2 } from 'lucide-react';
import api from '../api/client';

interface PhotoEditorProps {
  photoUrl: string;
  photoId: string;
  itemId: string;
  onSave: () => void;
  onClose: () => void;
}

const ASPECT_OPTIONS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photoUrl,
  photoId,
  itemId,
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
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBrightness(1.0);
    setContrast(1.0);
    setAspectIndex(0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const edits: Record<string, unknown> = {};

      if (croppedAreaPixels && (croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0)) {
        edits.crop = croppedAreaPixels;
      }
      if (brightness !== 1.0) edits.brightness = brightness;
      if (contrast !== 1.0) edits.contrast = contrast;
      if (rotation !== 0) edits.rotation = rotation;

      await api.editPhoto(itemId, photoId, edits as any);
      onSave();
    } catch (err) {
      console.error('Failed to save photo edit:', err);
    }
    setIsSaving(false);
  };

  const aspect = ASPECT_OPTIONS[aspectIndex].value;

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
          disabled={isSaving}
          className="px-4 py-1.5 bg-ink-500 hover:bg-ink-600 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 relative min-h-0">
        <Cropper
          image={photoUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
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
        {/* Rotate + Aspect */}
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
              onClick={() => setAspectIndex((i) => (i + 1) % ASPECT_OPTIONS.length)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              {ASPECT_OPTIONS[aspectIndex].label}
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
            onChange={(e) => setZoom(Number(e.target.value))}
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

        {/* Reset */}
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
