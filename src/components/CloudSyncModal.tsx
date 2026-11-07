import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  Server
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface CloudSyncModalProps {
  onClose: () => void;
  onRefreshDecks: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  onClose,
  onRefreshDecks,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'googlecloud' | 'backup'>('supabase');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackup = () => {
    const json = storageService.exportAllAsJson();
    const filename = `snapstudy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = storageService.importFromJson(text);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count} decks!`);
        onRefreshDecks();
      } else {
        setImportStatus(`Import error: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const supabaseSqlSchema = `-- ==========================================
-- SnapStudy AI - Supabase PostgreSQL Schema
-- ==========================================

-- 1. Decks Table
create table public.decks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  summary text,
  source_image_url text,
  estimated_study_time_minutes integer default 15,
  mastery_percentage integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Flashcards Table with Leitner Spaced Repetition
create table public.flashcards (
  id text primary key,
  deck_id text references public.decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  hint text,
  core_concept text not null,
  key_formula text,
  source_snippet text,
  difficulty text default 'medium',
  leitner_box integer default 1,
  review_count integer default 0,
  next_review_at timestamp with time zone
);

-- 3. Row Level Security (RLS)
alter table public.decks enable row level security;
alter table public.flashcards enable row level security;

create policy "Users can view and manage their own decks"
  on public.decks for all
  using (auth.uid() = user_id);

create policy "Users can view and manage cards in their decks"
  on public.flashcards for all
  using (
    exists (
      select 1 from public.decks
      where decks.id = flashcards.deck_id
      and decks.user_id = auth.uid()
    )
  );
`;

  const googleCloudArchitecture = `// ==========================================
// Google Cloud Firestore Integration
// ==========================================

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "snapstudy-ai.firebaseapp.com",
  projectId: "snapstudy-ai",
  storageBucket: "snapstudy-ai.appspot.com",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save Deck to Firestore Collection
export async function syncDeckToCloud(deck) {
  const deckRef = doc(db, 'users', currentUserId, 'decks', deck.id);
  await setDoc(deckRef, deck, { merge: true });
}
`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Cloud & Supabase Integration
              </h2>
              <p className="text-xs text-slate-400">
                Persistent storage, database schemas, and cloud backups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="px-5 py-3 bg-emerald-950/30 border-b border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Local Persistence Active:</strong> All decks and Leitner study states are automatically saved to your device.
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-900/60 font-semibold text-[10px]">
            Sync OK
          </span>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Supabase PostgreSQL
          </button>
          <button
            onClick={() => setActiveTab('googlecloud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'googlecloud'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Cloud Firestore
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup & Restore
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === 'supabase' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">PostgreSQL & Row-Level Security Schema</h4>
                  <p className="text-[11px] text-slate-400">
                    Ready to paste into the Supabase SQL Editor.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(supabaseSqlSchema)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                  <code>{supabaseSqlSchema}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'googlecloud' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Google Cloud Firestore Integration</h4>
                  <p className="text-[11px] text-slate-400">
                    Cloud Firestore SDK integration for multi-device sync.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(googleCloudArchitecture)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Code' : 'Copy Snippet'}</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                  <code>{googleCloudArchitecture}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Download Full Library Backup</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export all your flashcard decks, cards, Leitner review progress, and study statistics into a single portable JSON file.
                </p>
                <button
                  onClick={handleBackup}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON Backup</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Restore from JSON Backup</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Import a previous SnapStudy JSON backup. New decks will be merged cleanly.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Select JSON File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                {importStatus && (
                  <p className="text-xs font-semibold text-emerald-400 mt-2">
                    {importStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
