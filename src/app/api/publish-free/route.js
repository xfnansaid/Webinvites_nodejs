import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug, coerceToIsoDate, pickMapFields } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/publish-free
 *
 * Publishes an invitation on the Free Tier after the user finishes
 * watching the sponsor ad.
 *
 * Rules:
 * 1. User must be signed in.
 * 2. 1 Free Template per account. If user already has a free published template
 *    and tries to create a NEW one, returns error with code 'FREE_TIER_LIMIT_REACHED'.
 * 3. Editing an existing free template is always allowed and re-publishes for free.
 * 4. Free templates have tier='free', is_ad_supported=true, is_paid=true.
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `publish-free:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many publish requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json(
        {
          error: 'Please sign in with Google to publish your invitation for free.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
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
    } = body || {};

    const ownerId = user?.id || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;

    // Check existing free publications for this user
    let query = supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_ad_supported, is_paid');

    if (ownerEmail) {
      query = query.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
    } else {
      query = query.eq('owner_id', ownerId);
    }

    let { data: userInvites, error: listError } = await query;

    if (listError && listError.code === '42703') {
      let fallbackQuery = supabaseServer
        .from('invitations')
        .select('id, slug, is_paid');
      if (ownerEmail) {
        fallbackQuery = fallbackQuery.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
      } else {
        fallbackQuery = fallbackQuery.eq('owner_id', ownerId);
      }
      const fallbackRes = await fallbackQuery;
      userInvites = fallbackRes.data || [];
    }

    const existingList = userInvites || [];
    const publishedInvites = existingList.filter((inv) => inv.is_paid || inv.tier === 'free');
    const freePublished = publishedInvites.filter(
      (inv) => inv.tier === 'free' || inv.is_ad_supported !== false,
    );
    const paidPublished = publishedInvites.filter(
      (inv) => inv.tier === 'premium' || inv.is_ad_supported === false,
    );

    // If publishing a brand new invite, verify free entitlement rules:
    // (1 active free template per account at a time. Delete existing free template to publish another for free)
    if (!invitationId) {
      if (freePublished.length >= 1) {
        return NextResponse.json(
          {
            error: 'You already have 1 active free invitation. Delete it from your dashboard to publish another free template, or pay ₹399 to publish an additional template.',
            code: 'FREE_TIER_LIMIT_REACHED',
            freePublishedCount: freePublished.length,
          },
          { status: 403 },
        );
      }
    } else {
      // If updating an existing invitation, verify ownership
      const target = existingList.find((inv) => String(inv.id) === String(invitationId));
      if (!target && existingList.length > 0) {
        const { data: checkDirect } = await supabaseServer
          .from('invitations')
          .select('id, owner_id, owner_email')
          .eq('id', invitationId)
          .maybeSingle();

        if (
          checkDirect &&
          checkDirect.owner_id !== ownerId &&
          checkDirect.owner_email !== ownerEmail
        ) {
          return NextResponse.json(
            { error: 'You do not have permission to edit this invitation.', code: 'FORBIDDEN' },
            { status: 403 },
          );
        }
      }
    }

    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date (YYYY-MM-DD).' },
        { status: 400 },
      );
    }

    const mapsUrl = pickMapFields(body);
    const resolvedPhotoUrl =
      photoUrl || photo_url || heroImage || templateData?.photoUrl || templateData?.heroImage || null;
    const incomingTd = templateData && typeof templateData === 'object' ? templateData : {};
    const resolvedTemplateData = {
      ...incomingTd,
      ...(resolvedPhotoUrl ? { photoUrl: resolvedPhotoUrl, heroImage: resolvedPhotoUrl } : {}),
      ...(showPhotoSection !== undefined ? { showPhotoSection } : {}),
      ...(showRsvp !== undefined ? { showRsvp } : {}),
      ...(showEvents !== undefined ? { showEvents } : {}),
    };

    let slug = invitationId ? null : generateSlug(groomName || 'groom', brideName || 'bride');

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
    const freeOrderId = `free_${nowIso.replace(/[^\d]/g, '')}_${crypto.randomBytes(3).toString('hex')}`;
    const freePaymentId = `free_reward_${nowIso.replace(/[^\d]/g, '')}`;

    const baseRow = {
      template_id: templateId || 'standard-crimson',
      groom_name: groomName || 'Groom',
      bride_name: brideName || 'Bride',
      wedding_date: cleanWeddingDate,
      wedding_time: weddingTime || null,
      venue: venue || '',
      venue_address: venueAddress || venue || '',
      maps_url: mapsUrl || null,
      whatsapp_number: whatsappNumber || null,
      groom_parents: groomParents || null,
      bride_parents: brideParents || null,
      hero_tagline: heroTagline || null,
      hero_event_text: heroEventText || null,
      countdown_title: countdownTitle || null,
      template_data: resolvedTemplateData,
      is_paid: true,
      paid_at: nowIso,
      status: 'paid',
      razorpay_order_id: freeOrderId,
      razorpay_payment_id: freePaymentId,
      tier: 'free',
      is_ad_supported: true,
      ...(resolvedPhotoUrl ? { photo_url: resolvedPhotoUrl } : {}),
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
    };

    let resultData;
    let resultError;

    if (invitationId) {
      const upRes = await supabaseServer
        .from('invitations')
        .update(baseRow)
        .eq('id', invitationId)
        .select()
        .maybeSingle();

      resultData = upRes.data;
      resultError = upRes.error;

      // Fallback if tier / is_ad_supported / photo_url columns do not exist in DB yet
      if (resultError) {
        console.warn('[publish-free] update error with full schema, retrying fallback:', resultError.message);
        const fallbackRow = { ...baseRow };
        delete fallbackRow.tier;
        delete fallbackRow.is_ad_supported;
        delete fallbackRow.photo_url;
        const retry = await supabaseServer
          .from('invitations')
          .update(fallbackRow)
          .eq('id', invitationId)
          .select()
          .maybeSingle();
        resultData = retry.data;
        resultError = retry.error;
      }

      if (!resultError && resultData) {
        slug = resultData.slug;
      }
    } else {
      const insRes = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug }])
        .select()
        .single();

      resultData = insRes.data;
      resultError = insRes.error;

      // If duplicate key error (23505), append high-resolution unique suffix
      if (resultError && resultError.code === '23505') {
        const uniqueSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        const insRetry = await supabaseServer
          .from('invitations')
          .insert([{ ...baseRow, slug: uniqueSlug }])
          .select()
          .single();
        resultData = insRetry.data;
        resultError = insRetry.error;
        if (!resultError) slug = uniqueSlug;
      }

      // Fallback if columns do not exist yet in DB
      if (resultError) {
        console.warn('[publish-free] insert error with full schema, retrying fallback:', resultError.message);
        const fallbackRow = { ...baseRow };
        delete fallbackRow.tier;
        delete fallbackRow.is_ad_supported;
        delete fallbackRow.photo_url;
        const retry = await supabaseServer
          .from('invitations')
          .insert([{ ...fallbackRow, slug }])
          .select()
          .single();
        resultData = retry.data;
        resultError = retry.error;
      }
    }

    if (resultError) {
      console.error('[publish-free] fatal database error:', resultError);
      return NextResponse.json(
        {
          error: resultError.message || 'Failed to save invitation to database.',
          details: resultError.details || resultError.hint || resultError.message,
          code: resultError.code || 'DB_ERROR',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      slug: resultData?.slug || slug,
      invitationId: resultData?.id || invitationId,
      tier: 'free',
      isAdSupported: true,
      message: 'Invitation published successfully on the free tier!',
    });
  } catch (err) {
    console.error('[publish-free] unexpected exception:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred.', details: err.stack },
      { status: 500 },
    );
  }
}
