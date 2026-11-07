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
  Maximize2,
  Scan,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleImages';
import { GenerateDeckRequest } from '../types';
import { sounds } from '../utils/soundEffects';

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
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);

  // Deck generation preferences
  const [cardCount, setCardCount] = useState<number>(20);
  const [studyFocus, setStudyFocus] = useState<'balanced' | 'definitions' | 'exam_qa' | 'formulas' | 'cloze'>('balanced');
  const [difficulty, setDifficulty] = useState<'standard' | 'intro' | 'advanced'>('standard');
  const [subjectHint, setSubjectHint] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam / mobile camera stream
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
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied in your browser settings.'
          : 'No live camera detected. You can test instantly with the sample textbook notes below.'
      );
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

  // Flip camera front / back
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Trigger Camera Shutter Snap
  const handleSnapCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Play tactile mechanical shutter sound
    sounds.playShutter();

    // Trigger visual screen flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 160);

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPreview(dataUrl);

    // Play scanner sound
    setTimeout(() => sounds.playScanSweep(), 300);

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
    sounds.playShutter();
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 160);

    setCapturedPreview(sample.svgDataUrl);
    setTimeout(() => sounds.playScanSweep(), 300);

    onCaptureAndGenerate({
      imageBase64: sample.svgDataUrl,
      mimeType: 'image/svg+xml',
      count: cardCount,
      studyFocus,
      difficulty,
      subjectHint: sample.subject,
    });
  };

  // Upload custom notes image from disk / photo library
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playShutter();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedPreview(dataUrl);
        setTimeout(() => sounds.playScanSweep(), 300);

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
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 overflow-hidden select-none">
      {/* Hidden capture canvas & file picker */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Camera Exposure Flash Animation */}
      {shutterFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-150" />
      )}

      {/* Top HUD Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
        <div className="flex items-center gap-2">
          {/* Preset Card Count Badge */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/40 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-lg shadow-indigo-950/30 hover:border-indigo-400 transition-all"
            title="Click to customize deck count & focus"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generate {cardCount} Cards</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Hallucination Audit</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Torch Toggle */}
          <button
            onClick={() => setTorchOn(!torchOn)}
            className={`p-2 rounded-2xl backdrop-blur-md border transition-all ${
              torchOn
                ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Toggle Flash / Torch"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Quick Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-2xl backdrop-blur-md border transition-all ${
              showSettings
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Deck Extraction Configuration"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal Drawer */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 w-80 p-4 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl text-xs space-y-3.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-slate-100 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Extraction Settings</span>
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          {/* Card Count Selector */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-semibold">Cards per Snap</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 15, 20, 25].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setCardCount(cnt)}
                  className={`py-2 rounded-xl font-bold transition-all text-xs ${
                    cardCount === cnt
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cnt}
                  {cnt === 20 && <span className="block text-[9px] font-normal text-amber-300">Default</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Study Focus */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-semibold">Study Focus</label>
            <select
              value={studyFocus}
              onChange={(e) => setStudyFocus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="balanced">Balanced (Core Concepts + Definitions)</option>
              <option value="definitions">Key Definitions & Terminology</option>
              <option value="exam_qa">High-Yield Exam Questions</option>
              <option value="formulas">Formulas, Reactions & Proofs</option>
              <option value="cloze">Fill-in-the-Blank & Mnemonics</option>
            </select>
          </div>

          {/* Subject Hint */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Subject / Exam (Optional)</label>
            <input
              type="text"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
              placeholder="e.g. AP Biology, MCAT, Chem 101, US History"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Viewfinder / Camera Lens Area */}
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
          /* High-aesthetic Standby View when physical camera is unavailable */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
            <div className="relative w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mb-5 text-indigo-400 shadow-2xl shadow-indigo-500/20">
              <Camera className="w-10 h-10" />
              <div className="absolute inset-0 rounded-3xl border border-indigo-400/40 animate-ping opacity-25" />
            </div>

            <h3 className="text-lg font-extrabold text-white mb-1.5 tracking-tight">
              Camera Viewfinder Standby
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              {cameraError ||
                'Align your physical textbook or notes in the lens, or tap any of our high-yield sample study pages below to test instant 20-card extraction.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={startCamera}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Retry Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Upload Notes Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Optical Scanning Reticle with Pulsing Corner Accents */}
        <div className="absolute inset-8 sm:inset-12 border border-indigo-500/30 rounded-3xl pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between w-full">
            <div className="w-8 h-8 border-t-[3px] border-l-[3px] border-indigo-400 rounded-tl-xl shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <div className="w-8 h-8 border-t-[3px] border-r-[3px] border-indigo-400 rounded-tr-xl shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>

          <div className="flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-slate-950/80 border border-indigo-500/40 text-[11px] font-semibold text-indigo-200 backdrop-blur-md shadow-lg shadow-black/50">
              Align textbook page or handwritten notes
            </span>
          </div>

          <div className="flex justify-between w-full">
            <div className="w-8 h-8 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl-xl shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <div className="w-8 h-8 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br-xl shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
        </div>

        {/* Holographic Laser Scanner Overlay during Generation */}
        {isGenerating && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            {/* Scanned Image Preview with active sweeping laser */}
            <div className="relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/40 mb-6 bg-slate-900">
              {capturedPreview && (
                <img
                  src={capturedPreview}
                  alt="Scanned Notes"
                  className="w-full h-full object-cover opacity-85"
                />
              )}

              {/* Holographic sweeping laser beam */}
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-bounce duration-1000 top-1/2" />
              <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />

              {/* Floating Extracted Concept Badges */}
              <div className="absolute top-4 left-3 px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/50 text-[10px] font-mono text-cyan-200 animate-pulse">
                ✦ OCR Active
              </div>
              <div className="absolute bottom-4 right-3 px-2 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-500/50 text-[10px] font-mono text-indigo-200">
                ✦ Verifying Source Quotes
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>Gemini 3.8 Flash Vision Engine</span>
              </div>

              <h4 className="text-lg font-extrabold text-white tracking-tight">
                Synthesizing {cardCount} High-Yield Flashcards
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {generationStep || 'Deciphering layout, formulas, and textbook concepts...'}
              </p>

              {/* Multimodal extraction progress pipeline */}
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-left space-y-2.5 text-xs shadow-inner">
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Document layout and handwritten text deciphered</span>
                </div>
                <div className="flex items-center gap-2.5 text-indigo-300 font-semibold animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                  <span>Formulating questions, concise answers & mnemonics</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                  <span>Auditing exact source citations for 100% accuracy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Sample Documents Carousel (1-Click Test) */}
      <div className="z-10 bg-slate-950/95 border-t border-slate-800/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Quick-Snap Sample Notes</span>
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">1-Click Test Without Paper</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelectSample(doc)}
              disabled={isGenerating}
              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group"
            >
              <div className="w-9 h-11 rounded-lg overflow-hidden bg-slate-950 border border-slate-700/80 flex-shrink-0 shadow-sm">
                <img src={doc.svgDataUrl} alt={doc.title} className="w-full h-full object-cover" />
              </div>
              <div className="max-w-[140px]">
                <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate transition-colors">
                  {doc.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{doc.badge}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Shutter Action Bar */}
      <div className="z-10 bg-slate-950 border-t border-slate-800/80 px-8 py-4 flex items-center justify-around">
        {/* Gallery / File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Upload notes photo from file"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-800 shadow-md">
            <Upload className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-[11px] font-semibold">Upload</span>
        </button>

        {/* Shutter Button (The Dead-Simple Snap Trigger) */}
        <button
          onClick={handleSnapCamera}
          disabled={isGenerating || !hasCameraPermission}
          className="relative flex items-center justify-center group disabled:opacity-50 transition-transform active:scale-90"
          title="Snap picture to generate 20 flashcards instantly"
        >
          {/* Pulsing ring around shutter */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/40 scale-125 animate-pulse" />
          <div className="w-20 h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-all group-hover:border-white shadow-xl shadow-indigo-600/30">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 group-hover:from-indigo-500 group-hover:to-sky-300 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white drop-shadow" />
            </div>
          </div>
          <span className="absolute -bottom-5 text-[10px] font-extrabold text-indigo-300 tracking-wider uppercase">
            Snap Note
          </span>
        </button>

        {/* Flip Front/Back Camera */}
        <button
          onClick={toggleCameraFacing}
          disabled={isGenerating}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Flip camera front/back"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-800 shadow-md">
            <RotateCcw className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-[11px] font-semibold">Flip</span>
        </button>
      </div>
    </div>
  );
};
