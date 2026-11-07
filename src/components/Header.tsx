import React from 'react';
import { Camera, Sparkles, Smartphone, Monitor, Database, Download, Flame, CheckCircle2, BookOpen } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenExport: () => void;
  onOpenCloudSync: () => void;
  activeTab: 'snap' | 'decks';
  setActiveTab: (tab: 'snap' | 'decks') => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isMobileFrame,
  setIsMobileFrame,
  onOpenExport,
  onOpenCloudSync,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/25">
            <Camera className="w-5 h-5 text-white" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                SnapStudy AI
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-full">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Snap notes · 20 flashcards in seconds</p>
          </div>
        </div>

        {/* Center Nav Tabs (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('snap')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'snap'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('decks')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'decks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Decks</span>
          </button>
        </nav>

        {/* Right Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak & Cards Stats */}
          <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-400" title="Daily study streak">
              <Flame className="w-4 h-4 fill-amber-400/20" />
              <span className="font-bold">{stats.studyStreakDays}d streak</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-emerald-400" title="Cards mastered in Leitner box 4+">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold">{stats.totalCardsLearned} mastered</span>
            </div>
          </div>

          {/* Cloud / Supabase Sync */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors"
            title="Cloud & Supabase Integration"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cloud Sync</span>
          </button>

          {/* Export / React Native */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors"
            title="Export to Anki, Quizlet, and React Native"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export & Code</span>
          </button>

          {/* Mobile / Responsive Shell Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
              isMobileFrame
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title={isMobileFrame ? 'Switch to Expanded View' : 'Switch to React Native Mobile Frame'}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
