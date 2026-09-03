'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  XCircle,
  X as XIcon,
  Download,
  QrCode,
  PartyPopper,
  Edit3,
  LogIn,
  LayoutDashboard,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, userInitials, userDisplayName } from '@/lib/auth';
import FreeTierExpiryBanner from '@/components/FreeTierExpiryBanner';
import { buildWhatsAppShareText } from '@/lib/share-text';

const MAX_POLL_ATTEMPTS = 15; // about 30s at 2s each
const POLL_INTERVAL_MS = 2000;

export default function InvitationSuccessShell({
  slug,
  initialIsPaid,
  invitation,
  querySuccess = false,
  viewStats,
  expiryInfo,
  showExpiryBanner = false,
  children,
}) {
  const router = useRouter();
  const auth = useAuth();
  const authUser = auth?.user || null;
  const authLoading = auth?.loading || false;
  const userPhone = auth?.userPhone || '';
  const userName = auth?.userName || '';
  const userEmail = auth?.userEmail || '';
  const userAvatar = auth?.userAvatar || '';
  const signOut = auth?.signOut || (async () => {});

  const invitationId = invitation?.id || invitation?.invitationId || null;
  const ownerPhone = invitation?.owner_phone || invitation?.ownerPhone || null;
  const ownerId = invitation?.owner_id || invitation?.ownerId || null;

  // Google users never set owner_phone on create-order (we only set owner_id).
  // Legacy phone-OTP invitations may have owner_phone set.
  const isOwner = Boolean(
    (authUser && ownerId && String(authUser.id) === String(ownerId))
    || (authUser && ownerPhone && userPhone && String(userPhone) === String(ownerPhone))
  );

  const razorpayOrderId = invitation?.razorpay_order_id;
  const groomName = invitation?.groom_name || invitation?.groomName;
  const brideName = invitation?.bride_name || invitation?.brideName;
  const weddingDate = invitation?.wedding_date || invitation?.weddingDate;
  const venue = invitation?.venue;

  // Canonical share URL for this invitation + referral tracking via=slug
  // Deterministic on server & client to avoid React hydration mismatches
  const defaultBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.webinvites.shop').replace(/\/$/, '');
  const slugEnc = encodeURIComponent(slug || '');
  const [shareUrl, setShareUrl] = useState(() => `${defaultBase}/i/${slugEnc}?via=${slugEnc}`);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setShareUrl(`${window.location.origin}/i/${slugEnc}?via=${slugEnc}`);
    }
  }, [slugEnc]);

  const guestCtaTemplate = String(invitation?.template_id || 'standard-crimson');
  const guestCtaDismissKey = `__wi_guest_cta_dismissed::${slug}`;
  const [guestCtaDismissed, setGuestCtaDismissed] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(guestCtaDismissKey) === '1') {
        setGuestCtaDismissed(true);
      }
    } catch {}
  }, [guestCtaDismissKey]);
  const dismissGuestCta = () => {
    try {
      sessionStorage.setItem(guestCtaDismissKey, '1');
    } catch {}
    setGuestCtaDismissed(true);
  };

  const [isPaid, setIsPaid] = useState(!!initialIsPaid);
  const [status, setStatus] = useState(
    querySuccess && !initialIsPaid ? 'verifying' : initialIsPaid ? 'paid' : 'draft',
  );
  // 'paid' | 'draft' | 'verifying' | 'error'
  const [attempts, setAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const pollTimer = useRef(null);

  // ------- Payment status check helper (uses the on-demand Razorpay API)
  const runStatusCheck = useCallback(async () => {
    if (!razorpayOrderId) return;
    try {
      setStatus((s) => (s === 'paid' ? 'paid' : 'verifying'));
      const res = await fetch(`/api/check-payment/${encodeURIComponent(razorpayOrderId)}`);
      const body = await res.json().catch(() => ({}));
      if (body?.isPaid === true) {
        setIsPaid(true);
        setStatus('paid');
        setLastError(null);
        // clear timers, we're done
        if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
        // reload once silently so the Server Component re-renders is_paid=true
        // which removes the giant PREVIEW watermark inside the template itself
        // (since it's inside isDraft={!invitation.is_paid} on the server)
        if (!initialIsPaid) {
          window.location.reload();
        }
      } else {
        setIsPaid(false);
        if (body?.ok === false || body?.error) {
          setLastError({
            message: body?.error || 'Could not verify payment status',
            hint: body?.hint || null,
          });
        } else {
          setLastError(
            body?.hint
              ? { message: 'Payment still pending on Razorpay side.', hint: body.hint }
              : null,
          );
        }
      }
    } catch (e) {
      console.warn('status check threw', e);
      setLastError({ message: e?.message || 'Network error checking status' });
    }
  }, [razorpayOrderId, initialIsPaid]);

  // ------- Auto-poll status only when ?success=true & not yet paid
  useEffect(() => {
    if (!querySuccess) return;
    if (isPaid) return;
    if (!razorpayOrderId) return;

    let cancelled = false;
    setAttempts(0);
    setStatus('verifying');

    const step = (n) => {
      if (cancelled) return;
      if (n > MAX_POLL_ATTEMPTS) {
        setStatus('draft');
        return;
      }
      setAttempts(n);
      pollTimer.current = setTimeout(() => {
        // fire check then schedule next only if we're not already paid
        runStatusCheck().finally(() => {
          if (!cancelled && !isPaid) step(n + 1);
        });
      }, POLL_INTERVAL_MS);
    };

    // Do an immediate first check, then start the poll loop
    runStatusCheck().then(() => {
      if (!cancelled && !isPaid) step(1);
    });
    return () => { cancelled = true; if (pollTimer.current) clearTimeout(pollTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySuccess, razorpayOrderId]);

  // ------- Copy link
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback: temp textarea
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }, [shareUrl]);

  // ------- WhatsApp share
  const handleWhatsApp = useCallback(() => {
    const text = buildWhatsAppShareText({
      templateId: invitation?.template_id,
      templateData: invitation?.template_data,
      brideName,
      groomName,
      weddingDate,
      venue,
      venueAddress: invitation?.venue_address || invitation?.venueAddress,
      shareUrl,
    });
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener');
  }, [invitation?.template_id, invitation?.template_data, brideName, groomName, weddingDate, venue, invitation?.venue_address, invitation?.venueAddress, shareUrl]);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  // When client knowledge first flips to isPaid === true (either from razorpay
  // orders.fetch() or initial DB render), kick off a SINGLE reload about 1.2s
  // later so the server-side is_paid=true propagates into the Template isDraft
  // prop (which removes the giant PREVIEW overlays server-side). The CSS
  // wrapper below hides the overlays client-side in the 1.2s interim window
  // so the customer never sees DRAFT behind the Congratulations banner.
  useEffect(() => {
    if (!isPaid) return;
    if (!querySuccess) return; // don't reload if this is a guest simply viewing a paid invite they received
    // Only reload once, the FIRST time we learn it's paid (not on subsequent status changes).
    let t;
    const reloadedKey = `__invite_reloaded::${slug}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(reloadedKey) !== '1') {
      sessionStorage.setItem(reloadedKey, '1');
      t = setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, querySuccess]);

  const childrenWrapperClass = [
    'invitation-container-root w-full min-h-screen relative',
    (isPaid || status === 'paid') ? 'force-live-hide-watermark' : '',
  ].filter(Boolean).join(' ');

  const isPaidPremium =
    invitation?.tier === 'premium' ||
    invitation?.is_ad_supported === false ||
    (invitation?.razorpay_payment_id && String(invitation?.razorpay_payment_id).startsWith('pay_')) ||
    (invitation?.razorpay_order_id && String(invitation?.razorpay_order_id).startsWith('admin_') && invitation?.paid_at);

  const isFreeTier = !isPaidPremium && invitation?.tier !== 'premium';
  const checkoutUrl = `/checkout?invitationId=${encodeURIComponent(invitationId || '')}&slug=${encodeURIComponent(slug || '')}`;

  return (
    <main className="min-h-screen relative">
      {/* ============================================================
          OWNER TOOLBAR — visible only to the authenticated invitation owner.
          Floats fixed-top, slim single-line horizontal pill on both mobile and desktop.
          ============================================================ */}
      {(isOwner || (authUser && (ownerId || ownerPhone) && !authLoading)) && (
        <div className="fixed top-2.5 sm:top-4 left-2.5 sm:left-4 z-[160] w-max max-w-[calc(100vw-1.25rem)] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-full bg-white/95 backdrop-blur-xl border border-[var(--emerald-primary)]/15 shadow-[0_8px_30px_rgba(15,56,44,0.18)]">
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 flex flex-nowrap items-center gap-1.5 sm:gap-2">
              {isOwner ? (
                <>
                  <span className="inline-flex items-center gap-1.5 pl-0.5 pr-1.5 sm:pr-2.5 py-0.5 rounded-full bg-[var(--emerald-light)] text-[var(--emerald-primary)] text-[10px] sm:text-[11px] font-bold border border-[var(--emerald-primary)]/10 shrink-0">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--emerald-primary)] text-white text-[9px] font-bold">
                        {userInitials(authUser)}
                      </span>
                    )}
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {userName || (userEmail ? userEmail.split('@')[0] : 'Owner')}
                    </span>
                  </span>

                  {invitationId && (
                    <Link
                      href={`/edit/${encodeURIComponent(invitationId)}`}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--emerald-primary)] text-white text-[11px] sm:text-xs font-bold shadow-sm hover:bg-[var(--emerald-dark)] transition-all active:scale-[0.98] shrink-0 whitespace-nowrap"
                    >
                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Edit</span>
                    </Link>
                  )}

                  {/* Go Ad-Free CTA — visible ONLY to the invitation owner on free tier */}
                  {isFreeTier && (
                    <Link
                      href={checkoutUrl}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-[11px] sm:text-xs font-bold shadow-sm shadow-amber-500/20 transition-all active:scale-[0.98] shrink-0 whitespace-nowrap"
                    >
                      <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Ad-Free (₹399)</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200/80 text-[var(--ink-soft)] hover:text-[var(--ink)] text-[11px] font-bold transition-colors shrink-0 whitespace-nowrap"
                  >
                    <LayoutDashboard className="w-3 h-3" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => signOut().then(() => router.refresh && router.refresh())}
                    className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-red-50 text-[var(--ink-soft)] hover:text-red-600 text-[11px] font-bold transition-colors shrink-0 whitespace-nowrap"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href={`/signin?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink-soft)] hover:text-[var(--ink)] text-[11px] font-bold transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in to edit</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================
          SUCCESS / STATUS BANNER
          ============================================================ */}
      {(querySuccess || !isPaid) && showBanner && (
        <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[180] w-[calc(100%-1rem)] sm:w-auto max-w-2xl animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto">
          {status === 'paid' ? (
            <div className="relative rounded-3xl shadow-[0_22px_60px_rgba(15,56,44,0.22)] overflow-hidden border-2 border-[var(--emerald-primary)]/20 bg-gradient-to-br from-white via-[var(--emerald-light)]/60 to-white">
              {/* Decorative sparkles */}
              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--champagne-500)]/20 blur-3xl"></div>
              <div className="pointer-events-none absolute -bottom-14 -left-12 w-52 h-52 rounded-full bg-[var(--emerald-primary)]/20 blur-3xl"></div>

              <button
                type="button"
                onClick={dismissBanner}
                className="absolute top-3 right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-[var(--ink-soft)] hover:bg-black/5 transition-colors"
                aria-label="Dismiss success banner"
              >
                <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Status badges */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 flex-wrap pr-8">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[var(--emerald-primary)] text-white text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Payment Successful
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/80 ring-1 ring-black/5 text-[9px] sm:text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-[var(--champagne-500)]" /> Watermark Removed
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-display text-lg sm:text-2xl md:text-[2.25rem] text-[var(--ink)] leading-tight tracking-tight mb-1.5 sm:mb-2">
                  Congratulations! Your invitation is live ✨
                </h2>

                {/* Description */}
                <p className="text-[var(--ink-muted)] text-xs sm:text-sm md:text-[15px] leading-relaxed mb-4">
                  Share the link below with your guests on WhatsApp, SMS, or any social platform.
                  Anyone who opens it will see your personalized invitation with no preview watermark.
                </p>

                {/* Share link card */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white shadow-inner ring-1 ring-black/5 mb-3">
                  <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--emerald-light)] flex items-center justify-center text-[var(--emerald-primary)]">
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-bold mb-0.5">
                      Your Invitation Link
                    </div>
                    <div className="truncate text-[11px] sm:text-[13px] font-semibold text-[var(--ink)]">
                      {shareUrl}
                    </div>
                  </div>
                </div>

                {/* Primary action buttons — full width on mobile */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink)] font-bold text-[11px] sm:text-[13px] transition-all shadow-sm active:scale-[0.98]"
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[var(--emerald-primary)]" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-[11px] sm:text-[13px] shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share on WhatsApp
                  </button>
                </div>

                {/* Secondary actions — 2-column grid on mobile, flex row on desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQR(s => !s)}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[10px] sm:text-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {showQR ? 'Hide QR' : 'Show QR Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (typeof window !== 'undefined') window.open(shareUrl, '_blank', 'noopener'); }}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[10px] sm:text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Open in new tab
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        navigator.share({
                          title: `${brideName || ''} & ${groomName || ''} — Wedding Invitation`.trim(),
                          text: buildWhatsAppShareText({
                            templateId: invitation?.template_id,
                            templateData: invitation?.template_data,
                            brideName,
                            groomName,
                            weddingDate,
                            venue,
                            venueAddress: invitation?.venue_address || invitation?.venueAddress,
                            shareUrl,
                          }),
                          url: shareUrl,
                        }).catch(() => {});
                      } else {
                        handleCopy();
                      }
                    }}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[10px] sm:text-xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    More sharing
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-xl bg-[var(--emerald-light)]/60 hover:bg-[var(--emerald-light)] text-[var(--emerald-primary)] hover:text-[var(--emerald-dark)] font-semibold text-[10px] sm:text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Create another
                  </Link>
                </div>

                {/* Inline QR code */}
                {showQR && (
                  <div className="mt-4 p-3 sm:p-5 bg-white rounded-3xl ring-1 ring-black/5 shadow-inner max-w-[240px] sm:max-w-sm mx-auto">
                    <div className="text-center mb-2 sm:mb-3">
                      <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--ink-muted)] mb-0.5 sm:mb-1">
                        Scan with any phone camera
                      </div>
                      <div className="text-[10px] sm:text-sm font-semibold text-[var(--ink)] truncate">
                        {shareUrl}
                      </div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-white p-2 ring-1 ring-black/5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=8&data=${encodeURIComponent(shareUrl)}`}
                        alt={`QR code for invitation ${shareUrl}`}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : status === 'verifying' ? (
            <div className="relative rounded-3xl shadow-[0_22px_60px_rgba(15,56,44,0.18)] overflow-hidden border-2 border-amber-300/40 bg-gradient-to-br from-amber-50 via-white to-amber-50/60">
              <div className="relative p-5 sm:p-6 md:p-7">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white shadow-inner flex items-center justify-center text-amber-500 ring-1 ring-amber-300/40">
                    <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> Verifying Payment
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[var(--ink-muted)] font-bold uppercase tracking-widest">
                        Attempt {Math.min(attempts + 1, MAX_POLL_ATTEMPTS)} / {MAX_POLL_ATTEMPTS}
                      </span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl md:text-[1.75rem] text-[var(--ink)] leading-tight mb-2">
                      Razorpay confirmed payment received — finalizing your invitation ✨
                    </h2>
                    <p className="text-[var(--ink-muted)] text-sm sm:text-base leading-relaxed mb-3.5">
                      This usually takes under 5 seconds. If you see this for more than a minute, click the
                      refresh button, or just reload the page. Your shareable link is being activated.
                    </p>
                    {lastError?.hint && (
                      <div className="text-[11px] sm:text-xs bg-amber-100/70 text-amber-800 border border-amber-200 rounded-2xl px-3 py-2 mb-3.5 leading-relaxed">
                        {lastError.hint}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        onClick={() => runStatusCheck()}
                        className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[var(--emerald-primary)] text-white font-bold text-[12px] sm:text-[13px] shadow-lg shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] active:scale-[0.98] transition-all"
                      >
                        <RefreshCw className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Refresh payment status now
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
                        className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white ring-1 ring-black/5 text-[var(--ink)] font-bold text-[12px] sm:text-[13px] hover:bg-gray-50 active:scale-[0.98] transition-all"
                      >
                        Reload page
                      </button>
                      <button
                        type="button"
                        onClick={dismissBanner}
                        className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[var(--ink-soft)] font-semibold text-[12px] sm:text-[13px] hover:bg-white/60 transition-colors"
                      >
                        I'll wait — dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // status === 'draft' AND query success = true → couldn't verify after all retries
            querySuccess ? (
              <div className="relative rounded-3xl shadow-[0_22px_60px_rgba(153,27,27,0.18)] overflow-hidden border-2 border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50/60">
                <div className="relative p-5 sm:p-6 md:p-7">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white shadow-inner flex items-center justify-center text-red-600 ring-1 ring-red-200">
                      <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                          Still verifying
                        </span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl md:text-[1.75rem] text-[var(--ink)] leading-tight mb-2">
                        Your payment went through, but we haven't confirmed it yet.
                      </h2>
                      <p className="text-[var(--ink-muted)] text-sm sm:text-base leading-relaxed mb-3.5">
                        You will <span className="font-bold text-[var(--ink)]">NOT</span> be charged twice. The watermark may still be visible
                        until the Razorpay webhook arrives. Click the buttons below or wait a few minutes and refresh.
                      </p>
                      {lastError && (
                        <div className="mb-3.5 space-y-1.5">
                          <div className="text-[11px] sm:text-xs bg-red-100/80 text-red-800 border border-red-200 rounded-2xl px-3 py-2 leading-relaxed">
                            <strong>Why? </strong>{lastError.message}
                          </div>
                          {lastError.hint && (
                            <div className="text-[11px] sm:text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl px-3 py-2 leading-relaxed">
                              💡 {lastError.hint}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          onClick={() => runStatusCheck()}
                          className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[var(--emerald-primary)] text-white font-bold text-[12px] sm:text-[13px] shadow-lg shadow-[var(--emerald-primary)]/20 hover:bg-[var(--emerald-dark)] active:scale-[0.98] transition-all"
                        >
                          <RefreshCw className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                          Try verifying again
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
                          className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white ring-1 ring-black/5 text-[var(--ink)] font-bold text-[12px] sm:text-[13px] hover:bg-gray-50 active:scale-[0.98] transition-all"
                        >
                          Reload page
                        </button>
                        <button
                          type="button"
                          onClick={dismissBanner}
                          className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[var(--ink-soft)] font-semibold text-[12px] sm:text-[13px] hover:bg-white/60 transition-colors"
                        >
                          Close & try later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Removed old DRAFT PREVIEW fixed chip — SuccessShell status banners replace it entirely, with 4 states */}

      {/* ------- TEMPLATE CHILDREN (Server Component) -------
           Wrapped in a div that has class .force-live-hide-watermark when
           client confirms paid — CSS rules above instantly hide the
           giant PREVIEW/DRAFT overlays while the server reload (1.2s) syncs
           the DB is_paid flip into the isDraft server render. */}
      <div className={childrenWrapperClass}>
        {children}
      </div>

      {/* ------- VIRAL LOOP CTA — guests only (hide from owner) -------
           Sleek, compact single-line pill CTA that sits unobtrusively at the bottom without blocking invitation content */}
      {!isOwner && !guestCtaDismissed && (
        <div
          className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[65] w-max max-w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto"
          role="region"
          aria-label="Make your own invitation"
        >
          <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 pl-3 pr-1.5 py-1 sm:py-1.5 rounded-full bg-[#0F382C]/95 text-white backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-emerald-400/20 text-xs">
            <span className="flex flex-nowrap items-center gap-1.5 font-medium text-white/95 text-[11px] sm:text-xs whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Create your invite</span>
            </span>
            <Link
              href={`/create/${encodeURIComponent(guestCtaTemplate)}?ref=viral-via-${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-white text-[var(--emerald-dark)] hover:bg-emerald-50 font-bold text-[10px] sm:text-[11px] shadow-sm transition-transform active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>Try Free</span>
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70" />
            </Link>
            <button
              type="button"
              onClick={dismissGuestCta}
              className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss banner"
            >
              <XIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ------- FREE TIER EXPIRY BANNER (visible to owner only) ------- */}
      {showExpiryBanner && isOwner && expiryInfo && (
        <FreeTierExpiryBanner
          daysRemaining={expiryInfo.daysRemaining}
          hoursRemaining={expiryInfo.hoursRemaining}
          invitationId={invitationId}
          slug={slug}
        />
      )}

      {/* ------- VIEW COUNTER (visible to host only) ------- */}
      {viewStats && viewStats.total_views > 0 && isOwner && (
        <div className="fixed bottom-3 left-3 z-[80]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold shadow-lg border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{viewStats.total_views} views</span>
            {viewStats.unique_visitors > 0 && (
              <span className="text-white/50">· {viewStats.unique_visitors} guests</span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
