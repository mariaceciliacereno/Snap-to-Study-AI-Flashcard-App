import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  Edit3,
  FolderOpen,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteDeckCascade,
  renameDeck,
  updateFlashcardContent,
} from '../lib/studyService.ts';
import type {
  FlashcardDeckRecord,
  FlashcardRecord,
  StudyProgressRecord,
  SubjectRecord,
} from '../types/study.ts';

interface MyDecksViewProps {
  userId: string;
  subjects: SubjectRecord[];
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  initialSubjectFilter: string;
  onClearInitialSubjectFilter: () => void;
  onStartStudyDeck: (deckId: string) => void;
  onGoToScan: () => void;
}

export function MyDecksView({
  userId,
  subjects,
  decks,
  flashcards,
  progress,
  initialSubjectFilter,
  onClearInitialSubjectFilter,
  onStartStudyDeck,
  onGoToScan,
}: MyDecksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubjectFilter || 'All'
  );
  const [inspectingDeckId, setInspectingDeckId] = useState<string | null>(null);
  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteDeckId, setConfirmDeleteDeckId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [emptyArtFailed, setEmptyArtFailed] = useState(false);

  const activeSubjectFilter =
    initialSubjectFilter && selectedSubject !== initialSubjectFilter
      ? initialSubjectFilter
      : selectedSubject;

  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      const matchesSubject =
        activeSubjectFilter === 'All' ||
        deck.subjectName.toLowerCase() === activeSubjectFilter.toLowerCase();
      if (!matchesSubject) return false;
      if (!q) return true;
      if (
        deck.title.toLowerCase().includes(q) ||
        deck.topic.toLowerCase().includes(q) ||
        deck.subjectName.toLowerCase().includes(q)
      ) {
        return true;
      }
      return flashcards.some(
        (c) =>
          c.deckId === deck.id &&
          (c.question.toLowerCase().includes(q) ||
            c.answer.toLowerCase().includes(q))
      );
    });
  }, [decks, flashcards, activeSubjectFilter, searchQuery]);

  const groupedBySubject = useMemo(() => {
    const map = new Map<string, FlashcardDeckRecord[]>();
    filteredDecks.forEach((deck) => {
      const key = deck.subjectName || 'General Studies';
      const list = map.get(key) || [];
      list.push(deck);
      map.set(key, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDecks]);

  const inspectingDeck = decks.find((d) => d.id === inspectingDeckId) || null;
  const inspectingCards = useMemo(() => {
    if (!inspectingDeck) return [];
    return flashcards
      .filter((c) => c.deckId === inspectingDeck.id)
      .sort((a, b) => a.cardNumber - b.cardNumber);
  }, [flashcards, inspectingDeck]);

  if (inspectingDeck) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setInspectingDeckId(null);
                setEditingCardId(null);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
              aria-label="Back to My Decks"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-slate-500">
                {inspectingDeck.subjectName} ·{' '}
                <span className="font-mono-nums">
                  {inspectingCards.length} flashcards
                </span>
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {inspectingDeck.title}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartStudyDeck(inspectingDeck.id)}
            className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-95 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            Study This Deck
          </button>
        </div>

        <div className="space-y-3">
          {inspectingCards.map((card) => {
            const isEditing = editingCardId === card.id;
            const prog = progress.find((p) => p.cardId === card.id);
            return (
              <div
                key={card.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs text-slate-500">
                    <span className="font-mono-nums font-semibold text-indigo-700">
                      #{card.cardNumber}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span className="capitalize">{card.questionStyle}</span>
                    {prog && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="capitalize font-medium text-slate-700">
                          Rated {prog.difficulty}
                        </span>
                      </>
                    )}
                  </p>

                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCardId(card.id);
                        setEditQuestion(card.question);
                        setEditAnswer(card.answer);
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Card
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={async () => {
                          setBusyAction(true);
                          try {
                            await updateFlashcardContent(card.id, {
                              question: editQuestion,
                              answer: editAnswer,
                            });
                            setEditingCardId(null);
                          } finally {
                            setBusyAction(false);
                          }
                        }}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 mt-2">
                    <textarea
                      rows={2}
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      rows={3}
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            My Flashcard Decks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automatically organized by detected academic subject and topic.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToScan}
          className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-95 whitespace-nowrap self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          New Scan
        </button>
      </div>

      {/* Search & Subject Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, subjects, or flashcard terms..."
            className="w-full min-h-[46px] pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                onClearInitialSubjectFilter();
                setSelectedSubject('All');
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeSubjectFilter === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => {
              const active =
                activeSubjectFilter.toLowerCase() === sub.name.toLowerCase();
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    onClearInitialSubjectFilter();
                    setSelectedSubject(sub.name);
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Decks List */}
      {groupedBySubject.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/90 p-8 text-center max-w-xl mx-auto">
          {!emptyArtFailed ? (
            <img
              src="/src/assets/images/flashcard_deck_art_1795390084548.jpg"
              alt="Organized stack of flashcards"
              referrerPolicy="no-referrer"
              onError={() => setEmptyArtFailed(true)}
              className="w-56 aspect-[4/3] object-cover rounded-2xl mx-auto mb-5 border border-slate-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
          )}
          <h2 className="font-display text-lg font-bold text-slate-900">
            {decks.length === 0
              ? 'Your study library is empty'
              : 'No matching flashcard decks'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            {decks.length === 0
              ? 'Snap a photo of any textbook page or lecture notes to create your first organized deck.'
              : 'Try a different search keyword or reset the subject filter.'}
          </p>
          <button
            type="button"
            onClick={
              decks.length === 0
                ? onGoToScan
                : () => {
                    setSearchQuery('');
                    onClearInitialSubjectFilter();
                    setSelectedSubject('All');
                  }
            }
            className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {decks.length === 0 ? 'Scan Your Notes' : 'Show All Decks'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedBySubject.map(([subjectName, subjectDecks]) => (
            <section key={subjectName} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <h2 className="font-display text-base font-bold text-slate-900">
                  {subjectName}
                </h2>
                <span className="text-xs text-slate-500 font-mono-nums">
                  {subjectDecks.length}{' '}
                  {subjectDecks.length === 1 ? 'deck' : 'decks'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectDecks.map((deck) => {
                  const deckProg = progress.filter((p) => p.deckId === deck.id);
                  const mastered = deckProg.filter(
                    (p) => p.difficulty === 'easy'
                  ).length;
                  const pct =
                    deck.cardCount > 0
                      ? Math.round((mastered / deck.cardCount) * 100)
                      : 0;

                  const isRenaming = renamingDeckId === deck.id;
                  const isDeleting = confirmDeleteDeckId === deck.id;

                  return (
                    <div
                      key={deck.id}
                      className="rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        {isRenaming ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="flex-1 min-h-[40px] px-3 rounded-xl border border-indigo-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={busyAction}
                              onClick={async () => {
                                setBusyAction(true);
                                try {
                                  await renameDeck(deck.id, renameValue);
                                  setRenamingDeckId(null);
                                } finally {
                                  setBusyAction(false);
                                }
                              }}
                              className="min-h-[40px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingDeckId(null)}
                              className="min-h-[40px] px-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-display text-base font-bold text-slate-900">
                              {deck.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-mono-nums">
                              {deck.cardCount} Flashcards · {mastered} Mastered ({pct}%)
                            </p>
                          </>
                        )}

                        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {isDeleting ? (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-red-800">
                            Delete this deck and its cards?
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={busyAction}
                              onClick={async () => {
                                setBusyAction(true);
                                try {
                                  await deleteDeckCascade(userId, deck.id);
                                  setConfirmDeleteDeckId(null);
                                } finally {
                                  setBusyAction(false);
                                }
                              }}
                              className="min-h-[36px] px-3 rounded-lg bg-red-600 text-white text-xs font-semibold"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDeckId(null)}
                              className="min-h-[36px] px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                            >
                              Keep
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => onStartStudyDeck(deck.id)}
                            className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Study
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setInspectingDeckId(deck.id)}
                              className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              Edit Cards
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingDeckId(deck.id);
                                setRenameValue(deck.title);
                              }}
                              aria-label={`Rename ${deck.title}`}
                              className="min-h-[42px] min-w-[42px] rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDeckId(deck.id)}
                              aria-label={`Delete ${deck.title}`}
                              className="min-h-[42px] min-w-[42px] rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
