import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const startCamera = async (facing: 'user' | 'environment') => {
    stopCamera();
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream is not supported in this browser. You can upload a photo instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setIsCameraActive(false);
      setErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. You can select a photo from your device!'
          : 'Could not access camera. Please choose a photo from your device.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPhoto]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      id="kids-camera-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Modal Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Smile & Snap! 📸</h3>
              <p className="text-xs text-slate-300">Take a picture of your day</p>
            </div>
          </div>
          <button
            id="btn-close-camera-modal"
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewfinder or Preview */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-white/10 flex items-center justify-center shadow-inner">
          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />

              {!isCameraActive && (
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                  <AlertCircle className="w-12 h-12 text-amber-400" />
                  <p className="text-sm text-slate-300 max-w-sm">
                    {errorMsg || 'Starting camera viewfinder...'}
                  </p>
                  <button
                    id="btn-camera-upload-fallback"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo from Device</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Controls Bar */}
        <div className="w-full flex items-center justify-between mt-5 px-2">
          {capturedPhoto ? (
            <>
              <button
                id="btn-camera-retake"
                type="button"
                onClick={retake}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                id="btn-camera-confirm"
                type="button"
                onClick={confirmPhoto}
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>Use This Photo! 🌟</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-camera-choose-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>

              {/* Big Shutter Button */}
              <button
                id="btn-camera-snap"
                type="button"
                onClick={snapPhoto}
                disabled={!isCameraActive}
                className="w-16 h-16 rounded-full bg-white text-indigo-900 border-4 border-indigo-400 flex items-center justify-center shadow-xl transform active:scale-90 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Take Picture"
              >
                <Camera className="w-8 h-8 text-indigo-600" />
              </button>

              <button
                id="btn-camera-switch-lens"
                type="button"
                onClick={switchCamera}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
