import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Play,
  HelpCircle,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  Zap,
  Flame
} from 'lucide-react';
import { FlashcardDeck } from '../types';

interface DeckListViewProps {
  decks: FlashcardDeck[];
  onSelectDeckToStudy: (deck: FlashcardDeck) => void;
  onSelectDeckToQuiz: (deck: FlashcardDeck) => void;
  onOpenDeckDetail: (deck: FlashcardDeck) => void;
  onExportDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onGoToCamera: () => void;
}

export const DeckListView: React.FC<DeckListViewProps> = ({
  decks,
  onSelectDeckToStudy,
  onSelectDeckToQuiz,
  onOpenDeckDetail,
  onExportDeck,
  onDeleteDeck,
  onGoToCamera,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'cards' | 'mastery'>('newest');

  // Extract unique subjects
  const subjects = useMemo(() => {
    const list = ['All'];
    decks.forEach((d) => {
      if (d.subject && !list.includes(d.subject)) {
        list.push(d.subject);
      }
    });
    return list;
  }, [decks]);

  // Filter & sort decks
  const filteredDecks = useMemo(() => {
    return decks
      .filter((deck) => {
        const matchesSubject = selectedSubject === 'All' || deck.subject === selectedSubject;
        const matchesSearch =
          deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deck.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deck.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSubject && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'cards') return b.cards.length - a.cards.length;
        if (sortBy === 'mastery') return (b.masteryPercentage || 0) - (a.masteryPercentage || 0);
        return 0;
      });
  }, [decks, searchQuery, selectedSubject, sortBy]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Study Decks Library</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              {decks.length} Decks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Flashcards synthesized from your camera snaps with Leitner spaced repetition.
          </p>
        </div>

        <button
          onClick={onGoToCamera}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Snap New Notes</span>
        </button>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks, subjects, key definitions, or formulas..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/90 px-3 py-2 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900">Newest</option>
              <option value="cards" className="bg-slate-900">Most Cards</option>
              <option value="mastery" className="bg-slate-900">Highest Mastery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
          {subjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === subj
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      )}

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Decks Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? 'Try modifying your search query or subject filters.'
              : 'Snap a picture of your textbook or lecture notes to automatically generate your 20-card deck!'}
          </p>
          <button
            onClick={onGoToCamera}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
          >
            Open AI Camera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => {
            const mastery = deck.masteryPercentage || 0;
            const masteredCount = deck.cards.filter((c) => (c.box || 1) >= 4).length;
            const learningCount = deck.cards.filter((c) => (c.box || 1) < 4).length;

            return (
              <div
                key={deck.id}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-950/30"
              >
                <div>
                  {/* Card Header with Subject and Source Thumbnail */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/90 border border-indigo-800/50 px-2.5 py-0.5 rounded-lg shadow-sm">
                        {deck.subject || 'General'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {deck.estimatedStudyTimeMinutes}m
                      </span>
                    </div>

                    {deck.sourceImage && (
                      <div
                        onClick={() => onOpenDeckDetail(deck)}
                        className="w-11 h-11 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                        title="View original scanned note"
                      >
                        <img
                          src={deck.sourceImage}
                          alt={deck.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3
                    onClick={() => onOpenDeckDetail(deck)}
                    className="text-base font-extrabold text-white hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1 mb-1.5 tracking-tight"
                  >
                    {deck.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {deck.summary}
                  </p>
                </div>

                <div>
                  {/* Spaced Repetition Mastery Progress Bar */}
                  <div className="mb-4 bg-slate-950/90 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{deck.cards.length} Flashcards</span>
                      </span>
                      <span className="text-emerald-400 font-bold">{mastery}% Mastered</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                      <span>{masteredCount} in Leitner Box 4-5</span>
                      <span>{learningCount} to review</span>
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => onSelectDeckToStudy(deck)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Study</span>
                    </button>

                    <button
                      onClick={() => onSelectDeckToQuiz(deck)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
                      title="Test yourself with 4-choice Quiz"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                    </button>

                    <button
                      onClick={() => onExportDeck(deck)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
                      title="Export to Anki / Quizlet / React Native"
                    >
                      <Download className="w-4 h-4 text-sky-400" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete deck "${deck.title}"?`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
