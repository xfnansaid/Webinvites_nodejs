'use client';

import Skeleton from '@/components/ui/Skeleton';

/**
 * Skeleton loader that mirrors a wedding invitation layout.
 * Used as the Suspense fallback on /i/[slug] while the template loads.
 */
export default function InvitationSkeleton() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Hero image */}
        <Skeleton className="w-full aspect-[4/3] rounded-3xl" />

        {/* Couple names */}
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-56 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-10 mx-auto rounded-full" />
          <Skeleton className="h-8 w-48 mx-auto rounded-xl" />
        </div>

        {/* Date & venue */}
        <div className="text-center space-y-2">
          <Skeleton className="h-3 w-40 mx-auto rounded" />
          <Skeleton className="h-3 w-32 mx-auto rounded" />
        </div>

        {/* Divider */}
        <Skeleton className="h-px w-32 mx-auto rounded" />

        {/* Details block */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 mx-auto rounded" />
          <Skeleton className="h-3 w-4/6 mx-auto rounded" />
        </div>

        {/* Map placeholder */}
        <Skeleton className="w-full h-36 rounded-2xl" />

        {/* Countdown block */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1.5">
              <Skeleton className="w-14 h-14 rounded-xl" />
              <Skeleton className="h-2 w-10 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
