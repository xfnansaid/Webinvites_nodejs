import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { supabaseServer } from '@/lib/supabase-server';
import EditClient from '@/components/edit/EditClient';

/**
 * Edit Invitation — Server Component (SSR).
 *
 * Reads the Supabase auth cookie, fetches the invitation directly from the
 * database at request time, and passes everything to EditClient.
 * The user sees their invitation INSTANTLY — no skeleton, no loading spinner,
 * no client-side waterfall.
 *
 * If the cookie is missing → redirect to /signin.
 * If the invitation doesn't exist or user lacks access → 404.
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function EditPage({ params }) {
  const { id: invitationId } = params;

  if (!invitationId) {
    notFound();
  }

  // 1. Read auth cookie from the incoming request
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

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
    redirect(`/signin?next=${encodeURIComponent(`/edit/${invitationId}`)}`);
  }

  // 3. Fetch invitation directly from Supabase
  const { data: invitation, error } = await supabaseServer
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .maybeSingle();

  // 4. Not found or DB error → 404
  if (error || !invitation) {
    notFound();
  }

  // 5. Ownership check: owner_id OR owner_phone OR owner_email
  const userEmail = user?.email?.trim?.().toLowerCase?.()
    || user?.user_metadata?.email?.trim?.().toLowerCase?.()
    || null;

  const isOwner = invitation.owner_id && String(invitation.owner_id) === String(user.id);
  const isPhoneOwner = user.phone && invitation.owner_phone === user.phone;
  const isEmailOwner = userEmail && invitation.owner_email && invitation.owner_email.toLowerCase() === userEmail;

  // Allow access if owner OR if invitation is paid (anyone with the link can view)
  if (!isOwner && !isPhoneOwner && !isEmailOwner && !invitation.is_paid) {
    notFound();
  }

  // 6. Pass server-fetched data to the client component
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </main>
    }>
      <EditClient
        initialInvitation={invitation}
        invitationId={invitationId}
      />
    </Suspense>
  );
}
