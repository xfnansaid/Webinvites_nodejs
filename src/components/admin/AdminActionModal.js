'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  Crown,
  RotateCcw,
  Archive,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  Music,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function AdminActionModal({ invitation, isOpen, onClose, onActionSuccess }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [customDays, setCustomDays] = useState('14');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !invitation) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = invitation.slug ? `${origin}/i/${invitation.slug}` : '';

  const copyUrl = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (actionType, payload = {}) => {
    setLoadingAction(actionType);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/invitations/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          invitationId: invitation.id,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to perform action.');
      }

      setSuccessMsg(data.message || 'Action executed successfully!');
      if (onActionSuccess) {
        onActionSuccess(invitation.id, actionType, data.invitation);
      }
      setTimeout(() => {
        if (actionType === 'delete') {
          onClose();
        }
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10 transition-all">
        {/* Mobile handle indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 via-white to-amber-50/30">
          <div className="pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ring-1 ${
                invitation.tier === 'free'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-amber-50 text-amber-800 ring-amber-200'
              }`}>
                {invitation.tier === 'free' ? '🌱 Free Tier' : '👑 Premium'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                invitation.isExpired
                  ? 'bg-red-100 text-red-700'
                  : invitation.isExpiringSoon
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {invitation.isExpired ? 'Expired' : invitation.isExpiringSoon ? 'Expiring Soon' : 'Active'}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl text-[var(--ink)] font-bold mt-1.5">
              {invitation.groomName} & {invitation.brideName}
            </h3>
            <p className="text-xs text-[var(--ink-muted)] flex items-center gap-1.5 mt-0.5 truncate">
              <span>Slug:</span>
              <span className="font-mono text-emerald-700 font-semibold">{invitation.slug}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body content (scrollable) */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Metadata quick row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Template</span>
              <span className="font-semibold text-gray-800 truncate block">{invitation.templateId || 'Default'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Event Date</span>
              <span className="font-semibold text-gray-800 block">{invitation.eventDate || 'Not set'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Edits Used</span>
              <span className="font-semibold text-gray-800 block">{invitation.editCount || 0} / 3 edits</span>
            </div>
            <div className="col-span-2 sm:col-span-3 pt-1.5 border-t border-gray-200/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
              {invitation.ownerEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" /> {invitation.ownerEmail}
                </span>
              )}
              {invitation.ownerPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> {invitation.ownerPhone}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action 1: Extend Expiry */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/80">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Extend Invitation Expiry</span>
            </div>
            <p className="text-xs text-emerald-800/80 mb-3">
              Instantly grant more live days to this invitation.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                disabled={!!loadingAction}
                onClick={() => handleAction('extend_expiry', { days: 7 })}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                +7 Days
              </button>
              <button
                disabled={!!loadingAction}
                onClick={() => handleAction('extend_expiry', { days: 14 })}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                +14 Days
              </button>
              <button
                disabled={!!loadingAction}
                onClick={() => handleAction('extend_expiry', { days: 30 })}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                +30 Days
              </button>
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-14 px-2 py-1 text-xs border border-gray-300 rounded-lg text-center font-bold"
                />
                <button
                  disabled={!!loadingAction || !customDays}
                  onClick={() => handleAction('extend_expiry', { days: parseInt(customDays, 10) || 7 })}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action 2: Change Tier & Reset Edits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Tier Management</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mb-2.5">
                Current: <strong className="uppercase">{invitation.tier}</strong>
              </p>
              {invitation.tier === 'free' ? (
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleAction('set_tier', { tier: 'premium' })}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade to Premium
                </button>
              ) : (
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleAction('set_tier', { tier: 'free' })}
                  className="w-full py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Downgrade to Free
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Host Edit Limit</span>
              </div>
              <p className="text-[11px] text-blue-800/80 mb-2.5">
                Restores 3 fresh edits for the host.
              </p>
              <button
                disabled={!!loadingAction || invitation.editCount === 0}
                onClick={() => handleAction('reset_edits')}
                className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Edit Count
              </button>
            </div>
          </div>

          {/* Links & Direct Access */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Links & Sharing</span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono text-gray-700 select-all"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`/i/${invitation.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            </div>
          </div>

          {/* Destructive Zone */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Invitation</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between bg-red-50 p-2.5 rounded-xl border border-red-200">
                <span className="text-xs text-red-700 font-bold">Are you sure? This cannot be undone.</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!!loadingAction}
                    onClick={() => handleAction('delete')}
                    className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    {loadingAction === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
