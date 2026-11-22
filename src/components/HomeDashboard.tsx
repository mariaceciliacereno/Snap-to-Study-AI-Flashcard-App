import {
  ArrowRight,
  BookOpen,
  Camera,
  FolderOpen,
  Layers,
  Upload,
} from 'lucide-react';
import type {
  AppTab,
  FlashcardDeckRecord,
  FlashcardRecord,
  StudyProgressRecord,
  SubjectRecord,
  UserProfile,
} from '../types/study.ts';

interface HomeDashboardProps {
  profile: UserProfile | null;
  fallbackName: string;
  subjects: SubjectRecord[];
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  onNavigateTab: (tab: AppTab) => void;
  onStartQuickUpload: () => void;
  onOpenDeckStudy: (deckId: string) => void;
  onSelectSubjectFilter: (subjectName: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeDashboard({
  profile,
  fallbackName,
  subjects,
  decks,
  flashcards,
  progress,
  onNavigateTab,
  onStartQuickUpload,
  onOpenDeckStudy,
  onSelectSubjectFilter,
}: HomeDashboardProps) {
  const fullName = profile?.displayName || fallbackName || 'Student';
  const firstName = fullName.split(' ')[0];

  const totalCards = flashcards.length;
  const totalDecks = decks.length;
  const masteredCount = progress.filter((p) => p.difficulty === 'easy').length;
  const reviewedCount = progress.length;
  const progressPct =
    totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  const recentDecks = decks.slice(0, 4);
  const recentCards = flashcards.slice(0, 4);

  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (progressPct / 100) * ringCircumference;

  return (
    <div className="space-y-8">
      {/* Hero Greeting + Primary Scan CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm font-medium text-indigo-100 mb-1.5">
            {getGreeting()}, {firstName}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance]">
            Ready to turn today&apos;s notes into active recall?
          </h1>
          <p className="text-sm text-indigo-100/90 mt-2 max-w-xl leading-relaxed">
            Capture textbook pages, lecture slides, or handwritten notes. Gemini AI automatically detects your topic and builds 20 flashcards.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('scan')}
              className="min-h-[54px] px-7 py-3.5 rounded-2xl bg-white text-indigo-700 font-display font-bold text-base flex items-center justify-center gap-3 shadow-md hover:bg-indigo-50 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              <Camera className="w-5 h-5" />
              Scan Your Notes
            </button>

            <button
              type="button"
              onClick={onStartQuickUpload}
              className="min-h-[54px] px-6 py-3.5 rounded-2xl bg-white/15 border border-white/25 text-white font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </button>
          </div>
        </div>
      </section>

      {/* Key Metrics Strip */}
      <section aria-label="Study statistics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Flashcards Created
            </p>
            <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
              {totalCards}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Study Decks
            </p>
            <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
              {totalDecks}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Study Progress
            </p>
            <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
              {progressPct}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono-nums">
              {masteredCount} easy · {reviewedCount} reviewed
            </p>
          </div>
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
            <circle
              cx="22"
              cy="22"
              r={ringRadius}
              stroke="#E2E8F0"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="22"
              cy="22"
              r={ringRadius}
              stroke="#4F46E5"
              strokeWidth="4"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </section>

      {/* Quick Access to Saved Subjects */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Saved Subjects
          </h2>
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('decks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 min-h-[44px]"
            >
              Browse all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 text-sm text-slate-500">
            Subjects appear automatically here as soon as you scan your first study topic.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {subjects.map((subject) => {
              const count = decks.filter(
                (d) => d.subjectName.toLowerCase() === subject.name.toLowerCase()
              ).length;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onSelectSubjectFilter(subject.name)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors flex items-center gap-2.5 text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.accentColor }}
                  />
                  <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {subject.name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono-nums whitespace-nowrap">
                    {count} {count === 1 ? 'deck' : 'decks'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-Column Lower Content: My Flashcard Decks + Recently Generated Flashcards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              My Flashcard Decks
            </h2>
            {decks.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('decks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 min-h-[44px]"
              >
                View all decks
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentDecks.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/90 p-7 text-center">
              <p className="font-display text-base font-semibold text-slate-900">
                No flashcard decks yet
              </p>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Tap &ldquo;Scan Your Notes&rdquo; to generate your first 20-card study deck.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('scan')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Scan First Page
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
              {recentDecks.map((deck) => {
                const deckProgress = progress.filter((p) => p.deckId === deck.id);
                const easyCount = deckProgress.filter((p) => p.difficulty === 'easy').length;
                return (
                  <div
                    key={deck.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 truncate">
                        <span>{deck.subjectName}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono-nums">{deck.cardCount} cards</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono-nums">{easyCount} mastered</span>
                      </p>
                      <h3 className="font-display text-base font-bold text-slate-900 truncate mt-0.5">
                        {deck.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenDeckStudy(deck.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Study
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Recently Generated Flashcards
            </h2>
          </div>

          {recentCards.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/90 p-7 text-sm text-slate-500">
              Your latest generated questions and answers will appear here for quick review.
            </div>
          ) : (
            <div className="space-y-3">
              {recentCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onOpenDeckStudy(card.deckId)}
                  className="w-full text-left rounded-2xl bg-white border border-slate-200/90 p-4 hover:border-indigo-300 transition-colors"
                >
                  <p className="text-xs text-slate-500 mb-1">
                    <span>{card.subject}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{card.topic}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-nums">#{card.cardNumber}</span>
                  </p>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {card.question}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-1.5">
                    {card.answer}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
