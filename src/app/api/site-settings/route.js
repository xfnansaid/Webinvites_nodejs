import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG = {
  whatsNew: {
    enabled: true,
    versionTag: 'v2.5',
    title: "What’s New in Web Invites",
    subtitle: 'Latest updates, fixes & enhancements',
    changes: [
      'Fixed & synchronized countdown timers for Modern Navy and Royal Postcard templates.',
      'Enhanced 1-tap Google Maps directions and location pin navigation across all devices.',
      'Optimized mobile performance and high-resolution photo loading.',
      'Added instant WhatsApp RSVP quick confirmation.'
    ],
    buttonText: 'Explore Templates',
    buttonLink: '#templates'
  },
  maintenance: {
    enabled: false,
    title: "We'll Be Right Back!",
    message: "We're making some quick improvements behind the scenes. Everything will be back up and running shortly!",
    estimatedReturn: 'Back in ~15–30 minutes',
    supportWhatsapp: '+91 98460 12345'
  }
};

// In-memory fallback cache in case database table is initializing or unreachable
let memoryConfigCache = { ...DEFAULT_CONFIG };
let lastFetchedAt = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

export async function GET() {
  const now = Date.now();
  if (now - lastFetchedAt < CACHE_TTL_MS && memoryConfigCache) {
    return NextResponse.json({
      success: true,
      config: memoryConfigCache,
      cached: true
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    });
  }

  try {
    const { data, error } = await supabaseServer
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', 'site_config')
      .maybeSingle();

    if (!error && data?.value) {
      memoryConfigCache = {
        whatsNew: { ...DEFAULT_CONFIG.whatsNew, ...(data.value.whatsNew || {}) },
        maintenance: { ...DEFAULT_CONFIG.maintenance, ...(data.value.maintenance || {}) },
        updatedAt: data.updated_at
      };
      lastFetchedAt = now;
    }
  } catch (err) {
    console.warn('[site-settings] Non-fatal DB read fallback:', err?.message || err);
  }

  return NextResponse.json({
    success: true,
    config: memoryConfigCache || DEFAULT_CONFIG
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
    }
  });
}
