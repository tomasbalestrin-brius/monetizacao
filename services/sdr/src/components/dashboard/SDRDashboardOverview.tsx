import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSDRsWithMetrics } from '@/hooks/useSdrMetrics';
import { useFunnels } from '@/hooks/useFunnels';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserCheck,
  Phone,
  TrendingUp,
  Target,
  Calendar,
  Loader2,
  BarChart3,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';

export function SDRDashboardOverview() {
  const { isAdmin, isLider } = useAuth();
  const [period, setPeriod] = useState('current');
  const [funnelFilter, setFunnelFilter] = useState('all');

  const { data: funnels } = useFunnels();
  const { data: leads } = useLeads({
    funnelId: funnelFilter !== 'all' ? funnelFilter : undefined,
  });

  const { start, end } = useMemo(() => {
    const now = new Date();
    if (period === 'current') {
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      };
    }
    if (period === '7d') {
      return {
        start: format(subDays(now, 7), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      };
    }
    if (period === '30d') {
      return {
        start: format(subDays(now, 30), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      };
    }
    const monthsAgo = parseInt(period);
    const target = subMonths(now, monthsAgo);
    return {
      start: format(startOfMonth(target), 'yyyy-MM-dd'),
      end: format(endOfMonth(target), 'yyyy-MM-dd'),
    };
  }, [period]);

  const { data: sdrsWithMetrics, isLoading } = useSDRsWithMetrics(undefined, start, end);

  // Calculate totals from SDRs with metrics
  const totals = useMemo(() => {
    if (!sdrsWithMetrics) return null;
    return sdrsWithMetrics.reduce(
      (acc, sdr: any) => {
        const m = sdr.metrics || {};
        acc.activated += m.totalActivated || 0;
        acc.scheduled += m.totalScheduled || 0;
        acc.attended += m.totalAttended || 0;
        acc.sales += m.totalSales || 0;
        return acc;
      },
      { activated: 0, scheduled: 0, attended: 0, sales: 0 }
    );
  }, [sdrsWithMetrics]);

  const schedulingRate = totals && totals.activated > 0 ? ((totals.scheduled / totals.activated) * 100) : 0;
  const attendanceRate = totals && totals.scheduled > 0 ? ((totals.attended / totals.scheduled) * 100) : 0;
  const conversionRate = totals && totals.attended > 0 ? ((totals.sales / totals.attended) * 100) : 0;
  const totalLeads = leads?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-slate-600 bg-slate-100 dark:bg-slate-900/30' },
    { label: 'Ativados', value: totals?.activated || 0, icon: Zap, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Agendados', value: totals?.scheduled || 0, icon: Calendar, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Realizados', value: totals?.attended || 0, icon: UserCheck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Vendas', value: totals?.sales || 0, icon: ShoppingCart, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Taxa Agend.', value: `${schedulingRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'Taxa Comp.', value: `${attendanceRate.toFixed(1)}%`, icon: Target, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Taxa Conv.', value: `${conversionRate.toFixed(1)}%`, icon: BarChart3, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard SDR</h1>
          <p className="text-muted-foreground mt-1">Visão geral de performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="1">Mês Anterior</SelectItem>
              <SelectItem value="2">2 meses atrás</SelectItem>
              <SelectItem value="3">3 meses atrás</SelectItem>
            </SelectContent>
          </Select>
          <Select value={funnelFilter} onValueChange={setFunnelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funis</SelectItem>
              {funnels?.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-3">
                <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SDRs Performance Table */}
      {(isAdmin || isLider) && sdrsWithMetrics && sdrsWithMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={18} />
              Performance dos SDRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">SDR</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Ativados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Agendados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">% Agend.</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Realizados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sdrsWithMetrics]
                    .sort((a: any, b: any) => (b.metrics?.totalSales || 0) - (a.metrics?.totalSales || 0))
                    .map((sdr: any) => {
                      const m = sdr.metrics || {};
                      const sRate = m.totalActivated > 0 ? ((m.totalScheduled / m.totalActivated) * 100) : 0;
                      const cRate = m.totalAttended > 0 ? ((m.totalSales / m.totalAttended) * 100) : 0;
                      return (
                        <tr key={sdr.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600">
                                {sdr.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="font-medium">{sdr.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right">{m.totalActivated || 0}</td>
                          <td className="py-2.5 px-2 text-right">{m.totalScheduled || 0}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={sRate >= 30 ? 'text-emerald-600' : sRate >= 15 ? 'text-amber-600' : 'text-red-500'}>
                              {sRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">{m.totalAttended || 0}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-emerald-600">{m.totalSales || 0}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={`font-medium ${cRate >= 30 ? 'text-emerald-600' : cRate >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                              {cRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
