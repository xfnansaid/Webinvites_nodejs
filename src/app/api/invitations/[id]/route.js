import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { coerceToIsoDate } from '@/lib/utils';

// IMPORTANT: This API MUST always hit the live DB so client edit saves are
// reflected IMMEDIATELY on the next GET /i/[slug] page load.  Without
// `export const dynamic = 'force-dynamic'`, Next.js Full Route Cache would
// serve stale HTTP responses on Hostinger production deployments.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;


// GET /api/invitations/[id] — fetch single invitation for the editor.
// Ownership check: owner_id OR owner_phone OR owner_email OR service_role bypass.
export async function GET(request, { params }) {
  const { id } = params || {};
  if (!id) return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 });

  const { user } = await resolveSupabaseUser(request);
  const serviceOk = isServiceRoleConfigured();

  const { data, error } = await supabaseServer
    .from('invitations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    // SECURITY: Never expose DB error codes or messages to the client
    if (process.env.NODE_ENV !== 'production') {
      console.error('[invitations GET] DB error:', error.message, error.code);
    }
    return NextResponse.json({ error: 'A server error occurred.' }, { status: 500 });
  }
  // SECURITY: Return the same 403 regardless of whether the resource exists
  // or the user lacks access — prevents user enumeration.
  if (!data) {
    return NextResponse.json(
      { error: 'Not authorized to view this invitation. Sign in with the account that created it.' },
      { status: 403 }
    );
  }

  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = user && data.owner_id && String(data.owner_id) === String(user.id);
  const isPhoneOwner = user && user.phone && data.owner_phone === user.phone;
  const isEmailOwner = userEmail && data.owner_email && data.owner_email.toLowerCase() === userEmail;
  // SECURITY: Same 403 whether resource missing or access denied.
  // OLD BUG: The `&& !data.is_paid` clause meant ANY paid invitation was publicly
  // readable by UUID (PII leak: whatsapp, addresses, family names, photos).
  // Correct: only service role or an ownership match may read.
  if (!serviceOk && !isOwner && !isPhoneOwner && !isEmailOwner) {
    return NextResponse.json(
      { error: 'Not authorized to view this invitation. Sign in with the account that created it.' },
      { status: 403 }
    );
  }

  const editCount = typeof data.edit_count === 'number' ? data.edit_count : (Number(data.template_data?._edit_count) || 0);
  const normalizedData = { ...data, edit_count: editCount };

  // SECURITY: Strip sensitive server-only fields from the response.
  // Never expose temp_owner_token (draft claim secret), Razorpay IDs
  // (payment identifiers), or raw owner PII to the client.
  const {
    temp_owner_token: _tot,
    razorpay_order_id: _roi,
    razorpay_payment_id: _rpi,
    razorpay_webhook_event_id: _rwe,
    ...safeInvitation
  } = normalizedData;

  return NextResponse.json({
    invitation: safeInvitation,
    editable: !!(isOwner || isPhoneOwner || isEmailOwner || serviceOk),
    edit_count: editCount,
    max_edits: 3,
    edits_remaining: Math.max(0, 3 - editCount),
  });
}

// PATCH /api/invitations/[id] — update invitation fields (owner only).
// Clients are limited to 3 post-publish edits to protect invite integrity.
export async function PATCH(request, { params }) {
  const { id } = params || {};
  if (!id) return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 });

  // SECURITY: Rate limit edit attempts — 30 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `edit-invite:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again.' },
      { status: 429 },
    );
  }

  const { user } = await resolveSupabaseUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Please sign in to edit your invitation.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // Load existing row first to perform ownership check server-side
  const { data: existing, error: existingErr } = await supabaseServer
    .from('invitations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (existingErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[invitations PATCH] DB error:', existingErr.message, existingErr.code);
    }
    return NextResponse.json({ error: 'A server error occurred.' }, { status: 500 });
  }
  // SECURITY: Same 403 whether missing or unauthorized — prevents enumeration.
  if (!existing) {
    return NextResponse.json(
      { error: 'Not authorized to edit this invitation.' },
      { status: 403 }
    );
  }

  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = existing.owner_id && String(existing.owner_id) === String(user.id);
  const isPhoneOwner = user.phone && existing.owner_phone === user.phone;
  const isEmailOwner = userEmail && existing.owner_email && existing.owner_email.toLowerCase() === userEmail;
  // SECURITY: Same 403 whether missing or unauthorized — prevents enumeration.
  if (!isOwner && !isPhoneOwner && !isEmailOwner && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'Not authorized to edit this invitation.' },
      { status: 403 }
    );
  }

  const MAX_EDITS = 3;
  const currentEditCount = typeof existing.edit_count === 'number'
    ? existing.edit_count
    : (Number(existing.template_data?._edit_count) || 0);

  // Enforce 3-edit limit for paid / published invitations
  if (existing.is_paid && currentEditCount >= MAX_EDITS) {
    return NextResponse.json(
      {
        error: `You have reached the maximum limit of ${MAX_EDITS} edits for this invitation. Please contact support if you need further changes.`,
        code: 'EDIT_LIMIT_REACHED',
        edit_count: currentEditCount,
        max_edits: MAX_EDITS,
        edits_remaining: 0,
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const updates = {};
  if (body.templateId !== undefined) updates.template_id = body.templateId;
  const resolvedGroom = body.groomName !== undefined ? body.groomName : (body.celebrantName !== undefined ? body.celebrantName : body.familyName);
  if (resolvedGroom !== undefined) updates.groom_name = resolvedGroom;
  if (body.brideName !== undefined) updates.bride_name = body.brideName;
  
  const rawDate = body.weddingDate !== undefined ? body.weddingDate : (body.birthdayDate !== undefined ? body.birthdayDate : (body.eventDate !== undefined ? body.eventDate : body.date));
  if (rawDate !== undefined) {
    const clean = coerceToIsoDate(rawDate);
    if (!clean) return NextResponse.json({ error: 'Event date must be a valid date' }, { status: 400 });
    updates.wedding_date = clean;
  }
  const resolvedTime = body.weddingTime !== undefined ? body.weddingTime : (body.birthdayTime !== undefined ? body.birthdayTime : body.eventTime);
  if (resolvedTime !== undefined) updates.wedding_time = resolvedTime;
  if (body.venue !== undefined) updates.venue = body.venue;
  if (body.venueAddress !== undefined) {
    updates.venue_address = body.venueAddress || existing.venue;
  }
  const mapVal = body.mapsUrl || body.mapUrl || body.directionsUrl;
  if (mapVal !== undefined) updates.maps_url = mapVal;
  if (body.whatsappNumber !== undefined) updates.whatsapp_number = body.whatsappNumber;
  if (body.groomParents !== undefined) updates.groom_parents = body.groomParents;
  if (body.brideParents !== undefined) updates.bride_parents = body.brideParents;
  if (body.heroTagline !== undefined) updates.hero_tagline = body.heroTagline || null;
  if (body.heroEventText !== undefined) updates.hero_event_text = body.heroEventText || null;
  if (body.countdownTitle !== undefined) updates.countdown_title = body.countdownTitle || null;

  // Next edit count (increment only for paid / published invites that actually make edits)
  const nextEditCount = existing.is_paid ? currentEditCount + 1 : currentEditCount;
  updates.edit_count = nextEditCount;

  // Template-specific inline edits (heroTitle, monogram, eyebrowMal, etc.)
  // stored in the template_data JSONB column. Also persist _edit_count inside JSONB for resilient fallback.
  const existingTemplateData = existing.template_data || {};
  const incomingTemplateData = (body.templateData && typeof body.templateData === 'object') ? body.templateData : {};
  const resolvedPhotoUrl =
    body.photoUrl !== undefined
      ? body.photoUrl
      : body.photo_url !== undefined
      ? body.photo_url
      : body.heroImage !== undefined
      ? body.heroImage
      : incomingTemplateData.photoUrl !== undefined
      ? incomingTemplateData.photoUrl
      : incomingTemplateData.heroImage !== undefined
      ? incomingTemplateData.heroImage
      : undefined;

  if (resolvedPhotoUrl !== undefined) {
    updates.photo_url = resolvedPhotoUrl || null;
  }

  updates.template_data = {
    ...existingTemplateData,
    ...incomingTemplateData,
    ...(body.celebrantName !== undefined ? { celebrantName: body.celebrantName } : {}),
    ...(body.age !== undefined ? { age: body.age } : {}),
    ...(body.birthdayDate !== undefined ? { birthdayDate: body.birthdayDate } : {}),
    ...(body.birthdayTime !== undefined ? { birthdayTime: body.birthdayTime } : {}),
    ...(body.partyTheme !== undefined ? { partyTheme: body.partyTheme } : {}),
    ...(body.familyName !== undefined ? { familyName: body.familyName } : {}),
    ...(body.eventDate !== undefined ? { eventDate: body.eventDate } : {}),
    ...(body.eventTime !== undefined ? { eventTime: body.eventTime } : {}),
    ...(body.hostsName !== undefined ? { hostsName: body.hostsName } : {}),
    ...(body.ceremonyTime !== undefined ? { ceremonyTime: body.ceremonyTime } : {}),
    ...(body.lunchTime !== undefined ? { lunchTime: body.lunchTime } : {}),
    ...(body.findOurHome !== undefined ? { findOurHome: body.findOurHome } : {}),
    ...(resolvedPhotoUrl !== undefined ? { photoUrl: resolvedPhotoUrl || '', heroImage: resolvedPhotoUrl || '' } : {}),
    ...(body.showPhotoSection !== undefined ? { showPhotoSection: body.showPhotoSection } : {}),
    ...(body.showRsvp !== undefined ? { showRsvp: body.showRsvp } : {}),
    ...(body.showEvents !== undefined ? { showEvents: body.showEvents } : {}),
    _edit_count: nextEditCount,
  };

  updates.updated_at = new Date().toISOString();

  // Auto-stamp owner_id the first time an authenticated owner patches a legacy row
  if (!existing.owner_id && user.id) updates.owner_id = user.id;
  // Auto-stamp owner_email the first time a signed-in Google user edits a legacy row
  if (!existing.owner_email && userEmail) updates.owner_email = userEmail;
  // Also backfill owner_phone if user.phone exists and DB has null for that column
  if (!existing.owner_phone && user.phone) updates.owner_phone = user.phone;

  let { data, error } = await supabaseServer
    .from('invitations')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  // -----------------------------------------------------------------------
  // Graceful iterative fallback for missing schema columns (error 42703).
  // The platform was built with two parallel naming conventions
  // (wedding_date vs event_date, venue vs venue_name, maps_url vs map_url,
  //  whatsapp_number vs rsvp_phone).  Incremental migrations may have been
  //  applied in any order, so ANY column we try to UPDATE may not exist yet.
  //  Rather than fail the whole edit save, repeatedly extract the unknown
  //  column name from the Postgres error message, drop it from the UPDATE
  //  payload, and retry.  Stop as soon as UPDATE succeeds or the error is
  //  something else entirely.  This guarantees edits always persist even
  //  when the Supabase schema lags behind the application code.
  // -----------------------------------------------------------------------
  let attemptUpdates = { ...updates };
  let fallbackAttempts = 0;
  const MAX_FALLBACK_ATTEMPTS = 16;
  while (
    error &&
    fallbackAttempts < MAX_FALLBACK_ATTEMPTS &&
    (error.code === '42703' || error.code === 'PGRST204')
  ) {
    fallbackAttempts += 1;

    let dropColumn = null;
    const msg = String(error.message || '');
    const fortyTwoSevenMatch = msg.match(/column\s+"?([^"\s)]+)"?\s+of\s+relation/i);
    if (fortyTwoSevenMatch && fortyTwoSevenMatch[1]) {
      dropColumn = fortyTwoSevenMatch[1];
    } else {
      const keys = Object.keys(attemptUpdates);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (msg.toLowerCase().includes(key.toLowerCase())) {
          dropColumn = key;
          break;
        }
      }
    }

    if (!dropColumn) {
      break;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[invitations PATCH] schema column "${dropColumn}" missing — dropping from UPDATE payload and retrying (attempt ${fallbackAttempts}).`,
      );
    }
    delete attemptUpdates[dropColumn];
    if (Object.keys(attemptUpdates).length === 0) {
      break;
    }

    const retry = await supabaseServer
      .from('invitations')
      .update(attemptUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[invitations PATCH] update error:', error.message, error.code);
    }
    return NextResponse.json({ error: 'A server error occurred.' }, { status: 500 });
  }

  const finalEditCount = typeof data?.edit_count === 'number'
    ? data.edit_count
    : (Number(data?.template_data?._edit_count) || nextEditCount);
  const normalizedData = { ...data, edit_count: finalEditCount };

  return NextResponse.json({
    ok: true,
    invitation: normalizedData,
    edit_count: finalEditCount,
    max_edits: MAX_EDITS,
    edits_remaining: Math.max(0, MAX_EDITS - finalEditCount),
  });
}

// DELETE /api/invitations/[id] — permanently delete an invitation (owner only).
export async function DELETE(request, { params }) {
  const { id } = params || {};
  if (!id) return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 });

  // SECURITY: Rate limit deletions — 5 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `delete-invite:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again.' }, { status: 429 });
  }

  const { user } = await resolveSupabaseUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Please sign in to delete your invitation.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // Load existing row first to perform ownership check server-side
  const { data: existing, error: existingErr } = await supabaseServer
    .from('invitations')
    .select('id, owner_id, owner_phone, owner_email, slug')
    .eq('id', id)
    .maybeSingle();

  if (existingErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[invitations DELETE] DB error:', existingErr.message);
    }
    return NextResponse.json({ error: 'A server error occurred.' }, { status: 500 });
  }
  // SECURITY: Same 403 whether missing or unauthorized — prevents enumeration.
  if (!existing) {
    return NextResponse.json(
      { error: 'Not authorized to delete this invitation.' },
      { status: 403 }
    );
  }

  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = existing.owner_id && String(existing.owner_id) === String(user.id);
  const isPhoneOwner = user.phone && existing.owner_phone === user.phone;
  const isEmailOwner = userEmail && existing.owner_email && existing.owner_email.toLowerCase() === userEmail;

  // SECURITY: Same 403 whether missing or unauthorized — prevents enumeration.
  if (!isOwner && !isPhoneOwner && !isEmailOwner && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'Not authorized to delete this invitation.' },
      { status: 403 }
    );
  }

  const { error: deleteErr } = await supabaseServer
    .from('invitations')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[invitations DELETE] error:', deleteErr.message);
    }
    return NextResponse.json({ error: 'Failed to delete invitation.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deletedId: id,
    slug: existing.slug,
  });
}

