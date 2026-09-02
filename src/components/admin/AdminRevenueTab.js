'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Crown,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  RefreshCw,
  Target,
  Zap,
  BarChart3,
  RefreshCw as RefreshIcon,
  TrendingDown,
  Minus,
} from 'lucide-react';

function FunnelBar({ label, count, total, color, icon: Icon }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-700 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          {label}
        </span>
        <span className="font-extrabold text-[var(--ink)]">{count.toLocaleString()} <span className="text-gray-400 font-semibold">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <div className={`${colors[color]} h-4 rounded-full transition-all flex items-center justify-end pr-2`}
          style={{ width: `${Math.max(pct, 2)}%` }}>
          {pct > 15 && <span className="text-[9px] font-bold text-white">{pct}%</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenueTab({ data, refreshTrigger }) {
  const [intelData, setIntelData] = useState(null);
  const [loadingIntel, setLoadingIntel] = useState(true);

  const revenue = data?.revenue || {};
  const stats = data?.stats || {};
  const transactions = data?.recentTransactions || [];

  const fetchIntel = useCallback(async () => {
    setLoadingIntel(true);
    try {
      const res = await fetch(`/api/admin/revenue-intelligence?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const json = await res.json();
      if (json.ok) setIntelData(json);
    } catch (err) {
      console.error('[AdminRevenueTab] Intel fetch error:', err);
    } finally {
      setLoadingIntel(false);
    }
  }, []);

  useEffect(() => { fetchIntel(); }, [fetchIntel]);
  useEffect(() => { if (refreshTrigger) fetchIntel(); }, [refreshTrigger, fetchIntel]);

  const funnel = intelData?.funnel || {};
  const projection = intelData?.projection || {};
  const revByTemplate = intelData?.revenueByTemplate || [];
  const cohorts = intelData?.cohorts || [];

  // Cohort chart
  const maxCohortRev = Math.max(...cohorts.map(c => c.revenue || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-2">
            ₹{(revenue.estimatedTotal || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Lifetime across {revenue.paidPremiumCount || 0} orders
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Last 30 Days</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            ₹{(revenue.recentRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-semibold">
            {revenue.recentUpgradesCount || 0} upgrades recently
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Upgrade Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">
            {revenue.conversionRate || 0}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {stats.premium || 0} of {stats.published || 0} published
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">ARPU</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">
            ₹{intelData?.arpu || 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Avg revenue per paid user
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              Conversion Funnel
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">User journey from creation to premium upgrade</p>
          </div>
          {loadingIntel && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>
        <div className="space-y-4">
          <FunnelBar label="Created (all time)" count={funnel.created || 0} total={funnel.created || 1} color="emerald" icon={Sparkles} />
          <FunnelBar label="Published (paid/free)" count={funnel.published || 0} total={funnel.created || 1} color="blue" icon={CheckCircle2} />
          <FunnelBar label="Viewed by guests" count={funnel.viewed || 0} total={funnel.created || 1} color="amber" icon={Target} />
          <FunnelBar label="Premium upgrades" count={funnel.premium || 0} total={funnel.created || 1} color="purple" icon={Crown} />
        </div>
        {/* Drop-off annotations */}
        {funnel.created > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span>Publish rate: <strong className="text-gray-800">{funnel.created > 0 ? Math.round((funnel.published / funnel.created) * 100) : 0}%</strong></span>
            <span>View rate: <strong className="text-gray-800">{funnel.published > 0 ? Math.round((funnel.viewed / funnel.published) * 100) : 0}%</strong></span>
            <span>Upgrade rate: <strong className="text-gray-800">{funnel.published > 0 ? Math.round((funnel.premium / funnel.published) * 100) : 0}%</strong></span>
            <span>Days to upgrade: <strong className="text-gray-800">{intelData?.avgDaysToUpgrade || '—'}</strong></span>
          </div>
        )}
      </div>

      {/* Revenue Projection */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Revenue Projections
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Based on last 30 days trend (₹{projection.dailyAvgRevenue || 0}/day avg)</p>
          </div>
          {projection.growthRate > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" /> +{projection.growthRate}%
            </span>
          ) : projection.growthRate < 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-700">
              <ArrowDownRight className="w-3 h-3" /> {projection.growthRate}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-600">
              <Minus className="w-3 h-3" /> 0%
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Next 30 Days</div>
            <div className="font-display text-xl font-extrabold text-emerald-800">₹{(projection.projected30d || 0).toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{projection.dailyAvgOrders || 0} orders/day avg</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Next 60 Days</div>
            <div className="font-display text-xl font-extrabold text-blue-800">₹{(projection.projected60d || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">Next 90 Days</div>
            <div className="font-display text-xl font-extrabold text-purple-800">₹{(projection.projected90d || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Comparison row */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span>Last 30d: <strong className="text-gray-800">₹{(projection.last30dRevenue || 0).toLocaleString()}</strong> ({projection.last30dOrders || 0} orders)</span>
          <span>Prev 30d: <strong className="text-gray-800">₹{(projection.prev30dRevenue || 0).toLocaleString()}</strong> ({projection.prev30dOrders || 0} orders)</span>
        </div>
      </div>

      {/* Revenue by Template */}
      {revByTemplate.length > 0 && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Revenue by Template
          </h4>
          <div className="space-y-3">
            {revByTemplate.map((t) => (
              <div key={t.templateId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--ink)] truncate">{t.templateId}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      ₹{t.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                    <span>{t.total} total</span>
                    <span>{t.premium} premium ({t.conversionRate}%)</span>
                    <span>{t.free} free</span>
                  </div>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2 shrink-0">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${t.conversionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Cohort Analysis */}
      {cohorts.length > 0 && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-500" />
            Weekly Revenue Cohorts (Last 8 Weeks)
          </h4>
          <div className="flex items-end gap-2 h-36 pt-4 pb-1 border-b border-gray-100 overflow-x-auto">
            {cohorts.map((c, i) => (
              <div key={i} className="flex-1 min-w-[40px] flex flex-col items-center gap-1 group">
                <div className="text-[9px] font-bold text-gray-500 mb-0.5">₹{c.revenue.toLocaleString()}</div>
                <div className="w-full flex flex-col justify-end h-24">
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all group-hover:bg-blue-600"
                    style={{ height: `${((c.revenue || 0) / maxCohortRev) * 100}%`, minHeight: c.revenue > 0 ? '4px' : '2px' }}
                    title={`${c.label}: ₹${c.revenue} revenue, ${c.premium} premium, ${c.created} created`}
                  />
                </div>
                <div className="text-[9px] text-gray-400 font-semibold text-center">{c.label}</div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span>Created: <strong>{cohorts.reduce((s, c) => s + c.created, 0)}</strong></span>
            <span>Premium: <strong>{cohorts.reduce((s, c) => s + c.premium, 0)}</strong></span>
            <span>Total Revenue: <strong>₹{cohorts.reduce((s, c) => s + c.revenue, 0).toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      {/* Recent Orders & Transaction Log */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Recent Payment & Publish Feed
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Latest transactions synced with Razorpay and free tier claims.
            </p>
          </div>
          <a
            href="/api/admin/export?type=revenue"
            download
            className="self-start sm:self-center px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Revenue CSV</span>
          </a>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No recent transactions recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 sm:p-3.5 rounded-xl bg-gray-50/80 hover:bg-emerald-50/40 border border-gray-100 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)]">
                      {tx.groomName} & {tx.brideName}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ring-1 ${
                      tx.amount > 0
                        ? 'bg-amber-50 text-amber-900 ring-amber-200'
                        : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                    }`}>
                      {tx.amount > 0 ? `₹${tx.amount}` : 'Free Tier'}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 font-mono mt-1 flex-wrap">
                    <span>Payment ID: <strong className="text-gray-700">{tx.paymentId}</strong></span>
                    {tx.paidAt && (
                      <span>Date: {new Date(tx.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs">
                  <span className="text-[11px] text-gray-500 truncate max-w-[180px]">{tx.ownerEmail}</span>
                  <a
                    href={`/i/${tx.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
