import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug } from '@/lib/utils';

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

// Try to resolve an authenticated Supabase user from the request cookies.
// Supabase stores session info in cookies named sb-<ref>-auth-token.
// Returns { user } or { user: null }.
async function resolveCurrentUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader) return { user: null };

    // Server-side RPC call to supabase.auth.getUser() using the client's
    // cookies as the access token source.
    const { createClient } = await import('@supabase/supabase-js').then(m => m);
    const headers = {};
    request.headers.forEach((v, k) => { headers[k] = v; });

    // Use the server key with the user's access-token cookie so getUser()
    // returns the real user (or null) without requiring password handling.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Attempt to parse the Supabase auth cookie directly
    const match = cookieHeader.match(/sb-[a-z]+-auth-token=([^;]+)/i);
    if (!match) return { user: null };
    let parsed = null;
    try {
      parsed = JSON.parse(decodeURIComponent(match[1]));
    } catch {
      return { user: null };
    }
    const accessToken = parsed?.access_token;
    if (!accessToken || !url || !serviceKey) {
      // Fall back to null (anonymous draft) — it's still allowed via RLS.
      return { user: null };
    }

    // Use service client with access-token override to validate + extract user
    const tempClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } = {}, error } = await tempClient.auth.getUser();
    if (error || !user) return { user: null };
    return { user };
  } catch (e) {
    console.warn('[create-order] resolveCurrentUser failed (will save anonymous draft):', e?.message || e);
    return { user: null };
  }
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
    const { user } = await resolveCurrentUser(request);
    const ownerId = user?.id || null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;

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
    };

    let data;
    let error;

    if (invitationId) {
      // UPDATE: existing invitation (Republish / Edit-and-repay flow)
      const { data: upData, error: upError } = await supabaseServer
        .from('invitations')
        .update(baseRow)
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

    const copyableSql = isRlsError
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
        hint: copyableSql
          ? 'SUPABASE RLS FIX REQUIRED (30 seconds): 1) Open https://supabase.com/dashboard → your project → SQL Editor → New Query. 2) Paste the SQL shown above this hint and click RUN (green arrow). 3) Retry the Pay button. Optional: paste SUPABASE_SERVICE_ROLE_KEY into .env.local for 100% bypass.'
          : isPlaceholderServiceKey
          ? 'Tip: paste your SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Project Settings → API → service_role into .env.local and restart the dev server. Then click Pay again.'
          : 'Please check the server terminal for the full stack trace.',
      },
      { status: 500 },
    );
  }
}
