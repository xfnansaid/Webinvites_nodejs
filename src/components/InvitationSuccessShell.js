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
} from 'lucide-react';
import Link from 'next/link';

const MAX_POLL_ATTEMPTS = 15; // about 30s at 2s each
const POLL_INTERVAL_MS = 2000;

function prettyWeddingDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildShareText({ brideName, groomName, weddingDate, venue, shareUrl }) {
  const dateLine = prettyWeddingDate(weddingDate);
  const names = [brideName, groomName].filter(Boolean).join(' & ');
  const parts = [];
  if (names) parts.push(`💍 ${names}`);
  if (dateLine) parts.push(`📅 ${dateLine}`);
  if (venue) parts.push(`📍 ${venue}`);
  parts.push(`🔗 ${shareUrl}`);
  parts.push('Your presence will make our day even more special! ❤️');
  return parts.join('\n');
}

export default function InvitationSuccessShell({
  slug,
  initialIsPaid,
  invitation,
  querySuccess = false,
  children,
}) {
  const razorpayOrderId = invitation?.razorpay_order_id;
  const groomName = invitation?.groom_name || invitation?.groomName;
  const brideName = invitation?.bride_name || invitation?.brideName;
  const weddingDate = invitation?.wedding_date || invitation?.weddingDate;
  const venue = invitation?.venue;

  // Canonical share URL for this invitation
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${window.location.protocol}//${window.location.host}`;
    const cleanBase = String(base).replace(/\/$/, '');
    return `${cleanBase}/i/${encodeURIComponent(slug)}`;
  }, [slug]);

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
    const text = buildShareText({ brideName, groomName, weddingDate, venue, shareUrl });
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener');
  }, [brideName, groomName, weddingDate, venue, shareUrl]);

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
    'contents',
    (isPaid || status === 'paid') ? 'force-live-hide-watermark' : '',
  ].filter(Boolean).join(' ');

  return (
    <main className="min-h-screen relative">
      {/* ============================================================
          GLOBAL CLIENT-SIDE CSS: hide the PREVIEW/DRAFT overlays immediately
          when client knows Razorpay says PAID, before the server re-render.
          ============================================================ */}
      {(isPaid || status === 'paid') && (
        <style>{`
          /* Strip all giant diagonal PREVIEW watermarks inside templates the INSTANT client
             says Razorpay paid — BEFORE the server's is_paid DB flag syncs (1.2s reload). */
          .force-live-hide-watermark { }

          /* Every watermark uses .select-none + .pointer-events-none — hide immediately */
          .force-live-hide-watermark .select-none.pointer-events-none,
          .force-live-hide-watermark *:is(.pointer-events-none.select-none) {
            opacity: 0 !important;
            visibility: hidden !important;
            transform: scale(0) !important;
            pointer-events: none !important;
          }
          /* Also hide any rotated huge PREVIEW uppercase divs (kept as dead guard) */
          .force-live-hide-watermark .whitespace-nowrap.uppercase.font-black {
            opacity: 0 !important;
            visibility: hidden !important;
            transform: scale(0) !important;
          }
          .force-live-hide-watermark .whitespace-nowrap.uppercase {
            opacity: 0 !important;
            visibility: hidden !important;
          }
          /* Hide DRAFT PREVIEW UNPAID bounce fixed-top chip */
          .force-live-hide-watermark ~ .animate-bounce.fixed,
          main > .animate-bounce.fixed:has(.force-live-hide-watermark) {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          /* Nuclear catch: ultra low-opacity (<0.1) preview overlays (every template uses this!) */
          .force-live-hide-watermark *[style*="opacity: 0.03"],
          .force-live-hide-watermark *[style*="opacity: 0.04"],
          .force-live-hide-watermark *[style*="opacity: 0.05"],
          .force-live-hide-watermark *[style*="opacity: 0.06"],
          .force-live-hide-watermark *[style*="opacity:0.03"],
          .force-live-hide-watermark *[style*="opacity:0.04"],
          .force-live-hide-watermark *[style*="opacity:0.05"],
          .force-live-hide-watermark *[style*="opacity:0.06"],
          .force-live-hide-watermark *[class*="text-white/\\[0\\.04\\]"],
          .force-live-hide-watermark *[class*="text-white/\\[0\\.05\\]"],
          .force-live-hide-watermark *[class*="text-white/\\[0\\.06\\]"] {
            opacity: 0 !important;
            visibility: hidden !important;
            transform: scale(0) !important;
          }
        `}</style>
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
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-2xl flex items-center justify-center text-[var(--ink-soft)] hover:bg-black/5 transition-colors"
                aria-label="Dismiss success banner"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="relative p-5 sm:p-7 md:p-8">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white shadow-inner flex items-center justify-center text-[var(--emerald-primary)] ring-1 ring-[var(--emerald-primary)]/15">
                    <PartyPopper className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--emerald-primary)] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Payment Successful
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-black/5 text-[10px] sm:text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">
                        <Sparkles className="w-3 h-3 text-[var(--champagne-500)] sm:w-3.5 sm:h-3.5" /> Watermark Removed
                      </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl md:text-[2.25rem] text-[var(--ink)] leading-tight tracking-tight mb-2">
                      Congratulations! Your invitation is live ✨
                    </h2>
                    <p className="text-[var(--ink-muted)] text-sm sm:text-base md:text-[15px] leading-relaxed mb-4 sm:mb-5">
                      Share the link below with your guests on WhatsApp, SMS, or any social platform.
                      Anyone who opens it will see your personalized invitation with no preview watermark.
                    </p>

                    {/* Share link row */}
                    <div className="w-full flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                      <div className="flex-1 min-w-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white shadow-inner ring-1 ring-black/5">
                        <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--emerald-light)] flex items-center justify-center text-[var(--emerald-primary)]">
                          <ExternalLink className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-bold mb-0.5">
                            Your Invitation Link
                          </div>
                          <div className="truncate text-[12px] sm:text-[13px] md:text-sm font-semibold text-[var(--ink)]">
                            {shareUrl}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:flex-none gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink)] font-bold text-[12px] sm:text-[13px] transition-all shadow-sm active:scale-[0.98]"
                        >
                          {linkCopied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[var(--emerald-primary)]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                              Copy Link
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleWhatsApp}
                          className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-[12px] sm:text-[13px] shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                        >
                          <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                          Share on WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Extra actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowQR(s => !s)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[11px] sm:text-xs transition-colors"
                      >
                        <QrCode className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        {showQR ? 'Hide QR Code' : 'Show QR Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (typeof window !== 'undefined') window.open(shareUrl, '_blank', 'noopener'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[11px] sm:text-xs transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Open in new tab
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.share) {
                            navigator.share({
                              title: `${brideName || ''} & ${groomName || ''} — Wedding Invitation`.trim(),
                              text: buildShareText({ brideName, groomName, weddingDate, venue, shareUrl }),
                              url: shareUrl,
                            }).catch(() => {});
                          } else {
                            handleCopy();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 ring-1 ring-black/5 hover:bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold text-[11px] sm:text-xs transition-colors"
                      >
                        <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        More sharing options
                      </button>
                      <Link
                        href="/templates"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--emerald-light)]/60 hover:bg-[var(--emerald-light)] text-[var(--emerald-primary)] hover:text-[var(--emerald-dark)] font-semibold text-[11px] sm:text-xs transition-colors"
                      >
                        <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Create another invitation
                      </Link>
                    </div>

                    {/* Inline QR code (uses Google Charts free API so we don't need a library) */}
                    {showQR && (
                      <div className="mt-5 p-4 sm:p-5 bg-white rounded-3xl ring-1 ring-black/5 shadow-inner max-w-xs sm:max-w-sm mx-auto sm:mx-0">
                        <div className="text-center mb-3">
                          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--ink-muted)] mb-1">
                            Scan with any phone camera
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-[var(--ink)] truncate">
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
    </main>
  );
}
