import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSDRTotalMetrics, useSDRsWithMetrics } from '@/hooks/useSdrMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Phone, TrendingUp, Target, Calendar } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function SDRDashboardOverview() {
  const { isAdmin, isLider } = useAuth();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const periodEnd = now.toISOString().split('T')[0];

  const { data: totalMetrics, isLoading: loadingMetrics } = useSDRTotalMetrics(undefined, periodStart, periodEnd);
  const { data: sdrsWithMetrics, isLoading: loadingSDRs } = useSDRsWithMetrics(undefined, periodStart, periodEnd);

  if (loadingMetrics || loadingSDRs) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const metrics = totalMetrics || {
    total_activated: 0,
    total_scheduled: 0,
    total_attended: 0,
    total_sales: 0,
    avg_scheduled_rate: 0,
    avg_attendance_rate: 0,
    avg_conversion_rate: 0,
  };

  const metricCards = [
    { label: 'Ativados', value: metrics.total_activated || 0, icon: Phone, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Agendados', value: metrics.total_scheduled || 0, icon: Calendar, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Realizados', value: metrics.total_attended || 0, icon: UserCheck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Vendas', value: metrics.total_sales || 0, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Taxa Agend.', value: `${(metrics.avg_scheduled_rate || 0).toFixed(1)}%`, icon: Target, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'Taxa Conv.', value: `${(metrics.avg_conversion_rate || 0).toFixed(1)}%`, icon: Target, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard SDR</h1>
        <p className="text-muted-foreground mt-1">Visão geral do mês atual</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SDRs Performance Table */}
      {(isAdmin || isLider) && sdrsWithMetrics && sdrsWithMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Performance dos SDRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">SDR</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ativados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Agendados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Realizados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrsWithMetrics.map((sdr: any) => (
                    <tr key={sdr.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{sdr.name}</td>
                      <td className="py-3 px-2 text-right">{sdr.metrics?.total_activated || 0}</td>
                      <td className="py-3 px-2 text-right">{sdr.metrics?.total_scheduled || 0}</td>
                      <td className="py-3 px-2 text-right">{sdr.metrics?.total_attended || 0}</td>
                      <td className="py-3 px-2 text-right font-semibold text-emerald-600">{sdr.metrics?.total_sales || 0}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-medium ${(sdr.metrics?.avg_conversion_rate || 0) >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {(sdr.metrics?.avg_conversion_rate || 0).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
