import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

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

export async function GET(request) {
  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — administrator access required.' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', 'site_config')
      .maybeSingle();

    if (error) {
      // If table does not exist, return defaults gracefully
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
        needsMigration: error.code === '42P01' || error.message?.includes('does not exist')
      });
    }

    const config = data?.value ? {
      whatsNew: { ...DEFAULT_CONFIG.whatsNew, ...(data.value.whatsNew || {}) },
      maintenance: { ...DEFAULT_CONFIG.maintenance, ...(data.value.maintenance || {}) },
      updatedAt: data.updated_at
    } : DEFAULT_CONFIG;

    return NextResponse.json({
      success: true,
      config,
      needsMigration: false
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

    const body = await request.json();
    const { whatsNew, maintenance } = body;

    const newConfig = {
      whatsNew: {
        enabled: Boolean(whatsNew?.enabled),
        versionTag: String(whatsNew?.versionTag || 'v2.5').trim(),
        title: String(whatsNew?.title || DEFAULT_CONFIG.whatsNew.title).trim(),
        subtitle: String(whatsNew?.subtitle || DEFAULT_CONFIG.whatsNew.subtitle).trim(),
        changes: Array.isArray(whatsNew?.changes) ? whatsNew.changes.map(s => String(s).trim()).filter(Boolean) : DEFAULT_CONFIG.whatsNew.changes,
        buttonText: String(whatsNew?.buttonText || 'Explore Templates').trim(),
        buttonLink: String(whatsNew?.buttonLink || '#templates').trim(),
      },
      maintenance: {
        enabled: Boolean(maintenance?.enabled),
        title: String(maintenance?.title || DEFAULT_CONFIG.maintenance.title).trim(),
        message: String(maintenance?.message || DEFAULT_CONFIG.maintenance.message).trim(),
        estimatedReturn: String(maintenance?.estimatedReturn || DEFAULT_CONFIG.maintenance.estimatedReturn).trim(),
        supportWhatsapp: String(maintenance?.supportWhatsapp || DEFAULT_CONFIG.maintenance.supportWhatsapp).trim(),
      }
    };

    const { error: upsertError } = await supabaseServer
      .from('site_settings')
      .upsert({
        key: 'site_config',
        value: newConfig,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (upsertError) {
      console.warn('[admin/site-settings] Upsert error:', upsertError);
      return NextResponse.json({
        error: `Database save failed: ${upsertError.message}. Make sure to run the migration if the table is missing.`,
        needsMigration: upsertError.code === '42P01' || upsertError.message?.includes('does not exist')
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Site settings updated successfully.',
      config: newConfig
    });
  } catch (err) {
    console.error('[admin/site-settings] POST error:', err);
    return NextResponse.json({ error: 'Internal server error while saving settings.' }, { status: 500 });
  }
}
