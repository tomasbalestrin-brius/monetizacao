
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ className, rows = 5, columns = 7 }: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="bg-muted/30 p-4 border-b border-border">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 rounded skeleton-shimmer",
                i === 0 ? "w-24" : "flex-1"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="p-4 flex gap-4"
            style={{ animationDelay: `${rowIndex * 0.05}s` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  "h-4 rounded skeleton-shimmer",
                  colIndex === 0 ? "w-24" : "flex-1"
                )}
                style={{ animationDelay: `${(rowIndex + colIndex) * 0.03}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
