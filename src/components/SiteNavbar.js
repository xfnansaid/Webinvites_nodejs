'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, userInitials } from '@/lib/auth';

/**
 * Minimal site-wide sticky navbar (desktop + mobile share the same UI:
 * - Logo + tagline linking to /
 * - One single icon trigger on the right:
 *     • Signed out → 👤 emoji circle. On click → popover with "Sign in with Google"
 *     • Signed in → user avatar/initials circle. On click → popover with
 *       name/email, Dashboard, Sign out.
 *
 * No hamburger, no long CTA buttons, just one small icon on either breakpoint.
 */
export function UserAccountButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut, userName, userEmail, userAvatar } = useAuth();

  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const signedIn = Boolean(user && !loading);

  const signInHref = `/signin?next=${encodeURIComponent(pathname !== '/' ? pathname : '/dashboard')}`;

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
      router.refresh && router.refresh();
    } catch (e) {
      // ignore
    }
  };

  // Close popover close on outside click or Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!popRef.current) return;
      if (popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="group relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-stone-50 hover:bg-[var(--emerald-light)]/50 ring-1 ring-stone-200 hover:ring-[var(--emerald-primary)]/20 transition-all active:scale-[0.98] shadow-sm shrink-0"
        aria-label={signedIn ? 'Account menu' : 'Sign in'}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {signedIn ? (
          userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
            />
          ) : (
            <span className="inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[var(--emerald-primary)] text-white text-[11px] font-bold">
              {userInitials(user)}
            </span>
          )
        ) : (
          <img
            width="22"
            height="22"
            src="/user-male-circle.png"
            alt="Account icon"
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
          />
        )}
        {/* Small indicator dot when signed in */}
        {signedIn && (
          <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-[var(--emerald-primary)] ring-2 ring-white" />
        )}
      </button>

      {/* Popover menu */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] sm:w-[280px] origin-top-right rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(15,56,44,0.14)] overflow-hidden"
        >
          {signedIn ? (
            <div className="flex flex-col">
              <div className="px-4 py-3.5 bg-gradient-to-br from-[var(--emerald-light)]/60 via-white to-white border-b border-stone-100 flex items-center gap-3">
                <div className="shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  ) : (
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[var(--emerald-primary)] text-white text-[12px] font-bold ring-2 ring-white shadow-sm">
                      {userInitials(user)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[var(--ink)] truncate">
                    {userName || 'My Account'}
                  </div>
                  <div className="text-[12px] text-[var(--ink-muted)] truncate">
                    {userEmail || 'Signed in with Google'}
                  </div>
                </div>
              </div>

              <div className="py-1.5 flex flex-col">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-stone-50 hover:text-[var(--ink)] transition-colors"
                >
                  <span aria-hidden>📊</span>
                  Dashboard
                </Link>

                <div className="my-1 h-px bg-stone-100" />
                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <span aria-hidden>🚪</span>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col p-2">
              <div className="px-3 pt-2.5 pb-2 text-center">
                <div className="text-sm font-bold text-[var(--ink)] mb-0.5">
                  Sign in to Web Invites
                </div>
                <div className="text-[12px] text-[var(--ink-muted)] leading-relaxed">
                  Save your invitations, edit designs & republish anytime.
                </div>
              </div>
              <Link
                href={signInHref}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="mt-1 mx-2 mb-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--emerald-primary)] px-4 py-2.5 text-white text-sm font-bold shadow-sm shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] transition-colors active:scale-[0.99]"
              >
                <span aria-hidden>🔐</span>
                Sign in with Google
              </Link>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SiteNavbar({ variant = 'home' }) {
  return (
    <header className="sticky top-0 z-[140] w-full bg-white/85 backdrop-blur-xl border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group min-w-0">
            <span className="relative inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 overflow-hidden">
              <img
                src="/logo.webp"
                alt="Web Invites"
                width="48"
                height="48"
                className="object-contain scale-[1.05]"
              />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-bold tracking-wide text-[15px] sm:text-[16px] text-[var(--ink)] group-hover:text-[var(--emerald-primary)] transition-colors">
                WEB INVITES
              </span>
              <span className="text-[10px] sm:text-[11px] text-[var(--ink-soft)] font-medium tracking-wide uppercase">
                ₹299
              </span>
            </div>
          </Link>

          {/* User Account Button */}
          <UserAccountButton />
        </div>
      </div>
    </header>
  );
}
