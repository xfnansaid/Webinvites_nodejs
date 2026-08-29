import { NextResponse } from 'next/server';
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

    const incomingTd = typeof templateData === 'object' && templateData ? templateData : {};
    const resolvedTemplateData = {
      ...incomingTd,
      ...(resolvedPhotoUrl ? { photoUrl: resolvedPhotoUrl, heroImage: resolvedPhotoUrl } : {}),
      ...(formData.showPhotoSection !== undefined ? { showPhotoSection: formData.showPhotoSection } : {}),
      ...(formData.showRsvp !== undefined ? { showRsvp: formData.showRsvp } : {}),
      ...(formData.showEvents !== undefined ? { showEvents: formData.showEvents } : {}),
    };

    if (!groomName || !brideName || !weddingDate) {
      return NextResponse.json(
        {
          error: 'Cannot save a draft without bride & groom names and a wedding date.',
          code: 'REQUIRED_FIELDS_MISSING',
        },
        { status: 400 },
      );
    }

    const cleanWeddingDate = coerceToIsoDate(weddingDate);
    if (!cleanWeddingDate) {
      return NextResponse.json(
        { error: 'Wedding date must be a valid date (YYYY-MM-DD).', code: 'BAD_WEDDING_DATE' },
        { status: 400 },
      );
    }

    // Slug logic — reuse existing slug on UPDATE / existing invitationId.
    let slug = invitationId ? null : generateSlug(groomName, brideName);

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
      groom_name: groomName,
      bride_name: brideName,
      wedding_date: cleanWeddingDate,
      wedding_time: weddingTime,
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
    };

    let data;
    let error;

    if (invitationId) {
      // UPDATE existing invitation (user is re-saving a draft / doing a
      // republish while still anonymous — we keep the new tempOwnerToken so
      // they can claim any saved changes).
      const upRes = await supabaseServer
        .from('invitations')
        .update({ ...baseRow, temp_owner_token: tempOwnerToken })
        .eq('id', invitationId)
        .select()
        .maybeSingle();
      data = upRes.data;
      error = upRes.error;
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('photo_url'))) {
        const fallbackRow = { ...baseRow };
        delete fallbackRow.photo_url;
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
      draftId: data.id,
      invitationId: data.id,
      tempOwnerToken,
      slug,
      isPaid: !!data.is_paid,
      ownerId: data.owner_id || null,
      alreadyClaimed: !!data.owner_id && !!ownerId && data.owner_id === ownerId,
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
