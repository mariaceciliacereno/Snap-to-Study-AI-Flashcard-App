import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Quote,
  CheckCircle2,
  Award,
  BookOpen,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FlashcardDeck, Flashcard } from '../types';
import { geminiService } from '../services/geminiService';

interface StudyModeProps {
  deck: FlashcardDeck;
  onClose: () => void;
  onCardReviewed: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onSwitchToQuiz: () => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({
  deck,
  onClose,
  onCardReviewed,
  onSwitchToQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<{ again: number; hard: number; good: number; easy: number }>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // AI Deep Explanation Drawer
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const currentCard: Flashcard | undefined = deck.cards[currentIndex];

  // Fire confetti on complete
  useEffect(() => {
    if (isCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isCompleted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || isExplaining) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isCompleted, isExplaining, currentIndex]);

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    onCardReviewed(currentCard.id, rating);
    setSessionRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    setIsFlipped(false);
    setShowHint(false);
    setAiExplanation(null);

    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Text to Speech
  const speakText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Ask AI to deep explain
  const handleAskAiExplanation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    setIsExplaining(true);
    try {
      const explanation = await geminiService.explainCard(
        currentCard.front,
        currentCard.back,
        deck.subject,
        'Provide an intuitive analogy, core logic breakdown, and a common exam trap for this flashcard.'
      );
      setAiExplanation(explanation);
    } catch (err) {
      setAiExplanation('Could not generate explanation at this time.');
    } finally {
      setIsExplaining(false);
    }
  };

  if (!currentCard && !isCompleted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Top Header */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-4 py-2">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Exit Study Mode"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xs text-center">
          <p className="text-xs font-bold text-white truncate">{deck.title}</p>
          <p className="text-[11px] text-slate-400">
            Card {currentIndex + 1} of {deck.cards.length}
          </p>
        </div>

        <button
          onClick={onSwitchToQuiz}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quiz Mode</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl w-full mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / deck.cards.length) * 100}%` }}
        />
      </div>

      {/* Main Study Arena */}
      {!isCompleted ? (
        <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center items-center py-2">
          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 w-full h-[380px] sm:h-[420px] cursor-pointer"
          >
            <div
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* CARD FRONT */}
              <div className="absolute inset-0 backface-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-800/40">
                      {currentCard.coreConcept}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => speakText(currentCard.front, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Box {currentCard.box || 1}
                      </span>
                    </div>
                  </div>

                  {currentCard.keyFormulaOrTerm && (
                    <div className="inline-block px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-700/40 text-[11px] font-mono text-indigo-300 mb-3">
                      {currentCard.keyFormulaOrTerm}
                    </div>
                  )}

                  <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed mt-2">
                    {currentCard.front}
                  </h3>
                </div>

                <div>
                  {/* Hint Reveal */}
                  {currentCard.hint && (
                    <div className="mb-3">
                      {showHint ? (
                        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{currentCard.hint}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-400/80 hover:text-amber-300"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Show Hint</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-800/80">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Tap or press Space to reveal answer</span>
                  </div>
                </div>
              </div>

              {/* CARD BACK */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/60 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
                      Answer & Core Takeaway
                    </span>
                    <button
                      onClick={(e) => speakText(currentCard.back, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium mb-4">
                    {currentCard.back}
                  </p>

                  {/* Verifiable Source Snippet */}
                  {currentCard.sourceSnippet && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-indigo-400 not-italic block mb-0.5">
                          Verified from Scanned Notes:
                        </span>
                        <span>"{currentCard.sourceSnippet}"</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {/* AI Explanation Drawer trigger */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mb-2">
                    <button
                      onClick={handleAskAiExplanation}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isExplaining ? 'Analyzing with AI...' : 'Ask AI: Mental Model & Exam Traps'}</span>
                    </button>
                    <span className="text-[11px] text-slate-500">Rate your recall below</span>
                  </div>

                  {aiExplanation && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-indigo-700/50 text-xs text-indigo-200 max-h-36 overflow-y-auto leading-relaxed mb-1">
                      {aiExplanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Spaced Repetition Rating Buttons */}
          <div className="w-full mt-4">
            {isFlipped ? (
              <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => handleRate('again')}
                  className="py-3 px-2 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-200 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95"
                >
                  <span className="text-sm font-extrabold text-red-400">Again</span>
                  <span className="text-[10px] text-red-400/80">&lt;10 min</span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">[1]</span>
                </button>

                <button
                  onClick={() => handleRate('hard')}
                  className="py-3 px-2 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95"
                >
                  <span className="text-sm font-extrabold text-amber-400">Hard</span>
                  <span className="text-[10px] text-amber-400/80">1 day</span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">[2]</span>
                </button>

                <button
                  onClick={() => handleRate('good')}
                  className="py-3 px-2 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95"
                >
                  <span className="text-sm font-extrabold text-emerald-400">Good</span>
                  <span className="text-[10px] text-emerald-400/80">3 days</span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">[3]</span>
                </button>

                <button
                  onClick={() => handleRate('easy')}
                  className="py-3 px-2 rounded-2xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 text-sky-200 font-bold text-xs flex flex-col items-center gap-0.5 transition-all active:scale-95"
                >
                  <span className="text-sm font-extrabold text-sky-400">Easy</span>
                  <span className="text-[10px] text-sky-400/80">7 days</span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">[4]</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full max-w-sm py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  Reveal Answer
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Deck Completed Celebration State */
        <div className="flex-1 max-w-lg w-full mx-auto flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white">Deck Mastered! 🎉</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You reviewed all {deck.cards.length} flashcards in "{deck.title}".
            </p>
          </div>

          {/* Session breakdown */}
          <div className="w-full grid grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="text-center">
              <span className="block font-bold text-red-400 text-base">{sessionRatings.again}</span>
              <span className="text-[10px] text-slate-500">Again</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-amber-400 text-base">{sessionRatings.hard}</span>
              <span className="text-[10px] text-slate-500">Hard</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-emerald-400 text-base">{sessionRatings.good}</span>
              <span className="text-[10px] text-slate-500">Good</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-sky-400 text-base">{sessionRatings.easy}</span>
              <span className="text-[10px] text-slate-500">Easy</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
              }}
              className="w-full py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              Study Deck Again
            </button>
            <button
              onClick={onSwitchToQuiz}
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all"
            >
              Test with Quiz
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            >
              Back to Decks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
