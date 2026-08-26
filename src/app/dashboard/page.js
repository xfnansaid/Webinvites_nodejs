import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { supabaseServer } from '@/lib/supabase-server';
import DashboardClient from '@/components/dashboard/DashboardClient';

/**
 * Dashboard — Server Component (SSR).
 *
 * Reads the Supabase auth cookie, fetches invitations directly from the
 * database at request time, and passes everything to DashboardClient.
 * The user sees their invitations INSTANTLY — no skeleton, no loading
 * spinner, no client-side waterfall.
 *
 * If the cookie is missing or invalid → redirect to /signin.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  // 1. Read auth cookie from the incoming request
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  // Build a minimal Request-like object so resolveSupabaseUser can read cookies
  const fakeRequest = {
    headers: {
      get: (name) => {
        if (name === 'cookie') return cookieHeader;
        return null;
      },
    },
  };

  const { user } = await resolveSupabaseUser(fakeRequest);

  // 2. No valid session → redirect to sign-in
  if (!user) {
    redirect('/signin?next=/dashboard');
  }

  // 3. Fetch invitations directly from Supabase (no API route needed)
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const ownerId = user.id;
  const ownerPhone = user.phone || user?.user_metadata?.phone || '';
  const ownerFilter = `owner_id.eq.${ownerId}${ownerPhone ? `,owner_phone.eq.${encodeURIComponent(ownerPhone)}` : ''}`;

  const { data: invites, error, count: totalCount } = await supabaseServer
    .from('invitations')
    .select('*', { count: 'exact' })
    .or(ownerFilter)
    .order('created_at', { ascending: false })
    .range(from, to);

  // Graceful error: pass empty data to client (it will show empty state)
  const safeInvites = error ? [] : (invites || []);
  const safeTotal = error ? 0 : (totalCount || 0);

  // Count published
  const { count: publishedCount } = await supabaseServer
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .or(ownerFilter)
    .eq('is_paid', true);

  const totalPages = Math.ceil(safeTotal / limit);

  // 4. Pass server-fetched data to the client component
  return (
    <DashboardClient
      initialInvites={safeInvites}
      initialTotalCount={safeTotal}
      initialPublishedCount={publishedCount || 0}
      initialPagination={{
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      }}
    />
  );
}
