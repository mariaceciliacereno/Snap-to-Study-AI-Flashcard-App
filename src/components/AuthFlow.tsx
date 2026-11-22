import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Layers,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';

type AuthScreen = 'welcome' | 'login' | 'signup' | 'forgot';

function formatAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in the Firebase Console Authentication settings. You can continue instantly with Google Sign-In below, or enable Email/Password in Firebase Console.';
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (raw.includes('auth/user-not-found')) {
    return 'No account found with this email address. Please sign up first.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Please choose a stronger password with at least 6 characters.';
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'Sign-in window was closed before completing authentication.';
  }
  return raw;
}

export function AuthFlow() {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendVerificationEmail,
    refreshAuthUser,
    logout,
  } = useAuth();

  const [screen, setScreen] = useState<AuthScreen>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Email verification gate when signed in via Email/Password before clicking link
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-5">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BrandLogo size="md" />
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">
                Snap-to-Study AI
              </h1>
              <p className="text-xs text-slate-500">Verify your student email</p>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>

          <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
            Check your inbox
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            We sent a verification link to{' '}
            <span className="font-semibold text-slate-900">{user.email}</span>.
            Confirm your email so your private study decks stay securely synced.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700">
              {notice}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                setError(null);
                try {
                  const verified = await refreshAuthUser();
                  if (!verified) {
                    setError('Email is not verified yet. Please click the link in your inbox first.');
                  }
                } catch (err) {
                  setError(formatAuthError(err));
                } finally {
                  setSubmitting(false);
                }
              }}
              className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              I&apos;ve Verified — Continue
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                setError(null);
                setNotice(null);
                try {
                  await resendVerificationEmail();
                  setNotice('Verification email resent. Check your inbox and spam folder.');
                } catch (err) {
                  setError(formatAuthError(err));
                } finally {
                  setSubmitting(false);
                }
              }}
              className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Resend Verification Email
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full min-h-[44px] text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (screen === 'login') {
        await signInWithEmail(email, password);
      } else if (screen === 'signup') {
        await signUpWithEmail(displayName, email, password);
      } else if (screen === 'forgot') {
        await resetPassword(email);
        setNotice('Password reset link sent! Check your email inbox.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
        <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                Snap-to-Study AI
              </span>
              <span className="text-xs text-slate-500">
                Snap · Learn · Remember
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setNotice(null);
                setScreen('login');
              }}
              className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-colors whitespace-nowrap"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setNotice(null);
                setScreen('signup');
              }}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              Sign Up
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12] [text-wrap:balance]">
              Turn any textbook page or lecture note into 20 flashcards in seconds.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Snap a photo with your camera or upload study notes. Our AI reads your material, automatically detects the subject and topic, and builds an interactive 20-card active recall deck.
            </p>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleSignIn}
                className="min-h-[50px] px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                    />
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setScreen('signup');
                }}
                className="min-h-[50px] px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Create Student Account
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Snap Notes</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Single or multi-page camera &amp; gallery capture
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">20 Flashcards</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Auto-detected subject, topic, and grounded Q&amp;A
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Active Recall</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    3D flip cards with Easy, Medium &amp; Difficult tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/study_desk_hero_1795390085480.jpg"
                  alt="Student scanning handwritten biology and computer science notes with Snap-to-Study AI"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-100 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-indigo-500" />
                </div>
              )}
              <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Automatic Topic Detection
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Science · Information Technology · Mathematics · Humanities
                  </p>
                </div>
                <span className="font-mono-nums text-xs font-semibold text-indigo-700 shrink-0">
                  20 cards / scan
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-5">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-7 sm:p-8 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setNotice(null);
            setScreen('welcome');
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <BrandLogo size="md" />
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              {screen === 'login'
                ? 'Welcome back'
                : screen === 'signup'
                  ? 'Create your account'
                  : 'Reset password'}
            </h1>
            <p className="text-xs text-slate-500">
              {screen === 'login'
                ? 'Access your saved flashcard decks anywhere'
                : screen === 'signup'
                  ? 'Start turning notes into flashcards'
                  : 'We will email you a password reset link'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 leading-relaxed">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 leading-relaxed">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-4">
          {screen === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Student Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@university.edu"
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {screen !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                {screen === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setNotice(null);
                      setScreen('forgot');
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {screen === 'login'
              ? 'Log In'
              : screen === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
          </button>
        </form>

        {screen !== 'forgot' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              className="w-full min-h-[46px] rounded-2xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          {screen === 'login' ? (
            <>
              New to Snap-to-Study AI?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setScreen('signup');
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setScreen('login');
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
