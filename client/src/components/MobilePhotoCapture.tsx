import React, { useState, useRef } from 'react';
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
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
    setCurrentPhoto(null);
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
            setCurrentPhoto(URL.createObjectURL(blob));
            setCapturedPhotos(prev => [...prev, file]);
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
        onPhotoCaptured(file);
      });
    }
  };

  // Remove a captured photo
  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Complete and move to next item
  const handleComplete = async () => {
    if (onComplete) {
      onComplete();
    }
    stopCamera();
    setCapturedPhotos([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">Photo Capture</h1>
          {itemId && (
            <p className="text-sm text-gray-600">Item: {itemId}</p>
          )}
        </div>
      </div>

      {/* Camera View */}
      {isCapturing ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[60vh] object-cover bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="p-3 bg-red-500 text-white rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={capturePhoto}
                className="p-4 bg-white rounded-full"
              >
                <Camera className="w-8 h-8 text-black" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {/* Start Camera Button */}
          <button
            onClick={startCamera}
            className="w-full py-4 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 mb-4"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </button>

          {/* File Input Fallback */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">Or upload from device</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </button>
          </div>
        </div>
      )}

      {/* Preview Last Captured Photo */}
      {currentPhoto && !isCapturing && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Last Captured</h3>
          <img 
            src={currentPhoto} 
            alt="Last captured" 
            className="w-full rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Captured Photos Grid */}
      {capturedPhotos.length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Captured Photos ({capturedPhotos.length})
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-2">
          {!isCapturing && capturedPhotos.length > 0 && (
            <>
              <button
                onClick={startCamera}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Add More
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Complete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};