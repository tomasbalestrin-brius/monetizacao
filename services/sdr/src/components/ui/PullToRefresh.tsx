import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, isPulling, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    disabled,
  });

  const progress = Math.min(pullDistance / 80, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;
  const readyToRefresh = progress >= 1;

  return (
    <div
      className={cn("relative", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 48, -48),
          transform: `translateX(-50%) rotate(${pullDistance * 2}deg)`,
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
            readyToRefresh || isRefreshing
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "w-5 h-5 transition-transform duration-200",
                readyToRefresh && "rotate-180"
              )} 
            />
          )}
        </div>
      </div>

      {/* Content with pull transformation */}
      <div
        className={cn(
          "transition-transform duration-200",
          !isPulling && !isRefreshing && "transition-transform"
        )}
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
