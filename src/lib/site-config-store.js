// Shared server-side configuration store with Supabase sync and instant fallback
import { supabaseServer } from '@/lib/supabase-server';

export const DEFAULT_SITE_CONFIG = {
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

// Global in-memory cache shared across API routes in this Node process
// Using globalThis so Next.js HMR or module isolation doesn't split the state
const GLOBAL_STORE_KEY = '__WEB_INVITES_SITE_CONFIG__';

if (!globalThis[GLOBAL_STORE_KEY]) {
  globalThis[GLOBAL_STORE_KEY] = {
    config: { ...DEFAULT_SITE_CONFIG },
    lastFetchedAt: 0,
    hasDbTable: true
  };
}

const store = globalThis[GLOBAL_STORE_KEY];

export async function getSiteConfig({ forceFresh = false } = {}) {
  const now = Date.now();
  // Fast cache: 5 seconds
  if (!forceFresh && now - store.lastFetchedAt < 5000 && store.config) {
    return {
      config: store.config,
      needsMigration: !store.hasDbTable
    };
  }

  try {
    const { data, error } = await supabaseServer
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', 'site_config')
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        store.hasDbTable = false;
      }
      return {
        config: store.config || DEFAULT_SITE_CONFIG,
        needsMigration: !store.hasDbTable
      };
    }

    store.hasDbTable = true;
    if (data?.value) {
      store.config = {
        whatsNew: { ...DEFAULT_SITE_CONFIG.whatsNew, ...(data.value.whatsNew || {}) },
        maintenance: { ...DEFAULT_SITE_CONFIG.maintenance, ...(data.value.maintenance || {}) }
      };
      store.lastFetchedAt = now;
    }
  } catch (err) {
    // Return memory store
  }

  return {
    config: store.config || DEFAULT_SITE_CONFIG,
    needsMigration: !store.hasDbTable
  };
}

export async function setSiteConfig(newConfig) {
  const sanitized = {
    whatsNew: {
      enabled: Boolean(newConfig?.whatsNew?.enabled),
      versionTag: String(newConfig?.whatsNew?.versionTag || 'v2.5').trim(),
      title: String(newConfig?.whatsNew?.title || DEFAULT_SITE_CONFIG.whatsNew.title).trim(),
      subtitle: String(newConfig?.whatsNew?.subtitle || DEFAULT_SITE_CONFIG.whatsNew.subtitle).trim(),
      changes: Array.isArray(newConfig?.whatsNew?.changes)
        ? newConfig.whatsNew.changes.map(s => String(s).trim()).filter(Boolean)
        : DEFAULT_SITE_CONFIG.whatsNew.changes,
      buttonText: String(newConfig?.whatsNew?.buttonText || 'Explore Templates').trim(),
      buttonLink: String(newConfig?.whatsNew?.buttonLink || '#templates').trim()
    },
    maintenance: {
      enabled: Boolean(newConfig?.maintenance?.enabled),
      title: String(newConfig?.maintenance?.title || DEFAULT_SITE_CONFIG.maintenance.title).trim(),
      message: String(newConfig?.maintenance?.message || DEFAULT_SITE_CONFIG.maintenance.message).trim(),
      estimatedReturn: String(newConfig?.maintenance?.estimatedReturn || DEFAULT_SITE_CONFIG.maintenance.estimatedReturn).trim(),
      supportWhatsapp: String(newConfig?.maintenance?.supportWhatsapp || DEFAULT_SITE_CONFIG.maintenance.supportWhatsapp).trim()
    }
  };

  // Update in-memory store immediately so all subsequent queries reflect this state instantly
  store.config = sanitized;
  store.lastFetchedAt = Date.now();

  let dbError = null;
  try {
    const { error: upsertError } = await supabaseServer
      .from('site_settings')
      .upsert({
        key: 'site_config',
        value: sanitized,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (upsertError) {
      dbError = upsertError;
      if (upsertError.code === '42P01' || upsertError.message?.includes('does not exist')) {
        store.hasDbTable = false;
      }
    } else {
      store.hasDbTable = true;
    }
  } catch (err) {
    dbError = err;
  }

  return {
    success: true,
    config: sanitized,
    dbSaved: !dbError,
    dbError: dbError?.message || null,
    needsMigration: !store.hasDbTable
  };
}
