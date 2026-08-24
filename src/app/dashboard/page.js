'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  HeartHandshake,
  LayoutGrid,
  Loader2,
  LogOut,
  Mail,
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
} from 'lucide-react';
import { useAuth, userInitials, userDisplayName } from '@/lib/auth';

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function prettyStatus(isPaid, statusColumn, isOwnerDraftColumn) {
  if (!isPaid || statusColumn === 'draft' || isOwnerDraftColumn) {
    return { label: 'Draft · Unpaid', tone: 'amber', icon: Clock };
  }
  return { label: 'Published', tone: 'emerald', icon: CheckCircle2 };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut, userName, userEmail, userAvatar } = useAuth();

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 0, hasMore: false });

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

  // Fetches page 1 (initial load or retry)
  const loadList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/invitations?page=1&limit=20', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: authHeaders,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // If the CLIENT already has a valid user but SERVER says 401 that
        // means the server-side cookie/user resolution failed (usually a
        // missing SUPABASE_SERVICE_ROLE_KEY or placeholder .env values).
        // Redirecting to /signin would create an infinite redirect loop
        // because the signin page sees a valid user and immediately sends
        // us BACK to /dashboard. So in that specific case we show the
        // error inline with a troubleshooting hint instead of looping.
        if (res.status === 401) {
          if (user) {
            setError(
              body?.error +
                (body?.hint ? ` ${body.hint}` : '') ||
                'Server could not verify your signed-in session. Usually this means SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local is a placeholder or missing.',
            );
          } else {
            router.replace(`/signin?next=${encodeURIComponent('/dashboard')}`);
            return;
          }
        } else {
          setError(body?.error || body?.hint || 'Could not load your invitations.');
        }
      } else {
        setInvites(body.invitations || []);
        setTotalCount(body.totalCount || 0);
        setPublishedCount(body.publishedCount || 0);
        setPagination(body.pagination || { page: 1, limit: 20, totalPages: 0, hasMore: false });
      }
    } catch (e) {
      setError(e?.message || 'Network error — please try again.');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/signin?next=${encodeURIComponent('/dashboard')}`);
      return;
    }
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const appBase = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.protocol}//${window.location.host}`;
  }, []);

  const handleCopy = (url, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(id);
    setTimeout(() => setCopied(''), 2200);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
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
      // Optimistically update list
      setInvites(prev => prev.filter(i => i.id !== deleteTarget.id));
      setTotalCount(prev => Math.max(0, prev - 1));
      if (deleteTarget.is_paid) {
        setPublishedCount(prev => Math.max(0, prev - 1));
      }
      // Close modal
      setDeleteTarget(null);
      setDeleteSlugInput('');
      setDeleteConfirmPhraseInput('');
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  // While auth is loading, show a gentle spinner
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
        <div className="flex items-center gap-2 text-[var(--ink-muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading your account…</span>
        </div>
      </main>
    );
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
                  Browse 25+ hand-crafted templates → edit → publish at ₹299
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
            <button onClick={loadList} className="ml-auto text-xs font-bold underline underline-offset-2 hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Invitations List */}
        <div className="flex items-end justify-between mb-3 sm:mb-4">
          <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)] leading-none tracking-tight">
            Your Invitations
          </h2>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}
        </div>

        {!loading && !hasAnyInvite ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--emerald-primary)]/20 bg-white/70 p-8 sm:p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--emerald-light)] text-[var(--emerald-primary)] flex items-center justify-center mb-4">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-[var(--ink)] mb-2 tracking-tight">
              You haven&apos;t created any invitations yet
            </h3>
            <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed mb-5 max-w-md mx-auto">
              Browse our curated luxury templates, customize everything in your browser, and publish your digital wedding
              invitation at a flat ₹299 — shareable on WhatsApp, SMS, or any social platform.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--emerald-primary)] text-white font-bold text-sm sm:text-base shadow-lg shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" /> Browse templates &amp; start designing
            </Link>
          </div>        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {invites.map((inv) => {
                const status = prettyStatus(inv.is_paid, inv.status, !inv.razorpay_order_id);
                const shareUrl = `${appBase}/i/${encodeURIComponent(inv.slug)}`;
                const StatusIcon = status.icon;
                const isDraft = status.tone === 'amber';
                return (
                  <div
                    key={inv.id}
                    className={`group rounded-3xl border-2 shadow-[0_18px_40px_rgba(15,56,44,0.08)] overflow-hidden transition-all hover:shadow-[0_22px_60px_rgba(15,56,44,0.12)] ${
                      isDraft
                        ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-100/70'
                        : 'bg-white/90 border-white/60'
                    }`}>
                    {/* Preview strip (using real template render would need server) */}
                    <div className="relative bg-gradient-to-br from-[var(--emerald-primary)]/10 via-white to-[var(--champagne-500)]/10 h-32 sm:h-40 overflow-hidden">
                      <div className="absolute inset-0 grid place-items-center p-5 text-center">
                        <div className="max-w-full">
                          <div className="font-display text-lg sm:text-xl text-[var(--ink)] leading-tight tracking-tight truncate">
                            {inv.bride_name || 'Bride'} <span className="text-[var(--champagne-500)]">♥</span> {inv.groom_name || 'Groom'}
                          </div>
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)]">
                            <MapPin className="w-3.5 h-3.5 text-[var(--emerald-primary)]/70" />
                            <span className="truncate max-w-[220px]">{inv.venue || 'Venue to be set'}</span>
                          </div>
                          <div className="mt-1 text-[11px] sm:text-xs text-[var(--ink-soft)] font-semibold">
                            {prettyDate(inv.wedding_date)}
                            {inv.wedding_time ? ` · ${inv.wedding_time}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${
                          status.tone === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                        }`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      {/* Template, Edit Badges and Small Delete Button */}
                      <div className="absolute top-3 right-3 flex items-start gap-1.5 z-10">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/85 ring-1 ring-black/5 text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-widest">
                            Template · {String(inv.template_id || 'standard-crimson').split('-').map(s => s[0]?.toUpperCase() + s.slice(1)).join(' ')}
                          </span>
                          {!isDraft && (
                            (() => {
                              const editCount = typeof inv.edit_count === 'number' ? inv.edit_count : (Number(inv.template_data?._edit_count) || 0);
                              const editsRemaining = Math.max(0, 3 - editCount);
                              const isLocked = editCount >= 3;
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ring-1 shadow-sm ${
                                  isLocked
                                    ? 'bg-rose-100/90 text-rose-800 ring-rose-200'
                                    : editsRemaining === 1
                                      ? 'bg-amber-100/90 text-amber-900 ring-amber-200'
                                      : 'bg-white/90 text-emerald-800 ring-emerald-200'
                                }`}>
                                  {isLocked ? (
                                    <><Lock className="w-2.5 h-2.5 text-rose-600" /> Edits Locked (3/3)</>
                                  ) : (
                                    <><ShieldAlert className="w-2.5 h-2.5 text-emerald-600" /> {editsRemaining} of 3 Edits Left</>
                                  )}
                                </span>
                              );
                            })()
                          )}
                        </div>

                        {/* Small Cross Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(inv);
                            setDeleteSlugInput('');
                            setDeleteConfirmPhraseInput('');
                            setDeleteError('');
                          }}
                          className="h-6 w-6 rounded-full bg-stone-900/70 hover:bg-rose-600 text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90 ring-1 ring-white/20 shrink-0"
                          title="Delete template"
                          aria-label="Delete template"
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Share URL row — only show for published/paid invitations, not unpaid drafts */}
                      {!isDraft && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[var(--cream)]/60 ring-1 ring-black/5">
                          <ExternalLink className="w-4 h-4 shrink-0 text-[var(--emerald-primary)]" />
                          <span className="truncate text-xs sm:text-sm font-semibold text-[var(--ink)]">
                            {shareUrl}
                          </span>
                          <button
                            onClick={() => handleCopy(shareUrl, inv.id)}
                            className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[11px] sm:text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                          >
                            {copied === inv.id ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-[var(--emerald-primary)]" /> Copied</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copy</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Owner email row — only if the invitation row already has owner_email populated */}
                      {inv.owner_email && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 ring-1 ring-black/5">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--ink-muted)]" />
                          <span className="truncate text-[11px] sm:text-xs font-semibold text-[var(--ink-soft)]">
                            {String(inv.owner_email).toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Actions grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                        {isDraft ? (
                          <Link
                            href={`/create/${encodeURIComponent(inv.template_id || 'standard-crimson')}?draftId=${encodeURIComponent(inv.id)}`}
                            className="col-span-2 sm:col-span-3 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[var(--champagne-500)] text-white text-xs sm:text-sm font-bold shadow-md shadow-[var(--champagne-500)]/20 hover:brightness-[1.02] transition-all active:scale-[0.98]"
                          >
                            <Sparkles className="w-4 h-4" /> Resume & Publish · Pay ₹299 →
                          </Link>
                        ) : (
                          (() => {
                            const editCount = typeof inv.edit_count === 'number' ? inv.edit_count : (Number(inv.template_data?._edit_count) || 0);
                            const editsRemaining = Math.max(0, 3 - editCount);
                            const isLocked = editCount >= 3;
                            return (
                              <Link
                                href={`/edit/${encodeURIComponent(inv.id)}`}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-[0.98] ${
                                  isLocked
                                    ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-md'
                                    : 'bg-[var(--emerald-primary)] hover:bg-[var(--emerald-dark)] text-white shadow-md shadow-[var(--emerald-primary)]/15'
                                }`}
                              >
                                {isLocked ? <Lock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                {isLocked ? 'View / Locked' : `Edit Invite (${editsRemaining} left)`}
                              </Link>
                            );
                          })()
                        )}
                        {!isDraft ? (
                          <a
                            href={`/i/${encodeURIComponent(inv.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white ring-1 ring-black/5 text-[var(--ink)] text-xs sm:text-sm font-bold hover:bg-[var(--emerald-light)]/50 transition-all active:scale-[0.98]"
                          >
                            <ExternalLink className="w-4 h-4" /> View Live
                          </a>
                        ) : (
                          <Link
                            href={`/create/${encodeURIComponent(inv.template_id || 'standard-crimson')}?draftId=${encodeURIComponent(inv.id)}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white ring-1 ring-black/5 text-[var(--ink)] text-xs sm:text-sm font-bold hover:bg-amber-50 transition-all active:scale-[0.98]"
                          >
                            <Edit3 className="w-4 h-4" /> Edit Draft
                          </Link>
                        )}
                        {isDraft ? (
                          <Link
                            href={`/`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/80 ring-1 ring-black/5 text-[var(--ink-soft)] text-xs sm:text-sm font-bold hover:bg-white transition-all active:scale-[0.98]"
                          >
                            <Download className="w-4 h-4" /> Templates
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              const text = [
                                `Wedding Invitation: ${inv.bride_name || 'Bride'} & ${inv.groom_name || 'Groom'}`,
                                prettyDate(inv.wedding_date) ? `📅 ${prettyDate(inv.wedding_date)}${inv.wedding_time ? ' · ' + inv.wedding_time : ''}` : '',
                                inv.venue ? `📍 ${inv.venue}` : '',
                                '',
                                shareUrl,
                              ].filter(Boolean).join('\n');
                              const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
                              if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#25D366] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#25D366]/15 hover:bg-[#1ebe5a] transition-all active:scale-[0.98]"
                          >
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                          </button>
                        )}
                      </div>
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading more…</>
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
        <div className="mt-10 sm:mt-12 text-center text-[11px] sm:text-xs text-[var(--ink-muted)] leading-relaxed max-w-md mx-auto">
          Any changes you make inside &quot;Edit Invite&quot; instantly update the live
          link you shared — your guests always see the latest version without a
          new URL. (Each published invite includes up to 3 complimentary edits to ensure data integrity).
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
                    To confirm, type <strong className="text-white font-bold font-mono">“{deleteTarget.slug || deleteTarget.id}”</strong>
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
                    To confirm, type <strong className="text-white font-bold">“delete my project”</strong>
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
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Delete Project</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
