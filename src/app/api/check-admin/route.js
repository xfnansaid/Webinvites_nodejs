import { NextResponse } from 'next/server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!request) {
      return NextResponse.json({ isAdmin: false });
    }
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json({ isAdmin: false });
    }
    return NextResponse.json({ isAdmin: !!isAdminUser(user) });
  } catch (err) {
    console.warn('[check-admin] exception:', err?.message || err);
    return NextResponse.json({ isAdmin: false });
  }
}
