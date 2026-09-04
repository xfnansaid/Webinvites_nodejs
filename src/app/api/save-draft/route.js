import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSlug, coerceToIsoDate, pickMapFields } from '@/lib/utils';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';


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
    // SECURITY: If crypto is unavailable, throw instead of using Math.random()
    // which is not cryptographically secure. This should never happen in Node.js
    // but if it does, we fail loudly rather than generating weak tokens.
    throw new Error('Cryptographically secure random not available. Cannot generate safe token.');
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
  // SECURITY: Rate limit draft saves — 20 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `save-draft:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again.' },
      { status: 429 },
    );
  }

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

    // Viral loop attribution: if user landed from a ?via= share link, preserve
    // the referrer slug on this draft row so when they eventually pay, the
    // referrer still gets credit (even if cookie gets cleared in between).
    let referredBySlug = null;
    try {
      const ckStore = await cookies();
      const viaRaw = ckStore.get('referrer_via')?.value;
      const viaClean = typeof viaRaw === 'string' ? viaRaw.trim() : '';
      if (viaClean && viaClean.length >= 3 && viaClean.length <= 120) {
        referredBySlug = viaClean;
      }
    } catch {}

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
    const resolvedPhotoUrl =
      formData.photoUrl ||
      formData.photo_url ||
      formData.heroImage ||
      templateData?.photoUrl ||
      templateData?.heroImage ||
      null;

    // Robust date extraction
    const rawDate =
      formData.weddingDate ||
      formData.birthdayDate ||
      formData.eventDate ||
      formData.date ||
      templateData?.weddingDate ||
      templateData?.birthdayDate ||
      templateData?.eventDate ||
      templateData?.date;
    const cleanWeddingDate = coerceToIsoDate(rawDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Event date must be a valid date (YYYY-MM-DD).', code: 'BAD_WEDDING_DATE' },
        { status: 400 },
      );
    }

    // Robust time extraction
    const resolvedWeddingTime =
      formData.weddingTime ||
      formData.birthdayTime ||
      formData.eventTime ||
      formData.time ||
      templateData?.weddingTime ||
      templateData?.birthdayTime ||
      templateData?.eventTime ||
      templateData?.time ||
      null;

    // Robust names extraction
    const resolvedGroomName =
      formData.groomName ||
      formData.celebrantName ||
      formData.familyName ||
      formData.hostName ||
      formData.hostsName ||
      templateData?.celebrantName ||
      templateData?.familyName ||
      templateData?.groomName ||
      'Celebration';

    const resolvedBrideName =
      formData.brideName ||
      (formData.age ? `${formData.age}th Birthday` : '') ||
      (templateId?.startsWith?.('housewarming') ? 'Housewarming' : '') ||
      templateData?.brideName ||
      '';

    const incomingTd = typeof templateData === 'object' && templateData ? templateData : {};
    const resolvedTemplateData = {
      ...incomingTd,
      // Preserve birthday/housewarming specific fields in template_data
      ...(formData.celebrantName ? { celebrantName: formData.celebrantName } : {}),
      ...(formData.age ? { age: formData.age } : {}),
      ...(formData.birthdayDate ? { birthdayDate: formData.birthdayDate } : {}),
      ...(formData.birthdayTime ? { birthdayTime: formData.birthdayTime } : {}),
      ...(formData.partyTheme ? { partyTheme: formData.partyTheme } : {}),
      ...(formData.familyName ? { familyName: formData.familyName } : {}),
      ...(formData.eventDate ? { eventDate: formData.eventDate } : {}),
      ...(formData.eventTime ? { eventTime: formData.eventTime } : {}),
      ...(formData.hostsName ? { hostsName: formData.hostsName } : {}),
      ...(formData.ceremonyTime ? { ceremonyTime: formData.ceremonyTime } : {}),
      ...(formData.lunchTime ? { lunchTime: formData.lunchTime } : {}),
      ...(formData.findOurHome ? { findOurHome: formData.findOurHome } : {}),
      ...(resolvedPhotoUrl ? { photoUrl: resolvedPhotoUrl, heroImage: resolvedPhotoUrl } : {}),
      ...(formData.showPhotoSection !== undefined ? { showPhotoSection: formData.showPhotoSection } : {}),
      ...(formData.showRsvp !== undefined ? { showRsvp: formData.showRsvp } : {}),
      ...(formData.showEvents !== undefined ? { showEvents: formData.showEvents } : {}),
    };

    // Slug logic — reuse existing slug on UPDATE / existing invitationId.
    let slug = invitationId ? null : generateSlug(resolvedGroomName, resolvedBrideName);

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
      groom_name: resolvedGroomName,
      bride_name: resolvedBrideName,
      wedding_date: cleanWeddingDate,
      wedding_time: resolvedWeddingTime,
      venue,
      venue_address: venueAddress,
      maps_url: mapsUrl,
      whatsapp_number: whatsappNumber,
      groom_parents: groomParents,
      bride_parents: brideParents,
      hero_tagline: heroTagline,
      hero_event_text: heroEventText,
      countdown_title: countdownTitle,
      template_data: resolvedTemplateData,
      ...(resolvedPhotoUrl ? { photo_url: resolvedPhotoUrl } : {}),
      temp_owner_token: tempOwnerToken,
      status: 'draft',
      is_paid: false,
      razorpay_order_id: null,
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
      // HOLE #1: Anonymous draft timestamp — set by app so pg_cron can delete
      // unclaimed anonymous drafts older than 4 hours, preventing unlimited
      // free-draft squatting that eats revenue.
      ...(!ownerId ? { anonymous_created_at: new Date().toISOString() } : {}),
      // HOLE #3: Preserve referral attribution on the row itself (belt-and-braces
      // vs cookie-only) so the referrer still gets free premium reward even if
      // the user switches browsers or clears cookies between save and pay.
      ...(referredBySlug ? { referred_by_slug: referredBySlug } : {}),
    };

    let data;
    let error;

    if (invitationId) {
      const updatePatch = { ...baseRow, temp_owner_token: tempOwnerToken };
      delete updatePatch.anonymous_created_at;
      delete updatePatch.referred_by_slug;
      const upRes = await supabaseServer
        .from('invitations')
        .update(updatePatch)
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upRes.data;
      error = upRes.error;
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.toLowerCase().includes('photo_url') || error.message?.toLowerCase().includes('anonymous_created_at'))) {
        const fallbackRow = { ...updatePatch };
        delete fallbackRow.photo_url;
        delete fallbackRow.anonymous_created_at;
        delete fallbackRow.referred_by_slug;
        const retry = await supabaseServer
          .from('invitations')
          .update({ ...fallbackRow, temp_owner_token: tempOwnerToken })
          .eq('id', invitationId)
          .select()
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }
      if (!error && !data) {
        error = new Error(`Invitation ${invitationId} not found (may have been deleted).`);
      }
      if (!error && data) slug = data.slug;
    } else {
      let currentSlug = slug;
      let insRes = await supabaseServer
        .from('invitations')
        .insert([{ ...baseRow, slug: currentSlug }])
        .select()
        .single();
      data = insRes.data;
      error = insRes.error;

      // Handle duplicate slug collision (23505)
      if (error && error.code === '23505') {
        currentSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        insRes = await supabaseServer
          .from('invitations')
          .insert([{ ...baseRow, slug: currentSlug }])
          .select()
          .single();
        data = insRes.data;
        error = insRes.error;
        if (!error) slug = currentSlug;
      }

      // Handle missing schema columns (photo_url, anonymous_created_at, referred_by_slug)
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('anonymous_created_at') || error.message?.includes('photo_url') || error.message?.includes('referred_by_slug'))) {
        const cleanRow = { ...baseRow };
        delete cleanRow.photo_url;
        delete cleanRow.anonymous_created_at;
        delete cleanRow.referred_by_slug;

        const retry = await supabaseServer
          .from('invitations')
          .insert([{ ...cleanRow, slug: currentSlug }])
          .select()
          .single();
        data = retry.data;
        error = retry.error;

        if (error && error.code === '23505') {
          currentSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
          const retrySlug = await supabaseServer
            .from('invitations')
            .insert([{ ...cleanRow, slug: currentSlug }])
            .select()
            .single();
          data = retrySlug.data;
          error = retrySlug.error;
          if (!error) slug = currentSlug;
        }
      }
    }

    if (error) throw error;

    // authSuggested tells the editor UI it should show a "Sign in to save
    // permanently to your account" CTA. Only shown for anonymous users
    // (owner_id still null) so that signed-in users don't see unnecessary
    // sign-in prompts.
    const isAnonymous = !ownerId && !data.owner_id;

    return NextResponse.json({
      ok: true,
      draftId: data.id,
      invitationId: data.id,
      tempOwnerToken,
      slug,
      isPaid: !!data.is_paid,
      ownerId: data.owner_id || null,
      alreadyClaimed: !!data.owner_id && !!ownerId && data.owner_id === ownerId,
      authSuggested: isAnonymous,
      referralAttribution: referredBySlug || data.referred_by_slug || null,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[save-draft]', err);
    }
    // SECURITY: Never expose DB error codes, SQL snippets, or architecture details.
    return NextResponse.json(
      { error: 'Failed to save draft. Please try again.' },
      { status: 500 },
    );
  }
}
