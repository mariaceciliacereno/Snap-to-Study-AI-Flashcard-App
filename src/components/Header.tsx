import React from 'react';
import {
  Camera,
  Sparkles,
  Smartphone,
  Monitor,
  Database,
  Download,
  Flame,
  CheckCircle2,
  BookOpen,
  Zap
} from 'lucide-react';
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
    <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Signature Logo */}
        <div
          onClick={() => setActiveTab('snap')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              {/* Inner glowing shutter aperture */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 to-cyan-400/20" />
              <Camera className="w-5 h-5 text-indigo-300 relative z-10 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full blur-[2px] opacity-80" />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SnapStudy AI
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-950/90 border border-indigo-700/60 rounded-full tracking-wider uppercase">
                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>Gemini 3.8 Flash</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Dead-simple camera · 20 verified flashcards per snap
            </p>
          </div>
        </div>

        {/* Center Navigation Switcher (Desktop) */}
        <nav className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('snap')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'snap'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('decks')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'decks'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Decks</span>
          </button>
        </nav>

        {/* Right Action Tools & Device Frame Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Daily Streak & Mastery Counters */}
          <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold" title="Consecutive study streak">
              <Flame className="w-4 h-4 fill-amber-400/20" />
              <span>{stats.studyStreakDays}d streak</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold" title="Mastered in Box 4-5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{stats.totalCardsLearned} mastered</span>
            </div>
          </div>

          {/* Cloud Sync & Supabase Integration */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all active:scale-95"
            title="Configure Cloud & Supabase Sync"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cloud Sync</span>
          </button>

          {/* Export / React Native */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95 shadow-sm"
            title="Export to Anki, Quizlet, and React Native"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export & Code</span>
          </button>

          {/* Mobile Shell vs Desktop Layout Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`p-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              isMobileFrame
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title={isMobileFrame ? 'Switch to Full Desktop View' : 'Switch to Native Mobile Smartphone Frame'}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
