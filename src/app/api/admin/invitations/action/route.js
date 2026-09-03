import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/invitations/action
 *
 * One-click admin moderation actions:
 * - extend_expiry: Extends free/premium expiry by N days
 * - set_tier: Upgrades to 'premium' or downgrades to 'free'
 * - reset_edits: Resets edit_count to 0 so host can edit again
 * - set_status: Sets status to 'paid', 'draft', or 'archived'
 * - delete: Deletes the invitation record
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-action:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — operator access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, invitationId, days, tier, status } = body;

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId.' }, { status: 400 });
    }

    // Verify invitation exists
    const { data: existing, error: findError } = await supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_paid, paid_at, wedding_date, edit_count, template_data')
      .eq('id', invitationId)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    let updatePayload = { updated_at: new Date().toISOString() };
    let successMessage = 'Action completed successfully.';

    switch (action) {
      case 'extend_expiry': {
        const extendDays = parseInt(days || '7', 10);
        const now = new Date();

        if (existing.tier === 'free') {
          // Free tier expires at paid_at + 21 days.
          // To give it `extendDays` from right now, set paid_at = now - (21 - extendDays) days.
          const newPaidAt = new Date(now.getTime() - (21 - extendDays) * 24 * 60 * 60 * 1000).toISOString();
          updatePayload.paid_at = newPaidAt;
          updatePayload.is_paid = true;
          successMessage = `Extended Free tier expiry by ${extendDays} days.`;
        } else {
          // Premium tier expires at wedding_date + 3 days.
          // If already expired, push wedding_date to (now + extendDays - 3 days).
          const targetDate = new Date(now.getTime() + (extendDays - 3) * 24 * 60 * 60 * 1000);
          updatePayload.wedding_date = targetDate.toISOString().split('T')[0];
          updatePayload.is_paid = true;
          successMessage = `Extended Premium validity by ${extendDays} days.`;
        }
        break;
      }

      case 'set_tier': {
        if (!['free', 'premium'].includes(tier)) {
          return NextResponse.json({ error: 'Invalid tier. Must be "free" or "premium".' }, { status: 400 });
        }
        updatePayload.tier = tier;
        updatePayload.is_ad_supported = tier === 'free';
        // If promoting to premium, ensure paid_at is set
        if (tier === 'premium' && !existing.paid_at) {
          updatePayload.paid_at = new Date().toISOString();
          updatePayload.is_paid = true;
        }
        successMessage = `Tier changed to ${tier.toUpperCase()}.`;
        break;
      }

      case 'reset_edits': {
        const updatedTemplateData = { ...(existing.template_data || {}), _edit_count: 0 };
        updatePayload.edit_count = 0;
        updatePayload.template_data = updatedTemplateData;
        successMessage = 'Host edit count reset to 0 (3 edits restored).';
        break;
      }

      case 'set_status': {
        if (!['paid', 'draft', 'archived'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
        }
        updatePayload.status = status;
        if (status === 'paid') {
          updatePayload.is_paid = true;
          if (!existing.paid_at) updatePayload.paid_at = new Date().toISOString();
        } else if (status === 'draft') {
          updatePayload.is_paid = false;
        }
        successMessage = `Status set to ${status.toUpperCase()}.`;
        break;
      }

      case 'delete': {
        const { error: delError } = await supabaseServer
          .from('invitations')
          .delete()
          .eq('id', invitationId);

        if (delError) {
          console.error('[Admin Action Delete] Error:', delError);
          return NextResponse.json({ error: 'Failed to delete invitation.' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, message: 'Invitation deleted permanently.' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action type.' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseServer
      .from('invitations')
      .update(updatePayload)
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) {
      console.error('[Admin Action Update] Error:', updateError);
      return NextResponse.json({ error: 'Failed to apply update.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: successMessage,
      invitation: updated,
    });
  } catch (err) {
    console.error('[Admin Action] Exception:', err);
    return NextResponse.json({ error: 'Server error processing admin action.' }, { status: 500 });
  }
}
