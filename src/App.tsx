import { useEffect, useState } from 'react';
import {
  BookOpen,
  Camera,
  FolderOpen,
  Home,
  Loader2,
  LogOut,
  User,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthFlow } from './components/AuthFlow.tsx';
import { BrandLogo } from './components/BrandLogo.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { HomeDashboard } from './components/HomeDashboard.tsx';
import { MyDecksView } from './components/MyDecksView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { ScanWorkspace } from './components/ScanWorkspace.tsx';
import { StudySessionView } from './components/StudySessionView.tsx';
import { subscribeToUserStudyData } from './lib/studyService.ts';
import type {
  AppTab,
  FlashcardDeckRecord,
  FlashcardRecord,
  ScannedDocumentRecord,
  StudyProgressRecord,
  SubjectRecord,
} from './types/study.ts';

function AuthenticatedApp() {
  const { user, profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [triggerUploadNonce, setTriggerUploadNonce] = useState(0);

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [decks, setDecks] = useState<FlashcardDeckRecord[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardRecord[]>([]);
  const [progress, setProgress] = useState<StudyProgressRecord[]>([]);
  const [scans, setScans] = useState<ScannedDocumentRecord[]>([]);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setSubjects([]);
      setDecks([]);
      setFlashcards([]);
      setProgress([]);
      setScans([]);
      return;
    }

    const unsub = subscribeToUserStudyData(user.uid, {
      onSubjects: setSubjects,
      onDecks: setDecks,
      onFlashcards: setFlashcards,
      onProgress: setProgress,
      onScans: setScans,
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            Loading Snap-to-Study AI...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return <AuthFlow />;
  }

  const handleOpenDeckStudy = (deckId: string) => {
    setSelectedDeckId(deckId);
    setActiveTab('study');
  };

  const handleSelectSubjectFilter = (subjectName: string) => {
    setSubjectFilter(subjectName);
    setActiveTab('decks');
  };

  const handleStartQuickUpload = () => {
    setActiveTab('scan');
    setTriggerUploadNonce((n) => n + 1);
  };

  const userInitial = (
    profile?.displayName ||
    user.displayName ||
    user.email ||
    'S'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <BrandLogo size="md" />
          <div className="min-w-0">
            <span className="font-display text-base font-bold text-slate-900 block truncate">
              Snap-to-Study AI
            </span>
            <span className="text-xs text-slate-500 block truncate">
              Snap · Learn · Remember
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'home'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            Home
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`w-full min-h-[48px] px-3.5 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white shadow-sm'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            Scan Notes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decks')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'decks'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            My Decks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'study'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Study
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Profile
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 min-w-0 text-left min-h-[44px]"
            >
              <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-display font-bold text-sm flex items-center justify-center shrink-0">
                {userInitial}
              </span>
              <span className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {profile?.displayName || user.displayName || 'Student'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Log out"
              className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Top Header (52px) */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 min-w-0"
        >
          <BrandLogo size="sm" />
          <span className="font-display text-base font-bold text-slate-900 truncate">
            Snap-to-Study AI
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          aria-label="Open profile"
          className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-display font-bold text-sm flex items-center justify-center shrink-0"
        >
          {userInitial}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'home' && (
            <HomeDashboard
              profile={profile}
              fallbackName={user.displayName || user.email?.split('@')[0] || 'Student'}
              subjects={subjects}
              decks={decks}
              flashcards={flashcards}
              progress={progress}
              onNavigateTab={setActiveTab}
              onStartQuickUpload={handleStartQuickUpload}
              onOpenDeckStudy={handleOpenDeckStudy}
              onSelectSubjectFilter={handleSelectSubjectFilter}
            />
          )}

          {activeTab === 'scan' && (
            <ScanWorkspace
              userId={user.uid}
              triggerUploadNonce={triggerUploadNonce}
              onDeckSaved={(deckId, startImmediately) => {
                setSelectedDeckId(deckId);
                setActiveTab(startImmediately ? 'study' : 'decks');
              }}
            />
          )}

          {activeTab === 'decks' && (
            <MyDecksView
              userId={user.uid}
              subjects={subjects}
              decks={decks}
              flashcards={flashcards}
              progress={progress}
              initialSubjectFilter={subjectFilter}
              onClearInitialSubjectFilter={() => setSubjectFilter('')}
              onStartStudyDeck={handleOpenDeckStudy}
              onGoToScan={() => setActiveTab('scan')}
            />
          )}

          {activeTab === 'study' && (
            <StudySessionView
              userId={user.uid}
              decks={decks}
              flashcards={flashcards}
              progress={progress}
              selectedDeckId={selectedDeckId}
              onSelectDeckId={setSelectedDeckId}
              onGoToScan={() => setActiveTab('scan')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              decks={decks}
              flashcards={flashcards}
              progress={progress}
              scans={scans}
              onOpenDeckStudy={handleOpenDeckStudy}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Tab Navigation (Home, Scan [Emphasized], My Decks, Study, Profile) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'home' ? 'text-indigo-700' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decks')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'decks' ? 'text-indigo-700' : 'text-slate-500'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              My Decks
            </span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              aria-label="Scan your notes"
              className={`-mt-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25 flex flex-col items-center justify-center active:scale-95 transition-transform ${
                activeTab === 'scan' ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight mt-0.5">
                Scan
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'study' ? 'text-indigo-700' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Study
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'profile' ? 'text-indigo-700' : 'text-slate-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
