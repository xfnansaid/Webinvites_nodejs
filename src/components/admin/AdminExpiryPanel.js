'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  HardDrive,
  Wrench,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Clock,
  Sparkles,
  Heart,
  Activity,
} from 'lucide-react';

import AdminOverviewTab from './AdminOverviewTab';
import AdminDirectoryTab from './AdminDirectoryTab';
import AdminRevenueTab from './AdminRevenueTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminMediaTab from './AdminMediaTab';
import AdminToolsTab from './AdminToolsTab';
import AdminSiteControlsTab from './AdminSiteControlsTab';
import AdminGuestEngagementTab from './AdminGuestEngagementTab';
import AdminPerformanceTab from './AdminPerformanceTab';
import AdminActionModal from './AdminActionModal';
import { Sliders } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview & Expiry', icon: BarChart3, badge: null },
  { id: 'directory', label: 'Invitations Directory', icon: Users, badge: null },
  { id: 'revenue', label: 'Revenue & Orders', icon: DollarSign, badge: null },
  { id: 'controls', label: 'Site Controls', icon: Sliders, badge: null },
  { id: 'analytics', label: 'Traffic & Analytics', icon: TrendingUp, badge: null },
  { id: 'engagement', label: 'Guest Engagement', icon: Heart, badge: null },
  { id: 'performance', label: 'System Health', icon: Activity, badge: null },
  { id: 'media', label: 'Media & Storage', icon: HardDrive, badge: null },
  { id: 'tools', label: 'Quick Tools', icon: Wrench, badge: null },
];

export default function AdminExpiryPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [error, setError] = useState(null);

  // Selected invitation for the Action Modal
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expiry-stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (res.status === 403) throw new Error('Access denied. This page is only accessible to authorized administrator accounts.');
      if (!res.ok) throw new Error(`Failed to fetch admin stats (${res.status})`);
      const data = await res.json();
      setStatsData(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load admin stats.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshingAll(true);
    setRefreshTrigger((prev) => prev + 1);
    try { await fetchStats(true); }
    finally { setTimeout(() => setRefreshingAll(false), 500); }
  }, [fetchStats]);

  const handleOpenActionModal = (invitation) => { setSelectedInvite(invitation); setIsModalOpen(true); };
  const handleCloseActionModal = () => { setIsModalOpen(false); setSelectedInvite(null); };
  const handleActionSuccess = () => { handleRefreshAll(); };

  if (loading && !statsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-[var(--ink-muted)]">Authenticating and loading Admin Command Center...</p>
      </div>
    );
  }

  if (error && !statsData) {
    return (
      <div className="rounded-3xl bg-red-50/80 border border-red-200 p-6 sm:p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-red-900">Admin Access Required</h3>
        <p className="text-xs sm:text-sm text-red-700 mt-1.5 leading-relaxed">{error}</p>
        <button onClick={handleRefreshAll} className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-1.5 shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" /><span>Retry</span>
        </button>
      </div>
    );
  }

  const expiringAlertCount = statsData?.expiry?.expiringSoonFree || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-white/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,56,44,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"><ShieldCheck className="w-4 h-4" /></span>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--ink)] tracking-tight">Admin Command Center</h1>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">Real-time management for invitations, lifecycles, revenue, and guest analytics.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {lastRefreshedAt && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Synced {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </span>
          )}
          <button onClick={handleRefreshAll} disabled={refreshingAll || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingAll ? 'animate-spin' : ''}`} />
            <span>{refreshingAll ? 'Refreshing All...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-1.5 shadow-[0_4px_20px_rgba(15,56,44,0.05)] overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 sm:space-x-2 min-w-max" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${isActive ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/60'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'overview' && expiringAlertCount > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                    {expiringAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Panel Content */}
      <div className="transition-all duration-300">
        {activeTab === 'overview' && (
          <AdminOverviewTab data={statsData} onSelectInvitation={handleOpenActionModal} onRefresh={handleRefreshAll} onSwitchTab={setActiveTab} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'directory' && (
          <AdminDirectoryTab onSelectInvitation={handleOpenActionModal} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'revenue' && (
          <AdminRevenueTab data={statsData} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'controls' && (
          <AdminSiteControlsTab refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'analytics' && (
          <AdminAnalyticsTab refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'engagement' && (
          <AdminGuestEngagementTab refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'performance' && (
          <AdminPerformanceTab refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'media' && (
          <AdminMediaTab refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'tools' && (
          <AdminToolsTab onSelectInvitation={handleOpenActionModal} refreshTrigger={refreshTrigger} />
        )}
      </div>

      {/* Shared Action Modal */}
      <AdminActionModal invitation={selectedInvite} isOpen={isModalOpen} onClose={handleCloseActionModal} onActionSuccess={handleActionSuccess} />
    </div>
  );
}
