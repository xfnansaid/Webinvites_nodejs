'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Crown,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ExternalLink,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  ShieldCheck,
  Loader2,
  XCircle,
} from 'lucide-react';

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, sublabel, color = 'emerald', trend }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    blue: 'bg-blue-50 text-blue-600 ring-blue-200',
    purple: 'bg-purple-50 text-purple-600 ring-purple-200',
    rose: 'bg-rose-50 text-rose-600 ring-rose-200',
  };

  return (
    <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-700' : trend < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="font-display text-2xl sm:text-3xl text-[var(--ink)] leading-none">
          {value}
        </div>
        <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-[var(--ink-muted)] mt-1">
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] sm:text-xs text-[var(--ink-soft)] mt-0.5">{sublabel}</div>
        )}
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.total || 0), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => {
        const premiumH = ((d.premium || 0) / maxVal) * 100;
        const freeH = ((d.free || 0) / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col items-stretch gap-0.5" style={{ height: '60px' }}>
              <div className="flex-1 flex flex-col justify-end">
                {d.premium > 0 && (
                  <div
                    className="w-full rounded-t-sm bg-amber-400"
                    style={{ height: `${premiumH}%`, minHeight: d.premium > 0 ? '4px' : '0' }}
                    title={`${d.premium} premium`}
                  />
                )}
                {d.free > 0 && (
                  <div
                    className="w-full rounded-b-sm bg-emerald-400"
                    style={{ height: `${freeH}%`, minHeight: d.free > 0 ? '4px' : '0' }}
                    title={`${d.free} free`}
                  />
                )}
              </div>
            </div>
            <div className="text-[8px] text-[var(--ink-muted)] font-medium">
              {new Date(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Admin Expiry Dashboard Panel
 * Shows expired invitations, revenue stats, and tier distribution.
 */
export default function AdminExpiryPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExpiredFree, setShowExpiredFree] = useState(false);
  const [showExpiredPremium, setShowExpiredPremium] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/expiry-stats', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to load admin stats.');
      } else {
        setStats(data);
      }
    } catch (e) {
      setError(e?.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="rounded-3xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-8 text-center">
        <Loader2 className="w-8 h-8 text-[var(--emerald-primary)] animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--ink-muted)]">Loading admin stats…</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-center">
        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-800 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white ring-1 ring-red-200 text-red-700 font-bold text-xs hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const { stats: s, expiry: e, revenue: r, dailyBreakdown, expiredFreeInvitations, expiredPremiumInvitations } = stats || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
            Expiry & Revenue Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5">
            Admin-only view · Last refreshed {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white ring-1 ring-black/5 hover:bg-[var(--emerald-light)]/60 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Invitations" value={s?.total || 0} color="emerald" />
        <StatCard icon={Crown} label="Premium (Paid)" value={s?.premium || 0} sublabel={`${r?.paidPremiumCount || 0} with payment`} color="amber" />
        <StatCard icon={Clock} label="Free Tier" value={s?.free || 0} sublabel={`${e?.expiringSoonFree || 0} expiring soon`} color="blue" />
        <StatCard icon={DollarSign} label="Estimated Revenue" value={`₹${(r?.estimatedTotal || 0).toLocaleString('en-IN')}`} sublabel={`${r?.recentUpgradesCount || 0} this month`} color="purple" />
      </div>

      {/* Expiry Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Expired Invitations */}
        <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">Expired Invitations</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-red-50/70 border border-red-100 p-3 text-center">
              <div className="font-display text-2xl text-red-700">{e?.expiredFree || 0}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-red-600/70 mt-0.5">Free Tier Expired</div>
            </div>
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 text-center">
              <div className="font-display text-2xl text-amber-700">{e?.expiredPremium || 0}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-amber-600/70 mt-0.5">Premium Expired</div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold">
              <Timer className="w-3 h-3" />
              {e?.expiringSoonFree || 0} free invitations expiring in 3 days
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">Revenue Breakdown</h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800">Total Premium Orders</span>
              <span className="font-display text-lg text-emerald-700">{r?.paidPremiumCount || 0}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50/70 border border-purple-100">
              <span className="text-xs font-semibold text-purple-800">Estimated Total Revenue</span>
              <span className="font-display text-lg text-purple-700">₹{(r?.estimatedTotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs font-semibold text-amber-800">Last 30 Days Revenue</span>
              <span className="font-display text-lg text-amber-700">₹{(r?.recentRevenue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Publishing Trend */}
      <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[var(--ink)]">7-Day Publishing Trend</h3>
          <div className="ml-auto flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Free</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Premium</span>
          </div>
        </div>
        <MiniBarChart data={dailyBreakdown} />
      </div>

      {/* Expired Free Invitations List */}
      {expiredFreeInvitations && expiredFreeInvitations.length > 0 && (
        <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] overflow-hidden">
          <button
            onClick={() => setShowExpiredFree(!showExpiredFree)}
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm text-[var(--ink)]">
                Expired Free Invitations ({expiredFreeInvitations.length})
              </span>
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              {showExpiredFree ? 'Hide' : 'Show'}
            </span>
          </button>

          {showExpiredFree && (
            <div className="border-t border-gray-100">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-left text-[10px] uppercase tracking-widest font-bold text-[var(--ink-muted)]">
                      <th className="px-4 py-2">Couple</th>
                      <th className="px-4 py-2">Published</th>
                      <th className="px-4 py-2">Expired</th>
                      <th className="px-4 py-2">Owner</th>
                      <th className="px-4 py-2">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiredFreeInvitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">
                          {inv.brideName} & {inv.groomName}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--ink-muted)]">
                          {prettyDate(inv.paidAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                            {inv.expiredDaysAgo}d ago
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--ink-muted)] truncate max-w-[160px]">
                          {inv.ownerEmail || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <a
                            href={`/i/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--emerald-primary)] hover:underline font-semibold"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expired Premium Invitations List */}
      {expiredPremiumInvitations && expiredPremiumInvitations.length > 0 && (
        <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] overflow-hidden">
          <button
            onClick={() => setShowExpiredPremium(!showExpiredPremium)}
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-sm text-[var(--ink)]">
                Expired Premium Invitations ({expiredPremiumInvitations.length})
              </span>
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              {showExpiredPremium ? 'Hide' : 'Show'}
            </span>
          </button>

          {showExpiredPremium && (
            <div className="border-t border-gray-100">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-left text-[10px] uppercase tracking-widest font-bold text-[var(--ink-muted)]">
                      <th className="px-4 py-2">Couple</th>
                      <th className="px-4 py-2">Event Date</th>
                      <th className="px-4 py-2">Paid</th>
                      <th className="px-4 py-2">Owner</th>
                      <th className="px-4 py-2">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiredPremiumInvitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">
                          {inv.brideName} & {inv.groomName}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--ink-muted)]">
                          {prettyDate(inv.weddingDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          {inv.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                              <ShieldCheck className="w-2.5 h-2.5" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--ink-muted)] truncate max-w-[160px]">
                          {inv.ownerEmail || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <a
                            href={`/i/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--emerald-primary)] hover:underline font-semibold"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tier Distribution Summary */}
      <div className="rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgba(15,56,44,0.06)] p-4 sm:p-5">
        <h3 className="font-bold text-sm text-[var(--ink)] mb-3">Tier Distribution</h3>
        <div className="flex items-center gap-3 h-6 rounded-full overflow-hidden bg-gray-100">
          {s?.total > 0 && (
            <>
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${((s.premium || 0) / s.total) * 100}%` }}
                title={`Premium: ${s.premium}`}
              />
              <div
                className="h-full bg-emerald-400 transition-all"
                style={{ width: `${((s.free || 0) / s.total) * 100}%` }}
                title={`Free: ${s.free}`}
              />
              <div
                className="h-full bg-gray-300 transition-all"
                style={{ width: `${((s.drafts || 0) / s.total) * 100}%` }}
                title={`Drafts: ${s.drafts}`}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Premium {s?.premium || 0} ({s?.total ? Math.round(((s.premium || 0) / s.total) * 100) : 0}%)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Free {s?.free || 0} ({s?.total ? Math.round(((s.free || 0) / s.total) * 100) : 0}%)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300" /> Drafts {s?.drafts || 0} ({s?.total ? Math.round(((s.drafts || 0) / s.total) * 100) : 0}%)</span>
        </div>
      </div>
    </div>
  );
}
