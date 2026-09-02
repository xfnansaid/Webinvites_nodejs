import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/admin/health
 *
 * System health & performance monitoring:
 * - Supabase connectivity + response time
 * - Database table row counts (key tables)
 * - Storage bucket stats
 * - Error rate from page_views (last 24h)
 * - Rate limiter status
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-health:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_CACHE_HEADERS });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403, headers: NO_CACHE_HEADERS });
    }

    const now = new Date();
    const nowTime = now.getTime();
    const checks = {};

    // ── 1. Supabase Connectivity & Latency ───────────────────
    const dbStart = Date.now();
    const { data: pingData, error: pingError } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true });
    const dbLatencyMs = Date.now() - dbStart;

    checks.database = {
      status: pingError ? 'error' : 'healthy',
      latencyMs: dbLatencyMs,
      rating: dbLatencyMs < 200 ? 'excellent' : dbLatencyMs < 500 ? 'good' : dbLatencyMs < 1000 ? 'fair' : 'poor',
      error: pingError?.message || null,
    };

    // ── 2. Storage Bucket Check ──────────────────────────────
    const storageStart = Date.now();
    const { data: bucketFiles, error: bucketError } = await supabaseServer.storage
      .from('invitation-photos')
      .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
    const storageLatencyMs = Date.now() - storageStart;

    checks.storage = {
      status: bucketError ? 'error' : 'healthy',
      latencyMs: storageLatencyMs,
      rating: storageLatencyMs < 300 ? 'excellent' : storageLatencyMs < 800 ? 'good' : 'fair',
      error: bucketError?.message || null,
    };

    // ── 3. Key Table Row Counts ──────────────────────────────
    const tableNames = ['invitations', 'page_views'];
    const tableCounts = {};

    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabaseServer
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        tableCounts[tableName] = error ? { error: error.message } : { count: count || 0 };
      } catch {
        tableCounts[tableName] = { error: 'Table may not exist' };
      }
    }

    // Try optional tables that may or may not exist
    const optionalTables = ['rsvp_responses', 'guest_messages', 'admin_audit_log'];
    for (const tableName of optionalTables) {
      try {
        const { count, error } = await supabaseServer
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        if (!error) {
          tableCounts[tableName] = { count: count || 0 };
        }
      } catch {
        // Table doesn't exist, skip silently
      }
    }

    checks.tables = tableCounts;

    // ── 4. Recent Activity (last 24h) ────────────────────────
    const last24h = new Date(nowTime - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(nowTime - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: viewsLast24h } = await supabaseServer
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h);

    const { count: viewsLast7d } = await supabaseServer
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last7d);

    const { count: newInvites24h } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h);

    const { count: newPremium24h } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .gte('paid_at', last24h);

    checks.activity = {
      viewsLast24h: viewsLast24h || 0,
      viewsLast7d: viewsLast7d || 0,
      newInvites24h: newInvites24h || 0,
      newPremium24h: newPremium24h || 0,
      revenueLast24h: (newPremium24h || 0) * 399,
    };

    // ── 5. Overall System Rating ─────────────────────────────
    const allStatuses = [checks.database.status, checks.storage.status];
    const overallStatus = allStatuses.every(s => s === 'healthy') ? 'healthy'
      : allStatuses.some(s => s === 'error') ? 'degraded'
      : 'warning';

    return NextResponse.json({
      ok: true,
      status: overallStatus,
      timestamp: now.toISOString(),
      checks,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[Admin Health] Exception:', err);
    return NextResponse.json({ error: 'Failed to run health checks.' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
