'use client';

import Skeleton from '@/components/ui/Skeleton';

/**
 * Skeleton loader that mirrors the dashboard layout:
 *   - Top bar (logo + user pill)
 *   - 3 summary stat cards
 *   - "Your Invitations" heading
 *   - 2-column grid of invitation cards (2 placeholders)
 */
export default function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24">

        {/* ── Top Bar ── */}
        <div className="flex flex-wrap items-center gap-3 justify-between mb-7 sm:mb-10">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-2.5 w-36 rounded-lg" />
            </div>
          </div>
          {/* User pill */}
          <div className="flex items-center gap-2.5 px-1.5 pr-3.5 py-1.5 rounded-2xl bg-white ring-1 ring-black/5 border border-stone-100">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-2 w-20 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
        </div>

        {/* ── Summary Cards (3-up) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-white/90 border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] p-5 sm:p-6 flex items-center gap-4"
            >
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-24 rounded" />
                <Skeleton className="h-8 w-14 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* ── "Your Invitations" heading ── */}
        <div className="flex items-end justify-between mb-3 sm:mb-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>

        {/* ── Invitation Card Grid (2 placeholders) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-stone-200/80 shadow-[0_12px_36px_rgba(15,56,44,0.06)] overflow-hidden bg-white"
            >
              {/* Header strip skeleton */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-stone-50/80 border-b border-black/[0.04]">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
              </div>

              {/* Main details area skeleton */}
              <div className="p-5 sm:p-6 text-center border-b border-black/[0.04] space-y-2">
                <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
                <Skeleton className="h-3.5 w-36 mx-auto rounded" />
                <Skeleton className="h-3 w-40 mx-auto rounded" />
              </div>

              {/* Card body & actions skeleton */}
              <div className="p-4 sm:p-5 space-y-2.5">
                {/* Share URL row */}
                <Skeleton className="h-9 w-full rounded-xl" />
                {/* Buttons row */}
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 w-20 rounded-xl" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
                {/* Upgrade banner skeleton */}
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
