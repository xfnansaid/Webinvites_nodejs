'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Sparkles,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import WhatsNewModal from '@/components/WhatsNewModal';
import MaintenanceBanner from '@/components/MaintenanceBanner';

export default function AdminSiteControlsTab({ refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Live preview states
  const [previewWhatsNew, setPreviewWhatsNew] = useState(false);
  const [previewMaintenance, setPreviewMaintenance] = useState(false);

  // Site Configuration Form State
  const [config, setConfig] = useState({
    whatsNew: {
      enabled: true,
      versionTag: 'v2.5',
      title: "What’s New in Web Invites",
      subtitle: 'Latest updates, fixes & enhancements',
      changes: [
        'Fixed & synchronized countdown timers for Modern Navy and Royal Postcard templates.',
        'Enhanced 1-tap Google Maps directions and location pin navigation across all devices.',
        'Optimized mobile performance and high-resolution photo loading.',
        'Added instant WhatsApp RSVP quick confirmation.'
      ],
      buttonText: 'Explore Templates',
      buttonLink: '#templates'
    },
    maintenance: {
      enabled: false,
      title: "We'll Be Right Back!",
      message: "We're making some quick improvements behind the scenes. Everything will be back up and running shortly!",
      estimatedReturn: 'Back in ~15–30 minutes',
      supportWhatsapp: '+91 98460 12345'
    }
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/site-settings?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok && data?.config) {
        setConfig(data.config);
        setNeedsMigration(Boolean(data.needsMigration));
      } else {
        setSaveError(data?.error || 'Failed to load site settings.');
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, refreshTrigger]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save settings.');
      }
      setSaveSuccess('Site settings saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      setSaveError(err.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChangeItem = () => {
    setConfig(prev => ({
      ...prev,
      whatsNew: {
        ...prev.whatsNew,
        changes: [...(prev.whatsNew.changes || []), '']
      }
    }));
  };

  const handleUpdateChangeItem = (index, value) => {
    setConfig(prev => {
      const updated = [...(prev.whatsNew.changes || [])];
      updated[index] = value;
      return {
        ...prev,
        whatsNew: { ...prev.whatsNew, changes: updated }
      };
    });
  };

  const handleRemoveChangeItem = (index) => {
    setConfig(prev => {
      const updated = (prev.whatsNew.changes || []).filter((_, i) => i !== index);
      return {
        ...prev,
        whatsNew: { ...prev.whatsNew, changes: updated }
      };
    });
  };

  const handleResetSeenStatus = () => {
    try {
      localStorage.removeItem(`seen_updates_${config.whatsNew.versionTag}`);
      alert(`Local seen status reset for ${config.whatsNew.versionTag}. Reload the homepage to view.`);
    } catch (e) {}
  };

  const sqlSnippet = `CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow service role full access to site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading Site Controls...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Save Button Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-serif">
            <Sliders className="w-5 h-5 text-emerald-600" />
            Global Site Controls & Announcements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage the hero updates popup, changelog notifications, and scheduled maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Save Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          {saveError}
        </div>
      )}

      {needsMigration && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Database Migration Recommended
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                The <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">site_settings</code> table hasn’t been created in Supabase yet. Run this snippet in your Supabase SQL editor:
              </p>
            </div>
            <button
              onClick={copySql}
              className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>
          <pre className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
            {sqlSnippet}
          </pre>
        </div>
      )}

      {/* ── SECTION 1: What's New / Changelog Popup Controls ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Homepage Updates / "What's New" Popup
              </h3>
              <p className="text-xs text-slate-500">
                Shows a stylish dialog on the homepage hero announcing latest features and updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.whatsNew.enabled}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  whatsNew: { ...prev.whatsNew, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-700">
                {config.whatsNew.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>

            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewWhatsNew(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Preview Modal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Version / Tag
            </label>
            <input
              type="text"
              value={config.whatsNew.versionTag}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                whatsNew: { ...prev.whatsNew, versionTag: e.target.value }
              }))}
              placeholder="e.g. v2.5 Update"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Changing the version tag will prompt visitors again even if they previously dismissed the older update.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Popup Title
            </label>
            <input
              type="text"
              value={config.whatsNew.title}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                whatsNew: { ...prev.whatsNew, title: e.target.value }
              }))}
              placeholder="e.g. What's New in Web Invites"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtitle / Description
            </label>
            <input
              type="text"
              value={config.whatsNew.subtitle}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                whatsNew: { ...prev.whatsNew, subtitle: e.target.value }
              }))}
              placeholder="e.g. Here is what we've recently improved:"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Change Items List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Change Items (Bulleted Features)
            </label>
            <button
              type="button"
              onClick={handleAddChangeItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {(config.whatsNew.changes || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateChangeItem(idx, e.target.value)}
                  placeholder="e.g. Fixed countdown timer calculation in templates"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveChangeItem(idx)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Button Text
            </label>
            <input
              type="text"
              value={config.whatsNew.buttonText}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                whatsNew: { ...prev.whatsNew, buttonText: e.target.value }
              }))}
              placeholder="e.g. Explore Templates"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Button Link
            </label>
            <input
              type="text"
              value={config.whatsNew.buttonLink}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                whatsNew: { ...prev.whatsNew, buttonLink: e.target.value }
              }))}
              placeholder="e.g. #templates"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Maintenance Mode Controls ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${config.maintenance.enabled ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                Site Maintenance Mode
                {config.maintenance.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Temporarily gates public visitors with an announcement screen while keeping Admin routes accessible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.maintenance.enabled}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-700">
                {config.maintenance.enabled ? 'Maintenance ON' : 'Maintenance OFF'}
              </span>
            </label>

            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewMaintenance(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Preview Screen
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Anti-Lockout Protection:</strong> Operators and Admins accessing <code className="font-mono font-bold">/admin</code>, <code className="font-mono font-bold">/signin</code>, and admin APIs will <em>never</em> be blocked.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Maintenance Headline
            </label>
            <input
              type="text"
              value={config.maintenance.title}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                maintenance: { ...prev.maintenance, title: e.target.value }
              }))}
              placeholder="We'll Be Right Back!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Estimated Return / Duration
            </label>
            <input
              type="text"
              value={config.maintenance.estimatedReturn}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                maintenance: { ...prev.maintenance, estimatedReturn: e.target.value }
              }))}
              placeholder="e.g. Back in ~15–30 minutes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Visitor Message
            </label>
            <textarea
              rows={2}
              value={config.maintenance.message}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                maintenance: { ...prev.maintenance, message: e.target.value }
              }))}
              placeholder="We're making some quick improvements behind the scenes. Everything will be back up and running shortly!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Support WhatsApp Number
            </label>
            <input
              type="text"
              value={config.maintenance.supportWhatsapp}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                maintenance: { ...prev.maintenance, supportWhatsapp: e.target.value }
              }))}
              placeholder="+91 98460 12345"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Live Preview Modal for What's New */}
      {previewWhatsNew && (
        <WhatsNewModal
          forceOpen={true}
          onForceClose={() => setPreviewWhatsNew(false)}
          customConfig={config.whatsNew}
        />
      )}

      {/* Live Preview Modal for Maintenance Mode */}
      {previewMaintenance && (
        <MaintenanceBanner
          forceOpen={true}
          onForceClose={() => setPreviewMaintenance(false)}
          customConfig={config.maintenance}
        />
      )}
    </div>
  );
}
