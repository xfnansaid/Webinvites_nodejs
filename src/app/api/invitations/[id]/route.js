import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';

// IMPORTANT: This API MUST always hit the live DB so client edit saves are
// reflected IMMEDIATELY on the next GET /i/[slug] page load.  Without
// `export const dynamic = 'force-dynamic'`, Next.js Full Route Cache would
// serve stale HTTP responses on Hostinger production deployments.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Coerce weddingDate to ISO
function coerceToIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
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
    return NextResponse.json({ error: error.message || 'DB error', code: error.code }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = user && data.owner_id && String(data.owner_id) === String(user.id);
  const isPhoneOwner = user && user.phone && data.owner_phone === user.phone;
  const isEmailOwner = userEmail && data.owner_email && data.owner_email.toLowerCase() === userEmail;
  // Allow viewing if owner OR service role is bypass OR invite is paid (anyone can see it via /i/[slug] anyway).
  if (!serviceOk && !isOwner && !isPhoneOwner && !isEmailOwner && !data.is_paid) {
    return NextResponse.json(
      { error: 'Sign in to edit this invitation. If this is your invite, sign in with the same Google account you used while publishing.', hint: 'Go to /signin' },
      { status: 403 }
    );
  }

  const editCount = typeof data.edit_count === 'number' ? data.edit_count : (Number(data.template_data?._edit_count) || 0);
  const normalizedData = { ...data, edit_count: editCount };

  return NextResponse.json({
    invitation: normalizedData,
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
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = existing.owner_id && String(existing.owner_id) === String(user.id);
  const isPhoneOwner = user.phone && existing.owner_phone === user.phone;
  const isEmailOwner = userEmail && existing.owner_email && existing.owner_email.toLowerCase() === userEmail;
  // If service role is active, allow bypass ownership checks (admin/dev mode).
  if (!isOwner && !isPhoneOwner && !isEmailOwner && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'You can only edit invitations you created with this Google account.' },
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
  if (body.groomName !== undefined) updates.groom_name = body.groomName;
  if (body.brideName !== undefined) updates.bride_name = body.brideName;
  if (body.weddingDate !== undefined) {
    const clean = coerceToIsoDate(body.weddingDate);
    if (!clean) return NextResponse.json({ error: 'Wedding date must be a valid date' }, { status: 400 });
    updates.wedding_date = clean;
  }
  if (body.weddingTime !== undefined) updates.wedding_time = body.weddingTime;
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
  updates.template_data = {
    ...existingTemplateData,
    ...incomingTemplateData,
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

  // Graceful fallback if database schema column edit_count hasn't been migrated yet
  if (error && (error.code === '42703' || error.message?.toLowerCase().includes('edit_count') || error.code === 'PGRST204')) {
    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.edit_count;
    const retry = await supabaseServer
      .from('invitations')
      .update(fallbackUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });

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
