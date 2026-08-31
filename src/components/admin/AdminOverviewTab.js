'use client';

import React, { useState } from 'react';
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
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sublabel, color = 'emerald', trend, badge }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    blue: 'bg-blue-50 text-blue-600 ring-blue-200',
    purple: 'bg-purple-50 text-purple-600 ring-purple-200',
    rose: 'bg-rose-50 text-rose-600 ring-rose-200',
  };

  return (
    <div className="rounded-2xl bg-white/95 border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-3.5 sm:p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ring-1 ${colors[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            {badge}
          </span>
        )}
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-700' : trend < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <div className="mt-2.5 sm:mt-3">
        <div className="font-display text-xl sm:text-3xl text-[var(--ink)] leading-tight font-extrabold">
          {value}
        </div>
        <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[var(--ink-muted)] mt-1 truncate">
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] sm:text-xs text-[var(--ink-soft)] mt-0.5 truncate">{sublabel}</div>
        )}
      </div>
    </div>
  );
}

function FourteenDayChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.total || 0), 1);

  return (
    <div className="rounded-2xl bg-white/90 border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-display text-base sm:text-lg text-[var(--ink)] font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            14-Day Growth & Creation Trend
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Daily breakdown of Free vs Premium invitations published.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span className="text-[var(--ink-soft)] font-medium">Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-[var(--ink-soft)] font-medium">Premium</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1 sm:gap-2 h-28 pt-4 pb-1 border-b border-gray-100 overflow-x-auto">
        {data.map((d, i) => {
          const premiumH = ((d.premium || 0) / maxVal) * 100;
          const freeH = ((d.free || 0) / maxVal) * 100;
          return (
            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
              <div className="w-full flex flex-col justify-end gap-0.5 h-20">
                {d.premium > 0 && (
                  <div
                    className="w-full rounded-t-sm bg-amber-400 transition-all group-hover:brightness-95"
                    style={{ height: `${premiumH}%`, minHeight: d.premium > 0 ? '4px' : '0' }}
                    title={`${d.premium} premium (₹${d.revenue || 0})`}
                  />
                )}
                {d.free > 0 && (
                  <div
                    className="w-full rounded-b-sm bg-emerald-400 transition-all group-hover:brightness-95"
                    style={{ height: `${freeH}%`, minHeight: d.free > 0 ? '4px' : '0' }}
                    title={`${d.free} free`}
                  />
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] text-[var(--ink-muted)] font-semibold truncate w-full text-center">
                {d.dayLabel?.split(',')[0] || d.date?.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminOverviewTab({ data, onSelectInvitation, onRefresh }) {
  const stats = data?.stats || {};
  const expiry = data?.expiry || {};
  const revenue = data?.revenue || {};
  const dailyBreakdown = data?.dailyBreakdown || [];
  const expiringSoon = data?.expiringSoonInvitations || [];
  const expiredFree = data?.expiredFreeInvitations || [];
  const expiredPremium = data?.expiredPremiumInvitations || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Total Published"
          value={stats.published || 0}
          sublabel={`${stats.drafts || 0} drafts in progress`}
          color="emerald"
        />
        <StatCard
          icon={Crown}
          label="Premium Upgrades"
          value={stats.premium || 0}
          sublabel={`${revenue.conversionRate || 0}% conversion rate`}
          color="amber"
          badge="₹399 Tier"
        />
        <StatCard
          icon={DollarSign}
          label="Gross Revenue"
          value={`₹${(revenue.estimatedTotal || 0).toLocaleString()}`}
          sublabel={`₹${(revenue.recentRevenue || 0).toLocaleString()} in last 30d`}
          color="purple"
        />
        <StatCard
          icon={Timer}
          label="Expired Total"
          value={expiry.totalExpired || 0}
          sublabel={`${expiry.expiringSoonFree || 0} expiring soon (<3d)`}
          color={expiry.expiringSoonFree > 0 ? 'rose' : 'blue'}
        />
      </div>

      {/* 14-Day Growth Graph */}
      <FourteenDayChart data={dailyBreakdown} />

      {/* Urgent Attention: Expiring Soon (<3 Days) */}
      {expiringSoon.length > 0 && (
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Expiring Soon — Free Tier ({expiringSoon.length})
                </h4>
                <p className="text-xs text-amber-800/80">
                  Invitations with 3 or fewer days remaining before auto-expiry.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {expiringSoon.slice(0, 6).map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectInvitation(inv)}
                className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-[var(--ink)] truncate">
                    {inv.groomName} & {inv.brideName}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">{inv.slug}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {inv.daysLeft}d left
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline block mt-0.5">
                    Manage →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Lists Accordion / Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expired Free Tier */}
        <div className="rounded-2xl bg-white/90 border border-white/80 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Expired Free Invitations ({expiredFree.length})
            </h4>
            <span className="text-xs text-[var(--ink-muted)]">Past 21-day window</span>
          </div>

          {expiredFree.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] py-4 text-center">No expired free invitations.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {expiredFree.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvitation(inv)}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50/50 border border-gray-100 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[var(--ink)] truncate block">
                      {inv.groomName} & {inv.brideName}
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)] font-mono">{inv.slug}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-red-600 block">
                      Expired {inv.expiredDaysAgo}d ago
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold hover:underline">Extend</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expired Premium */}
        <div className="rounded-2xl bg-white/90 border border-white/80 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Past Event Premium ({expiredPremium.length})
            </h4>
            <span className="text-xs text-[var(--ink-muted)]">Event date + 3d passed</span>
          </div>

          {expiredPremium.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] py-4 text-center">No expired premium invitations.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {expiredPremium.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvitation(inv)}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-amber-50/50 border border-gray-100 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[var(--ink)] truncate block">
                      {inv.groomName} & {inv.brideName}
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)] font-mono">{inv.slug}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-gray-600 block">
                      Date: {inv.weddingDate || 'N/A'}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold hover:underline">Manage</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
