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
              className="rounded-3xl border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] overflow-hidden bg-white/90"
            >
              {/* Preview strip */}
              <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
                <div className="absolute inset-0 grid place-items-center p-5">
                  <div className="space-y-2 text-center w-full max-w-[200px]">
                    <Skeleton className="h-5 w-40 mx-auto rounded-lg" />
                    <Skeleton className="h-3 w-28 mx-auto rounded" />
                    <Skeleton className="h-3 w-20 mx-auto rounded" />
                  </div>
                </div>
                {/* Status badge placeholder */}
                <div className="absolute top-3 left-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                {/* Template badge placeholder */}
                <div className="absolute top-3 right-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Share URL row */}
                <Skeleton className="h-10 w-full rounded-2xl" />
                {/* Buttons row */}
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-2xl" />
                  <Skeleton className="h-9 flex-1 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
