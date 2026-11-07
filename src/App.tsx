import React, { useState, useEffect } from 'react';
import {
  Camera,
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  Smartphone,
  Monitor,
  AlertCircle,
  Wifi,
  BatteryMedium,
  Check,
  Zap
} from 'lucide-react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { DeckListView } from './components/DeckListView';
import { StudyMode } from './components/StudyMode';
import { QuizMode } from './components/QuizMode';
import { DeckDetailModal } from './components/DeckDetailModal';
import { ExportModal } from './components/ExportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { FlashcardDeck, GenerateDeckRequest, UserStats } from './types';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalCardsLearned: 38,
    studyStreakDays: 4,
    totalDecksCreated: 3,
    minutesStudied: 45,
  });

  const [activeTab, setActiveTab] = useState<'snap' | 'decks'>('snap');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active Modals & Study/Quiz states
  const [selectedDeckForStudy, setSelectedDeckForStudy] = useState<FlashcardDeck | null>(null);
  const [selectedDeckForQuiz, setSelectedDeckForQuiz] = useState<FlashcardDeck | null>(null);
  const [selectedDeckForDetail, setSelectedDeckForDetail] = useState<FlashcardDeck | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportDeck, setExportDeck] = useState<FlashcardDeck | undefined>(undefined);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadedDecks = storageService.getDecks();
    setDecks(loadedDecks);
    setUserStats(storageService.getUserStats());
  }, []);

  const refreshDecks = () => {
    setDecks(storageService.getDecks());
    setUserStats(storageService.getUserStats());
  };

  // Main Snap-to-Deck Generator
  const handleCaptureAndGenerate = async (params: GenerateDeckRequest) => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Deciphering document layout & reading handwriting...');

    const timer1 = setTimeout(() => {
      setGenerationStep('Extracting core concepts & formulas with Gemini 3.8 Flash...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setGenerationStep(`Synthesizing ${params.count || 20} high-yield flashcards with source citations...`);
    }, 3200);

    try {
      const { deck } = await geminiService.generateFlashcards(params);
      clearTimeout(timer1);
      clearTimeout(timer2);

      // Save deck
      storageService.addDeck(deck);
      refreshDecks();

      sounds.playSuccess();
      setSuccessToast(`🎉 Created "${deck.title}" with ${deck.cards.length} verified flashcards!`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Open new deck detail or go to study mode
      setSelectedDeckForDetail(deck);
      setActiveTab('decks');
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error(err);
      setErrorMessage(err.message || 'Failed to extract flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Spaced Repetition Review Handler
  const handleCardReviewed = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!selectedDeckForStudy) return;
    const updated = storageService.updateCardReview(selectedDeckForStudy.id, cardId, rating);
    if (updated) {
      setSelectedDeckForStudy(updated);
      refreshDecks();
    }
  };

  // Deck Update & Delete
  const handleUpdateDeck = (updated: FlashcardDeck) => {
    storageService.updateDeck(updated);
    refreshDecks();
    if (selectedDeckForDetail?.id === updated.id) {
      setSelectedDeckForDetail(updated);
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    storageService.deleteDeck(deckId);
    refreshDecks();
    if (selectedDeckForDetail?.id === deckId) {
      setSelectedDeckForDetail(null);
    }
  };

  const handleOpenExportForDeck = (deck: FlashcardDeck) => {
    setExportDeck(deck);
    setIsExportOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Global Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950 border border-emerald-600/60 text-emerald-200 text-xs font-bold shadow-2xl animate-in slide-in-from-top duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-950 border border-red-600/60 text-red-200 text-xs font-semibold shadow-2xl animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* App Header */}
      <Header
        stats={userStats}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        onOpenExport={() => {
          setExportDeck(decks[0]);
          setIsExportOpen(true);
        }}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        {isMobileFrame ? (
          /* MOBILE PHONE SHELL PREVIEW (React Native Smartphone Frame) */
          <div className="relative w-full max-w-[395px] h-[790px] bg-slate-900 border-[10px] border-slate-800 rounded-[50px] shadow-2xl shadow-indigo-950/60 flex flex-col overflow-hidden my-auto ring-1 ring-slate-700/50">
            {/* Phone Notch & Status Bar */}
            <div className="h-8 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-400 z-30 select-none">
              <span className="font-bold text-slate-200">9:41</span>
              {/* Dynamic Island */}
              <div className="w-24 h-4 bg-black rounded-full shadow-inner" />
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <BatteryMedium className="w-4 h-4 text-slate-200" />
              </div>
            </div>

            {/* Mobile Body Content */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              {activeTab === 'snap' ? (
                <CameraView
                  onCaptureAndGenerate={handleCaptureAndGenerate}
                  isGenerating={isGenerating}
                  generationStep={generationStep}
                />
              ) : (
                <DeckListView
                  decks={decks}
                  onSelectDeckToStudy={(deck) => setSelectedDeckForStudy(deck)}
                  onSelectDeckToQuiz={(deck) => setSelectedDeckForQuiz(deck)}
                  onOpenDeckDetail={(deck) => setSelectedDeckForDetail(deck)}
                  onExportDeck={handleOpenExportForDeck}
                  onDeleteDeck={handleDeleteDeck}
                  onGoToCamera={() => setActiveTab('snap')}
                />
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="h-16 bg-slate-950 border-t border-slate-800/80 px-8 flex items-center justify-around z-30">
              <button
                onClick={() => setActiveTab('snap')}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'snap' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Snap Note</span>
              </button>

              <button
                onClick={() => setActiveTab('decks')}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'decks' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px]">Decks ({decks.length})</span>
              </button>
            </div>

            {/* Home indicator bar */}
            <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        ) : (
          /* RESPONSIVE FULL DESKTOP / TABLET VIEW */
          <div className="w-full h-full flex-1 flex flex-col max-w-7xl mx-auto">
            {activeTab === 'snap' ? (
              <div className="flex-1 w-full max-w-4xl mx-auto h-[690px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
                <CameraView
                  onCaptureAndGenerate={handleCaptureAndGenerate}
                  isGenerating={isGenerating}
                  generationStep={generationStep}
                />
              </div>
            ) : (
              <DeckListView
                decks={decks}
                onSelectDeckToStudy={(deck) => setSelectedDeckForStudy(deck)}
                onSelectDeckToQuiz={(deck) => setSelectedDeckForQuiz(deck)}
                onOpenDeckDetail={(deck) => setSelectedDeckForDetail(deck)}
                onExportDeck={handleOpenExportForDeck}
                onDeleteDeck={handleDeleteDeck}
                onGoToCamera={() => setActiveTab('snap')}
              />
            )}
          </div>
        )}
      </main>

      {/* Study Mode Overlay (3D Flashcard Flip & Spaced Repetition) */}
      {selectedDeckForStudy && (
        <StudyMode
          deck={selectedDeckForStudy}
          onClose={() => setSelectedDeckForStudy(null)}
          onCardReviewed={handleCardReviewed}
          onSwitchToQuiz={() => {
            const target = selectedDeckForStudy;
            setSelectedDeckForStudy(null);
            setSelectedDeckForQuiz(target);
          }}
        />
      )}

      {/* Rapid Quiz Mode Overlay */}
      {selectedDeckForQuiz && (
        <QuizMode
          deck={selectedDeckForQuiz}
          onClose={() => setSelectedDeckForQuiz(null)}
          onStudyMode={() => {
            const target = selectedDeckForQuiz;
            setSelectedDeckForQuiz(null);
            setSelectedDeckForStudy(target);
          }}
        />
      )}

      {/* Deck Detail & Citation Accuracy Inspection Modal */}
      {selectedDeckForDetail && (
        <DeckDetailModal
          deck={selectedDeckForDetail}
          onClose={() => setSelectedDeckForDetail(null)}
          onUpdateDeck={handleUpdateDeck}
          onStudy={(deck) => {
            setSelectedDeckForDetail(null);
            setSelectedDeckForStudy(deck);
          }}
          onQuiz={(deck) => {
            setSelectedDeckForDetail(null);
            setSelectedDeckForQuiz(deck);
          }}
          onExport={(deck) => {
            setExportDeck(deck);
            setIsExportOpen(true);
          }}
        />
      )}

      {/* Export to Anki / Quizlet / React Native Antigravity Modal */}
      {isExportOpen && (
        <ExportModal
          decks={decks}
          selectedDeck={exportDeck}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Cloud & Supabase Integration Modal */}
      {isCloudSyncOpen && (
        <CloudSyncModal
          onClose={() => setIsCloudSyncOpen(false)}
          onRefreshDecks={refreshDecks}
        />
      )}
    </div>
  );
}
