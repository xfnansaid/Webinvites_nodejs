'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import AdminExpiryPanel from '@/components/admin/AdminExpiryPanel';
import SiteNavbar from '@/components/SiteNavbar';

/**
 * Admin Dashboard — Expiry & Revenue Panel
 * Accessible only to admin users (ADMIN_EMAILS env var).
 */
export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
      <SiteNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-light)]/60 text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 ring-1 ring-red-200 text-red-800 text-xs font-bold">
            <Shield className="w-4 h-4" />
            Admin Only
          </div>
        </div>

        {/* Admin Panel */}
        <AdminExpiryPanel />
      </div>
    </main>
  );
}
