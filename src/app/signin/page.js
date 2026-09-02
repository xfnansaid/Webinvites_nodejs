'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  PartyPopper,
  Heart,
  Sparkles,
  Star,
  Eye,
  Globe,
  Palette,
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

  // If user is already signed in: consume stashed destination & redirect.
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let destination = '/dashboard';
    const stashed = consumeAuthRedirectNext();
    if (stashed) destination = stashed;
    else if (queryNext) destination = queryNext;

    if (typeof destination === 'string' && destination.split('?')[0].replace(/\/+$/, '') === '/signin') {
      destination = '/dashboard';
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const cleanUrl = `${window.location.pathname}${hash.length ? `#${hash.replace(/^#/, '')}` : ''}`;
    window.history.replaceState(null, '', cleanUrl);

    setRedirecting(true);

    const t1 = setTimeout(() => {
      try {
        router.replace(destination);
      } catch (navErr) {
        window.location.assign(destination);
        return;
      }
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
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--ink)] selection:bg-[var(--emerald-primary)]/30 flex flex-col lg:flex-row">

      {/* ═══════════════════════════════════════════════════════════════
          LEFT PANEL — Dark emerald hero (hidden on mobile, shown on lg+)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden bg-gradient-to-br from-[#061812] via-[#0A261C] to-[#0D3224]">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-[var(--champagne-500)]/8 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[8%] w-80 h-80 bg-[var(--emerald-primary)]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] left-[50%] w-48 h-48 bg-[var(--champagne-400)]/6 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full px-10 xl:px-14 py-10">
          {/* Top: Logo */}
          <Link href="/" className="inline-flex items-center gap-3 group w-fit">
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10 overflow-hidden">
              <Image
                src="/logo.webp"
                alt="Web Invites"
                width={44}
                height={44}
                className="object-contain"
                priority
                unoptimized
              />
            </span>
            <span className="font-display font-bold tracking-widest text-sm text-white/80 group-hover:text-white transition-colors">
              WEB INVITES
            </span>
          </Link>

          {/* Center: Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Decorative line */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--champagne-500)]/50" />
              <Sparkles className="w-4 h-4 text-[var(--champagne-500)]" />
            </div>

            <h1 className="font-display text-[clamp(2.2rem,3.5vw,3.2rem)] font-bold text-white leading-[1.1] tracking-tight mb-5">
              Create Your
              <span className="block text-gradient-gold mt-1">
                Dream Invitation
              </span>
            </h1>

            <p className="text-base text-white/60 leading-relaxed mb-8 max-w-md">
              Design stunning digital wedding invitations in minutes.
              Choose from 25+ hand-crafted templates, customize everything
              in your browser, and share instantly.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white font-display">25+</span>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Templates</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white font-display">Free</span>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">To Publish</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white font-display">Instant</span>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Live Link</span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-[var(--champagne-500)] fill-[var(--champagne-500)]" />
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed italic mb-3">
                &ldquo;We created our wedding invite in under 5 minutes and shared it on WhatsApp.
                Every guest loved the design. Better than any printed card!&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--champagne-500)] to-[var(--champagne-600)] flex items-center justify-center text-[10px] font-bold text-white">
                  AP
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/80">Anjali & Pradeep</div>
                  <div className="text-[10px] text-white/40">Kerala Wedding · 2025</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Trust badges */}
          <div className="flex items-center gap-4 text-[11px] text-white/30">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SSL Encrypted</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Google OAuth</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>Made with love</span>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#061812] to-transparent pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT PANEL — Sign-in card
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">

        {/* Mobile-only top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-100">
          <div className="max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group min-w-0">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200 overflow-hidden">
                <Image
                  src="/logo.webp"
                  alt="Web Invites"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </span>
              <span className="font-display font-bold tracking-wide text-sm text-[var(--ink)] group-hover:text-[var(--emerald-primary)] transition-colors">
                WEB INVITES
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--ink-soft)] hover:bg-stone-50 hover:text-[var(--ink)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Templates
            </Link>
          </div>
        </div>

        {/* Centered card area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-0">
          <div className="w-full max-w-[420px]">

            {/* Desktop-only: minimal back link */}
            <div className="hidden lg:block mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to templates
              </Link>
            </div>

            {/* Sign-in card */}
            <div className="relative">
              {/* Card glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--champagne-500)]/10 via-transparent to-[var(--emerald-primary)]/10 rounded-[2rem] blur-xl opacity-60 pointer-events-none" />

              <div className="relative bg-white rounded-3xl shadow-[0_30px_80px_rgba(15,56,44,0.1)] border border-stone-100/80 overflow-hidden">
                {/* Card header */}
                <div className="px-7 sm:px-8 pt-8 sm:pt-10 pb-5 sm:pb-6 text-center">
                  {/* Logo mark */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-stone-200/80 mb-5 overflow-hidden">
                    <Image
                      src="/logo.webp"
                      alt="Web Invites"
                      width={52}
                      height={52}
                      className="object-contain scale-105"
                      priority
                      unoptimized
                    />
                  </div>

                  <h1 className="font-display text-[clamp(1.5rem,2.5vw,1.875rem)] text-[var(--ink)] leading-tight mb-2">
                    {signedIn
                      ? <>Welcome back, <span className="text-[var(--emerald-primary)]">{userDisplayName(user)}</span></>
                      : <>Start Creating</>}
                  </h1>
                  <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed max-w-sm mx-auto">
                    {signedIn
                      ? 'You are signed in securely. Taking you to your dashboard…'
                      : 'Sign in with Google to start designing your dream wedding invitation in under 5 minutes.'}
                  </p>
                </div>

                {/* Card body */}
                <div className="px-7 sm:px-8 pb-8 sm:pb-10">
                  {/* Error */}
                  {(localError || oauthError) && !signedIn && (
                    <div className="mb-5 rounded-2xl bg-red-50 border border-red-200/80 px-4 py-3 text-[13px] text-red-700 leading-relaxed flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-red-600 text-[10px] font-bold">!</span>
                      </div>
                      <span>{localError || oauthError}</span>
                    </div>
                  )}

                  {/* Signed-in welcome */}
                  {signedIn && (
                    <div className="space-y-4 mb-5">
                      <div className="rounded-2xl bg-[var(--emerald-light)]/60 border border-[var(--emerald-primary)]/10 px-4 py-4 text-[13px] text-[var(--emerald-dark)] leading-relaxed flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--emerald-primary)]" />
                        <div>
                          <div className="font-bold mb-0.5">Signed in successfully</div>
                          <div className="opacity-80">Taking you to your dashboard…</div>
                        </div>
                      </div>
                      <Link
                        href="/dashboard"
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--emerald-primary)] hover:bg-[var(--emerald-dark)] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {/* Google button */}
                  {!signedIn && (
                    <>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={submitting || loading}
                        className="w-full group relative inline-flex items-center justify-center gap-3.5 px-5 py-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 shadow-[0_2px_8px_rgba(15,56,44,0.04)] hover:shadow-[0_8px_24px_rgba(15,56,44,0.08)] text-[var(--ink)] font-bold text-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center">
                          <svg viewBox="0 0 48 48" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.57l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                          </svg>
                        </span>
                        <span className="flex items-center gap-2">
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Redirecting to Google…
                            </>
                          ) : loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading…
                            </>
                          ) : (
                            <>Continue with Google</>
                          )}
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-stone-100" />
                        </div>
                        <div className="relative flex justify-center text-[11px]">
                          <span className="bg-white px-3 text-[var(--ink-muted)] font-semibold uppercase tracking-widest">
                            Why sign in?
                          </span>
                        </div>
                      </div>

                      {/* Feature grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { icon: <Eye className="w-4 h-4" />, label: 'Manage all invitations', color: 'emerald' },
                          { icon: <Palette className="w-4 h-4" />, label: 'Edit & republish live', color: 'champagne' },
                          { icon: <Sparkles className="w-4 h-4" />, label: '25+ templates', color: 'emerald' },
                          { icon: <ShieldCheck className="w-4 h-4" />, label: 'Secure Google sign-in', color: 'champagne' },
                        ].map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-stone-50/80 border border-stone-100/80 text-[12px] sm:text-[13px] text-[var(--ink-soft)] transition-colors hover:bg-stone-50"
                          >
                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${feat.color === 'emerald'
                              ? 'bg-[var(--emerald-light)] text-[var(--emerald-primary)]'
                              : 'bg-[var(--champagne-50)] text-[var(--champagne-600)]'
                              }`}>
                              {feat.icon}
                            </span>
                            <span className="font-semibold leading-tight">{feat.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Social proof */}
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <div className="flex -space-x-2">
                          {['bg-gradient-to-br from-emerald-400 to-emerald-600', 'bg-gradient-to-br from-amber-400 to-amber-600', 'bg-gradient-to-br from-rose-400 to-rose-600', 'bg-gradient-to-br from-blue-400 to-blue-600'].map((bg, i) => (
                            <div key={i} className={`w-7 h-7 rounded-full ${bg} ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white`}>
                              {['S', 'R', 'A', 'P'][i]}
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-[var(--ink-muted)]">
                          <span className="font-bold text-[var(--ink)]">2,400+</span> couples already created
                        </div>
                      </div>

                      {/* Terms */}
                      <p className="mt-6 text-[11px] text-center text-[var(--ink-muted)] leading-relaxed">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="underline underline-offset-2 hover:text-[var(--ink)] transition-colors">
                          Terms of Service
                        </Link>
                        . We only use your name & email for ownership of invitation links you publish.
                      </p>
                    </>
                  )}

                  {/* Redirecting spinner (signed in) */}
                  {signedIn && redirecting && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[var(--ink-soft)] font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--emerald-primary)]" />
                      Redirecting…
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInContent />
    </Suspense>
  );
}

/* ─── Skeleton matching the new split-screen layout ─── */
function SignInSkeleton() {
  const shimmerBg = 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)';
  const Bar = ({ className }) => (
    <div className={`relative overflow-hidden bg-stone-200/70 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: shimmerBg }} />
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col lg:flex-row">
      {/* Left panel skeleton */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-gradient-to-br from-[#061812] via-[#0A261C] to-[#0D3224] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex flex-col justify-between w-full px-10 xl:px-14 py-10">
          <Bar className="h-11 w-40 rounded-2xl" />
          <div className="flex-1 flex flex-col justify-center max-w-lg space-y-5 mt-12">
            <Bar className="h-1 w-12 rounded-full bg-white/10" />
            <Bar className="h-10 w-72 rounded-xl bg-white/10" />
            <Bar className="h-10 w-56 rounded-xl bg-white/10" />
            <Bar className="h-4 w-80 rounded bg-white/5 mt-2" />
            <div className="flex gap-6 mt-4">
              <Bar className="h-14 w-16 rounded-xl bg-white/5" />
              <Bar className="h-14 w-16 rounded-xl bg-white/5" />
              <Bar className="h-14 w-16 rounded-xl bg-white/5" />
            </div>
            <Bar className="h-28 w-full rounded-2xl bg-white/5 mt-4" />
          </div>
          <div className="flex gap-3 mt-8">
            <Bar className="h-3 w-20 rounded bg-white/5" />
            <Bar className="h-3 w-16 rounded bg-white/5" />
            <Bar className="h-3 w-20 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[420px] space-y-5">
          <Bar className="h-4 w-28 rounded mx-auto" />
          <Bar className="h-16 w-16 rounded-2xl mx-auto" />
          <Bar className="h-6 w-40 rounded-xl mx-auto" />
          <Bar className="h-3 w-64 rounded mx-auto" />
          <Bar className="h-14 w-full rounded-2xl mt-4" />
          <div className="flex gap-3">
            <Bar className="h-20 flex-1 rounded-xl" />
            <Bar className="h-20 flex-1 rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Bar className="h-20 flex-1 rounded-xl" />
            <Bar className="h-20 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
