'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  HardDrive,
  Sparkles,
  ShieldCheck,
  X,
  Eye,
} from 'lucide-react';

export default function AdminMediaTab() {
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [filter, setFilter] = useState('all'); // 'all' | 'in_use' | 'orphans'
  const [search, setSearch] = useState('');
  const [confirmPurgeModal, setConfirmPurgeModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to scan media storage.');
      }
      setMediaData(data);
    } catch (err) {
      console.error('[AdminMediaTab] Fetch error:', err);
      setError(err.message || 'Failed to load media storage data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handlePurgeOrphans = async () => {
    const orphanPhotos = (mediaData?.files || []).filter((f) => f.isOrphan);
    const orphanPaths = orphanPhotos.map((f) => f.path);

    if (orphanPaths.length === 0) {
      setConfirmPurgeModal(false);
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Optimistic UI update: Remove orphans from current view immediately
    const remainingFiles = (mediaData?.files || []).filter((f) => !f.isOrphan);
    setMediaData((prev) => ({
      ...prev,
      stats: {
        ...(prev?.stats || {}),
        orphanCount: 0,
        orphanSizeBytes: 0,
        orphanSizeFormatted: '0 KB',
      },
      files: remainingFiles,
    }));

    try {
      const res = await fetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge_orphans', paths: orphanPaths }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to purge orphan photos.');
      }

      setSuccessMsg(data.message || `Successfully purged ${orphanPaths.length} orphan photos.`);
      setConfirmPurgeModal(false);
      // Synchronize with backend fresh data
      setTimeout(() => {
        fetchMedia();
      }, 500);
    } catch (err) {
      setError(err.message || 'Error occurred while purging files.');
      // Restore on failure
      fetchMedia();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSingleFile = async (filePath) => {
    if (!window.confirm(`Permanently delete "${filePath}" from storage?`)) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Optimistic UI update
    setMediaData((prev) => ({
      ...prev,
      files: (prev?.files || []).filter((f) => f.path !== filePath),
    }));

    try {
      const res = await fetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_file', path: filePath }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete file.');
      }

      setSuccessMsg(data.message || 'File deleted successfully.');
      setTimeout(() => {
        fetchMedia();
      }, 500);
    } catch (err) {
      setError(err.message);
      fetchMedia();
    } finally {
      setActionLoading(false);
    }
  };

  const stats = mediaData?.stats || {};
  const allFiles = mediaData?.files || [];

  const filteredFiles = allFiles.filter((f) => {
    if (filter === 'in_use' && f.isOrphan) return false;
    if (filter === 'orphans' && !f.isOrphan) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(q);
      const matchPath = f.path?.toLowerCase().includes(q);
      const matchSlug = f.linkedSlug?.toLowerCase().includes(q);
      const matchCouple = f.linkedCouple?.toLowerCase().includes(q);
      return matchName || matchPath || matchSlug || matchCouple;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Top Storage Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Bucket Storage</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-2">
            {stats.totalSizeFormatted || '0 KB'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {stats.totalFiles || 0} total photos stored
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Active Photos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {stats.activeCount || 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Linked to live invitations</div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Orphan Photos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-rose-700 mt-2">
            {stats.orphanCount || 0}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1 font-semibold">
            {stats.orphanSizeFormatted || '0 KB'} wasted space
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-white/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">Storage Cleanup</span>
            <div className="text-xs text-gray-600 mt-1">
              Delete unlinked draft images
            </div>
          </div>

          <button
            type="button"
            disabled={actionLoading || (stats.orphanCount || 0) === 0}
            onClick={() => setConfirmPurgeModal(true)}
            className="w-full mt-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Purge All Orphans ({stats.orphanCount || 0})</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal Popup for Purging */}
      {confirmPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => !actionLoading && setConfirmPurgeModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-display text-lg font-bold text-gray-900">
                Purge {stats.orphanCount} Orphan Photo{stats.orphanCount === 1 ? '' : 's'}?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                This will permanently delete all {stats.orphanCount} unlinked photos and instantly reclaim <strong>{stats.orphanSizeFormatted}</strong> of Supabase storage space. Active invitation photos are safe and will not be affected.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmPurgeModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePurgeOrphans}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Purge All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl max-h-[85vh] bg-stone-900 rounded-2xl overflow-hidden p-2 flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white/95 rounded-2xl border border-white/80 p-3 sm:p-4 shadow-[0_4px_20px_rgba(15,56,44,0.05)]">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, slug, or couple name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === 'all' ? 'bg-white text-[var(--ink)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({allFiles.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('in_use')}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === 'in_use' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                In Use ({stats.activeCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilter('orphans')}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === 'orphans' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orphans ({stats.orphanCount || 0})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMedia}
              disabled={loading}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              title="Refresh storage files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading && !mediaData ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl border border-white/80">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Scanning Supabase Storage bucket...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center bg-white/60 rounded-2xl border border-white/80 p-6">
          <p className="text-sm font-bold text-[var(--ink)]">No media files found</p>
          <p className="text-xs text-gray-500 mt-1">Bucket is currently empty or no photos match filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className="group bg-white/95 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(15,56,44,0.05)] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              {/* Image Preview Thumbnail */}
              <div
                onClick={() => file.publicUrl && setPreviewImage(file.publicUrl)}
                className="relative h-36 bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer"
              >
                {file.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ${
                    file.isOrphan
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {file.isOrphan ? '⚠️ Orphan' : '✓ In Use'}
                  </span>
                </div>

                {/* Size Badge */}
                <div className="absolute bottom-2 right-2">
                  <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                    {file.sizeFormatted}
                  </span>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  {file.linkedCouple ? (
                    <p className="font-bold text-xs text-[var(--ink)] truncate" title={file.linkedCouple}>
                      {file.linkedCouple}
                    </p>
                  ) : (
                    <p className="font-bold text-xs text-rose-700 truncate">
                      Unlinked / Abandoned
                    </p>
                  )}
                  {file.linkedSlug && (
                    <p className="text-[10px] text-emerald-700 font-mono truncate">
                      /i/{file.linkedSlug}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1 text-xs">
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-emerald-700 transition-colors"
                    title="Open original photo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDeleteSingleFile(file.path)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors ml-auto cursor-pointer"
                    title="Delete photo from storage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
