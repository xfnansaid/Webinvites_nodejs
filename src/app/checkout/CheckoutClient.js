'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  Loader2,
  AlertCircle,
  Clock,
  RotateCcw,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

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
        reject(new Error('Razorpay checkout script could not be loaded. Please refresh.'));
        return;
      }
      delay = Math.min(delay * 2, 500);
      setTimeout(tick, delay);
    };
    tick();
  });
}

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CheckoutClient({ initialInvitation, searchSlug, searchInvitationId }) {
  const router = useRouter();
  const { user, session } = useAuth();

  const [invitation, setInvitation] = useState(initialInvitation);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'initiating' | 'processing' | 'cancelled' | 'failed' | 'success'
  const [errorMessage, setErrorMessage] = useState('');

  // Ad isolation: Clean up any foreign ad scripts, iframes, or overlays from the window
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Remove all foreign ad scripts
      const adScripts = document.querySelectorAll(
        'script[id^="monetag"], script[src*="al5sm"], script[src*="n6wxm"], script[src*="nap5k"], script[src*="omg10"], script[src*="googlesyndication"], script[src*="doubleclick"], script[src*="adservice"]'
      );
      adScripts.forEach((s) => s.remove());

      // 2. Remove all ad iframes / overlays / push badges
      const adElements = document.querySelectorAll(
        'iframe[src*="monetag"], iframe[src*="al5sm"], iframe[src*="n6wxm"], iframe[src*="google"], ins.adsbygoogle, div[class*="monetag"], div[id*="monetag"]'
      );
      adElements.forEach((el) => el.remove());

      // 3. Unregister any service workers that might have been installed by ad networks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let reg of registrations) {
            reg.unregister();
          }
        }).catch(() => {});
      }

      // 4. Clear ad tracking keys from storage
      try {
        sessionStorage.removeItem('monetag_pop_count');
        localStorage.removeItem('monetag_pop_count');
      } catch {}

      // 5. Clean window objects
      if (window.monetag) delete window.monetag;
    } catch (e) {
      // Safe fallback
    }
  }, []);

  // Fallback: If not fetched server-side, fetch on client
  useEffect(() => {
    if (invitation) return;
    if (!searchSlug && !searchInvitationId) return;

    let cancelled = false;
    const fetchInvite = async () => {
      try {
        let url = '';
        if (searchSlug) {
          url = `/api/invitations?slug=${encodeURIComponent(searchSlug)}`;
        } else if (searchInvitationId) {
          url = `/api/invitations?id=${encodeURIComponent(searchInvitationId)}`;
        }
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) {
          setInvitation(data);
        }
      } catch (err) {
        console.warn('Could not fetch invitation for checkout:', err);
      }
    };
    fetchInvite();
    return () => { cancelled = true; };
  }, [invitation, searchSlug, searchInvitationId]);

  const td = invitation?.template_data || {};
  const isBirthday = invitation?.template_id?.startsWith('birthday-');
  const isHousewarming = invitation?.template_id?.startsWith('housewarming-');

  let titleName = '';
  if (isBirthday) {
    titleName = `${td.celebrantName || invitation?.groom_name || 'Celebration'}'s Birthday`;
  } else if (isHousewarming) {
    titleName = `${td.familyName || invitation?.groom_name || 'Family'} Housewarming`;
  } else {
    const bride = invitation?.bride_name || '';
    const groom = invitation?.groom_name || '';
    titleName = [groom, bride].filter(Boolean).join(' & ') || 'Wedding Celebration';
  }

  const eventDate = invitation?.wedding_date || td.birthdayDate || td.eventDate;
  const venue = invitation?.venue || td.venue || '';
  const photo = invitation?.photo_url || td.photoUrl || td.heroImage || td.couplePhoto || '';
  const returnUrl = invitation?.slug ? `/i/${encodeURIComponent(invitation.slug)}` : '/';

  // Check if invitation is already premium
  const isAlreadyPremium = useMemo(() => {
    if (!invitation) return false;
    return Boolean(
      invitation.tier === 'premium' ||
      invitation.is_ad_supported === false ||
      (invitation.razorpay_payment_id && String(invitation.razorpay_payment_id).startsWith('pay_')) ||
      (invitation.razorpay_order_id && String(invitation.razorpay_order_id).startsWith('admin_') && invitation.paid_at)
    );
  }, [invitation]);

  const handlePayNow = useCallback(async () => {
    if (!invitation?.id) {
      setErrorMessage('Invitation not found. Please return to your invitation.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    setStatus('initiating');

    try {
      await waitForRazorpay();

      // 1. Create order
      const authHeaders = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        authHeaders.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          invitationId: invitation.id,
          purpose: 'remove_ads',
          groomName: invitation.groom_name || 'Upgrade',
          brideName: invitation.bride_name || 'Premium',
          weddingDate: invitation.wedding_date || new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize payment order. Please try again.');
      }

      // 2. Open Razorpay Checkout in a completely clean environment
      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount || 39900,
        currency: 'INR',
        name: 'WEB INVITES',
        description: `Remove Ads & Upgrade to Premium — ${titleName}`,
        order_id: data.orderId,
        handler: async function (rzpResponse) {
          try {
            setStatus('processing');
            setLoading(true);
            const confRes = await fetch('/api/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              }),
            });

            const confData = await confRes.json().catch(() => ({}));
            if (!confRes.ok || confData.error) {
              console.warn('Confirm payment warning:', confData);
            }

            setStatus('success');
            // Redirect smoothly to the live invitation with success & upgraded parameters
            const targetSlug = data.slug || invitation.slug;
            router.push(`/i/${encodeURIComponent(targetSlug)}?success=true&paid=true&upgraded=true`);
          } catch (confErr) {
            console.error('Confirmation error:', confErr);
            const targetSlug = data.slug || invitation.slug;
            router.push(`/i/${encodeURIComponent(targetSlug)}?success=true&paid=true&upgraded=true`);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatus('cancelled');
          },
        },
        prefill: {
          name: user?.user_metadata?.name || titleName,
          email: user?.email || '',
          contact: user?.phone || invitation?.whatsapp_number || '',
        },
        theme: {
          color: '#0F382C',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failEvt) {
        setErrorMessage(failEvt?.error?.description || 'Payment could not be processed by bank.');
        setStatus('failed');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      setErrorMessage(err.message || 'Payment initiation failed.');
      setStatus('failed');
      setLoading(false);
    }
  }, [invitation, session, titleName, user, router]);

  return (
    <>
      {/* Razorpay script loaded cleanly on this dedicated checkout route */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950 font-sans">
        
        {/* Top Header */}
        <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200 overflow-hidden shadow-xs">
                <img
                  src="/logo.png"
                  alt="Web Invites"
                  width={36}
                  height={36}
                  className="object-contain scale-[1.08]"
                />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white tracking-wide font-display">
                  WEB INVITES
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  Secure Checkout
                </span>
              </div>
            </Link>

            {/* Back link & Security Badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit SSL Encrypted</span>
              </div>

              <Link
                href={returnUrl}
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors px-3 py-1.5 rounded-xl hover:bg-stone-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Invitation</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1">
          
          {isAlreadyPremium ? (
            /* Already Premium State */
            <div className="max-w-md mx-auto text-center bg-stone-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Already Premium &amp; Ad-Free!
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                This invitation is already upgraded to Premium. Your guests are enjoying an uninterrupted, 100% ad-free experience.
              </p>
              <Link
                href={returnUrl}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all"
              >
                <span>View Live Invitation</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : !invitation ? (
            /* Invitation Not Found */
            <div className="max-w-md mx-auto text-center bg-stone-900/90 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Invitation Not Found</h2>
              <p className="text-xs text-stone-400">
                We couldn't load the invitation details. Please verify your link and try again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            /* Standard Checkout Flow */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Invitation Details & Value Props */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Invitation Snapshot Card */}
                <div className="bg-stone-900/80 border border-stone-800/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    {photo ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-1 ring-white/10 shrink-0 bg-stone-800">
                        <img
                          src={photo}
                          alt={titleName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-950 to-stone-900 border border-emerald-800/30 flex items-center justify-center shrink-0 text-emerald-400">
                        <Heart className="w-8 h-8 opacity-80" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Upgrading to Premium</span>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-bold text-white font-display truncate">
                        {titleName}
                      </h1>

                      <div className="mt-2 space-y-1 text-xs text-stone-400">
                        {eventDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            <span>{prettyDate(eventDate)}</span>
                          </div>
                        )}
                        {venue && (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            <span className="truncate">{venue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="bg-stone-900/60 border border-stone-800/60 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 font-mono">
                    Included with Premium Upgrade
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-stone-300">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-950/40 border border-stone-800/50">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-white block font-medium">100% Ad-Free</strong>
                        <span className="text-stone-400 text-[11px]">No popunders, banners, or third-party links</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-950/40 border border-stone-800/50">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-white block font-medium">Extended Hosting</strong>
                        <span className="text-stone-400 text-[11px]">Active until 3 days after your event</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-950/40 border border-stone-800/50">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-white block font-medium">Instant WhatsApp Sharing</strong>
                        <span className="text-stone-400 text-[11px]">Formatted message preview &amp; QR code</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-white block font-medium">Zero Watermarks</strong>
                        <span className="text-emerald-200/80 text-[11px]">Pristine, professional invitation card</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Guarantee */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-900/40 border border-stone-800/50 text-xs text-stone-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Official verified merchant checkout. Payments are processed securely by Razorpay.
                  </span>
                </div>
              </div>

              {/* Right Column: Pricing & Action Box */}
              <div className="lg:col-span-5">
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 sticky top-24">
                  
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Order Summary
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      One-time lifetime upgrade for this invitation
                    </p>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 py-3 border-y border-stone-800 text-xs">
                    <div className="flex items-center justify-between text-stone-300">
                      <span>Premium Ad-Free Package</span>
                      <span className="font-semibold text-white">₹399.00</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span>All Platform Taxes &amp; Fees</span>
                      <span className="text-emerald-400 font-medium">Included</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block">
                        Total Amount
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Flat fee · No hidden charges
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        ₹399
                      </span>
                    </div>
                  </div>

                  {/* Notification Banners: Cancelled / Failed / Processing */}
                  {status === 'cancelled' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4" />
                        <span>Payment Cancelled</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        No amount was deducted from your account. You can retry whenever you are ready.
                      </p>
                    </div>
                  )}

                  {status === 'failed' && (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Payment Failed</span>
                      </div>
                      <p className="text-[11px] text-red-200/80 leading-relaxed">
                        {errorMessage || 'Payment was declined by the bank or network. Please try another payment method.'}
                      </p>
                    </div>
                  )}

                  {status === 'processing' && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                      <span>Payment received! Finalizing ad-free activation...</span>
                    </div>
                  )}

                  {/* Payment CTA Button */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={loading || status === 'processing'}
                      onClick={handlePayNow}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {loading || status === 'processing' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening Secure Gateway...</span>
                        </>
                      ) : status === 'cancelled' || status === 'failed' ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Retry Payment (₹399)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Pay ₹399 &amp; Remove Ads</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={returnUrl}
                      className="w-full inline-flex items-center justify-center py-2.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                    >
                      Cancel &amp; Return to Invitation
                    </Link>
                  </div>

                  {/* Payment Methods Supported */}
                  <div className="pt-2 border-t border-stone-800/80 text-center space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block">
                      Accepted Payment Methods
                    </span>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 font-medium flex-wrap">
                      <span className="px-2 py-1 rounded bg-stone-800/80">UPI / GPay / PhonePe</span>
                      <span className="px-2 py-1 rounded bg-stone-800/80">Credit &amp; Debit Cards</span>
                      <span className="px-2 py-1 rounded bg-stone-800/80">NetBanking</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-stone-900 py-6 text-center text-xs text-stone-600">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} WEB INVITES. All rights reserved.</span>
            <div className="flex items-center gap-4 text-stone-500">
              <Link href="/terms" className="hover:text-stone-300">Terms &amp; Privacy</Link>
              <span>·</span>
              <Link href="/" className="hover:text-stone-300">Home</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
