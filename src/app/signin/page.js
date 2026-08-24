'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react';
import { useAuth, consumeAuthRedirectNext, userInitials, userDisplayName } from '@/lib/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInWithGoogle, oauthError, userAvatar } = useAuth();

  const nextQp = searchParams?.get('next') || '';
  const redirectQp = searchParams?.get('redirect') || '';
  const stageFlag = searchParams?.get('stage') === '1';
  const queryNext = nextQp || redirectQp;

  const _fallbackTimeoutRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // (A) If user is already signed in: consume stashed destination & redirect.
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let destination = '/dashboard';
    // Prefer stashed OAuth next URL (set by signInWithGoogle({ nextRelative }))
    const stashed = consumeAuthRedirectNext();
    if (stashed) destination = stashed;
    else if (queryNext) destination = queryNext;

    // Safety: don't redirect back to /signin itself (prevents a refresh loop)
    if (typeof destination === 'string' && destination.split('?')[0].replace(/\/+$/, '') === '/signin') {
      destination = '/dashboard';
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const cleanUrl = `${window.location.pathname}${hash.length ? `#${hash.replace(/^#/, '')}` : ''}`;
    window.history.replaceState(null, '', cleanUrl);

    setRedirecting(true);

    // Primary navigation: Next router
    const t1 = setTimeout(() => {
      try {
        router.replace(destination);
      } catch (navErr) {
        console.warn('[signin] router.replace failed, falling back to window.location:', navErr);
        window.location.assign(destination);
        return;
      }
      // Fallback hard redirect if the router did not navigate within ~1.8s.
      // This catches App Router edge cases where client router silently hangs
      // on redirect loops or blocked route changes.
      const t2 = setTimeout(() => {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== destination.split('?')[0]
        ) {
          window.location.assign(destination);
        }
      }, 1800);
      _fallbackTimeoutRef.current = t2;
    }, 350);
    return () => {
      clearTimeout(t1);
      if (_fallbackTimeoutRef.current) clearTimeout(_fallbackTimeoutRef.current);
    };
  }, [user, loading, queryNext, router]);

  const handleGoogleSignIn = async (e) => {
    e?.preventDefault();
    setLocalError('');
    setSubmitting(true);
    // Pass staged /?next= as the OAuth callback destination (if any).
    const nextRelative = queryNext || (stageFlag ? window.location.pathname : '/dashboard');
    const res = await signInWithGoogle({ nextRelative });
    if (!res?.ok) {
      setSubmitting(false);
      const msg = res?.error?.message || 'Google sign-in could not be started. Please try again.';
      setLocalError(msg);
    }
  };

  const signedIn = Boolean(user && !loading);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <span className="relative inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 overflow-hidden">
              <Image
                src="/logo.webp"
                alt="Web Invites"
                width={48}
                height={48}
                className="object-contain scale-[1.05]"
                priority
                unoptimized
              />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-bold tracking-wide text-[15px] sm:text-[16px] text-[var(--ink)] group-hover:text-[var(--emerald-primary)] transition-colors">
                WEB INVITES
              </span>
              <span className="text-[10px] sm:text-[11px] text-[var(--ink-soft)] font-medium tracking-wide uppercase">
                ₹299  ·
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-[var(--ink-soft)] hover:bg-stone-50 hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to templates
          </Link>
        </div>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[440px] relative">
          {/* Floating decorative blobs */}
          <div className="absolute -top-16 -left-14 w-40 h-40 bg-[var(--gold-primary)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -right-10 w-52 h-52 bg-[var(--emerald-primary)]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative bg-white rounded-3xl sm:rounded-[2rem] shadow-[0_30px_80px_rgba(15,56,44,0.12)] border border-stone-100 overflow-hidden">
            {/* Header ribbon */}
            <div className="relative px-6 sm:px-8 pt-8 pb-6 text-center bg-gradient-to-b from-[var(--emerald-light)]/40 via-white to-white">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white ring-1 ring-[var(--emerald-primary)]/10 shadow-[0_10px_30px_rgba(15,56,44,0.08)] mb-4">
                {signedIn && userAvatar ? (
                  <img src={userAvatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : signedIn ? (
                  <span className="h-14 w-14 rounded-full bg-[var(--emerald-primary)] text-white flex items-center justify-center font-bold text-lg">
                    {userInitials(user)}
                  </span>
                ) : (
                  <img
                    width="32"
                    height="32"
                    src="/user-male-circle.png"
                    alt="Account icon"
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              <h1 className="font-display text-[clamp(1.6rem,3vw,2rem)] text-[var(--ink)] leading-tight mb-1.5">
                {signedIn
                  ? <>Welcome back, <span className="text-[var(--emerald-primary)]">{userDisplayName(user)}</span></>
                  : 'Sign in to Web Invites'}
              </h1>
              <p className="text-[13px] sm:text-sm text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
                {signedIn
                  ? 'You are signed in securely with your Google account. Taking you to your dashboard…'
                  : 'Use your Google account to manage your invitations, edit designs, and republish any time. No passwords.'}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 pb-7 sm:pb-8">
              {/* Errors */}
              {(localError || oauthError) && !signedIn && (
                <div className="mb-5 rounded-2xl bg-red-50 border border-red-200/80 px-4 py-3 text-[13px] text-red-700 leading-relaxed">
                  {localError || oauthError}
                </div>
              )}

              {/* Signed-in welcome state (show briefly before redirect) */}
              {signedIn && (
                <div className="rounded-2xl bg-[var(--emerald-light)]/50 border border-[var(--emerald-primary)]/10 px-4 py-4 text-[13px] sm:text-sm text-[var(--emerald-dark)] leading-relaxed flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--emerald-primary)]" />
                  <div>
                    <div className="font-bold mb-0.5">Signed in successfully</div>
                    <div className="opacity-80">
                      Redirecting you in a moment…
                    </div>
                  </div>
                </div>
              )}

              {/* Google button */}
              {!signedIn && (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={submitting || loading}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-5 py-3.5 sm:py-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-[0_1px_2px_rgba(15,56,44,0.04),0_4px_16px_rgba(15,56,44,0.06)] hover:shadow-[0_4px_18px_rgba(15,56,44,0.10)] text-[var(--ink)] font-bold text-sm sm:text-[15px] transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center">
                      <svg viewBox="0 0 48 48" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.57l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                      </svg>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {submitting ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          Redirecting to Google…
                        </>
                      ) : loading ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          Loading account…
                        </>
                      ) : (
                        <>Continue with Google</>
                      )}
                    </span>
                  </button>

                  {/* Feature rows */}
                  <div className="mt-6 sm:mt-7 grid gap-2.5">
                    {[
                      { icon: <PartyPopper className="w-4.5 h-4.5 text-[var(--gold-primary)]" />, label: 'Access all your invitations from any device' },
                      { icon: <CheckCircle2 className="w-4.5 h-4.5 text-[var(--emerald-primary)]" />, label: 'Edit designs & re-publish to the same share link' },
                      { icon: <ShieldCheck className="w-4.5 h-4.5 text-[var(--ink-muted)]" />, label: 'Secure one-tap Google OAuth — no passwords to remember' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-2xl bg-stone-50/60 border border-stone-100 px-3.5 py-2.5 text-[12px] sm:text-[13px] text-[var(--ink-soft)]">
                        <span className="mt-0.5 shrink-0">{row.icon}</span>
                        <span className="leading-relaxed">{row.label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 text-[11px] sm:text-xs text-center text-[var(--ink-muted)] leading-relaxed">
                    By continuing, you agree to create a Web Invites account linked to your Google email.
                    We only use your name & email for ownership of invitation links you publish.
                  </p>
                </>
              )}

              {signedIn && redirecting && (
                <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-[var(--ink-soft)] font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--emerald-primary)]" />
                  Redirecting…
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FAF8F5] text-[var(--ink)] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--emerald-primary)]" />
      </main>
    }>
      <SignInContent />
    </Suspense>
  );
}
