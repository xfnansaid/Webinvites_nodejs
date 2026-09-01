'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Loader2, Sparkles, X, Copy, Check, LogIn, PlayCircle } from 'lucide-react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, userInitials } from '@/lib/auth';
import RewardedPublishModal from '@/components/ads/RewardedPublishModal';
import {
  saveStagedEdits,
  consumeForPublishStagedEdits,
  discardStagedEdits,
  STAGE_MAX_AGE_MS,
} from '@/lib/stage-edits';

// Poll with exponential backoff for window.Razorpay being ready after the
// checkout.js script injects. Ad blockers / corporate proxies sometimes
// block checkout.razorpay.com, so we fail cleanly with a troubleshooting
// message instead of throwing "window.Razorpay is not a constructor".
function waitForRazorpay(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let delay = 50;
    const tick = () => {
      if (typeof window !== 'undefined' && typeof window.Razorpay === 'function') {
        resolve(true);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(
          new Error(
            'Razorpay checkout script could not be loaded. Disable your ad blocker or privacy extension and refresh the page. ' +
              'If on a corporate/school network, checkout.razorpay.com may be blocked by a proxy.',
          ),
        );
        return;
      }
      delay = Math.min(delay * 2, 500);
      setTimeout(tick, delay);
    };
    tick();
  });
}

// Stage current formData to localStorage AND kick off the Google OAuth flow.
// After the Google redirect round-trip lands on /signin → signed-in → router.replace
// (back to `returnTo`). This component auto-detects staged data on mount and resumes
// the publish flow via handlePay within ~350ms (see the useEffect above handlePay).
//
// Before redirecting we also save a server-side "draft" row to Supabase so the
// user's edited template data is PERMANENTLY linked to their account after
// sign-in, not just in browser localStorage. See /api/save-draft.
async function stageEditsAndRedirect({
  formData,
  templateId,
  existingInvitationId,
  router,
  signInWithGoogle,
  session,
}) {
  if (typeof window === 'undefined') return;
  const returnTo = window.location.pathname + window.location.search;

  // Tier 1 — save to localStorage first (instant, always works, used for the
  // Live Editor to restore groom/bride/date fields before any server call completes).
  const stage = {
    formData: { ...formData },
    templateId,
    existingInvitationId: existingInvitationId || null,
    returnTo,
  };
  saveStagedEdits(stage);

  // Tier 2 (best-effort) — save the same form as an anonymous draft in Supabase.
  // If this succeeds we store draftId + temp_owner_token into the stage object
  // so after the Google redirect round-trip the client can call /api/claim-draft
  // to flip owner_id on the draft to the newly-signed-in user, making it show up
  // on their dashboard as an Unpaid Draft forever.
  try {
    const accessToken = session?.access_token || null;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch('/api/save-draft', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({
        formData: { ...formData },
        templateId,
        existingInvitationId: existingInvitationId || null,
        returnTo,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.ok && data.tempOwnerToken) {
      saveStagedEdits({
        ...stage,
        draftId: data.draftId || null,
        tempOwnerToken: data.tempOwnerToken,
      });
    }
  } catch (serverSaveErr) {
    // Best-effort only. localStorage restore is sufficient for user experience;
    // failing here does not prevent publish.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[PaymentBanner] /api/save-draft best-effort call failed (localStorage only used):',
        serverSaveErr?.message || serverSaveErr,
      );
    }
  }

  // Use the Google OAuth redirect (signInWithGoogle stores nextRelative in a second
  // key — the signin page consumes it and routes back to returnTo after sign-in).
  if (signInWithGoogle) {
    signInWithGoogle({ nextRelative: returnTo }).catch((e) => {
      // Fallback if Google fails to start: plain redirect to sign-in page
      const next = encodeURIComponent(returnTo);
      router.push(`/signin?next=${next}&stage=1`);
    });
  } else {
    const next = encodeURIComponent(returnTo);
    router.push(`/signin?next=${next}&stage=1`);
  }
}

function tryConsumeStagedEdits() {
  const stage = consumeForPublishStagedEdits();
  if (!stage) return null;
  // Backwards compat: the old helper used a 10-minute age threshold. Our shared
  // helper uses a 20-minute threshold; if by chance we got a stale one, discard.
  if (stage.at && Date.now() - stage.at > STAGE_MAX_AGE_MS) {
    discardStagedEdits();
    return null;
  }
  return stage;
}

export default function PaymentBanner({
  formData,
  templateId,
  existingInvitationId = null,
  invitationAlreadyPaid = false,
  onAfterSignInAutoPublish,
}) {
  const router = useRouter();
  const { user, session, loading: authLoading, userPhone, userName, userEmail, userAvatar, isAdmin, signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null); // {message, code, hint, copyableSql}
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showRewardedModal, setShowRewardedModal] = useState(false);
  const [entitlements, setEntitlements] = useState(null);
  const sqlTextareaRef = useRef(null);

  // Fetch user free tier entitlements
  useEffect(() => {
    let active = true;
    async function fetchEntitlements() {
      try {
        const res = await fetch('/api/user-entitlements', {
          credentials: 'same-origin',
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        if (active && res.ok && data) {
          setEntitlements(data);
        }
      } catch (e) {
        // ignore
      }
    }
    fetchEntitlements();
    return () => { active = false; };
  }, [user, session]);
  // Refs that let us invoke callbacks from a useEffect that runs BEFORE the
  // callbacks are declared.  This eliminates the temporal dead zone (TDZ)
  // "Cannot access before initialization" errors when React hook ordering
  // means the auto-resume effect is set up before the handlePay callback is
  // assigned.  The refs are assigned immediately after each callback is
  // declared, and are always dereferenced only inside a delayed setTimeout
  // body so the assignments have always run by the time we call them.
  const handlePayRef = useRef(null);
  const onAfterSignInAutoPublishRef = useRef(null);

  // On mount (after sign-in redirect): auto-consume staged edits and republish
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    // Wait for access_token in session to be available too (same render cycle
    // but we guard so we never call server with missing Bearer header on the
    // OAuth return page).
    if (!session?.access_token) return;
    const staged = tryConsumeStagedEdits();
    if (staged && (staged.templateId === templateId || !existingInvitationId)) {
      const t = setTimeout(() => {
        // IMPORTANT: read ONLY from refs here — this runs after 350ms so both
        // refs are guaranteed to be assigned; avoids any temporal dead zone
        // that would come from referencing handlePay / onAfter directly.
        const onAfter = onAfterSignInAutoPublishRef.current;
        const payFn = handlePayRef.current;
        if (typeof onAfter === 'function') onAfter();
        if (typeof payFn === 'function') {
          payFn(staged.formData || null, staged.existingInvitationId || null);
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [authLoading, user, session, templateId, existingInvitationId]);

  // Wipe the error banner when the user makes any edit so it doesn't hang around
  useEffect(() => {
    setLastError(null);
  }, [formData.groomName, formData.brideName, formData.weddingDate, formData.whatsappNumber]);

  const dismissError = useCallback(() => setLastError(null), []);
  const copySql = useCallback(async () => {
    if (!sqlTextareaRef.current) return;
    const sql = sqlTextareaRef.current.value;
    try {
      await navigator.clipboard.writeText(sql);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    } catch (e) {
      sqlTextareaRef.current.select();
      try {
        document.execCommand('copy');
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2500);
      } catch (_) {
        // no-op
      }
    }
  }, []);

  // Builds the headers we send along with every protected API call.
  // Always attaches a Bearer access token if the signed-in session has one,
  // which bypasses SameSite cookie quirks on localhost and races where the
  // session cookie has not yet been written after a Google OAuth redirect.
  const authHeaders = useMemo(() => {
    const h = { 'Content-Type': 'application/json' };
    const accessToken = session?.access_token || null;
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    return h;
  }, [session]);

  /**
   * Edits-only save flow — free, unlimited edits for any invitation that is
   * ALREADY PAID (invitationAlreadyPaid=true).  Used by:
   *   - Admin operator accounts clicking "Save edits & update live site"
   *   - Any signed-in customer editing a template they already paid for
   *
   * Instead of re-charging ₹299 or hitting the admin-publish flow (which
   * would assign a new fake razorpay order_id), we just PATCH the existing
   * invitation in-place with the latest formData, then redirect to live page.
   */
  const handleSaveEditsOnly = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    setLastError(null);
    const invitationId = overrideExistingId || existingInvitationId;
    if (!invitationId) {
      // Sanity guard — if no existing invitationId, fall through to normal
      // admin publish / Razorpay (will be handled by caller after return).
      return false;
    }

    try {
      setLoading(true);

      const fd = overrideFormData || formData;
      const canonical = fd.mapsUrl || fd.mapUrl || fd.directionsUrl;
      const photoUrl = fd.photoUrl || fd.heroImage || fd.templateData?.photoUrl || fd.templateData?.heroImage || '';

      let response;
      try {
        response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: fd.templateId || templateId,
            groomName: fd.groomName,
            brideName: fd.brideName,
            weddingDate: fd.weddingDate,
            weddingTime: fd.weddingTime,
            venue: fd.venue,
            venueAddress: fd.venueAddress,
            mapsUrl: canonical,
            whatsappNumber: fd.whatsappNumber,
            groomParents: fd.groomParents,
            brideParents: fd.brideParents,
            heroTagline: fd.heroTagline,
            heroEventText: fd.heroEventText,
            countdownTitle: fd.countdownTitle,
            photoUrl: photoUrl || undefined,
            templateData: {
              ...(fd.templateData || {}),
              ...(photoUrl ? { photoUrl, heroImage: photoUrl } : {}),
              ...(fd.showPhotoSection !== undefined ? { showPhotoSection: fd.showPhotoSection } : {}),
              ...(fd.showRsvp !== undefined ? { showRsvp: fd.showRsvp } : {}),
              ...(fd.showEvents !== undefined ? { showEvents: fd.showEvents } : {}),
            },
          }),
        });
      } catch (netErr) {
        setLastError({
          message: 'Could not reach the server. Please check your internet connection.',
          code: 'NETWORK',
          hint: netErr?.message || 'fetch() failed before reaching /api/invitations/[id] (PATCH route).',
        });
        return true;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setLastError({
          message: data?.error || `Server responded ${response.status}`,
          code: data?.code || `HTTP_${response.status}`,
          hint: data?.hint || data?.details || 'See Next.js server terminal for stack trace.',
          copyableSql: data?.copyableSql || null,
        });
        return true;
      }

      // Save success — redirect to live page with success flag (shows the
      // "Congratulations · Template published successfully" banner so user
      // gets a clear confirmation that their edits went live).
      const slug = data?.invitation?.slug || null;
      if (!slug) {
        setLastError({
          message: 'Saved to database — but we could not find the live page slug.',
          hint: 'Open Dashboard → click "Open live link" on the invitation card to confirm.',
        });
        return true;
      }

      router.push(`/i/${slug}?success=true`);
      return true;
    } catch (unexpectedErr) {
      console.error('Unexpected handleSaveEditsOnly error:', unexpectedErr);
      setLastError({
        message: unexpectedErr?.message || 'Something unexpected happened.',
        code: 'UNEXPECTED',
        hint: 'Screenshot the DevTools Console red errors and send to support.',
      });
      return true;
    } finally {
      setLoading(false);
    }
  }, [router, templateId, formData, existingInvitationId, authHeaders]);

  /**
   * Admin publish flow — called in place of Razorpay for whitelisted Google
   * accounts. Hits /api/admin-publish which server-side validates admin email
   * via Supabase auth cookies and writes invitation with is_paid=true.
   *
   * SHORT-CIRCUIT for already-paid invites: if invitationAlreadyPaid we use
   * handleSaveEditsOnly() instead, which saves for free (no fake admin order
   * id rewrite, no redirect logic divergence) — same for customers & admins.
   */
  const handleAdminPublish = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    // If editing existing paid invite: save edits only (no order rewrite)
    const invitationId = overrideExistingId || existingInvitationId;
    if (invitationAlreadyPaid && invitationId) {
      const handled = await handleSaveEditsOnly(overrideFormData, overrideExistingId);
      if (handled) return;
    }

    setLastError(null);
    try {
      setLoading(true);

      const payload = {
        ...(overrideFormData || formData),
        templateId,
        ...((invitationId)
          ? { invitationId }
          : {}),
      };

      let response;
      try {
        response = await fetch('/api/admin-publish', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        });
      } catch (netErr) {
        setLastError({
          message: 'Could not reach the server. Please check your internet connection.',
          code: 'NETWORK',
          hint: netErr?.message || 'fetch() failed before reaching the /api/admin-publish route.',
        });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setLastError({
          message: data?.error || `Server responded ${response.status}`,
          code: data?.code || `HTTP_${response.status}`,
          hint: data?.hint || data?.details || 'See the Next.js server terminal for the full stack trace.',
          copyableSql: data?.copyableSql || null,
        });
        return;
      }

      // Admin publish success — redirect exactly like Razorpay handler success
      // so the user lands on the live invitation with the success=true banner.
      router.push(`/i/${data.slug}?success=true`);
    } catch (unexpectedErr) {
      console.error('Unexpected admin-publish error:', unexpectedErr);
      setLastError({
        message: unexpectedErr?.message || 'Something unexpected happened.',
        code: 'UNEXPECTED',
        hint: 'Check the browser DevTools Console for red errors; screenshot them and send to support if this repeats.',
      });
    } finally {
      setLoading(false);
    }
  }, [router, templateId, formData, existingInvitationId, authHeaders, handleSaveEditsOnly, invitationAlreadyPaid]);

  /**
   * Free Tier Publish handler — triggered when user completes the Rewarded Video Ad
   */
  const handleFreePublishRewardEarned = useCallback(async () => {
    setShowRewardedModal(false);

    // If not signed in, redirect to Google sign-in first
    if (!authLoading && !user) {
      stageEditsAndRedirect({
        formData,
        templateId,
        existingInvitationId,
        router,
        signInWithGoogle,
        session,
      });
      return;
    }

    setLoading(true);
    setLastError(null);

    try {
      const payload = {
        ...(formData || {}),
        templateId,
        ...(existingInvitationId ? { invitationId: existingInvitationId } : {}),
      };

      const res = await fetch('/api/publish-free', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        if (data?.code === 'FREE_TIER_LIMIT_REACHED') {
          setEntitlements((prev) => ({
            ...(prev || {}),
            canPublishFree: false,
            freePublishedCount: 1,
          }));
        }
        setLastError({
          message: data?.error || `Server returned ${res.status}`,
          code: data?.code || `HTTP_${res.status}`,
          hint:
            data?.code === 'FREE_TIER_LIMIT_REACHED'
              ? 'You already have 1 active free invitation. Delete it from your Dashboard to publish another free template, or proceed to pay ₹399 below.'
              : data?.details || 'Check the details above, or publish ad-free for ₹399.',
          showPayOption: data?.code === 'FREE_TIER_LIMIT_REACHED',
        });
        return;
      }

      router.push(`/i/${data.slug}?success=true`);
    } catch (err) {
      console.error('Free publish error:', err);
      setLastError({
        message: err?.message || 'Free publish failed.',
        code: 'FREE_PUBLISH_FAILED',
        hint: 'You can try again or upgrade to publish ad-free for ₹399.',
      });
    } finally {
      setLoading(false);
    }
  }, [formData, templateId, existingInvitationId, authHeaders, router, authLoading, user, signInWithGoogle, session]);

  const canPublishFree = useMemo(() => {
    if (invitationAlreadyPaid) return false;
    if (isAdmin) return false;
    if (entitlements && entitlements.canPublishFree === false) return false;
    return true;
  }, [invitationAlreadyPaid, isAdmin, entitlements]);

  /**
   * Standard Paid Razorpay checkout flow (₹399)
   */
  const handlePayPaid = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    setLastError(null);
    const existingId = overrideExistingId || existingInvitationId;

    if (!authLoading && !user) {
      stageEditsAndRedirect({
        formData: overrideFormData || formData,
        templateId,
        existingInvitationId: existingId,
        router,
        signInWithGoogle,
        session,
      });
      return;
    }

    try {
      setLoading(true);
      await waitForRazorpay();

      const payload = {
        ...(overrideFormData || formData),
        templateId,
        ...(existingId ? { invitationId: existingId } : {}),
        purpose: 'publish_premium',
      };

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        setLastError({
          message: data?.error || `Server responded ${response.status}`,
          code: data?.code || `HTTP_${response.status}`,
          hint: data?.hint || data?.details || 'Check the server logs.',
        });
        return;
      }

      const fd = overrideFormData || formData;
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'WEB INVITES',
        description: `Wedding Invitation - ${fd.groomName} & ${fd.brideName}`,
        order_id: data.orderId,
        handler: async function (rzpResponse) {
          try {
            await fetch('/api/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              }),
            });
          } catch (e) {
            console.warn('confirm-payment call failed', e);
          }
          router.push(`/i/${data.slug}?success=true`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            window.dispatchEvent(new Event('razorpay-close'));
          },
        },
        prefill: {
          name: `${fd.groomName} & ${fd.brideName}`,
          contact: fd.whatsappNumber || userPhone,
        },
        theme: {
          color: '#0F382C',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failEvt) {
        setLastError({
          message: failEvt?.error?.description || 'Payment failed.',
          code: 'PAYMENT_FAILED',
        });
        setLoading(false);
        window.dispatchEvent(new Event('razorpay-close'));
      });
      window.dispatchEvent(new Event('razorpay-open'));
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setLastError({
        message: err.message || 'Could not start payment.',
        code: 'PAYMENT_ERROR',
      });
      setLoading(false);
    }
  }, [authLoading, user, router, templateId, formData, existingInvitationId, userPhone, authHeaders, signInWithGoogle, session]);

  /**
   * The unified Publish Now flow.
   */
  const handlePay = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    setLastError(null);

    const existingId = overrideExistingId || existingInvitationId;
    if (invitationAlreadyPaid && existingId) {
      const handled = await handleSaveEditsOnly(overrideFormData, overrideExistingId);
      if (handled) return;
    }

    if (isAdmin) {
      await handleAdminPublish(overrideFormData, overrideExistingId);
      return;
    }

    // FREE TIER PUBLISH ROUTE:
    // Show the upgrade/free modal FIRST (even for unauthenticated users).
    // Auth check happens AFTER user picks an option in the modal callbacks.
    if (canPublishFree) {
      setShowRewardedModal(true);
      return;
    }

    // For non-free-tier users (e.g. already used their free publish),
    // require sign-in before proceeding to paid checkout.
    if (!authLoading && !user) {
      stageEditsAndRedirect({
        formData: overrideFormData || formData,
        templateId,
        existingInvitationId: existingId,
        router,
        signInWithGoogle,
        session,
      });
      return;
    }

    // Otherwise standard ₹399 payment
    await handlePayPaid(overrideFormData, overrideExistingId);
  }, [authLoading, user, isAdmin, handleAdminPublish, handleSaveEditsOnly, invitationAlreadyPaid, existingInvitationId, formData, templateId, router, signInWithGoogle, session, canPublishFree, handlePayPaid]);

  handlePayRef.current = handlePay;
  onAfterSignInAutoPublishRef.current = typeof onAfterSignInAutoPublish === 'function'
    ? onAfterSignInAutoPublish
    : null;

  const buttonLabel = useMemo(() => {
    if (authLoading) return 'Checking account…';
    if (invitationAlreadyPaid) {
      return 'Save edits & update live site';
    }
    if (isAdmin) return 'Publish Now (Admin — Free)';
    if (canPublishFree) return 'Publish Invitation ✨';
    if (!user) return 'Sign in & Publish ✨';
    return 'Publish for ₹399';
  }, [authLoading, invitationAlreadyPaid, user, isAdmin, canPublishFree]);

  const buttonIcon = useMemo(() => {
    if (authLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (canPublishFree) return <Sparkles className="w-5 h-5 text-amber-300" />;
    if (!user) return <LogIn className="w-5 h-5" />;
    return <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />;
  }, [authLoading, user, canPublishFree]);

  return (
    <>
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onError={(e) => {
          console.warn('Razorpay script failed to load (ad block, network, or extension).', e);
          setLastError({
            message:
              'Razorpay checkout script was blocked from loading. This is usually caused by an ad blocker or Brave Shields.',
            code: 'RZP_SCRIPT_BLOCKED',
            hint:
              '1) Temporarily disable your ad/privacy blocker on this page. 2) Turn off Brave Shields (lion icon in URL bar). 3) Refresh and try again.',
          });
        }}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Inline error banner — above the payment card. Fixed pointer-events auto so user can close/read it. */}
        {lastError && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 mb-3 sm:mb-4 pointer-events-auto">
            <div className="relative bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl shadow-[0_18px_50px_rgba(153,27,27,0.15)] p-4 sm:p-5 flex items-start gap-3 sm:gap-4 animate-in slide-in-from-bottom-6 fade-in duration-300">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-bold text-red-800 text-sm sm:text-base leading-none">
                    Couldn't start payment
                  </h4>
                  {lastError.code && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 font-mono text-[10px] sm:text-[11px] tracking-tight">
                      {lastError.code}
                    </span>
                  )}
                </div>
                <p className="text-red-700 text-[13px] sm:text-sm leading-relaxed mb-2">
                  {lastError.message}
                </p>
                {lastError.hint && (
                  <p className="text-red-600/90 text-[11px] sm:text-xs leading-relaxed bg-white/70 border border-red-100 rounded-xl px-3 py-2">
                    💡 {lastError.hint}
                  </p>
                )}

                {lastError.showPayOption && (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLastError(null);
                        handlePayPaid();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pay ₹399 &amp; Publish Now</span>
                    </button>
                    <Link
                      href="/dashboard"
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900 underline ml-1"
                    >
                      Go to Dashboard to delete old invite →
                    </Link>
                  </div>
                )}

                {lastError.copyableSql && (
                  <div className="mt-3 border border-red-200 rounded-2xl bg-white overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between gap-2 bg-red-50 px-3 py-2 border-b border-red-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold text-red-800 tracking-wide uppercase">
                          Copy SQL — paste into Supabase SQL Editor
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={copySql}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 text-[11px] font-bold transition-colors shrink-0"
                      >
                        {sqlCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      ref={sqlTextareaRef}
                      readOnly
                      value={lastError.copyableSql}
                      rows={10}
                      spellCheck={false}
                      className="w-full block bg-white text-[11px] sm:text-xs font-mono text-gray-800 p-3 resize-none focus:outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={dismissError}
                className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        )}

        {/* Main payment banner */}
        <div className="bg-white/92 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-10px_40px_rgba(15,56,44,0.1)] p-4 sm:p-5 md:p-3.5 lg:p-4 pointer-events-auto pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left w-full md:w-auto md:min-w-0">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-1.5 pr-3 py-1.5 rounded-2xl bg-[var(--emerald-light)]/60 ring-1 ring-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/10">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--emerald-primary)] text-white text-[10px] font-bold">
                      {userInitials(user)}
                    </span>
                  )}
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--emerald-primary)]/80">Signed in with Google</div>
                    <div className="text-[12px] font-bold text-[var(--ink)] truncate max-w-[160px]">
                      {userName || userEmail || 'You'}
                    </div>
                  </div>
                </div>
              )}

              {/* Compact subtitle chip (desktop only) */}
              <div className="hidden md:flex md:max-w-none items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[var(--champagne-500)]/10 text-[11px] font-bold text-[var(--champagne-700)] ring-1 ring-[var(--champagne-500)]/20">
                  {isAdmin ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {invitationAlreadyPaid ? 'Admin · Saving edits = instant site update' : 'ADMIN · PUBLISH INSTANTLY'}
                    </>
                  ) : invitationAlreadyPaid ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Owner · Save edits directly to live site
                    </>
                  ) : canPublishFree ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      1 Free Template Available · Free or ₹399 Ad-Free
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Secure Checkout · ₹399 Ad-Free
                    </>
                  )}
                </span>
                {isAdmin && (
                  <span className="hidden xl:inline text-[11px] font-semibold text-[var(--ink-muted)] truncate max-w-[280px]">
                    Publishing under{' '}
                    <span className="text-[var(--ink-soft)] font-bold">{userName || userEmail || 'Operator'}</span>
                    {' '}— no payment required.
                  </span>
                )}
                {canPublishFree && user && !isAdmin && (
                  <button
                    type="button"
                    onClick={() => handlePayPaid()}
                    className="hidden lg:inline-flex text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline ml-1"
                  >
                    Or go 100% ad-free (₹399) →
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handlePay()}
                disabled={loading}
                className="w-full md:w-auto px-7 sm:px-9 py-3.5 sm:py-3.5 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-[var(--emerald-dark)] transition-all shadow-xl shadow-[var(--emerald-primary)]/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isAdmin
                      ? invitationAlreadyPaid
                        ? 'Saving to your live site…'
                        : 'Publishing invitation…'
                      : invitationAlreadyPaid
                        ? 'Saving to your live site…'
                        : 'Processing…'}
                  </>
                ) : (
                  <>
                    {buttonLabel}
                    {buttonIcon}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Rewarded Video Ad Modal for Free Tier Publishing */}
      <RewardedPublishModal
        isOpen={showRewardedModal}
        onClose={() => setShowRewardedModal(false)}
        onRewardEarned={handleFreePublishRewardEarned}
        onUpgradeToPaid={() => {
          setShowRewardedModal(false);
          // Auth check: if not signed in, redirect to Google sign-in first
          if (!authLoading && !user) {
            stageEditsAndRedirect({
              formData,
              templateId,
              existingInvitationId,
              router,
              signInWithGoogle,
              session,
            });
            return;
          }
          handlePayPaid();
        }}
        templateTitle={`${formData?.groomName || 'Groom'} & ${formData?.brideName || 'Bride'}`}
      />
    </>
  );
}

