import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Users, Calendar, TrendingUp, UserCheck, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { SDRMetricCard } from './SDRMetricCard';
import { SDRChart } from './SDRChart';
import { SDRDataTable } from './SDRDataTable';
import { useSDRs, useSDRMetrics, type SDRAggregatedMetrics, type SDRMetric } from '@/hooks/useSdrMetrics';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { MetricCardSkeletonGrid, ChartSkeleton, TableSkeleton } from '@/components/dashboard/skeletons';
import { cn } from '@/lib/utils';

interface SDRDetailPageProps {
  sdrId: string;
  periodStart?: string;
  periodEnd?: string;
  onPeriodChange: (start: string | undefined, end: string | undefined) => void;
  onBack: () => void;
}

// Calculate aggregated metrics from an array of metrics
function calculateAggregatedMetrics(metrics: SDRMetric[]): SDRAggregatedMetrics {
  if (metrics.length === 0) {
    return {
      totalActivated: 0,
      totalScheduled: 0,
      avgScheduledRate: 0,
      totalScheduledSameDay: 0,
      totalAttended: 0,
      avgAttendanceRate: 0,
      totalSales: 0,
      avgConversionRate: 0,
    };
  }

  const totalActivated = metrics.reduce((sum, m) => sum + (m.activated || 0), 0);
  const totalScheduled = metrics.reduce((sum, m) => sum + (m.scheduled || 0), 0);
  const totalScheduledSameDay = metrics.reduce((sum, m) => sum + (m.scheduled_same_day || 0), 0);
  const totalAttended = metrics.reduce((sum, m) => sum + (m.attended || 0), 0);
  const totalSales = metrics.reduce((sum, m) => sum + (m.sales || 0), 0);

  const avgScheduledRate = totalActivated > 0 ? (totalScheduled / totalActivated) * 100 : 0;
  const avgAttendanceRate = totalScheduledSameDay > 0 ? (totalAttended / totalScheduledSameDay) * 100 : 0;
  const avgConversionRate = totalAttended > 0 ? (totalSales / totalAttended) * 100 : 0;

  return {
    totalActivated,
    totalScheduled,
    avgScheduledRate,
    totalScheduledSameDay,
    totalAttended,
    avgAttendanceRate,
    totalSales,
    avgConversionRate,
  };
}

export function SDRDetailPage({
  sdrId,
  periodStart,
  periodEnd,
  onPeriodChange,
  onBack,
}: SDRDetailPageProps) {
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();
  
  const { data: sdrs } = useSDRs();
  const { data: metrics, isLoading: isLoadingMetrics } = useSDRMetrics(
    sdrId,
    periodStart,
    periodEnd
  );

  const sdr = sdrs?.find((s) => s.id === sdrId);
  const aggregatedMetrics = metrics ? calculateAggregatedMetrics(metrics) : null;

  const Icon = sdr?.type === 'social_selling' ? Users : Phone;

  // Swipe navigation between SDRs
  const handleNavigateToSDR = useCallback((id: string) => {
    setSearchParams({ module: 'sdrs', sdr: id });
  }, [setSearchParams]);

  const {
    currentIndex,
    totalItems,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    swipeOffset,
    isSwiping,
    handlers,
  } = useSwipeNavigation({
    items: sdrs || [],
    currentId: sdrId,
    onNavigate: handleNavigateToSDR,
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['sdr-metrics', sdrId] });
  }, [queryClient, sdrId]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        className={cn(
          "space-y-6 transition-transform duration-200",
          !isSwiping && "transition-transform"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        {...handlers}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10"
            >
              <ArrowLeft size={20} />
            </Button>

            <div className="p-3 rounded-2xl bg-primary/10">
              <Icon size={28} className="text-primary" />
            </div>

            <div>
              {sdr ? (
                <>
                  <h1 className="text-2xl font-bold text-foreground">{sdr.name}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground capitalize">
                      {sdr.type === 'sdr' ? 'SDR' : 'Social Selling'}
                    </p>
                    {totalItems > 1 && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {currentIndex + 1} de {totalItems}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation arrows for desktop */}
            {totalItems > 1 && (
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="h-8 w-8"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="h-8 w-8"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
            
            <PeriodFilter
              periodStart={periodStart}
              periodEnd={periodEnd}
              onPeriodChange={onPeriodChange}
            />
          </div>
        </div>

        {/* Swipe hint for mobile */}
        {totalItems > 1 && (
          <p className="text-xs text-muted-foreground text-center md:hidden animate-fade-in">
            ← Deslize para navegar entre SDRs →
          </p>
        )}

        {/* Metrics */}
        {isLoadingMetrics ? (
          <MetricCardSkeletonGrid count={7} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <SDRMetricCard
              title="Ativados"
              value={aggregatedMetrics?.totalActivated || 0}
              icon={Users}
            />
            <SDRMetricCard
              title="Agendados"
              value={aggregatedMetrics?.totalScheduled || 0}
              icon={Calendar}
            />
            <SDRMetricCard
              title="% Agendamento"
              value={aggregatedMetrics?.avgScheduledRate || 0}
              isPercentage
              showProgress
              icon={TrendingUp}
            />
            <SDRMetricCard
              title="Agend. no dia"
              value={aggregatedMetrics?.totalScheduledSameDay || 0}
              icon={UserCheck}
            />
            <SDRMetricCard
              title="Realizados"
              value={aggregatedMetrics?.totalAttended || 0}
              icon={UserCheck}
            />
            <SDRMetricCard
              title="% Comparec."
              value={aggregatedMetrics?.avgAttendanceRate || 0}
              isPercentage
              showProgress
              icon={TrendingUp}
            />
            <SDRMetricCard
              title="Vendas"
              value={aggregatedMetrics?.totalSales || 0}
              icon={ShoppingCart}
              variant="highlight"
            />
          </div>
        )}

        {/* Chart */}
        {isLoadingMetrics ? (
          <ChartSkeleton height={350} />
        ) : (
          <SDRChart metrics={metrics || []} />
        )}

        {/* Data Table */}
        {isLoadingMetrics ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <SDRDataTable metrics={metrics || []} />
        )}
      </div>
    </PullToRefresh>
  );
}
