import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/site-config-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { config } = await getSiteConfig();

  return NextResponse.json({
    success: true,
    config
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
