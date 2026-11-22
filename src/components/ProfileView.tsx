import React, { useEffect, useState } from 'react';
import { Check, Loader2, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { updateUserProfile } from '../lib/studyService.ts';
import type {
  FlashcardDeckRecord,
  FlashcardRecord,
  ScannedDocumentRecord,
  StudyProgressRecord,
} from '../types/study.ts';

interface ProfileViewProps {
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  scans: ScannedDocumentRecord[];
  onOpenDeckStudy: (deckId: string) => void;
}

export function ProfileView({
  decks,
  flashcards,
  progress,
  scans,
  onOpenDeckStudy,
}: ProfileViewProps) {
  const { user, profile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [goal, setGoal] = useState(profile?.studyGoalDaily ?? 20);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setGoal(profile.studyGoalDaily);
    }
  }, [profile]);

  const masteredCount = progress.filter((p) => p.difficulty === 'easy').length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedMsg(false);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        studyGoalDaily: goal,
      });
      setSavedMsg(true);
      window.setTimeout(() => setSavedMsg(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Student Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your study preferences and review scan history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Account Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-6">
        <div className="flex items-center gap-4">
          {profile?.photoUrl || user?.photoURL ? (
            <img
              src={profile?.photoUrl || user?.photoURL || ''}
              alt={displayName || 'Student'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-slate-900 truncate">
              {profile?.displayName || user?.displayName || 'Student'}
            </h2>
            <p className="text-sm text-slate-500 truncate">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="profile-goal"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Daily Flashcard Goal
              </label>
              <select
                id="profile-goal"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10 cards / day</option>
                <option value={20}>20 cards / day</option>
                <option value={40}>40 cards / day</option>
                <option value={60}>60 cards / day</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Preferences
            </button>
            {savedMsg && (
              <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Study Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs text-slate-500">Scans</p>
          <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
            {scans.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs text-slate-500">Decks</p>
          <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
            {decks.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs text-slate-500">Flashcards</p>
          <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
            {flashcards.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs text-slate-500">Mastered</p>
          <p className="font-display font-mono-nums text-2xl font-bold text-slate-900 mt-1">
            {masteredCount}
          </p>
        </div>
      </div>

      {/* Scanned Documents History */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Recent Note Scans
        </h2>

        {scans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 text-sm text-slate-500">
            Your captured study page records will appear here after your first scan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => onOpenDeckStudy(scan.deckId)}
                className="rounded-2xl bg-white border border-slate-200/90 p-3.5 flex items-center gap-3.5 text-left hover:border-indigo-300 transition-colors"
              >
                {scan.thumbnailDataUrl ? (
                  <img
                    src={scan.thumbnailDataUrl}
                    alt={scan.topic}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-mono-nums text-xs font-bold">
                    {scan.pageCount}p
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 truncate">
                    {scan.subjectName} · {scan.pageCount}{' '}
                    {scan.pageCount === 1 ? 'page' : 'pages'}
                  </p>
                  <p className="font-display text-sm font-bold text-slate-900 truncate mt-0.5">
                    {scan.topic}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
