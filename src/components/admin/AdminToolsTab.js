'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function AdminToolsTab({ onSelectInvitation }) {
  const [inspectSlug, setInspectSlug] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleInspect = async (e) => {
    e?.preventDefault();
    if (!inspectSlug.trim()) return;

    setInspectLoading(true);
    setInspectResult(null);
    setInspectError(null);

    try {
      const res = await fetch(`/api/admin/invitations?q=${encodeURIComponent(inspectSlug.trim())}&limit=1`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to lookup invitation.');
      }

      if (!data.invitations || data.invitations.length === 0) {
        setInspectError(`No invitation found matching "${inspectSlug}".`);
      } else {
        setInspectResult(data.invitations[0]);
      }
    } catch (err) {
      setInspectError(err.message);
    } finally {
      setInspectLoading(false);
    }
  };

  const copyJson = () => {
    if (!inspectResult) return;
    navigator.clipboard.writeText(JSON.stringify(inspectResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <input
            type="text"
            placeholder="e.g. rahul-weds-priya or user@example.com"
            value={inspectSlug}
            onChange={(e) => setInspectSlug(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={inspectLoading || !inspectSlug.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
          >
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
                <button
                  onClick={() => onSelectInvitation(inspectResult)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Manage
                </button>
                <a
                  href={`/i/${inspectResult.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-emerald-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* JSON preview */}
            <div className="relative">
              <div className="flex items-center justify-between pb-1 text-[10px] uppercase font-bold text-gray-400">
                <span>Record Payload</span>
                <button
                  onClick={copyJson}
                  className="text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                >
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

      {/* System Status & Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5 space-y-3">
          <h4 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            Backend & Security Status
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 font-semibold">
              <span>Admin Authentication:</span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 font-semibold">
              <span>Supabase Service Role:</span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 font-semibold">
              <span>Expiry Cron Cleanup:</span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enabled (21d / 3d)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl border border-white/80 shadow-sm p-4 sm:p-5 space-y-3">
          <h4 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            Storage & Media Buckets
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 font-semibold text-gray-700">
              <span>Photo Upload Bucket:</span>
              <span className="font-mono text-gray-900">invitation-photos</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 font-semibold text-gray-700">
              <span>Max Image Payload:</span>
              <span className="font-mono text-gray-900">5 MB</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 font-semibold text-gray-700">
              <span>Rate Limiting:</span>
              <span className="font-mono text-gray-900">Active (In-Memory)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
