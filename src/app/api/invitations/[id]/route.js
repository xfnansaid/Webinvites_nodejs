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

  return NextResponse.json({ invitation: data, editable: !!(isOwner || isPhoneOwner || isEmailOwner || serviceOk) });
}

// PATCH /api/invitations/[id] — update invitation fields (owner only).
// Fields that may be sent: templateId, groomName, brideName, weddingDate, weddingTime,
// venue, venueAddress, mapsUrl/mapUrl/directionsUrl, whatsappNumber, groomParents,
// brideParents, heroTagline, heroEventText, countdownTitle
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
  // If service role is active, allow for now bypass ownership checks (admin/dev mode).
  if (!isOwner && !isPhoneOwner && !isEmailOwner && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'You can only edit invitations you created with this Google account.' },
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
  updates.updated_at = new Date().toISOString();

  // Auto-stamp owner_id the first time an authenticated owner patches a legacy row
  if (!existing.owner_id && user.id) updates.owner_id = user.id;
  // Auto-stamp owner_email the first time a signed-in Google user edits a legacy row
  if (!existing.owner_email && userEmail) updates.owner_email = userEmail;
  // Also backfill owner_phone if user.phone exists and DB has null for that column
  if (!existing.owner_phone && user.phone) updates.owner_phone = user.phone;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true, invitation: existing });
  }

  const { data, error } = await supabaseServer
    .from('invitations')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });

  return NextResponse.json({ ok: true, invitation: data });
}
