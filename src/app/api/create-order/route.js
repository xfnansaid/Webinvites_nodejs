import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Coerce an incoming weddingDate value into a YYYY-MM-DD ISO date string.
// Users can type garbage like "Fri, 12, Monday" in free-text edits; this
// ensures Postgres never sees a non-ISO DATE value.
function coerceToIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // Already ISO? Return as-is.
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

// Normalize aliased map URL fields so both old & new clients write the
// correct column maps_url AND the aliases are kept in sync.
function pickMapFields(body) {
  const canonical = body.mapsUrl || body.mapUrl || body.directionsUrl || '';
  return canonical;
}

export async function POST(request) {
  try {
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
      // Optional: if client passes an existing invitationId, UPDATE that row
      // instead of creating a new one (used by "Edit Invite → Republish" flow).
      invitationId,
    } = body;

    // Resolve owner_id if caller is signed in
    const { user } = await resolveSupabaseUser(request);
    const ownerId = user?.id || null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;

    const mapsUrl = pickMapFields(body);

    // Critical: weddingDate must be ISO format before sending to Supabase
    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date. Please enter as YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    // 1. Generate unique slug
    let slug = invitationId
      ? null // don't regenerate slug on republish; existing slug stays
      : generateSlug(groomName, brideName);

    if (!invitationId) {
      // Check if slug exists and append number if it does
      const { data: existing } = await supabaseServer
        .from('invitations')
        .select('slug')
        .ilike('slug', `${slug}%`);
      
      if (existing && existing.length > 0) {
        slug = `${slug}-${existing.length + 1}`;
      }
    }

    // 2. Create Razorpay Order
    const amount = 299 * 100; // Amount in paise (₹299 - unified flat price)
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const baseRow = {
      template_id: templateId,
      groom_name: groomName,
      bride_name: brideName,
      wedding_date: cleanWeddingDate,
      wedding_time: weddingTime,
      venue: venue,
      venue_address: venueAddress || venue,
      maps_url: mapsUrl,
      whatsapp_number: whatsappNumber,
      groom_parents: groomParents,
      bride_parents: brideParents,
      razorpay_order_id: order.id,
      hero_tagline: heroTagline || null,
      hero_event_text: heroEventText || null,
      countdown_title: countdownTitle || null,
      // Link owner when authenticated so user can see invite in Dashboard
      // and edit later from any device via Sign In.
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
    };

    let data;
    let error;

    if (invitationId) {
      // UPDATE: existing invitation (Republish / Edit-and-repay flow)
      // Include owner_email / owner_id even if user didn't have them earlier —
      // this backfills identity info for legacy drafts when they re-publish.
      const updateRow = {
        ...baseRow,
        ...(ownerId ? { owner_id: ownerId } : {}),
        ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
        ...(ownerEmail ? { owner_email: ownerEmail } : {}),
      };
      const { data: upData, error: upError } = await supabaseServer
        .from('invitations')
        .update(updateRow)
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upData;
      error = upError;
      if (!error && !data) {
        error = new Error('Invitation not found');
      }
      // Return existing slug
      if (!error) slug = data.slug;
    } else {
      // INSERT: brand new draft invitation
      ({ data, error } = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug, is_paid: false }])
        .select()
        .single());
    }

    if (error) throw error;

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      invitationId: data.id,
      slug: slug,
      keyId: process.env.RAZORPAY_KEY_ID,
      owner: ownerId ? { id: ownerId, phone: ownerPhone } : null,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    // Surface a detailed error to the client instead of a generic message so
    // the PaymentBanner UI can tell the user exactly what went wrong.
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
      ? `-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- Adds the owner_email column for traceability (captures signed-in Google account email).
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS owner_email text
  CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254);
CREATE INDEX IF NOT EXISTS invitations_owner_email_idx
  ON public.invitations (owner_email);
CREATE INDEX IF NOT EXISTS invitations_owner_id_email_idx
  ON public.invitations (owner_id, owner_email);`
      : missingTempOwnerColumn
      ? `-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS temp_owner_token text
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status text
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));`
      : isRlsError
      ? `-- Run this in Supabase Dashboard → SQL Editor → New Query
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published invitations" ON invitations;
CREATE POLICY "Public can view published invitations" ON invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON invitations;
CREATE POLICY "Anyone can create a draft invitation" ON invitations FOR INSERT WITH CHECK (is_paid = false);

-- Auth + ownership (NEW — required for User Dashboard / Edit Later flows):
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS owner_phone TEXT;
CREATE INDEX IF NOT EXISTS idx_invitations_owner_id ON invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_owner_phone ON invitations(owner_phone);
COMMENT ON COLUMN invitations.owner_id IS 'Supabase auth user who created/owns this invite';

DROP POLICY IF EXISTS "Owners can update their own invitations" ON invitations;
CREATE POLICY "Owners can update their own invitations" ON invitations FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Also add the missing new columns (WYSIWYG + payment tracking):
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_tagline TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_event_text TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS countdown_title TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_webhook_event_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;`
      : null;

    return NextResponse.json(
      {
        error: error?.message || 'Failed to create order',
        code: error?.code || null,
        details: error?.details || error?.hint || null,
        copyableSql,
        hint: copyableSql && (missingOwnerEmailColumn || missingTempOwnerColumn)
          ? 'MISSING COLUMN (30 seconds to fix): 1) Open Supabase Dashboard → your project → SQL Editor → New Query. 2) Paste the SQL snippet above (copied from the error panel with the copy icon) and click RUN (green arrow). 3) Refresh the editor page and retry.'
          : copyableSql
          ? 'SUPABASE RLS FIX REQUIRED (30 seconds): 1) Open https://supabase.com/dashboard → your project → SQL Editor → New Query. 2) Paste the SQL shown above this hint and click RUN (green arrow). 3) Retry the Pay button. Optional: paste SUPABASE_SERVICE_ROLE_KEY into .env.local for 100% bypass.'
          : isPlaceholderServiceKey
          ? 'Tip: paste your SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Project Settings → API → service_role into .env.local and restart the dev server. Then click Pay again.'
          : 'Please check the server terminal for the full stack trace.',
      },
      { status: 500 },
    );
  }
}
