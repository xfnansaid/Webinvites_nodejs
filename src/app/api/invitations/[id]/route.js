import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';

// Resolve the current auth user from Supabase session cookies — returns user or null.
async function resolveCurrentUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/sb-[a-z]+-auth-token=([^;]+)/i);
    if (!match) return null;
    let parsed = null;
    try { parsed = JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
    const accessToken = parsed?.access_token;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!accessToken || !url || !serviceKey) return null;

    const { createClient } = require('@supabase/supabase-js');
    const tempClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } = {}, error } = await tempClient.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (e) {
    console.warn('[invitation-api] resolveCurrentUser failed:', e?.message || e);
    return null;
  }
}

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
// Ownership check: owner_id OR service_role OR the invitation has the same phone as user.phone
export async function GET(request, { params }) {
  const { id } = params || {};
  if (!id) return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 });

  const user = await resolveCurrentUser(request);
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

  const isOwner = user && data.owner_id && data.owner_id === user.id;
  const isPhoneOwner = user && user.phone && data.owner_phone === user.phone;
  // Allow viewing if owner OR service role is bypass OR invite is paid (anyone can see it via /i/[slug] anyway).
  if (!serviceOk && !isOwner && !isPhoneOwner && !data.is_paid) {
    return NextResponse.json(
      { error: 'Sign in to edit this invitation. If this is your invite, sign in with the same mobile number you used while publishing.', hint: 'Go to /signin' },
      { status: 403 }
    );
  }

  return NextResponse.json({ invitation: data, editable: !!(isOwner || isPhoneOwner || serviceOk) });
}

// PATCH /api/invitations/[id] — update invitation fields (owner only).
// Fields that may be sent: templateId, groomName, brideName, weddingDate, weddingTime,
// venue, venueAddress, mapsUrl/mapUrl/directionsUrl, whatsappNumber, groomParents,
// brideParents, heroTagline, heroEventText, countdownTitle
export async function PATCH(request, { params }) {
  const { id } = params || {};
  if (!id) return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 });

  const user = await resolveCurrentUser(request);
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

  const isOwner = existing.owner_id === user.id;
  const isPhoneOwner = user.phone && existing.owner_phone === user.phone;
  // If service role is active, allow for now bypass ownership checks (admin/dev mode).
  if (!isOwner && !isPhoneOwner && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'You can only edit invitations you created with this mobile number.' },
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
