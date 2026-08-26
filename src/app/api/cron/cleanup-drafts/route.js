import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Next.js API Route for deleting unpaid drafts older than 24 hours (1 day)
// Can be triggered manually, by Vercel Cron, or an external cron service.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // SECURITY: CRON_SECRET is required — fail closed if not configured.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'Cron secret not configured on server.' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate cutoff timestamp (24 hours = 1 day ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from('invitations')
      .delete()
      .eq('is_paid', false)
      .lt('created_at', cutoffTime)
      .select('id, slug, created_at');

    if (error) {
      console.error('[Cron Cleanup Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = data ? data.length : 0;
    console.log(`[Cron Cleanup]: Successfully deleted ${deletedCount} unpaid draft(s) older than 1 day.`);

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffTime,
      deletedDrafts: data || [],
    });
  } catch (err) {
    console.error('[Cron Cleanup Exception]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
