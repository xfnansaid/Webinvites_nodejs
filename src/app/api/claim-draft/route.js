import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// POST /api/claim-draft — associate an anonymous "temp_owner_token" draft
// invitation with the currently signed-in Supabase user.
//
// Accepts: { tempOwnerToken: string }
//
// Server logic:
//   1. Resolve signed-in user (Bearer auth header fallback or sb-<ref>-auth-token cookie).
//   2. Look up invitations.temp_owner_token = $1 (unique index, so O(1)).
//   3. If no row → 404.
//   4. If row.owner_id IS NOT NULL:
//        a. If it matches user.id → return success (idempotent / already claimed).
//        b. Else → 409 CONFLICT, draft already claimed by another account.
//   5. Else (owner_id IS NULL, still anonymous):
//        UPDATE SET owner_id = user.id,
//                   owner_phone = user.phone (if any),
//                   temp_owner_token = NULL (so token can't be reused)
//        WHERE id = draft.id.
//   6. Return the full invitation row so the editor page can restore form state
//      from DB (the authoritative source) instead of localStorage.
export async function POST(request) {
  // SECURITY: Rate limit claim attempts — 10 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `claim-draft:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again.' },
      { status: 429 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tempOwnerToken = String(body?.tempOwnerToken || '').trim();

    if (!tempOwnerToken) {
      return NextResponse.json(
        { error: 'tempOwnerToken is required to claim a draft.', code: 'TOKEN_REQUIRED' },
        { status: 400 },
      );
    }

    // 1. Resolve signed-in user.
    const { user, resolution } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json(
        {
          error: 'Sign in to claim a draft.',
          code: 'AUTH_REQUIRED',
          hint:
            resolution === 'none'
              ? 'Server could not resolve a signed-in user. Ensure cookies are sent or Authorization: Bearer header is attached.'
              : `Resolution path=${resolution} returned null user. Sign out and back in with Google.`,
        },
        { status: 401 },
      );
    }

    // 2. Find the draft row via unique temp_owner_token index.
    const { data: draft, error: findErr } = await supabaseServer
      .from('invitations')
      .select('*')
      .eq('temp_owner_token', tempOwnerToken)
      .maybeSingle();

    if (findErr) throw findErr;

    // SECURITY: Same 404 whether draft doesn't exist or was already claimed.
    // Prevents enumeration of draft tokens.
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft could not be found or has expired.' },
        { status: 404 },
      );
    }

    // 3. Idempotency / conflict checks.
    const ownerId = user.id;
    const ownerPhone = user.phone || user.user_metadata?.phone || null;

    if (draft.owner_id) {
      if (String(draft.owner_id) === String(ownerId)) {
        // Idempotent: already claimed by same user
        return NextResponse.json({
          ok: true,
          claimed: true,
          alreadyClaimed: true,
          invitation: draft,
          ownerId,
        });
      }
      // SECURITY: Return same 404 as missing draft — prevents
      // enumerating who owns a draft token.
      return NextResponse.json(
        { error: 'Draft could not be found or has expired.' },
        { status: 404 },
      );
    }

    // 4. CLAIM: assign owner_id, preserve any user.phone / user.email, clear
    // temp_owner_token so token can never be reused. Also bump status to
    // 'draft' if it was NULL (legacy rows) so dashboard treats it consistently.
    const ownerEmail =
      (user.email && typeof user.email === 'string' ? user.email.trim().toLowerCase() : '') ||
      (user.user_metadata && typeof user.user_metadata.email === 'string'
        ? user.user_metadata.email.trim().toLowerCase()
        : '') ||
      null;

    const patch = {
      owner_id: ownerId,
      ...(ownerPhone ? { owner_phone: ownerPhone } : {}),
      ...(ownerEmail ? { owner_email: ownerEmail } : {}),
      temp_owner_token: null,
      status: draft.status || 'draft',
      claimed_at: new Date().toISOString(),
    };

    let { data: updated, error: upErr } = await supabaseServer
      .from('invitations')
      .update(patch)
      .eq('id', draft.id)
      .select()
      .single();

    // Tier-2 fallback: if claimed_at column doesn't exist in this DB yet
    // (migration not applied), strip it and retry. Claim must never fail
    // just because a metadata column is missing.
    if (upErr && upErr.code === '42703' && /claimed_at/.test(String(upErr.message || ''))) {
      const fallbackPatch = { ...patch };
      delete fallbackPatch.claimed_at;
      const retry = await supabaseServer
        .from('invitations')
        .update(fallbackPatch)
        .eq('id', draft.id)
        .select()
        .single();
      updated = retry.data;
      upErr = retry.error;
    }

    if (upErr) throw upErr;

    return NextResponse.json({
      ok: true,
      claimed: true,
      alreadyClaimed: false,
      invitation: updated,
      ownerId,
      authResolution: resolution,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[claim-draft]', err);
    }
    return NextResponse.json(
      { error: 'Failed to claim draft. Please try again.' },
      { status: 500 },
    );
  }
}
