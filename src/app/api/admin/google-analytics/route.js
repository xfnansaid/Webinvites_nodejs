import { NextResponse } from 'next/server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { fetchGA4Analytics } from '@/lib/google-analytics-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * Parses Google Service Account credentials from environment variables.
 */
function getCredentials() {
  const propertyId =
    process.env.GA4_PROPERTY_ID ||
    process.env.GA_PROPERTY_ID ||
    process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ||
    null;

  // Option 1: Full JSON string in env var
  const jsonStr =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GA_SERVICE_ACCOUNT_JSON ||
    null;

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        propertyId,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch {
      // Ignore JSON parse error and fallback to individual vars
    }
  }

  // Option 2: Individual env vars
  const clientEmail =
    process.env.GA_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    null;

  const privateKey =
    process.env.GA_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY ||
    null;

  return { propertyId, clientEmail, privateKey };
}

/**
 * GET /api/admin/google-analytics
 *
 * Secure admin endpoint to fetch real-time and 30-day Google Analytics 4 reports.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-ga:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_CACHE_HEADERS });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { propertyId, clientEmail, privateKey } = getCredentials();

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          ok: true,
          connected: false,
          measurementId: 'G-BPNYZQ4PHZ',
          status: 'unconfigured',
          missing: {
            propertyId: !propertyId,
            clientEmail: !clientEmail,
            privateKey: !privateKey,
          },
          setupGuide: {
            step1: 'Enable Google Analytics Data API in Google Cloud Console.',
            step2: 'Create a Service Account and download the JSON key.',
            step3: 'Add Service Account email as Viewer in GA4 Admin → Property Access Management.',
            step4: 'Add GA4_PROPERTY_ID, GA_CLIENT_EMAIL, and GA_PRIVATE_KEY to your environment variables.',
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const analytics = await fetchGA4Analytics({
      propertyId,
      clientEmail,
      privateKey,
    });

    return NextResponse.json(
      {
        ok: true,
        ...analytics,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('[Admin Google Analytics API] Error:', err);
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: err.message || 'Failed to fetch Google Analytics data.',
        measurementId: 'G-BPNYZQ4PHZ',
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
