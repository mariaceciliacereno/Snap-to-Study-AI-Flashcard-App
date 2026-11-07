import React, { useState } from 'react';
import {
  X,
  Play,
  HelpCircle,
  Download,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Check,
  Quote,
  Sparkles,
  Layers,
  Clock,
  BookOpen
} from 'lucide-react';
import { FlashcardDeck, Flashcard } from '../types';

interface DeckDetailModalProps {
  deck: FlashcardDeck;
  onClose: () => void;
  onUpdateDeck: (updated: FlashcardDeck) => void;
  onStudy: (deck: FlashcardDeck) => void;
  onQuiz: (deck: FlashcardDeck) => void;
  onExport: (deck: FlashcardDeck) => void;
}

export const DeckDetailModal: React.FC<DeckDetailModalProps> = ({
  deck,
  onClose,
  onUpdateDeck,
  onStudy,
  onQuiz,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'source'>('cards');
  const [selectedCardForSource, setSelectedCardForSource] = useState<Flashcard | null>(deck.cards[0] || null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newConcept, setNewConcept] = useState('');

  const handleAddCard = () => {
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `card_${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      hint: newHint.trim(),
      coreConcept: newConcept.trim() || 'Custom Note',
      sourceSnippet: 'Added manually',
      difficulty: 'medium',
      box: 1,
      reviewCount: 0,
    };
    const updated = {
      ...deck,
      cards: [...deck.cards, newCard],
      updatedAt: Date.now(),
    };
    onUpdateDeck(updated);
    setNewFront('');
    setNewBack('');
    setNewHint('');
    setNewConcept('');
    setIsAddingCard(false);
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = {
      ...deck,
      cards: deck.cards.filter((c) => c.id !== cardId),
      updatedAt: Date.now(),
    };
    onUpdateDeck(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/40 px-2.5 py-0.5 rounded-md">
                {deck.subject}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{deck.estimatedStudyTimeMinutes} min study
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {deck.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl line-clamp-2">
              {deck.summary}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & tabs */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards ({deck.cards.length})</span>
            </button>
            {deck.sourceImage && (
              <button
                onClick={() => setActiveTab('source')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'source'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Source Snapshot & Audit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onStudy(deck)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Study Deck</span>
            </button>
            <button
              onClick={() => onQuiz(deck)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Quiz Mode</span>
            </button>
            <button
              onClick={() => onExport(deck)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 'cards' ? (
            <div className="space-y-4">
              {/* Add Card Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {deck.cards.length} cards extracted via Gemini 3.8 Flash
                </span>
                <button
                  onClick={() => setIsAddingCard(!isAddingCard)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingCard ? 'Cancel' : 'Add Custom Card'}</span>
                </button>
              </div>

              {/* Add Card Form */}
              {isAddingCard && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300">New Flashcard</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Front (Question / Prompt)</label>
                      <textarea
                        value={newFront}
                        onChange={(e) => setNewFront(e.target.value)}
                        placeholder="e.g. What is the role of ATP Synthase?"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Back (Answer / Explanation)</label>
                      <textarea
                        value={newBack}
                        onChange={(e) => setNewBack(e.target.value)}
                        placeholder="e.g. Enzyme that synthesizes ATP using proton motive force."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      placeholder="Core Concept (e.g. Chemiosmosis)"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                    <input
                      type="text"
                      value={newHint}
                      onChange={(e) => setNewHint(e.target.value)}
                      placeholder="Hint / Mnemonic (Optional)"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddCard}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
                  >
                    Save Flashcard
                  </button>
                </div>
              )}

              {/* Cards List */}
              <div className="grid grid-cols-1 gap-3">
                {deck.cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-colors flex flex-col md:flex-row items-start justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-400">
                          {card.coreConcept}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Box {card.box || 1}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white">
                        {card.front}
                      </p>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        {card.back}
                      </p>

                      {card.sourceSnippet && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-400 italic">
                          <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span>Source Quote: "{card.sourceSnippet}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-start">
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Source Snapshot & Verification Audit Tab */
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs text-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    <strong>Accuracy Audit:</strong> Click any card below to verify that its concept matches the photographed textbook notes!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Scanned Image Preview */}
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-400 mb-2">Original Scanned Photo / Notes</span>
                  <div className="w-full max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-black flex items-center justify-center">
                    <img
                      src={deck.sourceImage}
                      alt="Scanned Source"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

                {/* Card citation verifier */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 block">Select Card to Audit Citation</span>
                  <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                    {deck.cards.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCardForSource(c)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedCardForSource?.id === c.id
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <p className="text-xs font-bold text-white mb-1">
                          #{i + 1} {c.front}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                          {c.back}
                        </p>
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px] text-indigo-200 italic">
                          " {c.sourceSnippet || 'Extracted from visual structure.'} "
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
