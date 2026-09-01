'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Globe,
  Cpu,
  TrendingUp,
  Users,
  Eye,
  DollarSign,
} from 'lucide-react';

function StatusDot({ status }) {
  const colors = {
    healthy: 'bg-emerald-500',
    good: 'bg-emerald-500',
    excellent: 'bg-emerald-500',
    fair: 'bg-amber-500',
    warning: 'bg-amber-500',
    poor: 'bg-red-500',
    error: 'bg-red-500',
    degraded: 'bg-red-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-400'} shrink-0`} />;
}

function MetricRow({ label, value, status, sublabel }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-xs">
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-bold text-[var(--ink)]">{value}</span>
        {sublabel && <span className="text-gray-500 ml-1">{sublabel}</span>}
      </div>
    </div>
  );
}

export default function AdminPerformanceTab({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/health?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setLastChecked(new Date());
      }
    } catch (err) {
      console.error('[AdminPerformanceTab] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (refreshTrigger) fetchData(); }, [refreshTrigger, fetchData]);

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80 animate-fade-in">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Running system health checks...</p>
      </div>
    );
  }

  const checks = data?.checks || {};
  const db = checks.database || {};
  const storage = checks.storage || {};
  const activity = checks.activity || {};
  const tables = checks.tables || {};

  const overallColor = data?.status === 'healthy' ? 'emerald' : data?.status === 'degraded' ? 'red' : 'amber';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Status Banner */}
      <div className={`rounded-2xl border-2 p-4 sm:p-5 ${
        overallColor === 'emerald' ? 'bg-emerald-50/60 border-emerald-200' :
        overallColor === 'red' ? 'bg-red-50/60 border-red-200' :
        'bg-amber-50/60 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              overallColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
              overallColor === 'red' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)]">
                System {data?.status === 'healthy' ? 'All Systems Operational' : data?.status === 'degraded' ? 'Degraded Performance' : 'Warning'}
              </h3>
              <p className="text-xs text-gray-500">
                {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'Checking...'}
              </p>
            </div>
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Database Health */}
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">Supabase Database</h4>
              <div className="flex items-center gap-1.5 text-[11px]">
                <StatusDot status={db.status} />
                <span className="font-semibold capitalize">{db.status || 'unknown'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <MetricRow label="Response Time" value={`${db.latencyMs || 0}ms`} status={db.rating} />
            <MetricRow label="Rating" value={db.rating || '—'} status={db.rating} />
          </div>
          {db.error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
              {db.error}
            </div>
          )}
        </div>

        {/* Storage Health */}
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">Storage (Photos)</h4>
              <div className="flex items-center gap-1.5 text-[11px]">
                <StatusDot status={storage.status} />
                <span className="font-semibold capitalize">{storage.status || 'unknown'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <MetricRow label="Response Time" value={`${storage.latencyMs || 0}ms`} status={storage.rating} />
            <MetricRow label="Rating" value={storage.rating || '—'} status={storage.rating} />
          </div>
          {storage.error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
              {storage.error}
            </div>
          )}
        </div>
      </div>

      {/* Database Table Counts */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-purple-500" />
          Database Table Statistics
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Object.entries(tables).map(([name, info]) => (
            <div key={name} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 font-mono">{name}</span>
              {info.error ? (
                <span className="text-[10px] font-semibold text-gray-400 italic">N/A</span>
              ) : (
                <span className="text-xs font-extrabold text-[var(--ink)]">{(info.count || 0).toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 24h Activity Feed */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500" />
          Last 24 Hours Activity
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <Eye className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <div className="font-display text-xl font-extrabold text-emerald-800">{(activity.viewsLast24h || 0).toLocaleString()}</div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Guest Views</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="font-display text-xl font-extrabold text-blue-800">{activity.newInvites24h || 0}</div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">New Invites</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <TrendingUp className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="font-display text-xl font-extrabold text-amber-800">{activity.newPremium24h || 0}</div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Premium Upgrades</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="font-display text-xl font-extrabold text-purple-800">₹{(activity.revenueLast24h || 0).toLocaleString()}</div>
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Revenue (24h)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
