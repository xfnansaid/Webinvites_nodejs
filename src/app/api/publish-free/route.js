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
 * 2. Allows publishing free templates up to the free tier limit. If user has reached the
 *    limit and tries to create a NEW one, returns error with code 'FREE_TIER_LIMIT_REACHED'.
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
      invitationId: rawInvitationId,
      tempOwnerToken: rawTempOwnerToken,
    } = body || {};

    const tempOwnerToken = typeof rawTempOwnerToken === 'string' ? rawTempOwnerToken.trim() : null;
    let invitationId = rawInvitationId || null;

    const ownerId = user?.id || null;
    const ownerEmail =
      (user?.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user?.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;
    const ownerPhone = user?.phone || user?.user_metadata?.phone || null;

    // If invitationId was not explicitly provided but tempOwnerToken is, look up draft row
    if (!invitationId && tempOwnerToken) {
      const { data: draftByToken } = await supabaseServer
        .from('invitations')
        .select('id, owner_id, owner_email, temp_owner_token')
        .eq('temp_owner_token', tempOwnerToken)
        .maybeSingle();

      if (draftByToken && (!draftByToken.owner_id || draftByToken.owner_id === ownerId || draftByToken.owner_email === ownerEmail)) {
        invitationId = draftByToken.id;
      }
    }

    // Check existing free publications for this user
    let query = supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_ad_supported, is_paid, temp_owner_token');

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

    // If publishing a brand new invite (or claiming a fresh draft), verify free entitlement limit:
    const targetInList = invitationId ? existingList.find((inv) => String(inv.id) === String(invitationId)) : null;
    const isAlreadyPaidOrPublished = targetInList && (targetInList.is_paid || targetInList.tier === 'free');

    if (!isAlreadyPaidOrPublished) {
      if (freePublished.length >= 3) {
        return NextResponse.json(
          {
            error: 'You have reached the free invitation limit. Upgrade to Premium for ₹399 to publish this invitation, or manage your invitations from your dashboard.',
            code: 'FREE_TIER_LIMIT_REACHED',
            freePublishedCount: freePublished.length,
          },
          { status: 403 },
        );
      }
    }

    if (invitationId) {
      // Verify ownership of the existing invitation / draft
      let isOwner = !!targetInList;
      if (!isOwner) {
        const { data: checkDirect } = await supabaseServer
          .from('invitations')
          .select('id, owner_id, owner_email, owner_phone, temp_owner_token')
          .eq('id', invitationId)
          .maybeSingle();

        if (!checkDirect) {
          return NextResponse.json(
            { error: 'You do not have permission to edit this invitation.', code: 'FORBIDDEN' },
            { status: 403 },
          );
        }

        isOwner =
          (ownerId && checkDirect.owner_id && String(checkDirect.owner_id) === String(ownerId)) ||
          (ownerEmail && checkDirect.owner_email &&
            String(checkDirect.owner_email).toLowerCase() === String(ownerEmail).toLowerCase()) ||
          (ownerPhone && checkDirect.owner_phone &&
            String(checkDirect.owner_phone) === String(ownerPhone)) ||
          (tempOwnerToken && checkDirect.temp_owner_token &&
            checkDirect.temp_owner_token === tempOwnerToken) ||
          (!checkDirect.owner_id && !checkDirect.owner_email); // unclaimed draft
      }

      if (!isOwner) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this invitation.', code: 'FORBIDDEN' },
          { status: 403 },
        );
      }
    }

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
        { error: 'Event date must be a valid date (YYYY-MM-DD).' },
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

    const mapsUrl = pickMapFields(body);
    const resolvedPhotoUrl =
      photoUrl || photo_url || heroImage || templateData?.photoUrl || templateData?.heroImage || null;
    const incomingTd = templateData && typeof templateData === 'object' ? templateData : {};
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
    const freeOrderId = `free_${nowIso.replace(/[^\d]/g, '')}_${crypto.randomBytes(3).toString('hex')}`;
    const freePaymentId = `free_reward_${nowIso.replace(/[^\d]/g, '')}`;

    const baseRow = {
      template_id: templateId || 'standard-crimson',
      groom_name: resolvedGroomName,
      bride_name: resolvedBrideName,
      wedding_date: cleanWeddingDate,
      wedding_time: resolvedWeddingTime,
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

    // ── POST-INSERT FREE-TIER RACE GUARD (TOCTOU mitigation) ────────────────
    // For brand-new (non-republish) free-tier invitations: re-count the user's
    // free invitations AFTER the insert. If count > 3 we lost a double-click /
    // parallel-request race. DELETE the row we just inserted and reject.
    if (!invitationId && resultData) {
      let postQuery = supabaseServer
        .from('invitations')
        .select('id, tier, is_ad_supported, is_paid');
      if (ownerEmail) {
        postQuery = postQuery.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
      } else {
        postQuery = postQuery.eq('owner_id', ownerId);
      }
      const { data: postList } = await postQuery;
      const postFreeCount = (postList || []).filter(
        inv => inv.tier === 'free' || inv.is_ad_supported !== false || inv.tier === null
      ).length;

      if (postFreeCount > 3) {
        await supabaseServer.from('invitations').delete().eq('id', resultData.id);
        return NextResponse.json(
          {
            error: 'You have reached the free invitation limit. Upgrade to Premium for ₹399 to publish this invitation, or manage your invitations from your dashboard.',
            code: 'FREE_TIER_LIMIT_REACHED',
            freePublishedCount: postFreeCount,
          },
          { status: 403 },
        );
      }
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
