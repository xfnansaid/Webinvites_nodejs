import React, { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { templates } from '@/components/templates';
import InvitationSuccessShell from '@/components/InvitationSuccessShell';

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
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if the invitation has expired (past 3 days from the event date).
 * 3 days = 3 * 24 * 60 * 60 * 1000 ms = 259,200,000 ms.
 */
function isInvitationExpired(weddingDate, weddingTime) {
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
// the couple names, wedding date, venue, and the site brand.
export async function generateMetadata({ params, searchParams }) {
  const invitation = await getInvitation(params.slug);
  if (!invitation || isInvitationExpired(invitation.wedding_date, invitation.wedding_time)) {
    return {
      title: 'Invitation Not Found — WEB INVITES',
      description: 'The requested digital wedding invitation is no longer available.',
    };
  }
  const bride = invitation.bride_name || '';
  const groom = invitation.groom_name || '';
  const couple = [bride, groom].filter(Boolean).join(' & ') || 'Wedding Invitation';
  const dateLine = prettyWeddingDate(invitation.wedding_date);
  const venueLine = invitation.venue ? `@ ${invitation.venue}` : '';
  const parts = [couple, dateLine, venueLine].filter(Boolean);
  const title = `${couple} — Wedding Invitation | WEB INVITES`;
  const description = parts.join(' · ');

  const publicAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || '';
  const canonical = publicAppUrl ? `${publicAppUrl}/i/${encodeURIComponent(params.slug)}` : undefined;

  const templateSpecificData = invitation.template_data || {};
  const photo = invitation.photo_url || templateSpecificData.photoUrl || templateSpecificData.heroImage || templateSpecificData.couplePhoto || '';
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
          // Couple photo or fallback OG default
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${couple} — Wedding Invitation`,
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

export default async function InvitationPage({ params, searchParams }) {
  const { slug } = params;
  const querySuccess = Boolean(searchParams?.success === 'true' || searchParams?.paid === 'true');
  const invitation = await getInvitation(slug);

  if (!invitation || isInvitationExpired(invitation.wedding_date, invitation.wedding_time)) {
    notFound();
  }

  const TemplateComponent = templates[invitation.template_id] || templates['standard-crimson'];
  // Merge template-specific fields (heroTitle, monogram, etc.) from the
  // template_data JSONB column into the top-level data object so templates
  // receive flat props like data.heroTitle, data.monogram, etc.
  const templateSpecificData = invitation.template_data || {};
  const photo = invitation.photo_url || templateSpecificData.photoUrl || templateSpecificData.heroImage || templateSpecificData.couplePhoto || '';
  const templateData = {
    ...templateSpecificData,
    ...(photo ? { photoUrl: photo, heroImage: photo, couplePhoto: photo } : {}),
    groomName: invitation.groom_name,
    brideName: invitation.bride_name,
    weddingDate: invitation.wedding_date,
    weddingTime: invitation.wedding_time,
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

  return (      <InvitationSuccessShell
        slug={slug}
        initialIsPaid={!!invitation.is_paid}
        invitation={invitation}
        querySuccess={querySuccess}
      >
        <Suspense fallback={<InvitationLoadingSkeleton />}>
          <div className="WebInvitesPreviewContainer" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}><TemplateComponent
            data={templateData}
            isDraft={!invitation.is_paid}
          /></div>
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
