import React, { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import CheckoutClient from './CheckoutClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Secure Checkout | WEB INVITES',
  description: 'Upgrade your invitation to Premium Ad-Free. Safe, encrypted payment via Razorpay.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage({ searchParams }) {
  const slug = searchParams?.slug || null;
  const invitationId = searchParams?.invitationId || searchParams?.id || null;

  let invitation = null;

  if (slug) {
    const { data } = await supabaseServer
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    invitation = data;
  } else if (invitationId) {
    const { data } = await supabaseServer
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .maybeSingle();
    invitation = data;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-stone-400">Loading Checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutClient
        initialInvitation={invitation}
        searchSlug={slug}
        searchInvitationId={invitationId}
      />
    </Suspense>
  );
}
