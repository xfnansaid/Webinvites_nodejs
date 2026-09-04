import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'afnansaleem050@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'minimax/minimax-01';

/**
 * Gathers aggregated website metrics, template distribution, and revenue stats
 * to provide real context to the OpenRouter AI model.
 */
async function gatherBusinessMetrics() {
  try {
    // 1. Fetch all invitations (metadata only for speed)
    const { data: invitations, error } = await supabaseServer
      .from('invitations')
      .select('id, slug, template_id, tier, is_paid, is_ad_supported, status, created_at, paid_at, wedding_date, venue, owner_email, template_data')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const total = invitations?.length || 0;
    const paidInvites = (invitations || []).filter((i) => i.is_paid || i.tier === 'premium' || i.is_ad_supported === false);
    const freeInvites = (invitations || []).filter((i) => i.tier === 'free' || (i.is_paid && i.is_ad_supported !== false));
    const draftInvites = (invitations || []).filter((i) => !i.is_paid && i.status === 'draft');

    // Template popularity breakdown
    const templateCounts = {};
    const templatePaidCounts = {};
    const eventTypeCounts = { wedding: 0, birthday: 0, housewarming: 0, other: 0 };

    (invitations || []).forEach((inv) => {
      const tid = inv.template_id || 'unknown';
      templateCounts[tid] = (templateCounts[tid] || 0) + 1;
      if (inv.is_paid) {
        templatePaidCounts[tid] = (templatePaidCounts[tid] || 0) + 1;
      }

      if (tid.startsWith('birthday-')) eventTypeCounts.birthday += 1;
      else if (tid.startsWith('housewarming-')) eventTypeCounts.housewarming += 1;
      else eventTypeCounts.wedding += 1;
    });

    // Sort templates by popularity
    const sortedTemplates = Object.entries(templateCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        templateId: id,
        totalCreated: count,
        paidCount: templatePaidCounts[id] || 0,
        paidConversionRate: count > 0 ? ((templatePaidCounts[id] || 0) / count * 100).toFixed(1) + '%' : '0%',
      }));

    // Recent 7 days activity
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recent7Days = (invitations || []).filter((i) => i.created_at >= sevenDaysAgo);

    return {
      totalInvitations: total,
      paidPublishedCount: paidInvites.length,
      freePublishedCount: freeInvites.length,
      draftCount: draftInvites.length,
      paidConversionRate: total > 0 ? ((paidInvites.length / total) * 100).toFixed(1) + '%' : '0%',
      newInLast7Days: recent7Days.length,
      eventTypes: eventTypeCounts,
      topTemplates: sortedTemplates.slice(0, 10),
      leastUsedTemplates: sortedTemplates.slice(-5).reverse(),
      sampleVenues: (invitations || []).map((i) => i.venue).filter(Boolean).slice(0, 15),
    };
  } catch (err) {
    console.warn('[ai-insights] Metrics gather fallback:', err?.message || err);
    return { error: 'Partial data available', summary: 'Metrics could not be fully aggregated.' };
  }
}

/**
 * POST /api/admin/ai-insights
 * OpenRouter MiniMax AI Model Integration for Website Analysis
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-ai:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    // 1. Authenticate Admin
    const { user } = await resolveSupabaseUser(request);
    const userEmail = (user?.email || user?.user_metadata?.email || '').trim().toLowerCase();
    const isAdmin = Boolean(user && userEmail && ADMIN_EMAILS.includes(userEmail));

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const userPrompt = String(body.prompt || '').trim();
    const customApiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : null;
    const requestedModel = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;

    // Use API Key from env var or admin input
    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenRouter API Key is missing. Please provide your OPENROUTER_API_KEY in .env.local or enter it in the Admin Console.',
        code: 'API_KEY_REQUIRED',
      }, { status: 400 });
    }

    // 2. Fetch live metrics
    const metrics = await gatherBusinessMetrics();

    // 3. Construct System & User Prompt
    const systemPrompt = `You are the Chief Business & Growth Intelligence AI for Web Invites (webinvites.shop), a digital wedding, birthday, and housewarming invitation platform in India.
Your mission is to analyze platform telemetry, identify customer trends, pinpoint friction points, and deliver direct, actionable growth strategies.

STRICT FORMATTING AND TONE RULES:
- Reply ONLY with useful, data-backed insights, clear bullet points, and high-impact conclusions.
- NO conversational filler, NO introductory greetings ("Hello!", "Sure, I can help with that"), NO outro ("Hope this helps!").
- Nothing more, nothing less. Every line must deliver direct business value.
- Use clear Markdown formatting with bold key terms, ranked lists, and structured sections:
  1. 📊 Key Telemetry Takeaway
  2. 🏆 Template Popularity & Customer Love (What people love & why)
  3. ⚠️ Bottlenecks & Drop-off Points
  4. 🚀 High-Priority Growth Actions (Design ideas, pricing, conversion tweaks)`;

    const defaultQuestion = 'Provide a comprehensive analysis of our website traffic, template popularity, customer preferences, and high-impact recommendations to increase paid conversions.';
    const finalPrompt = userPrompt || defaultQuestion;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Here is the current live platform telemetry data for Web Invites:
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

Admin Query:
${finalPrompt}`,
      },
    ];

    // 4. Call OpenRouter API via native fetch
    const openRouterRes = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://www.webinvites.shop',
        'X-Title': 'Web Invites Admin Intelligence',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: requestedModel,
        messages,
        temperature: 0.25,
        max_tokens: 1500,
      }),
    });

    const aiData = await openRouterRes.json().catch(() => ({}));

    if (!openRouterRes.ok || aiData.error) {
      const errorMsg = aiData?.error?.message || aiData?.error || `OpenRouter responded with status ${openRouterRes.status}`;
      return NextResponse.json({
        error: `AI Model Error: ${errorMsg}`,
        code: 'AI_PROVIDER_ERROR',
        details: aiData,
      }, { status: 502 });
    }

    const aiContent = aiData?.choices?.[0]?.message?.content || 'No insights generated.';

    return NextResponse.json({
      success: true,
      modelUsed: requestedModel,
      metricsSnapshot: metrics,
      insights: aiContent,
      usage: aiData.usage || null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ai-insights] Exception:', err);
    return NextResponse.json({
      error: err.message || 'An unexpected error occurred while communicating with the AI model.',
    }, { status: 500 });
  }
}
