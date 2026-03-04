import { cn } from '@/lib/utils';

interface SDRCardSkeletonProps {
  className?: string;
}

export function SDRCardSkeleton({ className }: SDRCardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        
        <div className="flex-1 space-y-2">
          {/* Name */}
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          {/* Type badge */}
          <div className="h-3 w-16 rounded-full skeleton-shimmer" />
        </div>
      </div>
      
      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-12 rounded skeleton-shimmer" />
            <div className="h-5 w-8 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-2.5 w-16 rounded skeleton-shimmer" />
          <div className="h-2.5 w-8 rounded skeleton-shimmer" />
        </div>
        <div className="h-2 w-full rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SDRCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SDRCardSkeleton key={i} />
      ))}
    </div>
  );
}
