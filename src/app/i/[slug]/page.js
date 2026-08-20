import React from 'react';
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

async function getInvitation(slug) {
  // `supabaseServer` = service role server client (bypasses RLS for reading
  // invites).  Using browser anon client here caused two problems:
  //   1) It's designed for client-side usage, not server components.
  //   2) Next.js Data Cache silently cached the first .select() result forever.
  const { data, error } = await supabaseServer
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

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

// WhatsApp / Facebook / Twitter OG metadata — so when users share their
// invitation link via WhatsApp, the chat preview shows a beautiful card with
// the couple names, wedding date, venue, and the site brand.
export async function generateMetadata({ params, searchParams }) {
  const invitation = await getInvitation(params.slug);
  if (!invitation) {
    return {
      title: 'WEB INVITES — Digital Wedding Invitations',
      description: 'Create beautiful digital wedding invitations at ₹299 flat.',
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
          // Default OG — WhatsApp renders this as a large image preview.
          // Supabase storage / custom screenshot can replace this URL later.
          url: publicAppUrl ? `${publicAppUrl}/og-wedding-default.jpg` : 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop',
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
      images: [publicAppUrl ? `${publicAppUrl}/og-wedding-default.jpg` : 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop'],
    },
  };
}

export default async function InvitationPage({ params, searchParams }) {
  const { slug } = params;
  const querySuccess = Boolean(searchParams?.success === 'true' || searchParams?.paid === 'true');
  const invitation = await getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  const TemplateComponent = templates[invitation.template_id] || templates['standard-crimson'];
  const templateData = {
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

  return (
    <InvitationSuccessShell
      slug={slug}
      initialIsPaid={!!invitation.is_paid}
      invitation={invitation}
      querySuccess={querySuccess}
    >
      <div className="WebInvitesPreviewContainer" style={{ containerType: 'inline-size', width: '100%', maxWidth: '100%' }}><TemplateComponent
        data={templateData}
        isDraft={!invitation.is_paid}
      /></div>
    </InvitationSuccessShell>
  );
}
