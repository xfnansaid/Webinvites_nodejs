import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug, coerceToIsoDate, pickMapFields } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/publish-free
 *
 * Publishes an invitation on the Free Tier after the user finishes
 * watching the Google Rewarded Video Ad.
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
  const rl = rateLimit({ key: `publish-free:${ip}`, limit: 15, windowMs: 60_000 });
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
          error: 'Please sign in to publish your invitation for free.',
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

    const ownerId = user.id;
    const ownerEmail = user.email?.trim().toLowerCase() || null;
    const ownerPhone = user.phone || user.user_metadata?.phone || null;

    // Check existing free publications for this user
    let query = supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_ad_supported, is_paid');

    if (ownerEmail) {
      query = query.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
    } else {
      query = query.eq('owner_id', ownerId);
    }

    const { data: userInvites } = await query;
    const existingList = userInvites || [];
    const freePublished = existingList.filter(
      (inv) => (inv.is_paid || inv.tier === 'free') && (inv.tier === 'free' || inv.is_ad_supported !== false),
    );

    // If publishing a brand new invite, verify free limit
    if (!invitationId) {
      if (freePublished.length >= 1) {
        return NextResponse.json(
          {
            error: 'You have already published 1 free invitation. Please pay ₹399 to publish additional templates.',
            code: 'FREE_TIER_LIMIT_REACHED',
            freePublishedCount: freePublished.length,
          },
          { status: 403 },
        );
      }
    } else {
      // If updating an existing invitation, make sure user owns it
      const target = existingList.find((inv) => String(inv.id) === String(invitationId));
      if (!target && existingList.length > 0) {
        // Not in their list, check by direct query
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

    const baseRow = {
      template_id: templateId || 'template-1',
      groom_name: groomName || '',
      bride_name: brideName || '',
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
      is_paid: true, // Marked active and live
      tier: 'free',
      is_ad_supported: true,
      owner_id: ownerId,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      ...(resolvedPhotoUrl ? { photo_url: resolvedPhotoUrl } : {}),
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

      // Schema fallback if tier / is_ad_supported / photo_url columns do not exist yet in DB
      if (resultError) {
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

      if (resultError) {
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
      console.error('[publish-free] database error:', resultError);
      return NextResponse.json(
        {
          error: 'Failed to publish invitation. Please try again.',
          details: resultError.message,
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
      { error: 'An unexpected error occurred.', details: err.message },
      { status: 500 },
    );
  }
}
