import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug } from '@/lib/utils';
import { isAdminUser } from '@/lib/is-admin';
import { resolveSupabaseUser, getSupabaseProjectRef } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Coerce an incoming weddingDate value into a YYYY-MM-DD ISO date string.
// Users can type garbage in free-text edits; this ensures Postgres never
// sees a non-ISO DATE value.
function coerceToIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function pickMapFields(body) {
  const canonical = body.mapsUrl || body.mapUrl || body.directionsUrl || '';
  return canonical;
}

export async function POST(request) {
  try {
    // 1. Admin-only gate. This check is server-side against the real Supabase
    // auth cookie — a client cannot fake admin status.
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      const ref = getSupabaseProjectRef() || '';
      return NextResponse.json(
        {
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED',
          hint: ref
            ? `Expected Supabase session cookie: sb-${ref}-auth-token. If client is signed in via Google OAuth but cookie not present on the request, make sure your NEXT_PUBLIC_SUPABASE_URL matches the project configured in auth.js, and SameSite cookie policy permits localhost cookies.`
            : 'Could not read Supabase session cookie.',
        },
        { status: 401 },
      );
    }
    if (!isAdminUser(user)) {
      return NextResponse.json(
        {
          error:
            'This publish method is only available to site operators. Please use the normal Publish Now → Pay flow.',
          code: 'NOT_ADMIN',
          hint: `Signed-in as ${user.email || 'unknown email'}.`,
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      templateId,
      groomName,
      brideName,
      weddingDate,
      weddingTime,
      venue,
      venueAddress,
      whatsappNumber,
      groomParents,
      brideParents,
      heroTagline,
      heroEventText,
      countdownTitle,
      invitationId,
    } = body;

    const mapsUrl = pickMapFields(body);
    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date. Please enter as YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    const ownerId = user.id || null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;

    let slug = invitationId ? null : generateSlug(groomName, brideName);

    if (!invitationId) {
      const { count } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .ilike('slug', `${slug}%`);
      if (count && count > 0) {
        slug = `${slug}-${count + 1}`;
      }
    }

    const nowIso = new Date().toISOString();
    // Use a stable pseudo "order_id" and "payment_id" so confirm-payment
    // doesn't have to be called and all DB columns are populated.
    const adminOrderId = `admin_${nowIso.replace(/[^\d]/g, '')}_${Math.floor(Math.random() * 1e6)}`;
    const adminPaymentId = `admin_payment_${nowIso.replace(/[^\d]/g, '')}`;

    const baseRow = {
      template_id: templateId,
      groom_name: groomName,
      bride_name: brideName,
      wedding_date: cleanWeddingDate,
      wedding_time: weddingTime,
      venue,
      venue_address: venueAddress || venue,
      maps_url: mapsUrl,
      whatsapp_number: whatsappNumber,
      groom_parents: groomParents,
      bride_parents: brideParents,
      razorpay_order_id: adminOrderId,
      razorpay_payment_id: adminPaymentId,
      hero_tagline: heroTagline || null,
      hero_event_text: heroEventText || null,
      countdown_title: countdownTitle || null,
      is_paid: true,
      paid_at: nowIso,
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
    };

    let data;
    let error;

    if (invitationId) {
      // Existing invitation — just update content + keep is_paid=true (was
      // likely already true, but enforce it in case of stale rows).
      const { data: upData, error: upError } = await supabaseServer
        .from('invitations')
        .update(baseRow)
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upData;
      error = upError;
      if (!error && !data) error = new Error('Invitation not found');
      if (!error) slug = data.slug;
    } else {
      ({ data, error } = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug }])
        .select()
        .single());
    }

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      adminPublished: true,
      invitationId: data.id,
      slug,
      adminEmail: user.email || null,
    });
  } catch (error) {
    console.error('[admin-publish] Error:', error);
    const isPlaceholderServiceKey =
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      /PASTE_/i.test(process.env.SUPABASE_SERVICE_ROLE_KEY || '') ||
      (typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string' &&
        process.env.SUPABASE_SERVICE_ROLE_KEY.length < 40);
    const isRlsError =
      String(error?.code || '').includes('42501') ||
      /row-level security policy/i.test(String(error?.message || '') + ' ' + String(error?.hint || ''));
    const missingOwnerEmailColumn =
      String(error?.code || '') === '42703' ||
      /column\s+"owner_email"\s+does\s+not\s+exist/i.test(String(error?.message || ''));
    const missingTempOwnerColumn =
      String(error?.code || '') === '42703' &&
      /column\s+"temp_owner_token"\s+does\s+not\s+exist/i.test(String(error?.message || ''));

    const copyableSql = missingOwnerEmailColumn
      ? `-- Run in Supabase Dashboard → SQL Editor → New Query → Run
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS owner_email text
  CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254);
CREATE INDEX IF NOT EXISTS invitations_owner_email_idx
  ON public.invitations (owner_email);
CREATE INDEX IF NOT EXISTS invitations_owner_id_email_idx
  ON public.invitations (owner_id, owner_email);`
      : missingTempOwnerColumn
      ? `-- Run in Supabase Dashboard → SQL Editor → New Query → Run
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS temp_owner_token text
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status text
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));`
      : null;

    return NextResponse.json(
      {
        error: error?.message || 'Admin publish failed',
        code: error?.code || null,
        details: error?.details || error?.hint || null,
        copyableSql,
        hint: copyableSql
          ? 'MISSING COLUMN (30 seconds to fix): 1) Supabase Dashboard → SQL Editor → New Query. 2) Paste the SQL snippet above and RUN (green arrow). 3) Refresh and retry Publish Now.'
          : isPlaceholderServiceKey
          ? 'Tip: paste SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API → service_role into .env.local and restart the dev server.'
          : isRlsError
          ? 'Row-level security blocked the write. Ensure service_role key is configured and policies allow the owner/operator writes.'
          : 'Check the server terminal for the full stack trace.',
      },
      { status: 500 },
    );
  }
}
