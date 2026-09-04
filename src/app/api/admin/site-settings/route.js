import { NextResponse } from 'next/server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSiteConfig, setSiteConfig } from '@/lib/site-config-store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — administrator access required.' }, { status: 403 });
    }

    const { config, needsMigration } = await getSiteConfig({ forceFresh: true });

    return NextResponse.json({
      success: true,
      config,
      needsMigration
    });
  } catch (err) {
    console.error('[admin/site-settings] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-site-settings:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — administrator access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await setSiteConfig(body);

    return NextResponse.json({
      success: true,
      message: 'Site settings updated successfully.',
      config: result.config,
      dbSaved: result.dbSaved,
      needsMigration: result.needsMigration
    });
  } catch (err) {
    console.error('[admin/site-settings] POST error:', err);
    return NextResponse.json({ error: 'Internal server error while saving settings.' }, { status: 500 });
  }
}
