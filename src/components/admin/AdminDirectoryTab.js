'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Crown,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Music,
  MoreVertical,
  SlidersHorizontal,
  X,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
} from 'lucide-react';

export default function AdminDirectoryTab({ onSelectInvitation }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [status, setStatus] = useState('all');
  const [expiry, setExpiry] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: debouncedSearch,
        tier,
        status,
        expiry,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/invitations?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to fetch invitations`);
      }

      setInvitations(data.invitations || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error('[AdminDirectoryTab] Fetch error:', err);
      setError(err.message || 'Failed to load invitations.');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, tier, status, expiry, sortBy, sortOrder]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const activeFiltersCount =
    (tier !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (expiry !== 'all' ? 1 : 0) +
    (search ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setTier('all');
    setStatus('all');
    setExpiry('all');
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Filter Bar */}
      <div className="bg-white/95 border border-white/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_20px_rgba(15,56,44,0.05)]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by couple, slug, email, phone, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Filter Chips / Mobile Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={`sm:hidden flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
            </button>

            <a
              href="/api/admin/export?type=invitations"
              download
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
              title="Download all invitations as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>

            <button
              type="button"
              onClick={fetchInvitations}
              disabled={loading}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
              title="Refresh invitations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </form>

        {/* Filters Row (always on desktop, collapsible on mobile) */}
        <div className={`mt-3 pt-3 border-t border-gray-100 sm:flex flex-wrap items-center gap-3 ${showFiltersMobile ? 'block' : 'hidden sm:flex'}`}>
          {/* Tier filter */}
          <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tier:</span>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
              {['all', 'free', 'premium'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTier(t); setPage(1); }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    tier === t ? 'bg-white text-[var(--ink)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 font-semibold text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="paid">Published (Paid)</option>
              <option value="draft">Draft (Unpaid)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Expiry filter */}
          <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expiry:</span>
            <select
              value={expiry}
              onChange={(e) => { setExpiry(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 font-semibold text-gray-700"
            >
              <option value="all">All Lifecycles</option>
              <option value="active">Active Only</option>
              <option value="expiring_soon">Expiring Soon (≤3d)</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 font-semibold text-gray-700"
            >
              <option value="created_at">Date Created</option>
              <option value="paid_at">Date Paid</option>
              <option value="wedding_date">Event Date</option>
              <option value="edit_count">Edits Count</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchInvitations}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between px-1 text-xs text-[var(--ink-muted)]">
        <span>Found <strong>{totalCount}</strong> invitations</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading invitations directory...</p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-16 text-center bg-white/60 rounded-2xl border border-white/80 p-6">
          <p className="text-sm font-bold text-[var(--ink)]">No invitations match your search & filters</p>
          <p className="text-xs text-gray-500 mt-1">Try clearing filters or search by a different name/slug.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (hidden on mobile) */}
          <div className="hidden lg:block bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                    <th className="py-3 px-4">Couple / Slug</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-3">Template</th>
                    <th className="py-3 px-3">Event Date</th>
                    <th className="py-3 px-3">Owner / Contact</th>
                    <th className="py-3 px-3">Lifecycle / Expiry</th>
                    <th className="py-3 px-3 text-center">Edits</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-emerald-50/40 transition-colors group">
                      {/* Couple & Slug */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--ink)] text-sm">
                          {inv.groomName} {inv.brideName ? `& ${inv.brideName}` : ''}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-emerald-700 text-[11px] font-medium">{inv.slug}</span>
                          <a
                            href={`/i/${inv.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Open live invitation"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ring-1 ${
                          inv.tier === 'free'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-amber-50 text-amber-800 ring-amber-200'
                        }`}>
                          {inv.tier === 'free' ? '🌱 Free' : '👑 ₹399'}
                        </span>
                      </td>

                      {/* Template */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-700 truncate max-w-[120px]" title={inv.templateId}>
                          {inv.templateId || 'Default'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                          {inv.hasPhoto && <ImageIcon className="w-3 h-3 text-emerald-600" title="Photo attached" />}
                          {inv.audioTrack && <Music className="w-3 h-3 text-blue-600" title="Audio selected" />}
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-700">{inv.eventDate || '—'}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{inv.venue}</div>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-700 truncate max-w-[140px]" title={inv.ownerEmail}>
                          {inv.ownerEmail || '—'}
                        </div>
                        <div className="text-[10px] text-gray-400">{inv.ownerPhone || ''}</div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-3">
                        {inv.isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            Expired
                          </span>
                        ) : inv.isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            {inv.daysRemaining}d left
                          </span>
                        ) : inv.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {inv.daysRemaining !== null ? `${inv.daysRemaining}d left` : 'Active'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400">Draft (Unpaid)</span>
                        )}
                      </td>

                      {/* Edits */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono text-xs font-bold ${
                          inv.editCount >= 3 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {inv.editCount}/3
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectInvitation(inv)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE ADAPTIVE CARDS (hidden on desktop) */}
          <div className="block lg:hidden space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] p-4 space-y-3 transition-all"
              >
                {/* Top Row: Couple Name & Tier */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-base text-[var(--ink)] leading-tight">
                      {inv.groomName} {inv.brideName ? `& ${inv.brideName}` : ''}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-emerald-700 font-semibold">{inv.slug}</span>
                      <a
                        href={`/i/${inv.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-emerald-600 p-0.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ring-1 ${
                    inv.tier === 'free'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-amber-50 text-amber-800 ring-amber-200'
                  }`}>
                    {inv.tier === 'free' ? '🌱 Free' : '👑 ₹399'}
                  </span>
                </div>

                {/* Middle details grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100 bg-gray-50/50 rounded-xl p-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Template</span>
                    <span className="font-semibold text-gray-800 truncate block">{inv.templateId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Event Date</span>
                    <span className="font-semibold text-gray-800 block">{inv.eventDate || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Status / Expiry</span>
                    {inv.isExpired ? (
                      <span className="text-red-600 font-bold">Expired</span>
                    ) : inv.isExpiringSoon ? (
                      <span className="text-amber-700 font-bold">{inv.daysRemaining}d left</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">{inv.isPaid ? 'Active' : 'Draft'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Edits Used</span>
                    <span className="font-semibold text-gray-800 block">{inv.editCount}/3 edits</span>
                  </div>
                </div>

                {/* Owner info */}
                {inv.ownerEmail && (
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{inv.ownerEmail}</span>
                  </div>
                )}

                {/* Bottom Action Button */}
                <button
                  onClick={() => onSelectInvitation(inv)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <span>Manage & Actions</span>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between bg-white/95 rounded-2xl border border-white/80 p-3 shadow-sm text-xs">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 font-bold text-gray-700 flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-gray-600 font-semibold">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 font-bold text-gray-700 flex items-center gap-1 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
