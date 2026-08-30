import { NextResponse } from 'next/server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';

// Lightweight endpoint to check if the currently signed-in user is an admin.
// Returns { isAdmin: true/false } — used by the client to show admin-only
// UI elements without exposing admin email addresses in the JS bundle.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json({ isAdmin: false });
    }
    return NextResponse.json({ isAdmin: isAdminUser(user) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
