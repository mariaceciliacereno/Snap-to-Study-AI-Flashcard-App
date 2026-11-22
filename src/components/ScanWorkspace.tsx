import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Edit3,
  FilePlus2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  captureVideoFrame,
  createCompactThumbnail,
  fileToCapturedImage,
} from '../lib/imageUtils.ts';
import { saveGeneratedDeck } from '../lib/studyService.ts';
import type {
  CapturedPage,
  GeneratedFlashcardDraft,
  NoteAnalysisResult,
} from '../types/study.ts';

interface ScanWorkspaceProps {
  userId: string;
  triggerUploadNonce: number;
  onDeckSaved: (deckId: string, startStudyImmediately: boolean) => void;
}

type ScanStage = 'capture' | 'analyzing' | 'review';

export function ScanWorkspace({
  userId,
  triggerUploadNonce,
  onDeckSaved,
}: ScanWorkspaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [stage, setStage] = useState<ScanStage>('capture');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisStepLabel, setAnalysisStepLabel] = useState('Reading study notes...');

  const [analysis, setAnalysis] = useState<NoteAnalysisResult | null>(null);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableTopic, setEditableTopic] = useState('');
  const [editableCards, setEditableCards] = useState<GeneratedFlashcardDraft[]>([]);
  const [editingCardNumber, setEditingCardNumber] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live browser camera is unavailable on this device. Use "Take Photo" or "Upload Image" below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission was declined or no webcam was detected. You can capture with "Take Photo" or upload JPG/PNG images below.'
      );
    }
  };

  useEffect(() => {
    if (stage === 'capture') {
      void startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [stage, facingMode]);

  useEffect(() => {
    if (triggerUploadNonce > 0) {
      setStage('capture');
      setTimeout(() => {
        galleryInputRef.current?.click();
      }, 60);
    }
  }, [triggerUploadNonce]);

  const handleCaptureFromLiveCamera = () => {
    if (!videoRef.current || !cameraActive) return;
    if (pages.length >= 6) {
      setAnalysisError('You can combine up to 6 pages per study topic.');
      return;
    }
    setAnalysisError(null);
    const frame = captureVideoFrame(videoRef.current);
    const newPage: CapturedPage = {
      id: `page_${Date.now()}`,
      dataUrl: frame.dataUrl,
      mimeType: frame.mimeType,
      base64Data: frame.base64Data,
      label: `Page ${pages.length + 1}`,
    };
    const nextPages = [...pages, newPage];
    setPages(nextPages);
    setSelectedPageIndex(nextPages.length - 1);
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setAnalysisError(null);
    const remainingSlots = Math.max(0, 6 - pages.length);
    const files = Array.from(fileList).slice(0, remainingSlots);

    try {
      const processed: CapturedPage[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        const validExt = /\.(jpe?g|png)$/i.test(f.name);
        const validMime = ['image/jpeg', 'image/jpg', 'image/png'].includes(
          f.type.toLowerCase()
        );
        if (!validExt && !validMime) {
          setAnalysisError('Only JPG, JPEG, and PNG images are supported.');
          continue;
        }
        const img = await fileToCapturedImage(f);
        processed.push({
          id: `page_${Date.now()}_${i}`,
          dataUrl: img.dataUrl,
          mimeType: img.mimeType,
          base64Data: img.base64Data,
          label: `Page ${pages.length + processed.length + 1}`,
        });
      }
      if (processed.length > 0) {
        const nextPages = [...pages, ...processed];
        setPages(nextPages);
        setSelectedPageIndex(nextPages.length - 1);
      }
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Could not load selected image.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePage = (index: number) => {
    const next = pages.filter((_, idx) => idx !== index);
    setPages(next);
    setSelectedPageIndex(Math.max(0, Math.min(index, next.length - 1)));
  };

  const handleAnalyzeNotes = async () => {
    if (pages.length === 0) return;
    setAnalysisError(null);
    setStage('analyzing');
    setAnalysisStepLabel('Extracting text with Gemini Vision OCR...');

    const stepTimer1 = window.setTimeout(() => {
      setAnalysisStepLabel('Identifying academic subject and study topic...');
    }, 2200);
    const stepTimer2 = window.setTimeout(() => {
      setAnalysisStepLabel('Generating 20 grounded flashcards...');
    }, 4500);

    try {
      const response = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: pages.map((p) => ({
            mimeType: p.mimeType,
            data: p.base64Data,
          })),
        }),
      });

      const payload = (await response.json()) as NoteAnalysisResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || 'Failed to analyze study notes. Please try again.'
        );
      }

      setAnalysis(payload);
      setEditableSubject(payload.subject || 'General Studies');
      setEditableTopic(payload.topic || 'Study Topic');
      setEditableCards(payload.flashcards || []);
      setEditingCardNumber(null);
      setStage('review');
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to AI analysis service.'
      );
      setStage('capture');
    } finally {
      window.clearTimeout(stepTimer1);
      window.clearTimeout(stepTimer2);
    }
  };

  const handleSaveDeck = async (startStudyImmediately: boolean) => {
    if (!analysis || editableCards.length === 0) return;
    setSaving(true);
    setAnalysisError(null);

    try {
      const thumb = pages[0]
        ? await createCompactThumbnail(pages[0].dataUrl)
        : undefined;

      const deckId = await saveGeneratedDeck({
        userId,
        subjectName: editableSubject,
        topic: editableTopic,
        title: editableTopic,
        extractedSummary: analysis.extractedSummary,
        readabilityWarning: analysis.readabilityWarning,
        isReadable: analysis.isReadable,
        pageCount: pages.length,
        thumbnailDataUrl: thumb,
        flashcards: editableCards,
      });

      setPages([]);
      setAnalysis(null);
      setStage('capture');
      onDeckSaved(deckId, startStudyImmediately);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Failed to save flashcard deck.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (stage === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Analyzing Your Study Material
          </h2>
          <p className="text-sm text-indigo-600 font-medium mt-2">
            {analysisStepLabel}
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Processing {pages.length} {pages.length === 1 ? 'page' : 'pages'} · Preserving technical terms and verifying source accuracy
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'review' && analysis) {
    const canSave = analysis.isReadable && editableCards.length > 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Review Generated Flashcards
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Verify detected subject, topic, and edit any card before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStage('capture')}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Retake / Add Pages
          </button>
        </div>

        {/* Readability Warning Banner */}
        {(!analysis.isReadable || analysis.readabilityWarning) && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 ${
              analysis.isReadable
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">
                {analysis.isReadable
                  ? 'Partial Clarity Notice'
                  : 'Image Too Blurry or Unreadable'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                {analysis.readabilityWarning ||
                  'The captured image could not be read reliably. Please retake the photo in brighter lighting with steady focus.'}
              </p>
              {analysis.unclearSections.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs space-y-0.5">
                  {analysis.unclearSections.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
              {!analysis.isReadable && (
                <button
                  type="button"
                  onClick={() => {
                    setPages([]);
                    setAnalysis(null);
                    setStage('capture');
                  }}
                  className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-red-700"
                >
                  <Camera className="w-4 h-4" />
                  Retake Picture
                </button>
              )}
            </div>
          </div>
        )}

        {analysisError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {analysisError}
          </div>
        )}

        {canSave && (
          <>
            {/* Auto-Detected Subject & Topic */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="detected-subject"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    Detected Subject
                  </label>
                  <input
                    id="detected-subject"
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="detected-topic"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    Detected Topic
                  </label>
                  <input
                    id="detected-topic"
                    type="text"
                    value={editableTopic}
                    onChange={(e) => setEditableTopic(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {analysis.extractedSummary && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Recognized Study Summary
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {analysis.extractedSummary}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveDeck(true)}
                  className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save {editableCards.length} Flashcards &amp; Start Studying
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveDeck(false)}
                  className="min-h-[48px] px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  Save to My Decks
                </button>
              </div>
            </div>

            {/* Editable 20-Card List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Generated Flashcards ({editableCards.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Tap Edit on any card to adjust wording
                </p>
              </div>

              {editableCards.map((card, index) => {
                const isEditing = editingCardNumber === card.cardNumber;
                return (
                  <div
                    key={card.cardNumber}
                    className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs text-slate-500">
                        <span className="font-mono-nums font-semibold text-indigo-700">
                          Card {card.cardNumber} of {editableCards.length}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="capitalize">{card.questionStyle}</span>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {card.sourceGrounding === 'direct'
                            ? 'From uploaded notes'
                            : 'Includes AI clarification'}
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingCardNumber(isEditing ? null : card.cardNumber)
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 inline-flex items-center gap-1.5 shrink-0"
                      >
                        {isEditing ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Done
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </>
                        )}
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Question (Front)
                          </label>
                          <textarea
                            rows={2}
                            value={card.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditableCards((prev) =>
                                prev.map((c, idx) =>
                                  idx === index ? { ...c, question: val } : c
                                )
                              );
                            }}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Answer (Back)
                          </label>
                          <textarea
                            rows={3}
                            value={card.answer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditableCards((prev) =>
                                prev.map((c, idx) =>
                                  idx === index ? { ...c, answer: val } : c
                                )
                              );
                            }}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {card.question}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {card.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const activePreview = pages[selectedPageIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Scan Your Notes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Capture one or multiple pages (JPG, JPEG, PNG) to combine into one study deck.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={galleryInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            capture="environment"
            onChange={handleFilesSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            Upload from Gallery
          </button>
        </div>
      </div>

      {analysisError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {analysisError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Camera Viewfinder */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 relative">
          <div className="aspect-[4/3] relative flex items-center justify-center bg-slate-900">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {cameraActive && (
              <div
                className="pointer-events-none absolute inset-6 border border-white/30 rounded-2xl"
                aria-hidden="true"
              />
            )}

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-indigo-300" />
                </div>
                <p className="text-sm font-semibold max-w-sm">
                  {cameraError || 'Initializing camera...'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-indigo-500"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-white/20"
                  >
                    <Upload className="w-4 h-4" />
                    Choose JPG / PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => void startCamera(facingMode)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-white/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Camera
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Control Bar */}
          <div className="px-5 py-4 bg-slate-950/95 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) =>
                  prev === 'environment' ? 'user' : 'environment'
                )
              }
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-white/15"
            >
              <RefreshCw className="w-4 h-4" />
              Flip Camera
            </button>

            <button
              type="button"
              disabled={!cameraActive || pages.length >= 6}
              onClick={handleCaptureFromLiveCamera}
              aria-label="Capture note page"
              className="w-16 h-16 rounded-full bg-white border-4 border-indigo-400 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
            >
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-white/15"
            >
              <FilePlus2 className="w-4 h-4" />
              Device Cam
            </button>
          </div>
        </div>

        {/* Captured Pages Preview & Generate CTA */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Captured Pages
              </h2>
              <p className="text-xs text-slate-500 font-mono-nums mt-0.5">
                {pages.length} of 6 pages ready
              </p>
            </div>
            {pages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPages([]);
                  setSelectedPageIndex(0);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {activePreview ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[4/3]">
                <img
                  src={activePreview.dataUrl}
                  alt={activePreview.label}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePage(selectedPageIndex)}
                  aria-label="Remove current page"
                  className="absolute top-2.5 right-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-slate-900/75 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${
                      idx === selectedPageIndex
                        ? 'border-indigo-600'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.dataUrl}
                      alt={p.label}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {pages.length < 6 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex flex-col items-center justify-center text-[11px] font-semibold shrink-0"
                  >
                    <FilePlus2 className="w-4 h-4 mb-0.5" />
                    Add
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No pages captured yet
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Snap a picture using the camera viewfinder or upload JPG/PNG images from your device.
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={pages.length === 0}
            onClick={handleAnalyzeNotes}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-95 disabled:opacity-40 transition-opacity"
          >
            Generate Flashcards
          </button>
        </div>
      </div>
    </div>
  );
}
