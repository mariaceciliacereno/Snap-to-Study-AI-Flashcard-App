import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { recordCardStudyProgress } from '../lib/studyService.ts';
import type {
  DifficultyRating,
  FlashcardDeckRecord,
  FlashcardRecord,
  StudyProgressRecord,
} from '../types/study.ts';

interface StudySessionViewProps {
  userId: string;
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  selectedDeckId: string | null;
  onSelectDeckId: (deckId: string) => void;
  onGoToScan: () => void;
}

export function StudySessionView({
  userId,
  decks,
  flashcards,
  progress,
  selectedDeckId,
  onSelectDeckId,
  onGoToScan,
}: StudySessionViewProps) {
  const activeDeck = useMemo(() => {
    if (decks.length === 0) return null;
    if (selectedDeckId) {
      const found = decks.find((d) => d.id === selectedDeckId);
      if (found) return found;
    }
    return decks[0];
  }, [decks, selectedDeckId]);

  const deckCards = useMemo(() => {
    if (!activeDeck) return [];
    return flashcards
      .filter((c) => c.deckId === activeDeck.id)
      .sort((a, b) => a.cardNumber - b.cardNumber);
  }, [flashcards, activeDeck]);

  const [filterMode, setFilterMode] = useState<'all' | 'difficult'>('all');
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  const progressByCardId = useMemo(() => {
    const map = new Map<string, StudyProgressRecord>();
    progress.forEach((p) => {
      map.set(p.cardId, p);
    });
    return map;
  }, [progress]);

  // Reset order when active deck or filter changes
  useEffect(() => {
    const baseCards =
      filterMode === 'difficult'
        ? deckCards.filter(
            (c) => progressByCardId.get(c.id)?.difficulty === 'difficult'
          )
        : deckCards;
    setOrderedIds(baseCards.map((c) => c.id));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSaveFeedback(null);
  }, [activeDeck?.id, filterMode, deckCards.length]);

  const sessionCards = useMemo(() => {
    const map = new Map(deckCards.map((c) => [c.id, c]));
    return orderedIds
      .map((id) => map.get(id))
      .filter((c): c is FlashcardRecord => Boolean(c));
  }, [deckCards, orderedIds]);

  const currentCard = sessionCards[currentIndex] || null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!currentCard || sessionComplete) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        if (currentIndex < sessionCards.length - 1) {
          setIsFlipped(false);
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.code === 'ArrowLeft') {
        if (currentIndex > 0) {
          setIsFlipped(false);
          setCurrentIndex((i) => i - 1);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentCard, currentIndex, sessionCards.length, sessionComplete]);

  if (!activeDeck) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            No Decks to Study Yet
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-6">
            Scan a textbook page or handwritten notes first to generate your 20-card active recall deck.
          </p>
          <button
            type="button"
            onClick={onGoToScan}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scan Your Notes
          </button>
        </div>
      </div>
    );
  }

  const handleShuffle = () => {
    const copy = [...orderedIds];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setOrderedIds(copy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
  };

  const handleRestart = () => {
    const resetIds =
      filterMode === 'difficult'
        ? deckCards
            .filter((c) => progressByCardId.get(c.id)?.difficulty === 'difficult')
            .map((c) => c.id)
        : deckCards.map((c) => c.id);
    setOrderedIds(resetIds);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSaveFeedback(null);
  };

  const handleRateCard = async (difficulty: DifficultyRating) => {
    if (!currentCard || savingRating) return;
    setSavingRating(true);
    setSaveFeedback(null);
    const existingProg = progressByCardId.get(currentCard.id);

    try {
      await recordCardStudyProgress({
        userId,
        deckId: activeDeck.id,
        cardId: currentCard.id,
        difficulty,
        existingReviewCount: existingProg?.reviewCount,
      });
      setSaveFeedback(`Saved as ${difficulty}`);

      if (currentIndex < sessionCards.length - 1) {
        window.setTimeout(() => {
          setIsFlipped(false);
          setSaveFeedback(null);
          setCurrentIndex((i) => i + 1);
        }, 240);
      } else {
        window.setTimeout(() => {
          setSessionComplete(true);
          setSaveFeedback(null);
        }, 240);
      }
    } finally {
      setSavingRating(false);
    }
  };

  const deckRatings = deckCards.map((c) => progressByCardId.get(c.id)?.difficulty);
  const easyTotal = deckRatings.filter((r) => r === 'easy').length;
  const mediumTotal = deckRatings.filter((r) => r === 'medium').length;
  const difficultTotal = deckRatings.filter((r) => r === 'difficult').length;

  const progressPct =
    sessionCards.length > 0
      ? Math.round(((currentIndex + 1) / sessionCards.length) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Deck Picker & Study Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="study-deck-select" className="sr-only">
            Select Flashcard Deck
          </label>
          <select
            id="study-deck-select"
            value={activeDeck.id}
            onChange={(e) => onSelectDeckId(e.target.value)}
            className="w-full sm:w-auto max-w-full min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 font-display text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.subjectName} — {d.title} ({d.cardCount} cards)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({deckCards.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('difficult')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterMode === 'difficult'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Difficult ({difficultTotal})
            </button>
          </div>

          <button
            type="button"
            onClick={handleShuffle}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Empty Filter State */}
      {sessionCards.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center">
          <h2 className="font-display text-lg font-bold text-slate-900">
            No cards marked Difficult yet
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Switch back to All Cards to study the full deck and rate any tricky concepts as Difficult.
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            Show All Cards
          </button>
        </div>
      ) : sessionComplete ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Deck Session Complete
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeDeck.subjectName} · {activeDeck.title}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="font-mono-nums text-xl font-bold text-emerald-700">
                {easyTotal}
              </p>
              <p className="text-xs font-semibold text-emerald-800 mt-0.5">Easy</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
              <p className="font-mono-nums text-xl font-bold text-amber-700">
                {mediumTotal}
              </p>
              <p className="text-xs font-semibold text-amber-800 mt-0.5">Medium</p>
            </div>
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3">
              <p className="font-mono-nums text-xl font-bold text-rose-700">
                {difficultTotal}
              </p>
              <p className="text-xs font-semibold text-rose-800 mt-0.5">Difficult</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Deck
            </button>
            {difficultTotal > 0 && filterMode === 'all' && (
              <button
                type="button"
                onClick={() => setFilterMode('difficult')}
                className="min-h-[46px] px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm"
              >
                Review Difficult ({difficultTotal})
              </button>
            )}
          </div>
        </div>
      ) : (
        currentCard && (
          <>
            {/* Card Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-mono-nums font-semibold text-slate-900">
                  {currentIndex + 1} of {sessionCards.length}
                </span>
                <span>
                  {activeDeck.subjectName} · {activeDeck.topic}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* 3D Flip Flashcard */}
            <div className="perspective-1200">
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                aria-label={
                  isFlipped
                    ? 'Flashcard answer side. Tap to flip back to question.'
                    : 'Flashcard question side. Tap to reveal answer.'
                }
                className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-3xl"
              >
                <div
                  className={`relative w-full min-h-[300px] sm:min-h-[340px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front (Question) */}
                  <div className="absolute inset-0 backface-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Question ·{' '}
                        <span className="capitalize">
                          {currentCard.questionStyle}
                        </span>
                      </span>
                      <span className="font-mono-nums font-semibold text-indigo-700">
                        Card #{currentCard.cardNumber}
                      </span>
                    </div>

                    <div className="my-auto py-4">
                      <p className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {currentCard.question}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tap card to reveal answer</span>
                      {progressByCardId.get(currentCard.id) && (
                        <span className="capitalize font-semibold text-slate-600">
                          Last rated:{' '}
                          {progressByCardId.get(currentCard.id)?.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Back (Answer) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-xs text-indigo-100">
                      <span>Answer</span>
                      <span>
                        {currentCard.sourceGrounding === 'direct'
                          ? 'Directly from your notes'
                          : 'Includes AI clarification'}
                      </span>
                    </div>

                    <div className="my-auto py-4 overflow-y-auto max-h-[210px]">
                      <p className="text-base sm:text-lg font-medium leading-relaxed text-white">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-indigo-200">
                      <span>Tap card to view question</span>
                      <span className="font-mono-nums">
                        {currentIndex + 1} / {sessionCards.length}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Study Progress Rating Controls */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  How well did you remember this card?
                </p>
                {saveFeedback && (
                  <span className="text-xs font-semibold text-indigo-600">
                    {saveFeedback}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={savingRating}
                  onClick={() => handleRateCard('easy')}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    progressByCardId.get(currentCard.id)?.difficulty === 'easy'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Easy
                </button>

                <button
                  type="button"
                  disabled={savingRating}
                  onClick={() => handleRateCard('medium')}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    progressByCardId.get(currentCard.id)?.difficulty === 'medium'
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <Flame className="w-4 h-4 shrink-0" />
                  Medium
                </button>

                <button
                  type="button"
                  disabled={savingRating}
                  onClick={() => handleRateCard('difficult')}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    progressByCardId.get(currentCard.id)?.difficulty === 'difficult'
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Difficult
                </button>
              </div>
            </div>

            {/* Previous / Next Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setSaveFeedback(null);
                  setCurrentIndex((i) => Math.max(0, i - 1));
                }}
                className="flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIndex < sessionCards.length - 1) {
                    setIsFlipped(false);
                    setSaveFeedback(null);
                    setCurrentIndex((i) => i + 1);
                  } else {
                    setSessionComplete(true);
                  }
                }}
                className="flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                {currentIndex < sessionCards.length - 1 ? 'Next' : 'Finish Deck'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
