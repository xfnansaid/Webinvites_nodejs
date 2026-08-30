'use client';

import Skeleton from '@/components/ui/Skeleton';

/**
 * Skeleton loader that mirrors the editor layout:
 *   - Sticky header bar (back link + editing pill + save button)
 *   - Two-column grid: phone preview (left) + form sidebar (right)
 */
export default function EditPageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream)] via-white to-[var(--emerald-light)]/40">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-[120] backdrop-blur bg-white/75 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Back link */}
          <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
          {/* Editing pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white ring-1 ring-black/5 shadow-sm">
            <Skeleton className="w-4 h-4 rounded shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-12 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
          {/* Right side: badges + save button */}
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* ── Editor Grid ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-[230px] sm:pb-[250px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 items-start">

          {/* LEFT: Phone preview frame */}
          <section className="order-2 lg:order-1 w-full pb-24 sm:pb-28">
            <div className="w-full flex justify-center lg:justify-end">
              <div
                className="relative w-full max-w-[400px] sm:max-w-[400px] lg:max-w-[440px] shrink-0 rounded-[54px] sm:rounded-[58px] border-[10px] sm:border-[12px] border-[#0f172a] shadow-2xl shadow-slate-900/40 overflow-hidden"
                style={{ aspectRatio: '393 / 852' }}
              >
                {/* Dynamic Island */}
                <div className="absolute top-[6px] sm:top-2 left-1/2 -translate-x-1/2 w-[90px] sm:w-[100px] h-[23px] sm:h-7 bg-black rounded-full z-[90]" />
                {/* Content area */}
                <div className="absolute inset-0 pt-[34px] sm:pt-[40px] px-5 space-y-5">
                  {/* Hero image placeholder */}
                  <Skeleton className="w-full h-48 rounded-2xl" />
                  {/* Title lines */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 mx-auto rounded-lg" />
                    <Skeleton className="h-3 w-1/2 mx-auto rounded" />
                  </div>
                  {/* Date/venue */}
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-40 mx-auto rounded" />
                    <Skeleton className="h-3 w-28 mx-auto rounded" />
                  </div>
                  {/* Details block */}
                  <div className="space-y-3 mt-4">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-5/6 rounded" />
                    <Skeleton className="h-3 w-4/6 rounded" />
                  </div>
                  {/* Map placeholder */}
                  <Skeleton className="w-full h-32 rounded-2xl mt-4" />
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Form sidebar */}
          <section className="order-1 lg:order-2 w-full space-y-4">
            {/* Form cards — 3 skeleton cards */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-white/90 border-2 border-white/60 shadow-[0_18px_40px_rgba(15,56,44,0.08)] p-5 space-y-4"
              >
                {/* Card header */}
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
                {/* Form fields */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-20 rounded" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-24 rounded" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
