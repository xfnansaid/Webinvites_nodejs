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
  Radio,
  Globe2,
  Activity,
  ShieldCheck,
  HelpCircle,
  Laptop,
  Tablet,
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
  const [gaData, setGaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gaLoading, setGaLoading] = useState(true);
  const [showGaGuide, setShowGaGuide] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setGaLoading(true);
    try {
      const [baseRes, extRes, gaRes] = await Promise.allSettled([
        fetch(`/api/admin/analytics?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
        fetch(`/api/admin/analytics-enhanced?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
        fetch(`/api/admin/google-analytics?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
      ]);

      if (baseRes.status === 'fulfilled') {
        const json = await baseRes.value.json();
        if (json.ok) setData(json);
      }
      if (extRes.status === 'fulfilled') {
        const json = await extRes.value.json();
        if (json.ok) setExtData(json);
      }
      if (gaRes.status === 'fulfilled') {
        const json = await gaRes.value.json();
        setGaData(json);
      }
    } catch (err) {
      console.error('[AdminAnalyticsTab] Fetch error:', err);
    } finally {
      setLoading(false);
      setGaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (refreshTrigger) fetchAll();
  }, [refreshTrigger, fetchAll]);

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80 animate-fade-in">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Aggregating guest traffic & Google Analytics data...</p>
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

  // GA4 Data
  const isGaConnected = gaData?.connected === true;
  const gaOverview = gaData?.overview || {};
  const gaRealtime = gaData?.realtime || {};
  const gaDailyTrends = gaData?.dailyTrends || [];
  const gaTopPages = gaData?.topPages || [];
  const gaTrafficSources = gaData?.trafficSources || [];
  const gaDevices = gaData?.devices || {};
  const gaLocations = gaData?.locations || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── GOOGLE ANALYTICS 4 (GA4) LIVE INTELLIGENCE BANNER ── */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold tracking-tight">
                    Google Analytics 4 (GA4)
                  </h3>
                  <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-amber-200 border border-white/10">
                    G-BPNYZQ4PHZ
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Live official traffic streams, active visitors, and audience acquisition.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {isGaConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>GA4 Live Stream Active</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGaGuide(!showGaGuide)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showGaGuide ? 'Hide Setup Guide' : 'Connect Google Analytics API'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={fetchAll}
                disabled={gaLoading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 cursor-pointer"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gaLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* If GA is Connected: Live Realtime Counter & 30-Day Metrics */}
          {isGaConnected ? (
            <div className="space-y-5">
              {/* Top Row: Realtime Pulse + 4 Core Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Realtime Active Users Tile */}
                <div className="col-span-2 sm:col-span-1 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                      Realtime Right Now
                    </span>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="font-display text-3xl sm:text-4xl font-black text-emerald-300">
                      {gaRealtime.activeUsers || 0}
                    </div>
                    <div className="text-[11px] text-emerald-200/80 font-medium">
                      Active visitor{gaRealtime.activeUsers === 1 ? '' : 's'} on site
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400/80">Last 30 mins window</div>
                </div>

                {/* 30-Day Total Active Users */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                    Total Users (30d)
                  </span>
                  <div className="my-1.5 font-display text-2xl sm:text-3xl font-extrabold text-white">
                    {(gaOverview.totalActiveUsers || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    +{gaOverview.newUsers || 0} new visitors
                  </span>
                </div>

                {/* 30-Day Total Sessions */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                    Sessions (30d)
                  </span>
                  <div className="my-1.5 font-display text-2xl sm:text-3xl font-extrabold text-white">
                    {(gaOverview.sessions || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-400">Total browsing sessions</span>
                </div>

                {/* Total Screen Page Views */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                    GA4 Page Views
                  </span>
                  <div className="my-1.5 font-display text-2xl sm:text-3xl font-extrabold text-white">
                    {(gaOverview.screenPageViews || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-400">Verified hits logged</span>
                </div>

                {/* Engagement Rate */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                    Engagement Rate
                  </span>
                  <div className="my-1.5 font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {gaOverview.engagementRate || 0}%
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Avg {gaOverview.avgEngagementTimeSeconds || 0}s per user
                  </span>
                </div>
              </div>

              {/* GA4 Top Pages & Channels Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Top Viewed Pages */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Top GA4 Visited Pages & Invitations
                  </h4>
                  {gaTopPages.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">No page traffic recorded in GA4.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {gaTopPages.map((p, idx) => (
                        <div
                          key={p.path}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-4 h-4 rounded-full bg-white/10 text-stone-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-stone-200 truncate">{p.path}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-stone-400 text-[11px]">
                            <span className="font-bold text-white">{p.views} views</span>
                            <span>{p.users} users</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Traffic Acquisition Channels */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    GA4 Traffic Sources & Channels
                  </h4>
                  {gaTrafficSources.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">No source attribution recorded in GA4.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {gaTrafficSources.map((src) => {
                        const totalSessions = gaOverview.sessions || 1;
                        const pct = Math.min(100, Math.round((src.sessions / totalSessions) * 100));
                        return (
                          <div key={src.source} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                              <span>{src.label}</span>
                              <span className="text-stone-400">{src.sessions} sessions ({pct}%)</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Setup Helper when GA4 Service Account is not yet plugged in */
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google Analytics Tracking is Active (ID: G-BPNYZQ4PHZ)</span>
                </div>
                <span className="text-[11px] text-stone-400 bg-white/10 px-2 py-0.5 rounded-lg">
                  Frontend Tag Loaded
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Your site is actively sending hits to Google Analytics. To display real-time and 30-day graphs right inside this admin dashboard, configure your <strong>Google Cloud Service Account</strong> credentials in your environment variables.
              </p>

              {showGaGuide && (
                <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs text-stone-300">
                  <p className="font-bold text-white">Quick 2-Minute Setup Steps:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] text-stone-300">
                    <li>
                      Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Google Cloud Console</a> & enable the <strong>Google Analytics Data API</strong>.
                    </li>
                    <li>
                      Create a <strong>Service Account</strong>, create a <strong>JSON Key</strong>, and copy the Service Account email.
                    </li>
                    <li>
                      In <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Google Analytics</a> → <strong>Admin → Property Access Management</strong>, add that email as <strong>Viewer</strong>.
                    </li>
                    <li>
                      Add these variables to your <code className="bg-white/10 px-1 py-0.5 rounded text-amber-200">.env.local</code> or hosting settings:
                      <pre className="mt-2 p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`GA4_PROPERTY_ID=YOUR_NUMERIC_PROPERTY_ID
GA_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
                      </pre>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── DATABASE INTERNAL TRAFFIC OVERVIEW ── */}
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
            Top 10 Most Viewed Invitations (Supabase)
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
            Guest Traffic Referrers (Supabase)
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

      {/* Template Popularity Leaderboard */}
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

