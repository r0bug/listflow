import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Plus, X, FolderPlus, Image, Check, ArrowLeft, Download } from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

type Mode = 'menu' | 'new-item' | 'pool';

interface QueuedPhoto {
  id: string;
  file: File;
  preview: string;
}

export default function Snap() {
  const [mode, setMode] = useState<Mode>('menu');
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);

  // Check auth on mount (token may be in localStorage but isAuthenticated defaults false)
  useEffect(() => {
    checkAuth().finally(() => setAuthChecking(false));
  }, [checkAuth]);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const addPhotos = useCallback((files: FileList | File[]) => {
    const newPhotos: QueuedPhoto[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    setResult(null);
  }, []);

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (photos.length === 0) return;
    setUploading(true);
    setResult(null);
    setProgress({ done: 0, total: photos.length });

    try {
      const files = photos.map((p) => p.file);

      if (mode === 'pool') {
        // Upload all to pool in one batch
        await api.uploadToPool(files);
        setProgress({ done: files.length, total: files.length });
        setResult({ success: true, message: `${files.length} photo${files.length > 1 ? 's' : ''} added to pool` });
      } else {
        // New item: upload to pool, group, then create item (no AI)
        const uploadRes = await api.uploadToPool(files);
        setProgress({ done: Math.ceil(files.length / 2), total: files.length });

        // Group and create item
        const poolPhotos = (uploadRes as any).data || [];
        if (poolPhotos.length > 0) {
          const groupTag = `snap-${Date.now()}`;
          const photoIds = poolPhotos.map((p: any) => p.id);
          await api.groupPoolPhotos(photoIds, groupTag);
          await api.createItemsFromPool([groupTag], true); // skipAi = true
          setProgress({ done: files.length, total: files.length });
          setResult({ success: true, message: `Item created with ${files.length} photo${files.length > 1 ? 's' : ''}` });
        }
      }

      // Clear photos after success
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed';
      setResult({ success: false, message: msg });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setResult(null);
    setMode('menu');
  };

  // Loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
          <Camera className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">ListFlow Snap</h1>
        <p className="text-slate-400 mb-6 text-center">Sign in to start uploading photos</p>
        <button onClick={() => navigate('/login?returnTo=/snap')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium text-lg active:bg-blue-700">
          Sign In
        </button>
      </div>
    );
  }

  // Mode selection menu
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col text-white">
        {/* Header */}
        <div className="safe-top px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">ListFlow Snap</h1>
              <p className="text-xs text-slate-400">{user?.name || 'User'}</p>
            </div>
          </div>
          {installPrompt && (
            <button onClick={handleInstall} className="flex items-center gap-1.5 bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium active:bg-blue-600/30">
              <Download className="w-4 h-4" />
              Install
            </button>
          )}
        </div>

        {/* Mode buttons */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <button
            onClick={() => setMode('new-item')}
            className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center gap-4 active:bg-slate-700 transition-colors"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold">New Item</h2>
              <p className="text-sm text-slate-400">Select photos for a new listing item</p>
            </div>
          </button>

          <button
            onClick={() => setMode('pool')}
            className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center gap-4 active:bg-slate-700 transition-colors"
          >
            <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <FolderPlus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold">Photo Pool</h2>
              <p className="text-sm text-slate-400">Upload photos to group later</p>
            </div>
          </button>
        </div>

        {/* Footer link to full app */}
        <div className="px-6 pb-8 text-center">
          <button onClick={() => navigate('/')} className="text-slate-500 text-sm underline">
            Open full ListFlow
          </button>
        </div>
      </div>
    );
  }

  // Upload screen (shared for both modes)
  const modeLabel = mode === 'new-item' ? 'New Item' : 'Photo Pool';
  const accentBg = mode === 'new-item' ? 'bg-blue-600' : 'bg-emerald-600';
  const accentText = mode === 'new-item' ? 'text-blue-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-white">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-800">
        <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">{modeLabel}</h1>
          <p className="text-xs text-slate-400">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        {photos.length > 0 && !uploading && (
          <button onClick={handleUpload} className={`${accentBg} px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-1.5 active:opacity-80`}>
            <Upload className="w-4 h-4" />
            Upload
          </button>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mx-4 mt-3 p-3 rounded-xl flex items-center gap-2 text-sm ${result.success ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
          {result.success ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          <span>{result.message}</span>
          {result.success && (
            <button onClick={reset} className="ml-auto text-xs underline opacity-70">
              Done
            </button>
          )}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mx-4 mt-3 p-3 bg-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-300">Uploading...</span>
            <span className={accentText}>{progress.done}/{progress.total}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${accentBg} rounded-full transition-all duration-300`}
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {photos.length === 0 && !result ? (
          <button
            onClick={handleFileSelect}
            className="w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 active:border-slate-500 transition-colors"
          >
            <div className={`w-16 h-16 ${accentBg} rounded-2xl flex items-center justify-center opacity-80`}>
              <Image className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">Tap to select photos</p>
              <p className="text-slate-500 text-sm mt-1">Select multiple photos at once</p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-800">
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                {!uploading && (
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center active:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Add more button */}
            {!uploading && (
              <button
                onClick={handleFileSelect}
                className="aspect-square border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 active:border-slate-500"
              >
                <Plus className="w-6 h-6 text-slate-500" />
                <span className="text-xs text-slate-500">Add</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom upload bar (when photos exist) */}
      {photos.length > 0 && !uploading && !result && (
        <div className="px-4 pb-8 pt-3 border-t border-slate-800">
          <button
            onClick={handleUpload}
            className={`w-full ${accentBg} py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 active:opacity-80`}
          >
            <Upload className="w-5 h-5" />
            Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addPhotos(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
