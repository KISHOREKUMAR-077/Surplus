import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  Thermometer,
  Box,
  X,
  SwitchCamera,
  Scan,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIScreeningResult, FoodCondition } from '../../types';
import { runAIScreening } from '../../services/aiScreening';
import { SAMPLE_FOOD_IMAGES } from '../../services/initialData';

interface CameraFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScreeningComplete: (result: AIScreeningResult) => void;
  stageTitle?: string;
  stage: 'donor' | 'pickup' | 'ngo_final';
  inspectorName: string;
  defaultFoodName?: string;
}

export const CameraFoodModal: React.FC<CameraFoodModalProps> = ({
  isOpen,
  onClose,
  onScreeningComplete,
  stageTitle = 'Stage 1: Donor AI Food Verification',
  stage,
  inspectorName,
  defaultFoodName = 'Surplus Food Batch',
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'samples'>('samples');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [screeningResult, setScreeningResult] = useState<AIScreeningResult | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedConditionOverride, setSelectedConditionOverride] = useState<FoodCondition | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing or switching mode
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setScreeningResult(null);
      setIsScanning(false);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setMode('camera');
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable on this device. You can upload an image or select a sample photo below.');
      setMode('samples');
    }
  };

  const handleCaptureFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      triggerScreening(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      triggerScreening(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sampleUrl: string, sampleName: string) => {
    setCapturedImage(sampleUrl);
    stopCamera();
    triggerScreening(sampleUrl, sampleName);
  };

  const triggerScreening = async (imageUrl: string, customName?: string) => {
    setIsScanning(true);
    setScreeningResult(null);

    // Animated CNN pipeline steps
    const steps = [
      'Normalizing RGB tensor (224 x 224 x 3)...',
      'Running CNN Convolutional feature extractions...',
      'Evaluating color histogram & moisture density...',
      'Deep learning classification: Freshness & Tamper metrics...',
      'Generating visual safety certificate...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStepText(steps[i]);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const result = await runAIScreening({
        imageBase64: imageUrl,
        foodName: customName || defaultFoodName,
        stage,
        inspectorName,
      });

      // Allow testing override if user selected
      if (selectedConditionOverride) {
        result.condition = selectedConditionOverride;
      }

      setScreeningResult(result);
    } catch (e) {
      console.error('Screening error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScreeningResult(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  const handleConfirmResult = () => {
    if (screeningResult) {
      onScreeningComplete(screeningResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{stageTitle}</h3>
              <p className="text-xs text-emerald-100 font-medium">
                CNN-Based Computer Vision & Multi-Stage Visual Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>AI-Assisted Visual Screening:</strong> Provides preliminary optical quality verification. This advisory tool assists human inspection and does not replace statutory food regulatory certification.
          </span>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Top Mode Selectors if not captured */}
          {!capturedImage && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={startCamera}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'camera' && cameraActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  📷 Open Camera
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setMode('upload');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'upload'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  📁 Upload Photo
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setMode('samples');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode === 'samples'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ⚡ Quick Sample Food
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Inspector: <span className="font-semibold text-slate-700">{inspectorName}</span>
              </div>
            </div>
          )}

          {cameraError && !capturedImage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* VIEW: LIVE CAMERA */}
          {mode === 'camera' && !capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder Overlay with corner guides */}
                <div className="absolute inset-8 pointer-events-none border border-emerald-400/40 rounded-xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>
                  <div className="text-center bg-black/60 px-3 py-1 rounded-full text-emerald-300 text-xs font-mono backdrop-blur-sm">
                    Frame surplus food vessel or container inside target
                  </div>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                  <button
                    onClick={handleCaptureFromVideo}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 text-sm transition-transform active:scale-95"
                  >
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                    Capture Food Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: UPLOAD */}
          {mode === 'upload' && !capturedImage && (
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-slate-800 text-base mb-1">
                Upload Food Inspection Photo
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Upload a clear image of prepared food, containers, batch labels, or produce from your device gallery.
              </p>
              <label className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Select File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* VIEW: SAMPLES FOR INSTANT TESTING */}
          {mode === 'samples' && !capturedImage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Instant Test Samples (Select a Food Batch)
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Instant 1-Click CNN Processing
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    name: 'Cooked Rice Pilaf & Curry',
                    url: SAMPLE_FOOD_IMAGES.steamingRice,
                    badge: 'Hot Insulated',
                    freshness: 'Fresh',
                  },
                  {
                    name: 'Fresh Artisan Bread & Loaves',
                    url: SAMPLE_FOOD_IMAGES.breadBakery,
                    badge: 'Bakery Batch',
                    freshness: 'Fresh',
                  },
                  {
                    name: 'Hydroponic Salad & Greens',
                    url: SAMPLE_FOOD_IMAGES.freshVegetables,
                    badge: 'Produce',
                    freshness: 'Fresh',
                  },
                  {
                    name: 'Buffet Prepared Dishes',
                    url: SAMPLE_FOOD_IMAGES.buffetDishes,
                    badge: 'Banquet Tray',
                    freshness: 'Moderately Fresh',
                  },
                  {
                    name: 'Balanced Meal Trays',
                    url: SAMPLE_FOOD_IMAGES.freshMeals,
                    badge: 'Catered Meals',
                    freshness: 'Fresh',
                  },
                  {
                    name: 'Packaged Dairy & Canned Food',
                    url: SAMPLE_FOOD_IMAGES.packagedGoods,
                    badge: 'Dry Staples',
                    freshness: 'Fresh',
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample.url, sample.name)}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 text-left hover:border-emerald-500 hover:shadow-md transition-all bg-white"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sample.badge}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">
                          {sample.freshness}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1">
                        {sample.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: SCANNING PROGRESS OVERLAY */}
          {isScanning && (
            <div className="p-8 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>

              {/* Scanning visual ray with high-tech laser and reticle */}
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)] bg-black">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Scanning"
                    className="w-full h-full object-cover opacity-85"
                  />
                )}
                {/* Dynamic laser scanning line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-laser"></div>

                {/* Corner bounding guides */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>

                {/* Center target reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 border border-emerald-400/40 rounded-full animate-ping opacity-30"></div>
                  <Scan className="w-8 h-8 text-emerald-400/80 animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-1 z-10">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  CNN Vision Inference in Progress...
                </div>
                <p className="text-xs text-slate-400 font-mono">{scanStepText}</p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-2">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" /> Feature Extraction
                </span>
                <span>•</span>
                <span>Softmax Layer</span>
                <span>•</span>
                <span>Thermal Integrity Check</span>
              </div>
            </div>
          )}

          {/* VIEW: RESULT DISPLAY */}
          {screeningResult && !isScanning && (
            <div className="space-y-5">
              {/* Image + Core Category Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={screeningResult.imageUrl}
                    alt="Analyzed food"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono">
                    ID: {screeningResult.screeningId}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Visual Screening Classification
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {screeningResult.timestamp}
                      </span>
                    </div>

                    {/* Freshness Status Pill */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm ${
                          screeningResult.condition === 'Fresh'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : screeningResult.condition === 'Moderately Fresh'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : screeningResult.condition === 'Near Expiry'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {screeningResult.condition === 'Fresh' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {screeningResult.condition === 'Moderately Fresh' && (
                          <CheckCircle2 className="w-4 h-4 text-sky-600" />
                        )}
                        {screeningResult.condition === 'Near Expiry' && (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        {screeningResult.condition === 'Unsafe' && (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{screeningResult.condition}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confidence: <strong>{Math.round(screeningResult.confidence * 100)}%</strong></span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mt-2.5">
                      {screeningResult.detectedFood}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {screeningResult.recommendedWindow}
                    </p>
                  </div>

                  {/* Secondary specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      <span>Temp: <strong className="text-slate-800">{screeningResult.temperatureEstimate || 'Compliant'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Box className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Vessel: <strong className="text-slate-800">{screeningResult.packagingIntegrity || 'Secure'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Indicators Bullet List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  CNN Visual Inspection Indicators Detected:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {screeningResult.visualIndicators.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advisory Box */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <strong>Advisory Note:</strong> {screeningResult.advisoryNotes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {capturedImage && (
            <button
              onClick={handleRetake}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake / Choose Another Image
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            {screeningResult && (
              <button
                onClick={handleConfirmResult}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Use & Attach Verification
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
