'use client';

import React from 'react';
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
  Download,
} from 'lucide-react';

export default function AdminRevenueTab({ data }) {
  const revenue = data?.revenue || {};
  const stats = data?.stats || {};
  const transactions = data?.recentTransactions || [];

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
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Premium Pricing</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-2">
            ₹{revenue.pricePerPremium || 399}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            1-time fee / invitation
          </div>
        </div>
      </div>

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
            title="Download financial ledger CSV"
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
                    title="View live invite"
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
