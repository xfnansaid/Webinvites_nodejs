import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';
import { resolveSupabaseUser, getSupabaseProjectRef } from '@/lib/auth-server';

// GET /api/user/invitations — returns all invitations owned by the
// currently signed-in user (by owner_id OR owner_phone).
export async function GET(request) {
  const { user } = await resolveSupabaseUser(request);
  if (!user) {
    const ref = getSupabaseProjectRef() || '';
    return NextResponse.json(
      {
        error: 'Sign in to view your invitations.',
        code: 'AUTH_REQUIRED',
        hint: ref
          ? `Expected Supabase session cookie: sb-${ref}-auth-token. Confirm it is sent on localhost (this route reads request.cookies, not browser localStorage).`
          : 'Could not read the Supabase session cookie from your request.',
      },
      { status: 401 },
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
    if (isServiceRoleConfigured()) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    return NextResponse.json({
      invitations: [],
      hint: 'Paste SUPABASE_SERVICE_ROLE_KEY into .env.local to view your saved invitations.',
    });
  }

  return NextResponse.json({
    invitations: data || [],
    count: (data || []).length,
    user: { id: ownerId, phone: ownerPhone, email: user.email || null },
  });
}
