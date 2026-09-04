'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  HeartHandshake,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  XCircle,
  Lock,
  ShieldAlert,
  AlertCircle,
  X,
  Trash2,
  Timer,
} from 'lucide-react';
import { useAuth, userInitials, userDisplayName } from '@/lib/auth';
import RemoveAdsModal from '@/components/ads/RemoveAdsModal';
import { getInviteExpiry } from '@/lib/invite-expiry-client';
import { buildWhatsAppShareText } from '@/lib/share-text';

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isPremiumInvite(inv) {
  if (!inv) return false;
  return Boolean(
    inv.tier === 'premium' ||
    inv.is_ad_supported === false ||
    (inv.razorpay_payment_id && String(inv.razorpay_payment_id).startsWith('pay_')) ||
    (inv.razorpay_order_id && String(inv.razorpay_order_id).startsWith('admin_') && inv.paid_at),
  );
}

function prettyStatus(inv) {
  const isPaid = !!inv?.is_paid;
  const statusColumn = inv?.status;
  const isActive = inv?.is_active;

  if (isActive === false && isPaid) {
    return { label: 'Expired', tone: 'red', icon: XCircle, isExpired: true };
  }
  if (!isPaid || statusColumn === 'draft') {
    return { label: 'Draft', tone: 'amber', icon: Clock };
  }
  if (!isPremiumInvite(inv)) {
    return { label: 'Free Tier', tone: 'emerald', icon: CheckCircle2, isAdSupported: true };
  }
  return { label: 'Premium Tier', tone: 'emerald', icon: Sparkles, isAdSupported: false };
}

/**
 * Interactive dashboard client component.
 * Receives server-fetched data as props — no loading waterfall on initial render.
 *
 * Props:
 *   initialInvites      – Array of invitation rows (page 1)
 *   initialTotalCount   – Total invitation count
 *   initialPublishedCount – Published invitation count
 *   initialPagination   – { page, limit, totalPages, hasMore }
 */
export default function DashboardClient({
  initialInvites = [],
  initialTotalCount = 0,
  initialPublishedCount = 0,
  initialPagination = { page: 1, limit: 20, totalPages: 0, hasMore: false },
}) {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut, userName, userEmail, userAvatar, isAdmin } = useAuth();

  const [invites, setInvites] = useState(initialInvites);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [publishedCount, setPublishedCount] = useState(initialPublishedCount);
  const [pagination, setPagination] = useState(initialPagination);
  const [removeAdsTarget, setRemoveAdsTarget] = useState(null);

  const hasClientFetched = useRef(false);

  // If user is confirmed logged out after auth finishes loading, redirect to sign-in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin?next=/dashboard');
    }
  }, [authLoading, user, router]);

  // If initial server fetch was empty due to cookie transition, hydrate from API using client session
  useEffect(() => {
    if (session?.access_token && initialInvites.length === 0 && !hasClientFetched.current) {
      hasClientFetched.current = true;
      fetch('/api/user/invitations?page=1&limit=20', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
        .then(r => r.json())
        .then(data => {
          if (data?.invitations) {
            setInvites(data.invitations);
            setTotalCount(data.total || data.invitations.length);
            setPublishedCount(data.publishedCount || 0);
            if (data.pagination) setPagination(data.pagination);
          }
        })
        .catch(() => {});
    }
  }, [session, initialInvites.length]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSlugInput, setDeleteSlugInput] = useState('');
  const [deleteConfirmPhraseInput, setDeleteConfirmPhraseInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const authHeaders = useMemo(() => {
    const accessToken = session?.access_token || null;
    if (!accessToken) return undefined;
    return { Authorization: `Bearer ${accessToken}` };
  }, [session]);

  const appBase = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.protocol}//${window.location.host}`;
  }, []);

  const handleCopy = useCallback((url, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => { });
    }
    setCopied(id);
    setTimeout(() => setCopied(''), 2200);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  // Fetch the next page and append results
  const loadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const res = await fetch(`/api/user/invitations?page=${nextPage}&limit=${pagination.limit}`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: authHeaders,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || 'Could not load more invitations.');
      } else {
        setInvites(prev => [...prev, ...(body.invitations || [])]);
        setPagination(body.pagination || pagination);
      }
    } catch (e) {
      setError(e?.message || 'Network error — please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(body?.error || 'Failed to delete invitation.');
        setDeleting(false);
        return;
      }
      setInvites(prev => prev.filter(i => i.id !== deleteTarget.id));
      setTotalCount(prev => Math.max(0, prev - 1));
      if (deleteTarget.is_paid) {
        setPublishedCount(prev => Math.max(0, prev - 1));
      }
      setDeleteTarget(null);
      setDeleteSlugInput('');
      setDeleteConfirmPhraseInput('');
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  // While auth is loading, show skeleton
  if (authLoading) {
    const { default: DashboardSkeleton } = require('@/components/skeletons/DashboardSkeleton');
    return <DashboardSkeleton />;
  }

  const hasAnyInvite = invites.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between mb-7 sm:mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-[var(--emerald-primary)] text-white flex items-center justify-center shadow-md shadow-[var(--emerald-primary)]/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-lg sm:text-xl text-[var(--ink)] leading-none tracking-tight">
                WEB INVITES
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[var(--ink-muted)] font-bold">
                Your Wedding Dashboard
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:flex items-center gap-2.5 px-1.5 pr-3.5 py-1.5 rounded-2xl bg-white ring-1 ring-black/5 border border-stone-100">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--emerald-primary)] text-white text-[11px] font-bold ring-2 ring-white shadow-sm">
                  {userInitials(user)}
                </span>
              )}
              <div className="leading-tight min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--ink-muted)]">Signed in with Google</div>
                <div className="text-[12px] font-bold text-[var(--ink)] truncate max-w-[220px]">
                  {userName || userDisplayName(user)}
                </div>
                {(userEmail || user?.email) && (
                  <div className="text-[11px] font-medium text-[var(--ink-muted)] truncate max-w-[220px]">
                    {userEmail || user?.email}
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 ring-1 ring-red-200 text-red-700 hover:bg-red-100 transition-colors text-xs sm:text-sm font-semibold"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white ring-1 ring-black/5 hover:bg-red-50 hover:ring-red-200 text-[var(--ink-soft)] hover:text-red-600 transition-colors text-xs sm:text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Summary header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="rounded-3xl bg-white/90 border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] p-5 sm:p-6 flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-[var(--ink-muted)] mb-1">
                Total Invitations
              </div>
              <div className="font-display text-3xl sm:text-4xl text-[var(--ink)] leading-none">
                {totalCount}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] p-5 sm:p-6 flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 text-[var(--emerald-primary)] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-[var(--ink-muted)] mb-1">
                Live & Published
              </div>
              <div className="font-display text-3xl sm:text-4xl text-[var(--ink)] leading-none">
                {publishedCount}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[var(--champagne-500)]/20 via-white to-[var(--emerald-primary)]/10 border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] p-5 sm:p-6 flex items-center gap-4">
            <Link
              href="/"
              className="w-full inline-flex items-center gap-3"
            >
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-white ring-1 ring-black/5 text-[var(--champagne-500)] flex items-center justify-center shadow-sm">
                <Plus className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-[var(--ink-muted)] mb-1">
                  Create New Invite
                </div>
                <div className="font-bold text-sm sm:text-base text-[var(--ink)] leading-tight">
                  Browse templates → publish invitations for free with ads, or pay ₹399 to make any invite premium ad-free
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[var(--champagne-500)] hidden sm:block" />
            </Link>
          </div>
        </div>

        {/* State banners */}
        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm px-4 py-3 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <div className="font-bold mb-0.5">Could not load invitations</div>
              <div>{error}</div>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-xs font-bold underline underline-offset-2 hover:no-underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Invitations List */}
        <div className="flex items-end justify-between mb-3 sm:mb-4">
          <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)] leading-none tracking-tight">
            Your Invitations
          </h2>
        </div>

        {!hasAnyInvite ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--emerald-primary)]/20 bg-white/70 p-8 sm:p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center mb-4">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-[var(--ink)] mb-2 tracking-tight">
              You haven&apos;t created any invitations yet
            </h3>
            <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed mb-5 max-w-md mx-auto">
              Browse our templates, customize everything in your browser, and publish your digital wedding
              invitation for free with ads. You can also upgrade any invitation to premium ad-free for ₹399.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--emerald-primary)] text-white font-bold text-sm sm:text-base shadow-lg shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" /> Browse templates &amp; start designing
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {invites.map((inv) => {
                const status = prettyStatus(inv);
                const shareUrl = `${appBase}/i/${encodeURIComponent(inv.slug)}`;
                const StatusIcon = status.icon;
                const isDraft = status.tone === 'amber';
                const templateName = String(inv.template_id || 'standard-crimson').split('-').map(s => s[0]?.toUpperCase() + s.slice(1)).join(' ');
                const editCount = typeof inv.edit_count === 'number' ? inv.edit_count : (Number(inv.template_data?._edit_count) || 0);
                const editsRemaining = Math.max(0, 3 - editCount);
                const isLocked = editCount >= 3;

                return (
                  <div
                    key={inv.id}
                    className={`group rounded-3xl border shadow-[0_12px_36px_rgba(15,56,44,0.06)] overflow-hidden transition-all hover:shadow-[0_20px_50px_rgba(15,56,44,0.1)] flex flex-col justify-between ${status.isExpired
                        ? 'bg-gradient-to-br from-red-50/50 via-white to-red-50/20 border-red-200/70 opacity-80'
                        : isDraft
                          ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 border-amber-200/70'
                          : 'bg-white border-stone-200/80'
                      }`}>
                    <div>
                      {/* Card Header Strip: Status, Expiry, Template & Delete */}
                      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-stone-50/80 border-b border-black/[0.04]">
                        {/* Left: Status & Expiry badge */}
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${status.tone === 'emerald'
                              ? 'bg-emerald-100/90 text-emerald-800 ring-1 ring-emerald-200'
                              : status.tone === 'red'
                                ? 'bg-red-100 text-red-800 ring-1 ring-red-200'
                                : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                            }`}>
                            <StatusIcon className="w-3 h-3 shrink-0" />
                            {status.label}
                          </span>

                          {/* Expiry badge */}
                          {!status.isExpired && (() => {
                            const expiry = getInviteExpiry(inv);
                            if (expiry.isExpired) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 ring-1 ring-red-200 text-[10px] font-bold tracking-wider">
                                  <Clock className="w-3 h-3" /> Expired
                                </span>
                              );
                            }
                            if (expiry.daysRemaining !== null && expiry.tier === 'free') {
                              const isUrgent = expiry.daysRemaining <= 3;
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ring-1 ${isUrgent ? 'bg-red-100 text-red-800 ring-red-200' : 'bg-amber-100/80 text-amber-800 ring-amber-200/80'}`}>
                                  <Timer className="w-3 h-3" /> {expiry.daysRemaining}d left
                                </span>
                              );
                            }
                            if (expiry.daysRemaining !== null && expiry.tier === 'premium') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 text-[10px] font-bold tracking-wider">
                                  <Timer className="w-3 h-3" /> {expiry.daysRemaining}d after event
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Right: Template name tag & Delete button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="hidden xs:inline-flex sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-stone-200/80 text-[11px] font-medium text-[var(--ink-muted)] truncate max-w-[130px] sm:max-w-[160px]"
                            title={templateName}
                          >
                            {templateName}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(inv);
                              setDeleteSlugInput('');
                              setDeleteConfirmPhraseInput('');
                              setDeleteError('');
                            }}
                            className="h-7 w-7 rounded-full bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors border border-stone-200/80 shadow-2xs active:scale-95 shrink-0"
                            title="Delete template"
                            aria-label="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Preview & Event Details Area */}
                      <div className="bg-gradient-to-b from-[var(--emerald-primary)]/[0.03] via-white to-transparent p-5 sm:p-6 text-center border-b border-black/[0.04]">
                        <div className="max-w-full">
                          <div className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] leading-tight tracking-tight truncate">
                            {inv.bride_name || 'Bride'} <span className="text-[var(--champagne-500)]">♥</span> {inv.groom_name || 'Groom'}
                          </div>
                          
                          <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)] max-w-full">
                            <MapPin className="w-3.5 h-3.5 text-[var(--emerald-primary)]/70 shrink-0" />
                            <span className="truncate max-w-[280px] sm:max-w-[340px]">{inv.venue || 'Venue to be set'}</span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-[var(--ink-soft)] font-medium">
                            <span>
                              {prettyDate(inv.wedding_date)}
                              {inv.wedding_time ? ` · ${inv.wedding_time}` : ''}
                            </span>

                            {!isDraft && (
                              <>
                                <span className="text-stone-300 font-normal">·</span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isLocked ? 'text-rose-600' : 'text-stone-500'}`}
                                >
                                  {isLocked ? (
                                    <><Lock className="w-3 h-3 text-rose-500" /> Edits Locked (3/3)</>
                                  ) : (
                                    <><ShieldAlert className="w-3 h-3 text-emerald-600" /> {editsRemaining} of 3 edits left</>
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions and Sharing */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      {/* Share URL row */}
                      {!isDraft && !status.isExpired && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50/80 border border-stone-200/80">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[var(--emerald-primary)]" />
                          <span className="truncate text-xs font-mono text-[var(--ink)] flex-1">
                            {shareUrl}
                          </span>
                          <button
                            onClick={() => handleCopy(shareUrl, inv.id)}
                            className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-[var(--emerald-light)]/60 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors shadow-2xs"
                          >
                            {copied === inv.id ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-[var(--emerald-primary)]" /> Copied</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copy</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Primary Actions Row */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/edit/${encodeURIComponent(inv.id)}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--emerald-primary)] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[var(--emerald-dark)] active:scale-[0.98] transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> {status.isExpired ? 'Edit & Reactivate' : 'Edit Invite'}
                        </Link>

                        {!isDraft && !status.isExpired && (
                          <a
                            href={`/i/${encodeURIComponent(inv.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-[var(--emerald-light)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] font-bold text-xs sm:text-sm transition-colors shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        )}

                        {!isDraft && status.isExpired && (
                          <a
                            href={`/edit/${encodeURIComponent(inv.id)}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-amber-600 active:scale-[0.98] transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Upgrade to Reactivate
                          </a>
                        )}

                        {!isDraft && !status.isExpired && (
                          <button
                            onClick={() => {
                              const msg = buildWhatsAppShareText({
                                templateId: inv.template_id,
                                templateData: inv.template_data,
                                brideName: inv.bride_name,
                                groomName: inv.groom_name,
                                weddingDate: inv.wedding_date,
                                venue: inv.venue,
                                venueAddress: inv.venue_address,
                                shareUrl,
                              });
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        )}
                      </div>

                      {/* Upgrade Banner for Free/Ad-Supported tier */}
                      {!isDraft && !status.isExpired && status.isAdSupported && (
                        <a
                          href={`/checkout?slug=${encodeURIComponent(inv.slug || '')}&invitationId=${encodeURIComponent(inv.id || '')}`}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/15 border border-amber-300/70 hover:border-amber-400 text-amber-950 font-bold text-xs transition-all shadow-2xs group"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Remove Ads &amp; Upgrade to Premium</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold group-hover:bg-amber-600 transition-colors shadow-xs">
                            Upgrade ₹399 →
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More button */}
            {pagination.hasMore && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-sm font-bold text-[var(--ink)] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Loading more…</>
                  ) : (
                    <>Load more invitations ({pagination.limit} per page)</>
                  )}
                </button>
              </div>
            )}
            {pagination.hasMore && (
              <div className="mt-2 text-center text-[11px] text-[var(--ink-muted)]">
                Showing {invites.length} of {totalCount}
              </div>
            )}
          </>
        )}

        {/* Bottom helper */}
        <div className="mt-10 sm:mt-12 text-center text-[11px] sm:text-xs text-[var(--ink-muted)] leading-relaxed max-w-lg mx-auto space-y-2">
          <p>
            Any changes you make inside &quot;Edit Invite&quot; instantly update the live
            link you shared — your guests always see the latest version without a
            new URL. (Each published invite includes up to 3 complimentary edits to ensure data integrity).
          </p>
          <p className="text-amber-700/80 font-semibold">
            ⏰ Free tier invitations expire 21 days after publishing. Pay ₹399 to remove ads and convert that invitation into Premium Tier hosting until 3 days after your event.
          </p>
        </div>

        {/* ================= DELETE CONFIRMATION MODAL ================= */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-[480px] rounded-2xl bg-[#0C0C0C] border border-white/15 p-6 sm:p-7 text-white shadow-2xl space-y-5">

              {/* Header */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Delete Project
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
                  This will permanently delete the project and related resources like Deployments, Domains and Environment Variables.
                </p>
              </div>

              <div className="h-px w-full bg-white/10" />

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-stone-300 mb-2">
                    To confirm, type <strong className="text-white font-bold font-mono">&ldquo;{deleteTarget.slug || deleteTarget.id}&rdquo;</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteSlugInput}
                    onChange={(e) => setDeleteSlugInput(e.target.value)}
                    placeholder={deleteTarget.slug || deleteTarget.id}
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-white/40 focus:outline-none placeholder:text-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-stone-300 mb-2">
                    To confirm, type <strong className="text-white font-bold">&ldquo;delete my project&rdquo;</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmPhraseInput}
                    onChange={(e) => setDeleteConfirmPhraseInput(e.target.value)}
                    placeholder="delete my project"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-white/40 focus:outline-none placeholder:text-stone-700"
                  />
                </div>
              </div>

              {/* Error Callout if any */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {deleteError}
                </div>
              )}

              {/* Warning Banner */}
              <div className="p-3.5 rounded-xl bg-[#2A0E12] border border-[#5E1A22] text-[#FF6B7A] text-xs sm:text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#FF4D61]" />
                <span>
                  Deleting <strong className="font-semibold">{deleteTarget.slug || deleteTarget.id}</strong> cannot be undone.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteSlugInput('');
                    setDeleteConfirmPhraseInput('');
                    setDeleteError('');
                  }}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-xs sm:text-sm font-semibold text-stone-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={
                    deleting ||
                    deleteSlugInput.trim() !== (deleteTarget.slug || deleteTarget.id) ||
                    deleteConfirmPhraseInput.trim().toLowerCase() !== 'delete my project'
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/40 transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                  <span>Delete Project</span>
                </button>
              </div>

            </div>
          </div>
        )}
        {/* Remove Ads Modal */}
        {removeAdsTarget && (
          <RemoveAdsModal
            invitationId={removeAdsTarget.id}
            slug={removeAdsTarget.slug}
            onClose={() => setRemoveAdsTarget(null)}
            onSuccess={() => {
              setRemoveAdsTarget(null);
              router.refresh();
              window.location.reload();
            }}
          />
        )}
      </div>
    </main>
  );
}
