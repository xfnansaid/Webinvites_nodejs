'use client';

/**
 * Reusable Skeleton primitive with shimmer animation.
 *
 * <Skeleton className="h-4 w-32 rounded" />
 * <Skeleton className="h-10 w-10 rounded-2xl" />  // circle-ish
 *
 * Shimmer runs via CSS only — no JS timers, no layout thrash.
 */

export default function Skeleton({ className = '', style, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-stone-200/70 ${className}`}
      style={{
        ...style,
      }}
      {...props}
    >
      {/* Shimmer gradient overlay */}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 60%, transparent 100%)',
        }}
      />
    </div>
  );
}
