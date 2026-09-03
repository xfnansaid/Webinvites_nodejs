import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug, coerceToIsoDate, pickMapFields } from '@/lib/utils';
import { isAdminUser } from '@/lib/is-admin';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';


export async function POST(request) {
  // SECURITY: Rate limit admin publish — 10 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-publish:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again.' },
      { status: 429 },
    );
  }

  try {
    // 1. Admin-only gate. This check is server-side against the real Supabase
    // auth cookie — a client cannot fake admin status.
    const { user } = await resolveSupabaseUser(request);
    // SECURITY: Generic auth error — no architecture details leaked.
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 },
      );
    }
    if (!isAdminUser(user)) {
      // SECURITY: Never expose user email in error responses — prevents enumeration.
      return NextResponse.json(
        { error: 'This action requires operator privileges.' },
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
      templateData,
      photoUrl,
      photo_url,
      heroImage,
      showPhotoSection,
      showRsvp,
      showEvents,
      invitationId,
    } = body;

    const mapsUrl = pickMapFields(body);

    // Robust date extraction — support weddingDate, birthdayDate, eventDate, date across body and templateData
    const rawDate =
      weddingDate ||
      body.birthdayDate ||
      body.eventDate ||
      body.date ||
      templateData?.weddingDate ||
      templateData?.birthdayDate ||
      templateData?.eventDate ||
      templateData?.date;
    const cleanWeddingDate = coerceToIsoDate(rawDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Event date must be a valid date. Please enter as YYYY-MM-DD.' },
        { status: 400 },
      );
    }

    // Robust time extraction
    const resolvedWeddingTime =
      weddingTime ||
      body.birthdayTime ||
      body.eventTime ||
      body.time ||
      templateData?.weddingTime ||
      templateData?.birthdayTime ||
      templateData?.eventTime ||
      templateData?.time ||
      null;

    // Robust names extraction
    const resolvedGroomName =
      groomName ||
      body.celebrantName ||
      body.familyName ||
      body.hostName ||
      body.hostsName ||
      templateData?.celebrantName ||
      templateData?.familyName ||
      templateData?.groomName ||
      'Celebration';

    const resolvedBrideName =
      brideName ||
      (body.age ? `${body.age}th Birthday` : '') ||
      (templateId?.startsWith?.('housewarming') ? 'Housewarming' : '') ||
      templateData?.brideName ||
      '';

    const resolvedPhotoUrl = photoUrl || photo_url || heroImage || templateData?.photoUrl || templateData?.heroImage || null;
    const incomingTd = (templateData && typeof templateData === 'object') ? templateData : {};
    const resolvedTemplateData = {
      ...incomingTd,
      // Preserve birthday/housewarming specific fields in template_data
      ...(body.celebrantName ? { celebrantName: body.celebrantName } : {}),
      ...(body.age ? { age: body.age } : {}),
      ...(body.birthdayDate ? { birthdayDate: body.birthdayDate } : {}),
      ...(body.birthdayTime ? { birthdayTime: body.birthdayTime } : {}),
      ...(body.partyTheme ? { partyTheme: body.partyTheme } : {}),
      ...(body.familyName ? { familyName: body.familyName } : {}),
      ...(body.eventDate ? { eventDate: body.eventDate } : {}),
      ...(body.eventTime ? { eventTime: body.eventTime } : {}),
      ...(body.hostsName ? { hostsName: body.hostsName } : {}),
      ...(body.ceremonyTime ? { ceremonyTime: body.ceremonyTime } : {}),
      ...(body.lunchTime ? { lunchTime: body.lunchTime } : {}),
      ...(body.findOurHome ? { findOurHome: body.findOurHome } : {}),
      ...(resolvedPhotoUrl ? { photoUrl: resolvedPhotoUrl, heroImage: resolvedPhotoUrl } : {}),
      ...(showPhotoSection !== undefined ? { showPhotoSection } : {}),
      ...(showRsvp !== undefined ? { showRsvp } : {}),
      ...(showEvents !== undefined ? { showEvents } : {}),
    };

    const ownerId = user.id || null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;

    let slug = invitationId ? null : generateSlug(resolvedGroomName, resolvedBrideName);

    if (!invitationId) {
      const baseSlug = slug || 'invitation';
      const { data: existingSlugs } = await supabaseServer
        .from('invitations')
        .select('slug')
        .ilike('slug', `${baseSlug}%`);

      if (existingSlugs && existingSlugs.length > 0) {
        const slugSet = new Set(existingSlugs.map((s) => s.slug?.toLowerCase()));
        if (slugSet.has(baseSlug.toLowerCase())) {
          let suffix = 2;
          while (slugSet.has(`${baseSlug}-${suffix}`.toLowerCase())) {
            suffix += 1;
          }
          slug = `${baseSlug}-${suffix}`;
        }
      }
    }

    const nowIso = new Date().toISOString();
    // Use a stable pseudo "order_id" and "payment_id" so confirm-payment
    // doesn't have to be called and all DB columns are populated.
    const adminOrderId = `admin_${nowIso.replace(/[^\d]/g, '')}_${crypto.randomBytes(3).toString('hex')}`;
    const adminPaymentId = `admin_payment_${nowIso.replace(/[^\d]/g, '')}`;

    const baseRow = {
      template_id: templateId,
      groom_name: resolvedGroomName,
      bride_name: resolvedBrideName,
      wedding_date: cleanWeddingDate,
      wedding_time: resolvedWeddingTime,
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
      template_data: resolvedTemplateData,
      ...(resolvedPhotoUrl ? { photo_url: resolvedPhotoUrl } : {}),
      is_paid: true,
      paid_at: nowIso,
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
    };

    let data;
    let error;

    if (invitationId) {
      // SECURITY: Verify the invitation exists and check ownership before update.
      // Admins can update any invitation, but we still verify the row exists.
      const { data: existing } = await supabaseServer
        .from('invitations')
        .select('id, owner_id, is_paid')
        .eq('id', invitationId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
      }

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
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('photo_url'))) {
        const fallbackRow = { ...baseRow };
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
      if (!error && !data) error = new Error('Invitation not found');
      if (!error) slug = data.slug;
    } else {
      const insRes = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug }])
        .select()
        .single();
      data = insRes.data;
      error = insRes.error;
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('photo_url'))) {
        const fallbackRow = { ...baseRow };
        delete fallbackRow.photo_url;
        const retry = await supabaseServer
          .from('invitations')
          .insert([{ ...fallbackRow, slug }])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('[admin-publish]', error);
    }
    return NextResponse.json(
      { error: 'Publish failed. Please try again.' },
      { status: 500 },
    );
  }
}
