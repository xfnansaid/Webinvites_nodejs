'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Target,
  Clock,
  BarChart3,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';

function HeatmapGrid({ heatmap, dayNames, maxVal }) {
  if (!heatmap || heatmap.length === 0) return null;

  const getColor = (val) => {
    if (val === 0) return 'bg-gray-100';
    const ratio = val / (maxVal || 1);
    if (ratio < 0.15) return 'bg-emerald-100';
    if (ratio < 0.3) return 'bg-emerald-200';
    if (ratio < 0.5) return 'bg-emerald-300';
    if (ratio < 0.7) return 'bg-emerald-400';
    return 'bg-emerald-600';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="flex items-center gap-0.5 mb-1 ml-12">
          {[0, 4, 8, 12, 16, 20].map((h) => (
            <div key={h} className="flex-1 text-[9px] text-gray-400 font-semibold text-center">{h}h</div>
          ))}
        </div>
        {dayNames.map((day, di) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-10 text-[10px] font-bold text-gray-500 text-right pr-1 shrink-0">{day}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: 24 }, (_, hi) => (
                <div
                  key={hi}
                  className={`flex-1 h-4 rounded-sm ${getColor(heatmap[di][hi])}`}
                  title={`${day} ${hi}:00 — ${heatmap[di][hi]} views`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 ml-12">
          <span className="text-[9px] text-gray-400">Less</span>
          <div className="w-3 h-2.5 rounded-sm bg-gray-100" />
          <div className="w-3 h-2.5 rounded-sm bg-emerald-100" />
          <div className="w-3 h-2.5 rounded-sm bg-emerald-200" />
          <div className="w-3 h-2.5 rounded-sm bg-emerald-400" />
          <div className="w-3 h-2.5 rounded-sm bg-emerald-600" />
          <span className="text-[9px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsTab({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [extData, setExtData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [baseRes, extRes] = await Promise.allSettled([
        fetch(`/api/admin/analytics?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/analytics-enhanced?t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      if (baseRes.status === 'fulfilled') {
        const json = await baseRes.value.json();
        if (json.ok) setData(json);
      }
      if (extRes.status === 'fulfilled') {
        const json = await extRes.value.json();
        if (json.ok) setExtData(json);
      }
    } catch (err) {
      console.error('[AdminAnalyticsTab] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (refreshTrigger) fetchAll(); }, [refreshTrigger, fetchAll]);

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

  // Extended data
  const templateConversion = extData?.templateConversion || [];
  const peakTraffic = extData?.peakTraffic || {};
  const engagement = extData?.engagementDepth || {};

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
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Avg Engagement</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">
            {engagement.avgViewsPerInvite || 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">views per invitation</div>
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
            <a href="/api/admin/export?type=traffic" download className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Traffic CSV</span>
            </a>
            <button onClick={fetchAll} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">
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
                  <div className="w-full rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
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

      {/* Peak Traffic Heatmap */}
      {peakTraffic.heatmap && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            Peak Traffic Hours (Last 14 Days)
          </h4>
          <p className="text-xs text-gray-500 mb-4">When guests view your invitations most</p>
          <HeatmapGrid heatmap={peakTraffic.heatmap} dayNames={peakTraffic.dayNames || []} maxVal={peakTraffic.maxVal || 1} />
          {peakTraffic.topHours && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              {peakTraffic.topHours.map((h) => (
                <span key={h.hour} className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                  {h.label} ({h.count})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two Column Grid: Top Viewed & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <div key={item.slug} className="p-2.5 rounded-xl bg-gray-50/80 hover:bg-emerald-50/50 border border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-mono font-semibold text-gray-800 truncate">{item.slug}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-emerald-700">{item.views} views</span>
                    <a href={`/i/${item.slug}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-emerald-600 p-0.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${ref.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template A/B Conversion Rates */}
      {templateConversion.length > 0 && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Template A/B Performance
          </h4>
          <p className="text-xs text-gray-500 mb-4">Which templates drive the most premium conversions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templateConversion.map((t, idx) => (
              <div key={t.templateId} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate max-w-[120px]">
                        {t.templateId}
                      </span>
                    </div>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ring-1 ${
                      t.conversionRate > 20 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                      t.conversionRate > 10 ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                      'bg-gray-50 text-gray-600 ring-gray-200'
                    }`}>
                      {t.conversionRate}% CVR
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total: <strong className="text-gray-800">{t.total}</strong> · Premium: <strong className="text-amber-700">{t.premium}</strong>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>🌱 Free: <strong>{t.free}</strong></span>
                    <span>📸 Photo: <strong>{t.photoRate}%</strong></span>
                    <span>🎵 Audio: <strong>{t.audioRate}%</strong></span>
                  </div>
                  {/* Conversion bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${t.conversionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Depth */}
      {engagement.distribution && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-500" />
            Guest Engagement Depth
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(engagement.distribution).map(([label, count]) => {
              const total = Object.values(engagement.distribution).reduce((s, v) => s + v, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <div className="font-display text-lg font-extrabold text-[var(--ink)]">{count}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template Popularity Leaderboard (original) */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Template Popularity Leaderboard
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(templates.templatePopularity || []).map((t) => (
            <div key={t.templateId} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
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
