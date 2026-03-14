import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Upload } from 'lucide-react';

interface MobilePhotoCaptureProps {
  itemId?: string;
  onPhotoCaptured: (file: File) => void;
  onComplete?: () => void;
}

export const MobilePhotoCapture: React.FC<MobilePhotoCaptureProps> = ({
  itemId,
  onPhotoCaptured,
  onComplete
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (currentPhoto) URL.revokeObjectURL(currentPhoto);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File(
              [blob],
              `photo-${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );
            const url = URL.createObjectURL(blob);
            if (currentPhoto) URL.revokeObjectURL(currentPhoto);
            setCurrentPhoto(url);
            setCapturedPhotos(prev => [...prev, file]);
            setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
            onPhotoCaptured(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Handle file input for fallback
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        setCapturedPhotos(prev => [...prev, file]);
        setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
        onPhotoCaptured(file);
      });
    }
  };

  // Remove a captured photo
  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Complete and move to next item
  const handleComplete = async () => {
    if (onComplete) {
      onComplete();
    }
    stopCamera();
    setCapturedPhotos([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  return (
    <div className="space-y-4">
      {itemId && (
        <p className="text-sm text-slate-500">Item: {itemId}</p>
      )}

      {/* Camera View */}
      {isCapturing ? (
        <div className="relative rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-[4/3] object-cover bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="p-3 bg-coral-500 text-white rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={capturePhoto}
                className="p-4 bg-white rounded-full min-w-[56px] min-h-[56px] flex items-center justify-center"
              >
                <Camera className="w-8 h-8 text-black" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Start Camera Button */}
          <button
            onClick={startCamera}
            className="w-full py-4 bg-ink-600 text-white rounded-xl flex items-center justify-center gap-2 min-h-[48px] hover:bg-ink-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </button>

          {/* File Input Fallback */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">Or upload from device</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple

              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-2 mx-auto min-h-[44px] hover:bg-slate-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </button>
          </div>
        </div>
      )}

      {/* Preview Last Captured Photo */}
      {currentPhoto && !isCapturing && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Last Captured</h3>
          <img
            src={currentPhoto}
            alt="Last captured"
            className="w-full rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Captured Photos Grid */}
      {capturedPhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            Captured Photos ({capturedPhotos.length})
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {capturedPhotos.map((_, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={previewUrls[index]}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1.5 bg-coral-500 text-white rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={startCamera}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center gap-2 min-h-[48px] hover:bg-slate-200 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Add More
            </button>
            {onComplete && (
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-sage-600 text-white rounded-lg flex items-center justify-center gap-2 min-h-[48px] hover:bg-sage-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
