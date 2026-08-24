import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';

// Coerce an incoming weddingDate value into a YYYY-MM-DD ISO date string.
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
  return body.mapsUrl || body.mapUrl || body.directionsUrl || '';
}

// Cryptographically-secure 32-byte random hex token = 64 hex chars.
// 64 hex chars = 256 bits of entropy, effectively uncrackable even if an
// attacker knows the full Postgres table (requires iterating through 2^128
// UUID-like tokens at minimum to find a match).
function secureTempOwnerToken() {
  if (
    typeof globalThis.crypto === 'object' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const buf = new Uint8Array(32);
    globalThis.crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Node.js fallback: import() at runtime to avoid bundler issues in edge runtime.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(32).toString('hex');
  } catch {
    // Last-ditch fallback. Unlikely to ever be used in Next.js Node runtime.
    const chars = '0123456789abcdef';
    let out = '';
    for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * 16)];
    return out;
  }
}

export const dynamic = 'force-dynamic';

// POST /api/save-draft — save an anonymous draft invitation to Supabase.
//
// Designed to be called IMMEDIATELY before redirecting a user to Google OAuth
// (so even if the user's localStorage gets wiped / they switch devices, their
// edits are saved to their account once they sign in and call /api/claim-draft
// with the tempOwnerToken).
//
// Accepts (in JSON body):
//   { formData, templateId, existingInvitationId?, returnTo? }
//
// Returns:
//   { ok: true, draftId, tempOwnerToken, slug } — on success
//   { error, code, hint, copyableSql? } — on failure
export async function POST(request) {
  try {
    const body = await request.json();
    const formData = body?.formData || {};
    const templateId = body?.templateId;
    const invitationId = body?.existingInvitationId || null;

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required to save a draft.', code: 'TEMPLATE_ID_REQUIRED' },
        { status: 400 },
      );
    }

    // Resolve owner: usually null for anonymous users pre-sign-in, but we also
    // accept signed-in users to save updates as drafts.
    const { user } = await resolveSupabaseUser(request);
    const ownerId = user?.id || null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;

    const groomName = formData.groomName;
    const brideName = formData.brideName;
    const weddingDate = formData.weddingDate;
    const weddingTime = formData.weddingTime || null;
    const venue = formData.venue || null;
    const venueAddress = formData.venueAddress || venue || null;
    const whatsappNumber = formData.whatsappNumber || null;
    const groomParents = formData.groomParents || null;
    const brideParents = formData.brideParents || null;
    const heroTagline = formData.heroTagline || null;
    const heroEventText = formData.heroEventText || null;
    const countdownTitle = formData.countdownTitle || null;
    const mapsUrl = pickMapFields(formData);
    // Template-specific inline edits (heroTitle, monogram, eyebrowMal, etc.)
    const templateData = formData.templateData || {};

    if (!groomName || !brideName || !weddingDate) {
      return NextResponse.json(
        {
          error: 'Cannot save a draft without bride & groom names and a wedding date.',
          code: 'REQUIRED_FIELDS_MISSING',
        },
        { status: 400 },
      );
    }

    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date (YYYY-MM-DD).', code: 'BAD_WEDDING_DATE' },
        { status: 400 },
      );
    }

    // Slug logic — reuse existing slug on UPDATE / existing invitationId.
    let slug = invitationId ? null : generateSlug(groomName, brideName);

    if (!invitationId) {
      // Append number if slug collision exists.
      const { count } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .ilike('slug', `${slug}%`);
      if (count && count > 0) slug = `${slug}-${count + 1}`;
    }

    const tempOwnerToken = secureTempOwnerToken();

    // baseRow — same column names as /api/create-order so draft → claim → pay
    // flow preserves data 100%.
    const baseRow = {
      template_id: templateId,
      groom_name: groomName,
      bride_name: brideName,
      wedding_date: cleanWeddingDate,
      wedding_time: weddingTime,
      venue,
      venue_address: venueAddress,
      maps_url: mapsUrl,
      whatsapp_number: whatsappNumber,
      groom_parents: groomParents,
      bride_parents: brideParents,
      hero_tagline: heroTagline,
      hero_event_text: heroEventText,
      countdown_title: countdownTitle,
      template_data: templateData,
      temp_owner_token: tempOwnerToken,
      status: 'draft',
      is_paid: false,
      razorpay_order_id: null,
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
    };

    let data;
    let error;

    if (invitationId) {
      // UPDATE existing invitation (user is re-saving a draft / doing a
      // republish while still anonymous — we keep the new tempOwnerToken so
      // they can claim any saved changes).
      const { data: upData, error: upError } = await supabaseServer
        .from('invitations')
        .update({ ...baseRow, temp_owner_token: tempOwnerToken })
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upData;
      error = upError;
      if (!error && !data) {
        error = new Error(`Invitation ${invitationId} not found (may have been deleted).`);
      }
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
      draftId: data.id,
      invitationId: data.id,
      tempOwnerToken,
      slug,
      isPaid: !!data.is_paid,
      ownerId: data.owner_id || null,
      alreadyClaimed: !!data.owner_id && !!ownerId && data.owner_id === ownerId,
    });
  } catch (err) {
    console.error('/api/save-draft error:', err);
    const isRlsError =
      String(err?.code || '') === '42501' ||
      /row-level security/i.test(String(err?.message || '') + ' ' + String(err?.hint || ''));
    const missingColumn =
      String(err?.code || '') === '42703' ||
      /column\s+"temp_owner_token"\s+does\s+not\s+exist/i.test(String(err?.message || ''));
    const missingOwnerEmailColumn =
      String(err?.code || '') === '42703' ||
      /column\s+"owner_email"\s+does\s+not\s+exist/i.test(String(err?.message || ''));

    const copyableSql = missingOwnerEmailColumn
      ? `-- Run in Supabase Dashboard → SQL Editor → New Query → Run
-- (1) owner_email column — captures signed-in Google account email on every invitation.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS owner_email text
  CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254);
CREATE INDEX IF NOT EXISTS invitations_owner_email_idx
  ON public.invitations (owner_email);
CREATE INDEX IF NOT EXISTS invitations_owner_id_email_idx
  ON public.invitations (owner_id, owner_email);
-- (2) temp_owner_token + status columns (if not already added) — anonymous draft → sign-in claim flow.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS temp_owner_token text
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status text
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));
CREATE INDEX IF NOT EXISTS invitations_owner_status_idx
  ON public.invitations (owner_id, status) WHERE owner_id IS NOT NULL;`
      : missingColumn
      ? `-- Run in Supabase Dashboard → SQL Editor → New Query, then retry.
-- Adds the temp_owner_token + status columns used for anonymous draft -> sign-in claim flow.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS temp_owner_token text
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status text
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));
CREATE INDEX IF NOT EXISTS invitations_owner_status_idx
  ON public.invitations (owner_id, status) WHERE owner_id IS NOT NULL;`
      : isRlsError
      ? `-- Run in Supabase SQL Editor if service role is not set in .env.local:
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON invitations;
CREATE POLICY "Anyone can create a draft invitation" ON invitations FOR INSERT WITH CHECK (is_paid = false);`
      : null;

    return NextResponse.json(
      {
        error: err?.message || 'Failed to save draft.',
        code: err?.code || 'SAVE_DRAFT_FAILED',
        details: err?.details || err?.hint || null,
        copyableSql,
        hint: missingOwnerEmailColumn || missingColumn
          ? 'NEW COLUMNS REQUIRED (30-second fix): 1) Supabase Dashboard → SQL Editor → New Query. 2) Paste the SQL snippet above → click RUN (green arrow). 3) Refresh browser and retry Publish Now.'
          : isRlsError
          ? 'Supabase rejected this INSERT because of a missing RLS INSERT policy on invitations. Either add the RLS policy via copyableSql, or paste SUPABASE_SERVICE_ROLE_KEY into .env.local to bypass RLS entirely (service key is recommended, used everywhere already).'
          : 'See Next.js server terminal for the full stack trace.',
      },
      { status: 500 },
    );
  }
}
