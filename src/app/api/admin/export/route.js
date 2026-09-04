import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function buildCsvRow(fields) {
  return fields.map(escapeCsv).join(',');
}

/**
 * GET /api/admin/export?type=invitations|revenue|traffic
 *
 * Secure admin CSV export endpoint.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-export:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'invitations';
    const todayStr = new Date().toISOString().split('T')[0];

    // ─────────────────────────────────────────────────────────────
    // 1. INVITATIONS EXPORT
    // ─────────────────────────────────────────────────────────────
    if (type === 'invitations') {
      const { data: rows, error } = await supabaseServer
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const headers = [
        'ID',
        'Slug',
        'Groom Name',
        'Bride Name',
        'Template ID',
        'Tier',
        'Status',
        'Is Paid',
        'Paid Date',
        'Event Date',
        'Event Time',
        'Venue',
        'Owner Email',
        'Owner Phone',
        'Edits Used',
        'Photo Attached',
        'Music Track',
        'Payment ID',
        'Created At',
      ];

      const csvLines = [headers.map(escapeCsv).join(',')];

      for (const row of rows || []) {
        const hasPhoto = Boolean(
          row.photo_url ||
          row.template_data?.photoUrl ||
          row.template_data?.heroImage
        );
        const audioTrack = row.template_data?.musicTrack || row.template_data?.audioTrack || 'None';
        const eventDate = row.wedding_date || row.event_date || row.template_data?.weddingDate || '';
        const eventTime = row.wedding_time || row.event_time || row.template_data?.weddingTime || '';
        const venue = row.venue || row.venue_name || row.venue_address || row.template_data?.venue || '';

        csvLines.push(
          buildCsvRow([
            row.id,
            row.slug || '',
            row.groom_name || '',
            row.bride_name || '',
            row.template_id || '',
            row.tier || 'premium',
            row.status || (row.is_paid ? 'paid' : 'draft'),
            row.is_paid ? 'YES' : 'NO',
            row.paid_at || '',
            eventDate,
            eventTime,
            venue,
            row.owner_email || '',
            row.owner_phone || '',
            row.edit_count || 0,
            hasPhoto ? 'YES' : 'NO',
            audioTrack,
            row.razorpay_payment_id || '',
            row.created_at || '',
          ])
        );
      }

      const csvContent = csvLines.join('\r\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="web-invites-invitations-${todayStr}.csv"`,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. REVENUE / TRANSACTIONS EXPORT
    // ─────────────────────────────────────────────────────────────
    if (type === 'revenue') {
      const { data: rows, error } = await supabaseServer
        .from('invitations')
        .select('*')
        .eq('is_paid', true)
        .order('paid_at', { ascending: false });

      if (error) {
        throw error;
      }

      const headers = [
        'ID',
        'Slug',
        'Couple Names',
        'Owner Email',
        'Owner Phone',
        'Tier',
        'Amount (INR)',
        'Payment ID',
        'Order ID',
        'Paid At',
      ];

      const csvLines = [headers.map(escapeCsv).join(',')];

      for (const row of rows || []) {
        const isFree = row.tier === 'free' || (row.razorpay_payment_id && row.razorpay_payment_id.startsWith('free_'));
        const amount = isFree ? 0 : 399;
        const couple = `${row.groom_name || ''} & ${row.bride_name || ''}`.trim();

        csvLines.push(
          buildCsvRow([
            row.id,
            row.slug || '',
            couple,
            row.owner_email || '',
            row.owner_phone || '',
            row.tier || 'premium',
            amount,
            row.razorpay_payment_id || '',
            row.razorpay_order_id || '',
            row.paid_at || '',
          ])
        );
      }

      const csvContent = csvLines.join('\r\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="web-invites-revenue-${todayStr}.csv"`,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. TRAFFIC EXPORT
    // ─────────────────────────────────────────────────────────────
    if (type === 'traffic') {
      const { data: rows, error } = await supabaseServer
        .from('page_views')
        .select('slug, referrer, user_agent, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) {
        throw error;
      }

      const headers = ['Slug', 'Referrer', 'User Agent', 'Viewed At'];
      const csvLines = [headers.map(escapeCsv).join(',')];

      for (const row of rows || []) {
        csvLines.push(
          buildCsvRow([
            row.slug || '',
            row.referrer || 'Direct',
            row.user_agent || '',
            row.created_at || '',
          ])
        );
      }

      const csvContent = csvLines.join('\r\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="web-invites-traffic-${todayStr}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type.' }, { status: 400 });
  } catch (err) {
    console.error('[Admin Export] Error:', err);
    return NextResponse.json({ error: 'Failed to generate export.' }, { status: 500 });
  }
}
