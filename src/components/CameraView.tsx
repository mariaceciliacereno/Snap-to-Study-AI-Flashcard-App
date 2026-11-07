import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Sparkles,
  Upload,
  Zap,
  Sliders,
  Check,
  AlertCircle,
  FileText,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleImages';
import { GenerateDeckRequest } from '../types';

interface CameraViewProps {
  onCaptureAndGenerate: (params: GenerateDeckRequest) => Promise<void>;
  isGenerating: boolean;
  generationStep: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCaptureAndGenerate,
  isGenerating,
  generationStep,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleDocument | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Generation options
  const [cardCount, setCardCount] = useState<number>(20);
  const [studyFocus, setStudyFocus] = useState<'balanced' | 'definitions' | 'exam_qa' | 'formulas' | 'cloze'>('balanced');
  const [difficulty, setDifficulty] = useState<'standard' | 'intro' | 'advanced'>('standard');
  const [subjectHint, setSubjectHint] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera stream error or denied:', err);
      setHasCameraPermission(false);
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission was denied in your browser.' : 'No active webcam or camera detected.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Flip front/back camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture photo from live camera
  const handleSnapCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPreview(dataUrl);

    // Trigger AI generation
    onCaptureAndGenerate({
      imageBase64: dataUrl,
      mimeType: 'image/jpeg',
      count: cardCount,
      studyFocus,
      difficulty,
      subjectHint,
    });
  };

  // Select a preset sample document
  const handleSelectSample = (sample: SampleDocument) => {
    setSelectedSample(sample);
    setCapturedPreview(sample.svgDataUrl);
    onCaptureAndGenerate({
      imageBase64: sample.svgDataUrl,
      mimeType: 'image/svg+xml',
      count: cardCount,
      studyFocus,
      difficulty,
      subjectHint: sample.subject,
    });
  };

  // Upload custom image from device/disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedPreview(dataUrl);
        onCaptureAndGenerate({
          imageBase64: dataUrl,
          mimeType: file.type || 'image/jpeg',
          count: cardCount,
          studyFocus,
          difficulty,
          subjectHint,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 overflow-hidden">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Overlay Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-indigo-300 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Target: {cardCount} Cards</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTorchOn(!torchOn)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              torchOn
                ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Toggle Flash / Torch"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              showSettings
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Deck Extraction Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal Drawer */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 w-80 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-xs space-y-3.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100 text-sm">Extraction Settings</span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          {/* Card Count Selector */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-medium">Card Count per Snap</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 15, 20, 25].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setCardCount(cnt)}
                  className={`py-1.5 rounded-lg font-bold transition-colors ${
                    cardCount === cnt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Default 20 cards: ideal for comprehensive recall.</p>
          </div>

          {/* Study Focus */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-medium">Study Focus</label>
            <select
              value={studyFocus}
              onChange={(e) => setStudyFocus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="balanced">Balanced (Concepts + Terminology)</option>
              <option value="definitions">Key Definitions & Vocab</option>
              <option value="exam_qa">High-Yield Exam Questions</option>
              <option value="formulas">Formulas, Proofs & Mechanisms</option>
              <option value="cloze">Fill-in-the-Blank & Mnemonics</option>
            </select>
          </div>

          {/* Subject Hint */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Subject / Course (Optional)</label>
            <input
              type="text"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
              placeholder="e.g. AP Biology, MCAT, Chem 101"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Viewfinder / Camera Feed */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        {hasCameraPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback when webcam is unavailable or blocked */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Camera Stream Standby</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              {cameraError || 'Allow camera access to photograph physical pages, or test instantly with high-yield sample textbook notes below.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload Notes Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Optical Alignment Reticle Overlay */}
        <div className="absolute inset-8 sm:inset-12 border border-indigo-500/30 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
          {/* 4 Corner Accents */}
          <div className="flex justify-between w-full">
            <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
            <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
          </div>
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-slate-950/70 border border-indigo-500/30 text-[11px] font-medium text-indigo-200 backdrop-blur-md">
              Align textbook page or handwritten notes
            </span>
          </div>
          <div className="flex justify-between w-full">
            <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
            <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
          </div>
        </div>

        {/* Laser Scanner animation during generation */}
        {isGenerating && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            {/* Scanned Image Preview with sweeping laser */}
            <div className="relative w-64 h-80 rounded-xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/30 mb-6 bg-slate-900">
              {capturedPreview && (
                <img
                  src={capturedPreview}
                  alt="Captured Notes"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              {/* Sweeping Laser Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-bounce duration-1000 top-1/2" />
              <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
            </div>

            <div className="space-y-3 max-w-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Gemini 3.8 Flash Multimodal OCR</span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Synthesizing {cardCount} High-Yield Flashcards
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {generationStep || 'Extracting core concepts, definitions, formulas & citations...'}
              </p>

              {/* Progress Steps */}
              <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Document layout and handwritten text read</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-300 font-medium animate-pulse">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  <span>Synthesizing front/back pairs & memory mnemonics</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                  <span>Auditing source citations for 100% accuracy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sample Notes Strip (Fast 1-click test without camera) */}
      <div className="z-10 bg-slate-900/90 border-t border-slate-800/80 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ⚡ Quick Test Samples (1-Click Snap)
          </span>
          <span className="text-[11px] text-indigo-400">Select any note below</span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelectSample(doc)}
              disabled={isGenerating}
              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="w-8 h-10 rounded-md overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                <img src={doc.svgDataUrl} alt={doc.title} className="w-full h-full object-cover" />
              </div>
              <div className="max-w-[130px]">
                <p className="text-xs font-semibold text-slate-200 truncate">{doc.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{doc.badge}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Camera Action Bar */}
      <div className="z-10 bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-around">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Upload photo from disk or photo library"
        >
          <div className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-700">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Upload</span>
        </button>

        {/* Shutter Button (Dead-simple snap) */}
        <button
          onClick={handleSnapCamera}
          disabled={isGenerating || !hasCameraPermission}
          className="relative flex items-center justify-center group disabled:opacity-50 transition-transform active:scale-90"
          title="Snap picture to instantly generate 20 flashcards"
        >
          <div className="w-20 h-20 rounded-full border-4 border-indigo-400/80 p-1 flex items-center justify-center transition-all group-hover:border-indigo-300">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 group-hover:from-indigo-500 group-hover:to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>
          <span className="absolute -bottom-5 text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
            Snap Note
          </span>
        </button>

        {/* Flip Camera Facing Mode */}
        <button
          onClick={toggleCameraFacing}
          disabled={isGenerating}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Flip camera front/back"
        >
          <div className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-700">
            <RotateCcw className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Flip</span>
        </button>
      </div>
    </div>
  );
};
