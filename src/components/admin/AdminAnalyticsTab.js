'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Share2,
  Image as ImageIcon,
  Music,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  BarChart2,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';

export default function AdminAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('[AdminAnalyticsTab] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80 animate-fade-in">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Aggregating guest traffic & template analytics...</p>
      </div>
    );
  }

  const traffic = data?.traffic || {};
  const templates = data?.templates || {};
  const dailyViews = traffic.dailyViews || [];
  const topSlugs = traffic.topSlugs || [];
  const topReferrers = traffic.topReferrers || [];
  const devices = traffic.devices || { Mobile: 0, Desktop: 0, Tablet: 0 };
  const totalDeviceViews = (devices.Mobile || 0) + (devices.Desktop || 0) + (devices.Tablet || 0) || 1;
  const mobilePct = Math.round(((devices.Mobile + (devices.Tablet || 0)) / totalDeviceViews) * 100);
  const desktopPct = 100 - mobilePct;

  const maxDailyViews = Math.max(...dailyViews.map((d) => d.views || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Traffic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Total Guest Views</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-2">
            {(traffic.totalViews || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Across all live invitations</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Mobile Traffic</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">
            {mobilePct}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{desktopPct}% desktop viewers</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Photo Attach Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">
            {templates.featureAdoption?.photoPercentage || 0}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{templates.featureAdoption?.withPhoto || 0} invites with couple photos</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Music Adoption</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">
            {templates.featureAdoption?.audioPercentage || 0}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{templates.featureAdoption?.withAudio || 0} custom audio tracks</div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              14-Day Guest View Activity
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Daily invitation views logged in the page_views analytics table.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href="/api/admin/export?type=traffic"
              download
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Download guest traffic CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Traffic CSV</span>
            </a>
            <button
              onClick={fetchAnalytics}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              title="Refresh traffic data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-end gap-1.5 sm:gap-2 h-28 pt-4 pb-1 border-b border-gray-100 overflow-x-auto">
          {dailyViews.map((d, i) => {
            const h = ((d.views || 0) / maxDailyViews) * 100;
            return (
              <div key={i} className="flex-1 min-w-[22px] flex flex-col items-center gap-1 group relative">
                <div className="w-full flex flex-col justify-end h-20">
                  <div
                    className="w-full rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
                    style={{ height: `${h}%`, minHeight: d.views > 0 ? '6px' : '2px' }}
                    title={`${d.views} views on ${d.date}`}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold truncate w-full text-center">
                  {d.dayName?.split(',')[0] || d.date?.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Top Viewed Invites & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Most Visited Slugs */}
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-500" />
            Top 10 Most Viewed Invitations
          </h4>
          {topSlugs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No page views recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {topSlugs.map((item, idx) => (
                <div
                  key={item.slug}
                  className="p-2.5 rounded-xl bg-gray-50/80 hover:bg-emerald-50/50 border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-mono font-semibold text-gray-800 truncate">
                      {item.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-emerald-700">{item.views} views</span>
                    <a
                      href={`/i/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-emerald-600 p-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Referral Channels */}
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-blue-500" />
            Guest Traffic Referrers
          </h4>
          {topReferrers.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No referrer data logged yet.</p>
          ) : (
            <div className="space-y-3">
              {topReferrers.map((ref) => (
                <div key={ref.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>{ref.source}</span>
                    <span>{ref.count} clicks ({ref.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${ref.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Leaderboard */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Template Popularity Leaderboard
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(templates.templatePopularity || []).map((t) => (
            <div
              key={t.templateId}
              className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate max-w-[140px]">
                    {t.templateId}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                    {t.percentage}% share
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total Uses: <strong className="text-gray-800">{t.total}</strong>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-600">
                <span>🌱 Free: <strong>{t.free}</strong></span>
                <span>👑 Paid: <strong>{t.premium}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
