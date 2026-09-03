import { NextResponse } from 'next/server';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';

// GET /api/user/invitations — returns paginated invitations owned by the
// currently signed-in user (by owner_id OR owner_phone).
//
// Query params:
//   page  — 1-indexed page number (default 1)
//   limit — items per page (default 20, max 100)
//
// Response includes:
//   invitations  — array for the requested page
//   totalCount   — total matching rows (for summary cards)
//   publishedCount — how many are paid (for summary cards)
//   pagination   — { page, limit, totalPages, hasMore, nextCursor }
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request) {
  const { user } = await resolveSupabaseUser(request);
  // SECURITY: Generic auth error — no architecture details leaked.
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to view your invitations.' },
      { status: 401 },
    );
  }

  const ownerId = user.id;
  const ownerPhone = user.phone || user.user_metadata?.phone || '';

  // Parse pagination params
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit'), 10) || DEFAULT_LIMIT));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const ownerFilter = `owner_id.eq.${ownerId}${ownerPhone ? `,owner_phone.eq.${encodeURIComponent(ownerPhone)}` : ''}`;

  // Proactively clean up any unpaid drafts older than 24 hours (1 day) in background
  const oneDayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  supabaseServer
    .from('invitations')
    .delete()
    .eq('is_paid', false)
    .lt('created_at', oneDayCutoff)
    .then(() => {})
    .catch(() => {});

  // Fetch the current page of invitations
  const { data, error, count } = await supabaseServer
    .from('invitations')
    .select('*', { count: 'exact' })
    .or(ownerFilter)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[user/invitations] DB error:', error.message, error.code);
    }
    // SECURITY: Never expose DB error codes. Return empty data gracefully.
    return NextResponse.json({
      invitations: [],
      totalCount: 0,
      publishedCount: 0,
      pagination: { page: 1, limit, totalPages: 0, hasMore: false },
    });
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = page < totalPages;

  // Count published invitations (separate lightweight query)
  const { count: publishedCount } = await supabaseServer
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .or(ownerFilter)
    .eq('is_paid', true);

  return NextResponse.json({
    invitations: data || [],
    totalCount,
    publishedCount: publishedCount || 0,
    pagination: {
      page,
      limit,
      totalPages,
      hasMore,
    },
    user: { id: ownerId, phone: ownerPhone, email: user.email || null },
  });
}
