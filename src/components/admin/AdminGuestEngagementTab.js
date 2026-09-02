'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  BarChart3,
  Loader2,
  RefreshCw,
  TrendingUp,
  Target,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

function HeatmapGrid({ heatmap, dayNames, maxVal }) {
  if (!heatmap || heatmap.length === 0) return null;

  const hours = [0, 3, 6, 9, 12, 15, 18, 21]; // Show key hours
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
        {/* Hour labels */}
        <div className="flex items-center gap-0.5 mb-1 ml-12">
          {hours.map((h) => (
            <div key={h} className="flex-1 text-[9px] text-gray-400 font-semibold text-center">
              {h}h
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {dayNames.map((day, di) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-10 text-[10px] font-bold text-gray-500 text-right pr-1 shrink-0">{day}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: 24 }, (_, hi) => (
                <div
                  key={hi}
                  className={`flex-1 h-5 rounded-sm ${getColor(heatmap[di][hi])} transition-colors`}
                  title={`${day} ${hi}:00 — ${heatmap[di][hi]} views`}
                />
              ))}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 ml-12">
          <span className="text-[9px] text-gray-400">Less</span>
          <div className="w-4 h-3 rounded-sm bg-gray-100" />
          <div className="w-4 h-3 rounded-sm bg-emerald-100" />
          <div className="w-4 h-3 rounded-sm bg-emerald-200" />
          <div className="w-4 h-3 rounded-sm bg-emerald-400" />
          <div className="w-4 h-3 rounded-sm bg-emerald-600" />
          <span className="text-[9px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminGuestEngagementTab({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, healthRes] = await Promise.allSettled([
        fetch(`/api/admin/analytics-enhanced?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/health?t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const json = await analyticsRes.value.json();
        if (json.ok) setData(json);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const json = await healthRes.value.json();
        if (json.ok) setHealthData(json);
      }
    } catch (err) {
      console.error('[AdminGuestEngagementTab] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (refreshTrigger) fetchData(); }, [refreshTrigger, fetchData]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80 animate-fade-in">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Aggregating guest engagement data...</p>
      </div>
    );
  }

  const peak = data?.peakTraffic || {};
  const engagement = data?.engagementDepth || {};
  const rsvp = data?.rsvpStats;
  const activity = healthData?.checks?.activity || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Views (24h)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-2">
            {(activity.viewsLast24h || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{(activity.viewsLast7d || 0).toLocaleString()} this week</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Avg Views/Invite</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">
            {engagement.avgViewsPerInvite || 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{engagement.totalSlugsWithViews || 0} invitations viewed</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Peak Hour</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">
            {peak.peakHour !== undefined ? `${peak.peakHour}:00` : '—'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{peak.peakDay || '—'}</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">RSVPs Total</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">
            {rsvp?.total || 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {rsvp ? `${rsvp.breakdown?.attending || 0} attending` : 'No RSVP data yet'}
          </div>
        </div>
      </div>

      {/* RSVP Breakdown */}
      {rsvp && (
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
          <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            RSVP Response Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <div className="font-display text-2xl font-extrabold text-emerald-800">{rsvp.breakdown?.attending || 0}</div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Attending</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <HelpCircle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <div className="font-display text-2xl font-extrabold text-amber-800">{rsvp.breakdown?.maybe || 0}</div>
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">Maybe</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <div className="font-display text-2xl font-extrabold text-red-800">{rsvp.breakdown?.declined || 0}</div>
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mt-0.5">Declined</div>
            </div>
          </div>
        </div>
      )}

      {/* Peak Traffic Heatmap */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Peak Traffic Hours (Last 14 Days)
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Heatmap of guest views by hour and day of week</p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors self-start">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {peak.heatmap ? (
          <HeatmapGrid heatmap={peak.heatmap} dayNames={peak.dayNames || []} maxVal={peak.maxVal || 1} />
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">No traffic data available for heatmap.</p>
        )}

        {/* Top Hours */}
        {peak.topHours && peak.topHours.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Busiest Hours</p>
            <div className="flex flex-wrap gap-2">
              {peak.topHours.map((h) => (
                <span key={h.hour} className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                  {h.label} ({h.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Engagement Depth Distribution */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Guest Engagement Depth
        </h4>
        {engagement.distribution ? (
          <div className="space-y-3">
            {Object.entries(engagement.distribution).map(([label, count]) => {
              const total = Object.values(engagement.distribution).reduce((s, v) => s + v, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>{label}</span>
                    <span>{count} invites ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">No engagement data available.</p>
        )}
      </div>
    </div>
  );
}
