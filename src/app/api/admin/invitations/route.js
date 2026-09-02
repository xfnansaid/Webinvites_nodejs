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
 * GET /api/admin/invitations
 *
 * Paginated, searchable, filterable invitations list for Admin Command Center.
 * Bulletproof schema handling: uses select('*') to prevent 42703 column errors.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-invites:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_CACHE_HEADERS });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403, headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '15', 10)));
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const tier = searchParams.get('tier') || 'all'; // 'all' | 'free' | 'premium'
    const status = searchParams.get('status') || 'all'; // 'all' | 'paid' | 'draft' | 'archived'
    const templateId = searchParams.get('template') || 'all';
    const expiry = searchParams.get('expiry') || 'all'; // 'all' | 'active' | 'expiring_soon' | 'expired'
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc';

    const offset = (page - 1) * limit;

    // Use select('*') so no query fails if minor column differences exist
    let query = supabaseServer
      .from('invitations')
      .select('*', { count: 'exact' });

    // Apply Tier Filter
    if (tier === 'free') {
      query = query.or('tier.eq.free,is_ad_supported.eq.true');
    } else if (tier === 'premium') {
      query = query.or('tier.eq.premium,is_ad_supported.eq.false,razorpay_payment_id.ilike.pay_%');
    }

    // Apply Status Filter
    if (status === 'paid') {
      query = query.eq('is_paid', true);
    } else if (status === 'draft') {
      query = query.eq('is_paid', false);
    } else if (status === 'archived') {
      query = query.eq('status', 'archived');
    }

    // Apply Template Filter
    if (templateId && templateId !== 'all') {
      query = query.eq('template_id', templateId);
    }

    // Apply Search Filter across all relevant text columns
    if (search) {
      const cleanSearch = search.replace(/[%_,]/g, ' ').trim();
      if (cleanSearch) {
        query = query.or(
          `slug.ilike.%${cleanSearch}%,groom_name.ilike.%${cleanSearch}%,bride_name.ilike.%${cleanSearch}%,owner_email.ilike.%${cleanSearch}%,venue.ilike.%${cleanSearch}%,template_id.ilike.%${cleanSearch}%`
        );
      }
    }

    // Apply Sorting safely
    const allowedSortCols = ['created_at', 'paid_at', 'wedding_date', 'event_date', 'edit_count', 'updated_at'];
    const validSortCol = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(validSortCol, { ascending: sortOrder, nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;

    if (error) {
      console.error('[Admin Invitations] Supabase query error:', error.message, error.code, error.details);
      // Fallback: If ordering by specific column caused an issue, retry with standard created_at
      const fallbackQuery = await supabaseServer
        .from('invitations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fallbackQuery.error) {
        return NextResponse.json({
          ok: false,
          error: `Database query failed: ${fallbackQuery.error.message}`,
          invitations: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        }, { status: 500, headers: NO_CACHE_HEADERS });
      }

      return formatResponse(fallbackQuery.data, fallbackQuery.count, page, limit, expiry);
    }

    return formatResponse(rows, count, page, limit, expiry);
  } catch (err) {
    console.error('[Admin Invitations GET] Exception:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Server error processing request.',
      invitations: [],
      pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
    }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

function formatResponse(rows, count, page, limit, expiryFilter) {
  const nowTime = Date.now();

  const invitations = (rows || []).map((row) => {
    const isPaid = !!row.is_paid;
    const isFree = row.tier === 'free' || (row.is_ad_supported !== false && row.tier !== 'premium');
    const resolvedTier = row.tier || (row.is_ad_supported !== false ? 'free' : 'premium');
    const eventDate = row.wedding_date || row.event_date || row.template_data?.weddingDate || row.template_data?.eventDate || null;
    const weddingTime = row.wedding_time || row.event_time || row.template_data?.weddingTime || row.template_data?.eventTime || null;
    const venue = row.venue || row.venue_name || row.venue_address || row.template_data?.venue || '—';
    const venueAddress = row.venue_address || row.template_data?.venueAddress || row.venue || '';
    const mapsUrl = row.maps_url || row.template_data?.mapsUrl || null;
    const whatsappNumber = row.whatsapp_number || row.template_data?.whatsappNumber || null;
    const groomParents = row.groom_parents || row.template_data?.groomParents || null;
    const brideParents = row.bride_parents || row.template_data?.brideParents || null;
    const heroTagline = row.hero_tagline || row.template_data?.heroTagline || null;
    const heroEventText = row.hero_event_text || row.template_data?.heroEventText || null;
    const countdownTitle = row.countdown_title || row.template_data?.countdownTitle || null;
    const paidAt = row.paid_at || null;

    let isExpired = false;
    let isExpiringSoon = false;
    let daysRemaining = null;
    let expiryDate = null;

    if (isPaid) {
      if (isFree && paidAt) {
        const paidTime = new Date(paidAt).getTime();
        if (!Number.isNaN(paidTime)) {
          const expireTime = paidTime + 21 * 24 * 60 * 60 * 1000;
          expiryDate = new Date(expireTime).toISOString();
          const diffDays = Math.ceil((expireTime - nowTime) / (24 * 60 * 60 * 1000));
          daysRemaining = diffDays;
          if (diffDays <= 0) {
            isExpired = true;
          } else if (diffDays <= 3) {
            isExpiringSoon = true;
          }
        }
      } else if (!isFree && eventDate) {
        const [y, m, d] = String(eventDate).split('-').map(Number);
        if (y && m && d) {
          const eventTime = new Date(Date.UTC(y, m - 1, d)).getTime();
          const expireTime = eventTime + 3 * 24 * 60 * 60 * 1000;
          expiryDate = new Date(expireTime).toISOString();
          const diffDays = Math.ceil((expireTime - nowTime) / (24 * 60 * 60 * 1000));
          daysRemaining = diffDays;
          if (diffDays <= 0) {
            isExpired = true;
          } else if (diffDays <= 3) {
            isExpiringSoon = true;
          }
        }
      }
    }

    const resolvedPhotoUrl =
      row.photo_url ||
      row.template_data?.photoUrl ||
      row.template_data?.heroImage ||
      row.template_data?.couplePhoto ||
      null;

    const hasPhoto = Boolean(resolvedPhotoUrl);
    const audioTrack = row.template_data?.musicTrack || row.template_data?.audioTrack || null;

    return {
      id: row.id,
      slug: row.slug || `invite-${row.id}`,
      templateId: row.template_id || 'standard-crimson',
      groomName: row.groom_name || row.template_data?.groomName || 'Celebrant',
      brideName: row.bride_name || row.template_data?.brideName || '',
      eventDate,
      weddingTime,
      venue,
      venueAddress,
      mapsUrl,
      whatsappNumber,
      groomParents,
      brideParents,
      heroTagline,
      heroEventText,
      countdownTitle,
      photoUrl: resolvedPhotoUrl,
      templateData: row.template_data || {},
      isPaid,
      tier: resolvedTier,
      isAdSupported: row.is_ad_supported !== false && resolvedTier !== 'premium',
      status: row.status || (isPaid ? 'paid' : 'draft'),
      editCount: typeof row.edit_count === 'number' ? row.edit_count : (Number(row.template_data?._edit_count) || 0),
      ownerId: row.owner_id || null,
      ownerEmail: row.owner_email || null,
      ownerPhone: row.owner_phone || null,
      paidAt: row.paid_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      hasPhoto,
      audioTrack,
      isExpired,
      isExpiringSoon,
      daysRemaining,
      expiryDate,
    };
  });

  let filteredInvitations = invitations;
  if (expiryFilter === 'expired') {
    filteredInvitations = invitations.filter((inv) => inv.isExpired);
  } else if (expiryFilter === 'expiring_soon') {
    filteredInvitations = invitations.filter((inv) => inv.isExpiringSoon);
  } else if (expiryFilter === 'active') {
    filteredInvitations = invitations.filter((inv) => inv.isPaid && !inv.isExpired);
  }

  const total = count !== null && count !== undefined ? count : filteredInvitations.length;

  return NextResponse.json({
    ok: true,
    invitations: filteredInvitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }, { headers: NO_CACHE_HEADERS });
}
