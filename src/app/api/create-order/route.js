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
      mapsUrl, 
      whatsappNumber,
      groomParents,
      brideParents,
      heroTagline,
      heroEventText,
      countdownTitle,
    } = body;

    // Critical: weddingDate must be ISO format before sending to Supabase
    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date. Please enter as YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    // 1. Generate unique slug
    let slug = generateSlug(groomName, brideName);
    
    // Check if slug exists and append number if it does
    const { data: existing } = await supabaseServer
      .from('invitations')
      .select('slug')
      .ilike('slug', `${slug}%`);
    
    if (existing && existing.length > 0) {
      slug = `${slug}-${existing.length + 1}`;
    }

    // 2. Create Razorpay Order
    const amount = 399 * 100; // Amount in paise (₹399 - unified flat price)
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 3. Save draft to Supabase
    const { data, error } = await supabaseServer
      .from('invitations')
      .insert([
        {
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
          slug: slug,
          is_paid: false,
          razorpay_order_id: order.id,
          hero_tagline: heroTagline || null,
          hero_event_text: heroEventText || null,
          countdown_title: countdownTitle || null,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      invitationId: data.id,
      slug: slug,
      keyId: process.env.RAZORPAY_KEY_ID
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
      ? `-- Run this in Supabase Dashboard → SQL Editor → New Query\nALTER TABLE invitations ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Public can view published invitations" ON invitations;\nCREATE POLICY "Public can view published invitations" ON invitations FOR SELECT USING (true);\nDROP POLICY IF EXISTS "Anyone can create a draft invitation" ON invitations;\nCREATE POLICY "Anyone can create a draft invitation" ON invitations FOR INSERT WITH CHECK (is_paid = false);\n\n-- Also add the missing new columns (WYSIWYG + payment tracking):\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_tagline TEXT;\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_event_text TEXT;\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS countdown_title TEXT;\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_webhook_event_id TEXT;\nALTER TABLE invitations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;`
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
