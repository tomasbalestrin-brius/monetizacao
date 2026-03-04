import { cn } from '@/lib/utils';

interface MetricCardSkeletonProps {
  className?: string;
  showProgress?: boolean;
}

export function MetricCardSkeleton({ className, showProgress = false }: MetricCardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
        
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-3 w-16 rounded skeleton-shimmer" />
          
          {/* Value */}
          <div className="h-6 w-20 rounded skeleton-shimmer" />
        </div>
      </div>
      
      {showProgress && (
        <div className="mt-3 h-2 w-full rounded-full skeleton-shimmer" />
      )}
    </div>
  );
}

export function MetricCardSkeletonGrid({ count = 7 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} showProgress={i === 2 || i === 5} />
      ))}
    </div>
  );
}
