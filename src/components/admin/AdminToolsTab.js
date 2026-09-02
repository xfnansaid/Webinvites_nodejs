'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Server,
  Database,
  Loader2,
  FileCode2,
  Copy,
  Check,
  Trash2,
  FileX,
  AlertOctagon,
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  BarChart3,
  HardDrive,
  Eye,
  Sparkles,
} from 'lucide-react';

const ALERT_DEFAULTS = {
  expiringSoonThreshold: 5,
  lowConversionThreshold: 5,
  dailyViewsDropThreshold: 50,
  revenueMilestoneStep: 1000,
};

export default function AdminToolsTab({ onSelectInvitation, refreshTrigger }) {
  const [inspectSlug, setInspectSlug] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Drafts Cleanup State ──
  const [draftCount, setDraftCount] = useState(null);
  const [draftList, setDraftList] = useState([]);
  const [draftPreviewLoading, setDraftPreviewLoading] = useState(false);
  const [draftPreviewError, setDraftPreviewError] = useState(null);
  const [draftDeleteStep, setDraftDeleteStep] = useState(0);
  const [draftDeleteResult, setDraftDeleteResult] = useState(null);
  const [draftDeleteError, setDraftDeleteError] = useState(null);
  const [typeConfirm, setTypeConfirm] = useState('');

  // ── Page Views Reset State ──
  const [viewsCount, setViewsCount] = useState(null);
  const [viewsPreviewLoading, setViewsPreviewLoading] = useState(false);
  const [viewsDeleteStep, setViewsDeleteStep] = useState(0);
  const [viewsDeleteLoading, setViewsDeleteLoading] = useState(false);
  const [viewsDeleteResult, setViewsDeleteResult] = useState(null);
  const [viewsDeleteError, setViewsDeleteError] = useState(null);
  const [viewsConfirmText, setViewsConfirmText] = useState('');

  // ── Full System Reset State ──
  const [fullResetStep, setFullResetStep] = useState(0);
  const [fullResetStats, setFullResetStats] = useState(null);
  const [fullResetLoading, setFullResetLoading] = useState(false);
  const [fullResetResult, setFullResetResult] = useState(null);
  const [fullResetError, setFullResetError] = useState(null);
  const [fullResetConfirmText, setFullResetConfirmText] = useState('');

  // ── Database Insights State ──
  const [dbInsights, setDbInsights] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);

  // ── Alert Thresholds State ──
  const [alerts, setAlerts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin_alert_thresholds');
        return saved ? JSON.parse(saved) : { ...ALERT_DEFAULTS };
      } catch { return { ...ALERT_DEFAULTS }; }
    }
    return { ...ALERT_DEFAULTS };
  });
  const [alertsActive, setAlertsActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_alerts_enabled') !== 'false';
    }
    return true;
  });

  const lookupInvitation = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    setInspectLoading(true);
    setInspectResult(null);
    setInspectError(null);
    try {
      const res = await fetch(`/api/admin/invitations?q=${encodeURIComponent(query.trim())}&limit=1&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to lookup invitation.');
      if (!data.invitations || data.invitations.length === 0) {
        setInspectError(`No invitation found matching "${query}".`);
      } else {
        setInspectResult(data.invitations[0]);
      }
    } catch (err) {
      setInspectError(err.message);
    } finally {
      setInspectLoading(false);
    }
  }, []);

  const handleInspect = (e) => { e?.preventDefault(); lookupInvitation(inspectSlug); };

  useEffect(() => { if (refreshTrigger && inspectSlug.trim()) lookupInvitation(inspectSlug); }, [refreshTrigger, inspectSlug, lookupInvitation]);

  const copyJson = () => {
    if (!inspectResult) return;
    navigator.clipboard.writeText(JSON.stringify(inspectResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Drafts Cleanup Handlers ──
  const fetchDraftPreview = useCallback(async () => {
    setDraftPreviewLoading(true);
    setDraftPreviewError(null);
    try {
      const res = await fetch(`/api/admin/drafts/cleanup?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch draft count.');
      setDraftCount(data.count);
      setDraftList(data.drafts || []);
      if (data.count > 0) setDraftDeleteStep(1);
    } catch (err) { setDraftPreviewError(err.message); }
    finally { setDraftPreviewLoading(false); }
  }, []);

  const handleDraftDelete = useCallback(async () => {
    setDraftDeleteStep(4);
    setDraftDeleteError(null);
    setDraftDeleteResult(null);
    try {
      const res = await fetch('/api/admin/drafts/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete drafts.');
      setDraftDeleteResult(data);
      setDraftDeleteStep(5);
      setDraftCount(0);
      setDraftList([]);
      setTypeConfirm('');
    } catch (err) { setDraftDeleteError(err.message); setDraftDeleteStep(2); }
  }, []);

  const resetDraftCleanup = () => {
    setDraftDeleteStep(0); setDraftCount(null); setDraftList([]);
    setDraftDeleteResult(null); setDraftDeleteError(null); setTypeConfirm('');
  };

  // ── Page Views Reset Handlers ──
  const fetchViewsPreview = async () => {
    setViewsPreviewLoading(true);
    setViewsDeleteError(null);
    try {
      const res = await fetch(`/api/admin/reset-analytics?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch page views count.');
      setViewsCount(data.counts?.pageViews || 0);
      setViewsDeleteStep(1);
    } catch (err) {
      setViewsDeleteError(err.message);
    } finally {
      setViewsPreviewLoading(false);
    }
  };

  const handleViewsReset = async () => {
    setViewsDeleteLoading(true);
    setViewsDeleteError(null);
    try {
      const res = await fetch('/api/admin/reset-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'page_views', confirm: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to reset page views.');
      setViewsDeleteResult(data);
      setViewsDeleteStep(3);
      setViewsCount(0);
      setViewsConfirmText('');
    } catch (err) {
      setViewsDeleteError(err.message);
      setViewsDeleteStep(1);
    } finally {
      setViewsDeleteLoading(false);
    }
  };

  const resetViewsFlow = () => {
    setViewsDeleteStep(0);
    setViewsCount(null);
    setViewsDeleteResult(null);
    setViewsDeleteError(null);
    setViewsConfirmText('');
  };

  // ── Full System Reset Handlers ──
  const fetchFullResetPreview = async () => {
    setFullResetLoading(true);
    setFullResetError(null);
    try {
      const res = await fetch(`/api/admin/reset-analytics?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch counts.');
      setFullResetStats(data.counts);
      setFullResetStep(1);
    } catch (err) {
      setFullResetError(err.message);
    } finally {
      setFullResetLoading(false);
    }
  };

  const handleFullReset = async () => {
    setFullResetLoading(true);
    setFullResetError(null);
    try {
      const res = await fetch('/api/admin/reset-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'all', confirm: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to reset all analytics.');
      setFullResetResult(data);
      setFullResetStep(3);
      setFullResetConfirmText('');
    } catch (err) {
      setFullResetError(err.message);
      setFullResetStep(1);
    } finally {
      setFullResetLoading(false);
    }
  };

  const resetFullFlow = () => {
    setFullResetStep(0);
    setFullResetStats(null);
    setFullResetResult(null);
    setFullResetError(null);
    setFullResetConfirmText('');
  };

  // ── Database Insights ──
  const fetchDbInsights = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch(`/api/admin/health?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setDbInsights(data.checks);
    } catch {}
    finally { setDbLoading(false); }
  }, []);

  useEffect(() => { fetchDbInsights(); }, [fetchDbInsights]);

  // ── Alert Thresholds ──
  const saveAlerts = (key, value) => {
    const updated = { ...alerts, [key]: value };
    setAlerts(updated);
    localStorage.setItem('admin_alert_thresholds', JSON.stringify(updated));
  };

  const toggleAlerts = () => {
    const next = !alertsActive;
    setAlertsActive(next);
    localStorage.setItem('admin_alerts_enabled', String(next));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Slug / ID Inspector */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-600" />
            Quick Invitation Inspector
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Look up any invitation instantly by slug, ID, host email, or phone number.
          </p>
        </div>
        <form onSubmit={handleInspect} className="flex gap-2 items-center">
          <input type="text" placeholder="e.g. rahul-weds-priya or user@example.com" value={inspectSlug}
            onChange={(e) => setInspectSlug(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600" />
          <button type="submit" disabled={inspectLoading || !inspectSlug.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5">
            {inspectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup</span>
          </button>
        </form>
        {inspectError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{inspectError}</span>
          </div>
        )}
        {inspectResult && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {inspectResult.tier} tier
                </span>
                <h4 className="font-bold text-sm text-[var(--ink)] mt-1">
                  {inspectResult.groomName} & {inspectResult.brideName}
                </h4>
                <p className="text-xs text-gray-500 font-mono">Slug: {inspectResult.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onSelectInvitation(inspectResult)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">Manage</button>
                <a href={`/i/${inspectResult.slug}`} target="_blank" rel="noreferrer"
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-emerald-600"><ExternalLink className="w-4 h-4" /></a>
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between pb-1 text-[10px] uppercase font-bold text-gray-400">
                <span>Record Payload</span>
                <button onClick={copyJson} className="text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-semibold">
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56">
                {JSON.stringify(inspectResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DATABASE INSIGHTS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">Database Insights</h4>
              <p className="text-[11px] text-gray-500">Live table counts and storage statistics</p>
            </div>
          </div>
          <button onClick={fetchDbInsights} disabled={dbLoading}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">
            <RefreshCw className={`w-4 h-4 ${dbLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {dbInsights?.tables ? (
          <div className="space-y-4">
            {/* Table Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Object.entries(dbInsights.tables).map(([name, info]) => (
                <div key={name} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{name.replace(/_/g, ' ')}</span>
                  {info.error ? (
                    <span className="text-[10px] text-gray-400 italic mt-1">N/A</span>
                  ) : (
                    <span className="font-display text-lg font-extrabold text-[var(--ink)] mt-0.5">{(info.count || 0).toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold ${
                dbInsights.database?.status === 'healthy' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
              }`}>
                <span>Supabase DB:</span>
                <span className="flex items-center gap-1 font-bold">
                  {dbInsights.database?.status === 'healthy' ? <><CheckCircle2 className="w-3.5 h-3.5" /> {dbInsights.database.latencyMs}ms</> :
                    <><AlertTriangle className="w-3.5 h-3.5" /> Error</>}
                </span>
              </div>
              <div className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold ${
                dbInsights.storage?.status === 'healthy' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
              }`}>
                <span>Storage:</span>
                <span className="flex items-center gap-1 font-bold">
                  {dbInsights.storage?.status === 'healthy' ? <><CheckCircle2 className="w-3.5 h-3.5" /> {dbInsights.storage.latencyMs}ms</> :
                    <><AlertTriangle className="w-3.5 h-3.5" /> Error</>}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-between text-xs font-semibold">
                <span>Rate Limiting:</span>
                <span className="font-bold">Active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            {dbLoading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading database insights...</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Click refresh to load database stats</span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ALERT THRESHOLDS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">Alert Thresholds</h4>
              <p className="text-[11px] text-gray-500">Configure when to flag issues in the Overview tab</p>
            </div>
          </div>
          <button onClick={toggleAlerts}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              alertsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
            }`}>
            {alertsActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            <span>{alertsActive ? 'Active' : 'Disabled'}</span>
          </button>
        </div>

        {alertsActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                Expiring Soon Alert
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="50" value={alerts.expiringSoonThreshold}
                  onChange={(e) => saveAlerts('expiringSoonThreshold', parseInt(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <span className="text-xs text-gray-500">invitations expiring</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                Revenue Milestone Step
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">₹</span>
                <input type="number" min="100" step="100" value={alerts.revenueMilestoneStep}
                  onChange={(e) => saveAlerts('revenueMilestoneStep', parseInt(e.target.value) || 100)}
                  className="w-20 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <span className="text-xs text-gray-500">per milestone</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                Daily Views Drop Alert
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={alerts.dailyViewsDropThreshold}
                  onChange={(e) => saveAlerts('dailyViewsDropThreshold', parseInt(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <span className="text-xs text-gray-500">% drop from avg</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                Low Conversion Alert
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={alerts.lowConversionThreshold}
                  onChange={(e) => saveAlerts('lowConversionThreshold', parseInt(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                <span className="text-xs text-gray-500">% min conversion</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DANGER ZONE — Bulk Draft Cleanup
          ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-red-900 flex items-center gap-2">Danger Zone</h3>
            <p className="text-xs text-red-700/80">Irreversible bulk actions. Proceed with extreme caution.</p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <FileX className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[var(--ink)]">Delete All Draft Invitations</h4>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Permanently remove all unpaid/draft invitations that were never published.
              </p>
            </div>
          </div>

          {draftDeleteStep === 0 && !draftDeleteResult && (
            <div className="space-y-3">
              {draftPreviewError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{draftPreviewError}</span>
                </div>
              )}
              <button onClick={fetchDraftPreview} disabled={draftPreviewLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                {draftPreviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{draftPreviewLoading ? 'Scanning drafts...' : 'Preview Drafts to Delete'}</span>
              </button>
            </div>
          )}

          {draftDeleteStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Found {draftCount} draft invitation{draftCount === 1 ? '' : 's'}</p>
                  <p className="text-xs text-amber-700/80">These will be permanently deleted. This action cannot be undone.</p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {draftList.slice(0, 20).map((d) => (
                  <div key={d.id} className="px-3 py-2 flex items-center justify-between text-xs bg-white">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-[var(--ink)]">{d.groomName} & {d.brideName}</span>
                      <span className="text-[var(--ink-muted)] font-mono ml-2">{d.slug}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">{d.daysOld}d old · {d.ownerEmail}</span>
                  </div>
                ))}
                {draftList.length > 20 && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center bg-gray-50">
                    ...and {draftList.length - 20} more drafts
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDraftDeleteStep(2)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">Proceed to Delete</button>
                <button onClick={resetDraftCleanup}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all">Cancel</button>
              </div>
            </div>
          )}

          {draftDeleteStep === 2 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-800">
                  ⚠️ Confirm deletion of <strong>{draftCount}</strong> draft{draftCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-red-700/80 mt-1">
                  Type <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono font-bold">DELETE ALL DRAFTS</code> below to confirm.
                </p>
              </div>
              <input type="text" placeholder='Type: DELETE ALL DRAFTS' value={typeConfirm}
                onChange={(e) => setTypeConfirm(e.target.value)} autoFocus
                className="w-full px-3.5 py-2 text-xs bg-white border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono" />
              {draftDeleteError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{draftDeleteError}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => { if (typeConfirm === 'DELETE ALL DRAFTS') handleDraftDelete(); }}
                  disabled={typeConfirm !== 'DELETE ALL DRAFTS'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete {draftCount} Draft{draftCount === 1 ? '' : 's'}</span>
                </button>
                <button onClick={resetDraftCleanup}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all">Cancel</button>
              </div>
            </div>
          )}

          {draftDeleteStep === 4 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <Loader2 className="w-5 h-5 text-red-600 animate-spin shrink-0" />
              <p className="text-xs font-bold text-red-800">Deleting all draft invitations... This may take a moment.</p>
            </div>
          )}

          {draftDeleteStep === 5 && draftDeleteResult && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{draftDeleteResult.message}</p>
                  <p className="text-xs text-emerald-700/80 mt-0.5">
                    Deleted by {draftDeleteResult.adminEmail} at {new Date(draftDeleteResult.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={resetDraftCleanup}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /><span>Scan Again</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Reset Page Views & Traffic Analytics ── */}
        <div className="rounded-xl border border-red-200 bg-white p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Eye className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[var(--ink)]">Reset Page Views & Traffic Analytics</h4>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Clears all logged page views, resetting visitor counts, device splits, and traffic charts back to zero.
              </p>
            </div>
          </div>

          {viewsDeleteStep === 0 && !viewsDeleteResult && (
            <div className="space-y-3">
              {viewsDeleteError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{viewsDeleteError}</span>
                </div>
              )}
              <button onClick={fetchViewsPreview} disabled={viewsPreviewLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                {viewsPreviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{viewsPreviewLoading ? 'Scanning page views...' : 'Preview Views to Clear'}</span>
              </button>
            </div>
          )}

          {viewsDeleteStep === 1 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Found {viewsCount} logged page view{viewsCount === 1 ? '' : 's'}</p>
                  <p className="text-xs text-amber-700/80">Clearing page views will reset all traffic graphs, referral tracking, and view counts to 0.</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-800">
                  Type <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono font-bold">RESET VIEWS</code> below to confirm:
                </p>
              </div>
              <input type="text" placeholder='Type: RESET VIEWS' value={viewsConfirmText}
                onChange={(e) => setViewsConfirmText(e.target.value.toUpperCase())} autoFocus
                className="w-full px-3.5 py-2 text-xs bg-white border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono" />
              {viewsDeleteError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{viewsDeleteError}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={handleViewsReset}
                  disabled={viewsDeleteLoading || viewsConfirmText !== 'RESET VIEWS'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                  {viewsDeleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{viewsDeleteLoading ? 'Clearing...' : `Clear ${viewsCount} Page Views`}</span>
                </button>
                <button onClick={resetViewsFlow}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {viewsDeleteStep === 3 && viewsDeleteResult && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{viewsDeleteResult.message}</p>
                  <p className="text-xs text-emerald-700/80 mt-0.5">
                    Cleared at {new Date(viewsDeleteResult.results?.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={resetViewsFlow}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /><span>Done</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Complete Overview & Analytics Reset ── */}
        <div className="rounded-xl border border-red-300 bg-red-100/40 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-950">Complete Overview & Analytics Reset</h4>
              <p className="text-xs text-red-800/80 mt-0.5">
                Full reset: Clears all page views, traffic analytics, and unpaid draft invitations simultaneously for a completely fresh start.
              </p>
            </div>
          </div>

          {fullResetStep === 0 && !fullResetResult && (
            <div className="space-y-3">
              {fullResetError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{fullResetError}</span>
                </div>
              )}
              <button onClick={fetchFullResetPreview} disabled={fullResetLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                {fullResetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                <span>{fullResetLoading ? 'Scanning database...' : 'Preview Full Reset'}</span>
              </button>
            </div>
          )}

          {fullResetStep === 1 && fullResetStats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-red-200 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Page Views</span>
                  <span className="font-extrabold text-[var(--ink)] text-sm">{fullResetStats.pageViews} to be cleared</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Unpaid Drafts</span>
                  <span className="font-extrabold text-[var(--ink)] text-sm">{fullResetStats.drafts} to be deleted</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-800">
                  Type <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono font-bold">RESET ALL</code> below to confirm:
                </p>
              </div>
              <input type="text" placeholder='Type: RESET ALL' value={fullResetConfirmText}
                onChange={(e) => setFullResetConfirmText(e.target.value.toUpperCase())} autoFocus
                className="w-full px-3.5 py-2 text-xs bg-white border-2 border-red-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono" />
              {fullResetError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{fullResetError}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={handleFullReset}
                  disabled={fullResetLoading || fullResetConfirmText !== 'RESET ALL'}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                  {fullResetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{fullResetLoading ? 'Resetting All...' : 'Execute Complete Reset'}</span>
                </button>
                <button onClick={resetFullFlow}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {fullResetStep === 3 && fullResetResult && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{fullResetResult.message}</p>
                  <p className="text-xs text-emerald-700/80 mt-0.5">
                    Completed at {new Date(fullResetResult.results?.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={resetFullFlow}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /><span>Done</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
