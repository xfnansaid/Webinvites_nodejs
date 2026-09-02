import React, { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import { templates } from '@/components/templates';
import InvitationSuccessShell from '@/components/InvitationSuccessShell';
import { hashIp, getClientIpForTracking } from '@/lib/page-view-tracking';
import { getInviteExpiry } from '@/lib/invite-expiry';
import ConsentAwareAds from '@/components/ads/ConsentAwareAds';
import { MonetagTopHeaderBanner } from '@/components/ads/MonetagAdUnits';
import { getEditorCSSVars } from '@/components/editor/LiveEditorToolbar';

// ============================================================================
// CACHE BEHAVIOR — this page MUST show the LATEST invitation edits instantly
// because clients save edits and expect the live /i/[slug] page to update
// the very next page load.  By default Next.js App Router caches fetch() / DB
// reads in the "Data Cache" on disk (.next/cache) — FOREVER, never expires.
// That was the root cause of:
//   "after they made edits to their template again and hit save edits &
//    update live site, their existing site is not changing, it's showing the
//    old saved edited template."
// ============================================================================
export const revalidate = 0;                 // never cache this server response
export const dynamic = 'force-dynamic';      // never static-render this route
export const fetchCache = 'force-no-store';  // disable fetch() data cache inside

// `cache()` deduplicates: generateMetadata + the page component both call
// getInvitation(slug) on the same request — React cache ensures only ONE
// Supabase query fires instead of two.
const getInvitation = cache(async (slug) => {
  const { data, error } = await supabaseServer
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
});

function prettyWeddingDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Legacy wrapper — delegates to the unified getInviteExpiry() utility.
 * Kept for backwards compat with generateMetadata.
 */
function isInvitationExpired(weddingDate, weddingTime) {
  // This is only used in generateMetadata which doesn't have the full row.
  // For the main page render, we use getInviteExpiry(invitation) instead.
  if (!weddingDate) return false;
  try {
    let eventTime = new Date(`${weddingDate} ${weddingTime || '23:59:59'}`).getTime();
    if (Number.isNaN(eventTime)) {
      eventTime = new Date(weddingDate).getTime();
    }
    if (Number.isNaN(eventTime)) return false;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    return Date.now() > eventTime + THREE_DAYS_MS;
  } catch {
    return false;
  }
}

// WhatsApp / Facebook / Twitter OG metadata — so when users share their
// invitation link via WhatsApp, the chat preview shows a beautiful card with
// the celebrant / family / couple names, date, venue, and the site brand.
export async function generateMetadata({ params, searchParams }) {
  const invitation = await getInvitation(params.slug);
  // Check expiry using the unified utility (handles both free=21d and premium=3d-after-event)
  const metaExpiry = invitation ? getInviteExpiry(invitation) : null;
  if (!invitation || metaExpiry?.isExpired) {
    return {
      title: 'Invitation No Longer Available — WEB INVITES',
      description: 'This digital invitation link has expired and is no longer accessible.',
    };
  }

  const td = invitation.template_data || {};
  const isBirthday = invitation.template_id?.startsWith('birthday-');
  const isHousewarming = invitation.template_id?.startsWith('housewarming-');

  let titleName = '';
  if (isBirthday) {
    const celebrant = td.celebrantName || invitation.groom_name || 'Celebration';
    titleName = `${celebrant}'s Birthday Invitation`;
  } else if (isHousewarming) {
    const family = td.familyName || invitation.groom_name || 'Housewarming';
    titleName = `${family} — Housewarming & Griha Pravesh Invitation`;
  } else {
    const bride = invitation.bride_name || '';
    const groom = invitation.groom_name || '';
    const couple = [bride, groom].filter(Boolean).join(' & ') || 'Wedding Invitation';
    titleName = `${couple} — Wedding Invitation`;
  }

  const dateLine = prettyWeddingDate(invitation.wedding_date || td.birthdayDate || td.eventDate);
  const venueLine = invitation.venue ? `@ ${invitation.venue}` : '';
  const parts = [titleName, dateLine, venueLine].filter(Boolean);
  const title = `${titleName} | WEB INVITES`;
  const description = parts.join(' · ');

  const publicAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || '';
  const canonical = publicAppUrl ? `${publicAppUrl}/i/${encodeURIComponent(params.slug)}` : undefined;

  const photo = invitation.photo_url || td.photoUrl || td.heroImage || td.couplePhoto || '';
  const ogImageUrl = photo || (publicAppUrl ? `${publicAppUrl}/og-wedding-default.jpg` : 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop');

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'WEB INVITES',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: titleName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function InvitationPage({ params, searchParams, request }) {
  const { slug } = params;
  const querySuccess = Boolean(searchParams?.success === 'true' || searchParams?.paid === 'true');

  // ── Viral referral cookie (HOLE #3b Part 2) ──────────────────
  // When a visitor lands via ?via=some-invite-slug (appended to every WhatsApp
  // share link), set a 7-day cookie `referrer_via` so if this visitor later
  // pays for a premium invite, we credit the referrer with 1 FREE premium
  // invitation reward (see confirm-payment route).
  //
  // Guards:
  //  - Ignore self-referrals (via === current slug)
  //  - Ignore obvious non-slug strings (empty / just whitespace / too long)
  //  - Never overwrite an already-set cookie (earliest referrer wins)
  try {
    const via = typeof searchParams?.via === 'string' ? searchParams.via.trim() : '';
    if (via && via.length >= 3 && via.length <= 120 && via !== slug) {
      const ck = await cookies();
      const existing = ck.get('referrer_via')?.value;
      if (!existing) {
        ck.set('referrer_via', via, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    }
  } catch {
    // Cookie failures are never allowed to break the invitation page.
  }

  const invitation = await getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  // ── Expiration check (dual: runtime + cron-marked) ─────────
  // Free tier: 21 days from publish. Premium: 3 days after event.
  // Also check is_active flag (set by /api/cron/expire-invitations)
  const expiryInfo = getInviteExpiry(invitation);
  const isInactive = invitation.is_active === false;
  if (expiryInfo.isExpired || isInactive) {
    // Render the expired page instead of 404 — shows upgrade CTA
    const { default: InviteExpiredPage } = await import('@/components/InviteExpiredPage');
    return <InviteExpiredPage invitation={invitation} expiryInfo={expiryInfo} slug={slug} />;
  }

  // ── Page View Tracking ──────────────────────────────────────
  // Fire-and-forget: track this guest visit without blocking the page render.
  // We hash the IP for privacy — no raw IPs are ever stored.
  try {
    const ip = getClientIpForTracking(request);
    const ipHash = hashIp(ip);
    const userAgent = (request.headers?.get?.('user-agent') || '').slice(0, 200);
    const referrer = (request.headers?.get?.('referer') || '').slice(0, 500);
    await supabaseServer.rpc('track_page_view', {
      p_slug: slug,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
      p_referrer: referrer,
    });
  } catch (viewErr) {
    // Non-critical: never let view tracking break the page.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[page-view] tracking failed:', viewErr?.message);
    }
  }

  // Fetch view stats for display on the invitation page
  let viewStats = { total_views: 0, unique_visitors: 0, views_today: 0, last_viewed_at: null };
  try {
    const { data: stats } = await supabaseServer.rpc('get_view_stats', { p_slug: slug });
    if (stats && typeof stats === 'object' && !Array.isArray(stats)) {
      viewStats = stats;
    } else if (Array.isArray(stats) && stats.length > 0) {
      viewStats = stats[0];
    }
  } catch (statsErr) {
    // Non-critical
  }

  // ── Free tier expiry warning ──────────────────────────────
  const showExpiryBanner = expiryInfo.tier === 'free' && expiryInfo.daysRemaining !== null && expiryInfo.daysRemaining <= 7 && !expiryInfo.isExpired;

  const TemplateComponent = templates[invitation.template_id] || templates['standard-crimson'];
  // Merge template-specific fields from template_data JSONB column into the top-level data object
  const templateSpecificData = invitation.template_data || {};
  const photo = invitation.photo_url || templateSpecificData.photoUrl || templateSpecificData.heroImage || templateSpecificData.couplePhoto || '';
  const templateData = {
    ...templateSpecificData,
    ...(photo ? { photoUrl: photo, heroImage: photo, couplePhoto: photo } : {}),
    // Standard fields
    groomName: invitation.groom_name,
    brideName: invitation.bride_name,
    weddingDate: invitation.wedding_date,
    weddingTime: invitation.wedding_time,
    // Birthday fallbacks
    celebrantName: templateSpecificData.celebrantName || invitation.groom_name,
    birthdayDate: templateSpecificData.birthdayDate || invitation.wedding_date,
    birthdayTime: templateSpecificData.birthdayTime || invitation.wedding_time,
    // Housewarming fallbacks
    familyName: templateSpecificData.familyName || invitation.groom_name,
    eventDate: templateSpecificData.eventDate || invitation.wedding_date,
    eventTime: templateSpecificData.eventTime || invitation.wedding_time,
    venue: invitation.venue,
    venueAddress: invitation.venue_address,
    mapsUrl: invitation.maps_url,
    whatsappNumber: invitation.whatsapp_number,
    groomParents: invitation.groom_parents,
    brideParents: invitation.bride_parents,
    heroTagline: invitation.hero_tagline,
    heroEventText: invitation.hero_event_text,
    countdownTitle: invitation.countdown_title,
  };

  // An invitation is premium / ad-free if:
  // 1. tier is explicitly 'premium' or is_ad_supported is explicitly false
  // 2. OR it has a real Razorpay payment capture (razorpay_payment_id starting with 'pay_')
  // 3. OR it was published by an admin
  const isPaidPremium =
    invitation.tier === 'premium' ||
    invitation.is_ad_supported === false ||
    (invitation.razorpay_payment_id && String(invitation.razorpay_payment_id).startsWith('pay_')) ||
    (invitation.razorpay_order_id && String(invitation.razorpay_order_id).startsWith('admin_') && invitation.paid_at);

  const isAdSupported = !isPaidPremium && invitation.is_ad_supported !== false && invitation.tier !== 'premium';

  return (
    <InvitationSuccessShell
      slug={slug}
      initialIsPaid={!!invitation.is_paid}
      invitation={invitation}
      querySuccess={querySuccess}
      viewStats={viewStats}
      expiryInfo={expiryInfo}
      showExpiryBanner={showExpiryBanner}
    >
      <Suspense fallback={<InvitationLoadingSkeleton />}>
        <div
          className="WebInvitesPreviewContainer editor-preview-wrapper relative pb-16"
          data-hide-rsvp={templateData.showRsvp === false ? 'true' : 'false'}
          data-hide-photo={templateData.showPhotoSection === false ? 'true' : 'false'}
          data-hide-events={templateData.showEvents === false ? 'true' : 'false'}
          style={{
            containerType: 'inline-size',
            width: '100%',
            maxWidth: '100%',
            ...getEditorCSSVars(templateData).vars,
          }}
        >
          {/* Top Sponsor Ribbon on Free Tier Invitations */}
          {isAdSupported && <MonetagTopHeaderBanner />}

          <TemplateComponent
            data={templateData}
            isDraft={!invitation.is_paid}
          />

          {/* Consent-Aware Ads — only shown when user has advertising consent */}
          <ConsentAwareAds
            invitationId={invitation.id}
            slug={invitation.slug}
            isAdSupported={isAdSupported}
          />
        </div>
      </Suspense>
    </InvitationSuccessShell>
  );
}

/**
 * Server-compatible skeleton for the invitation Suspense fallback.
 * Pure CSS shimmer — no client JS needed.
 */
function InvitationLoadingSkeleton() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-stone-200/70 aspect-[4/3]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} />
        </div>
        <div className="text-center space-y-3">
          <div className="relative overflow-hidden h-8 w-56 mx-auto rounded-xl bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
          <div className="relative overflow-hidden h-4 w-10 mx-auto rounded-full bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
          <div className="relative overflow-hidden h-8 w-48 mx-auto rounded-xl bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
        </div>
        <div className="text-center space-y-2">
          <div className="relative overflow-hidden h-3 w-40 mx-auto rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
          <div className="relative overflow-hidden h-3 w-32 mx-auto rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
        </div>
        <div className="relative overflow-hidden h-px w-32 mx-auto rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
        <div className="space-y-3">
          <div className="relative overflow-hidden h-3 w-full rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
          <div className="relative overflow-hidden h-3 w-5/6 mx-auto rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
        </div>
        <div className="relative overflow-hidden w-full h-36 rounded-2xl bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1.5">
              <div className="relative overflow-hidden w-14 h-14 rounded-xl bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
              <div className="relative overflow-hidden h-2 w-10 mx-auto rounded bg-stone-200/70"><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)' }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
