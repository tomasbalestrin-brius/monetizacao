
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  className?: string;
  height?: number;
}

export function ChartSkeleton({ className, height = 350 }: ChartSkeletonProps) {
  // Generate random heights for bars
  const barHeights = [60, 80, 45, 90, 70, 85, 55, 75, 65, 95, 50, 88];
  
  return (
    <div
      className={cn(
        "p-6 rounded-xl bg-card border border-border",
        className
      )}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-32 rounded skeleton-shimmer" />
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full skeleton-shimmer" />
            <div className="h-3 w-16 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full skeleton-shimmer" />
            <div className="h-3 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
      
      {/* Chart area */}
      <div className="flex items-end justify-between h-48 gap-2 px-4">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-shimmer"
            style={{ 
              height: `${h}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-10 rounded skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}
