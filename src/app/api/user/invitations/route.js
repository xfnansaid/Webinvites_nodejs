import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';

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
    console.warn('[user-invitations] resolveCurrentUser failed:', e?.message || e);
    return null;
  }
}

// GET /api/user/invitations — returns all invitations owned by the
// currently signed-in user (by owner_id OR owner_phone).
export async function GET(request) {
  const user = await resolveCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to view your invitations.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const ownerId = user.id;
  const ownerPhone = user.phone || user.user_metadata?.phone || '';

  // Build the OR query: owner_id = uid OR owner_phone = phone
  const { data, error } = await supabaseServer
    .from('invitations')
    .select('*')
    .or(`owner_id.eq.${ownerId}${ownerPhone ? `,owner_phone.eq.${encodeURIComponent(ownerPhone)}` : ''}`)
    .order('created_at', { ascending: false });

  if (error) {
    // If service role isn't configured and the OR query fails on RLS, fall back
    // to a known-good fallback that lists nothing.
    if (isServiceRoleConfigured()) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ invitations: [], hint: 'Paste SUPABASE_SERVICE_ROLE_KEY into .env.local to view your saved invitations.' });
  }

  return NextResponse.json({
    invitations: data || [],
    count: (data || []).length,
    user: { id: ownerId, phone: ownerPhone, email: user.email || null },
  });
}
