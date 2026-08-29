import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug, coerceToIsoDate, pickMapFields } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export async function POST(request) {
  // SECURITY: Rate limit payment initiation — 10 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `create-order:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a moment.' },
      { status: 429 },
    );
  }

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
      templateData,
      photoUrl,
      photo_url,
      heroImage,
      showPhotoSection,
      showRsvp,
      showEvents,
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

    const resolvedPhotoUrl = photoUrl || photo_url || heroImage || templateData?.photoUrl || templateData?.heroImage || null;
    const incomingTd = (templateData && typeof templateData === 'object') ? templateData : {};
    const resolvedTemplateData = {
      ...incomingTd,
      ...(resolvedPhotoUrl ? { photoUrl: resolvedPhotoUrl, heroImage: resolvedPhotoUrl } : {}),
      ...(showPhotoSection !== undefined ? { showPhotoSection } : {}),
      ...(showRsvp !== undefined ? { showRsvp } : {}),
      ...(showEvents !== undefined ? { showEvents } : {}),
    };

    // 1. Generate unique slug
    let slug = invitationId
      ? null // don't regenerate slug on republish; existing slug stays
      : generateSlug(groomName, brideName);

    // 1 & 2. Slug collision check + Razorpay order creation are independent —
    // run them in parallel to halve the latency.
    const purpose = body.purpose || 'publish_premium'; // 'publish_premium' | 'remove_ads'
    const amount = 399 * 100; // Amount in paise (₹399 - unified flat price)
    const [, order] = await Promise.all([
      // Slug collision check (skip for republish/remove_ads where invitationId exists)
      invitationId
        ? Promise.resolve()
        : supabaseServer
            .from('invitations')
            .select('id', { count: 'exact', head: true })
            .ilike('slug', `${slug}%`)
            .then(({ count }) => {
              if (count && count > 0) slug = `${slug}-${count + 1}`;
            }),
      // Razorpay order creation
      razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          purpose,
          invitationId: invitationId || '',
        },
      }),
    ]);

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
      template_data: resolvedTemplateData,
      tier: 'premium',
      is_ad_supported: false,
      ...(resolvedPhotoUrl ? { photo_url: resolvedPhotoUrl } : {}),
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
      const upRes = await supabaseServer
        .from('invitations')
        .update(updateRow)
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upRes.data;
      error = upRes.error;
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('photo_url'))) {
        const fallbackRow = { ...updateRow };
        delete fallbackRow.photo_url;
        const retry = await supabaseServer
          .from('invitations')
          .update(fallbackRow)
          .eq('id', invitationId)
          .select()
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }
      if (!error && !data) {
        error = new Error('Invitation not found');
      }
      // Return existing slug
      if (!error) slug = data.slug;
    } else {
      // INSERT: brand new draft invitation
      const insRes = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug, is_paid: false }])
        .select()
        .single();
      data = insRes.data;
      error = insRes.error;
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('photo_url'))) {
        const fallbackRow = { ...baseRow };
        delete fallbackRow.photo_url;
        const retry = await supabaseServer
          .from('invitations')
          .insert([{ ...fallbackRow, slug, is_paid: false }])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating order:', error);
    }
    // SECURITY: In production, never expose DB error codes, SQL snippets,
    // column names, or RLS hints to the client.
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error: 'Failed to create order. Please try again.',
        // Only in dev: include diagnostic details for setup troubleshooting
        ...(isDev && {
          code: error?.code || null,
          details: error?.details || error?.hint || null,
        }),
      },
      { status: 500 },
    );
  }
}
