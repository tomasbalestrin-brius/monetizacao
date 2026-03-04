import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSDRsWithMetrics } from '@/hooks/useSdrMetrics';
import { useFunnels, useAllFunnelsSummary } from '@/hooks/useFunnels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, Users, BarChart3, GitBranch, Lightbulb, ArrowRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function SDRReportsPage() {
  const { isAdmin, isLider } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('current');

  const getDateRange = () => {
    const now = new Date();
    if (selectedMonth === 'current') {
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      };
    }
    const monthsAgo = parseInt(selectedMonth);
    const target = subMonths(now, monthsAgo);
    return {
      start: format(startOfMonth(target), 'yyyy-MM-dd'),
      end: format(endOfMonth(target), 'yyyy-MM-dd'),
    };
  };

  const { start, end } = getDateRange();
  const { data: sdrsWithMetrics, isLoading: loadingSDRs } = useSDRsWithMetrics(undefined, start, end);
  const { data: funnelsSummary, isLoading: loadingFunnels } = useAllFunnelsSummary(start, end);
  const { data: funnels } = useFunnels();

  const totals = useMemo(() => {
    if (!sdrsWithMetrics) return { activated: 0, scheduled: 0, attended: 0, sales: 0 };
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

  const schedulingRate = totals.activated > 0 ? ((totals.scheduled / totals.activated) * 100) : 0;
  const attendanceRate = totals.scheduled > 0 ? ((totals.attended / totals.scheduled) * 100) : 0;
  const conversionRate = totals.attended > 0 ? ((totals.sales / totals.attended) * 100) : 0;

  // Insights
  const insights = useMemo(() => {
    const tips: string[] = [];
    if (schedulingRate < 20) tips.push('Taxa de agendamento está baixa. Considere revisar scripts de abordagem.');
    if (attendanceRate < 50) tips.push('Muitos agendados não comparecem. Reforce confirmações via WhatsApp.');
    if (conversionRate < 20) tips.push('Taxa de conversão pode melhorar. Analise a qualidade dos leads agendados.');
    if (totals.activated > 0 && totals.scheduled === 0) tips.push('Nenhum agendamento registrado. Verifique se os SDRs estão lançando dados.');
    if (sdrsWithMetrics && sdrsWithMetrics.length > 1) {
      const sorted = [...sdrsWithMetrics].sort((a: any, b: any) => (b.metrics?.totalSales || 0) - (a.metrics?.totalSales || 0));
      const top = sorted[0] as any;
      if (top?.metrics?.totalSales > 0) {
        tips.push(`${top.name} lidera com ${top.metrics.totalSales} venda(s). Compartilhe boas práticas com o time.`);
      }
    }
    return tips;
  }, [schedulingRate, attendanceRate, conversionRate, totals, sdrsWithMetrics]);

  if (loadingSDRs) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={24} />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análise completa de performance por funil e SDR</p>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="1">Mês Anterior</SelectItem>
            <SelectItem value="2">2 meses atrás</SelectItem>
            <SelectItem value="3">3 meses atrás</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{totals.activated}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Ativados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{totals.scheduled}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{totals.attended}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{totals.sales}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{schedulingRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Agendamento</p>
              </div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(schedulingRate, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{attendanceRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Comparecimento</p>
              </div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(attendanceRate, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(conversionRate, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb size={18} className="text-amber-500" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel Breakdown */}
      {funnelsSummary && funnelsSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch size={18} />
              Dados por Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">Funil</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Leads</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Qualificados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Agendados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Realizados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelsSummary.map((fs: any) => (
                    <tr key={fs.funnel_id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2.5 px-2 font-medium">{fs.funnel_name}</td>
                      <td className="py-2.5 px-2 text-right">{fs.total_leads || 0}</td>
                      <td className="py-2.5 px-2 text-right">{fs.total_qualified || 0}</td>
                      <td className="py-2.5 px-2 text-right">{fs.total_calls_scheduled || 0}</td>
                      <td className="py-2.5 px-2 text-right">{fs.total_calls_done || 0}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-600">{fs.total_sales || 0}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={`font-medium ${(fs.conversion_rate || 0) >= 30 ? 'text-emerald-600' : (fs.conversion_rate || 0) >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                          {(fs.conversion_rate || 0).toFixed(1)}%
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

      {/* SDR Ranking */}
      {(isAdmin || isLider) && sdrsWithMetrics && sdrsWithMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={18} />
              Ranking de SDRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">SDR</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Ativados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Agendados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">% Agend.</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Realizados</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">% Comp.</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">% Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sdrsWithMetrics]
                    .sort((a: any, b: any) => (b.metrics?.totalSales || 0) - (a.metrics?.totalSales || 0))
                    .map((sdr: any, index: number) => {
                      const m = sdr.metrics || {};
                      const sRate = m.totalActivated > 0 ? ((m.totalScheduled / m.totalActivated) * 100) : 0;
                      const aRate = m.totalScheduled > 0 ? ((m.totalAttended / m.totalScheduled) * 100) : 0;
                      const cRate = m.totalAttended > 0 ? ((m.totalSales / m.totalAttended) * 100) : 0;
                      return (
                        <tr key={sdr.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2.5 px-2 font-bold text-muted-foreground">{index + 1}</td>
                          <td className="py-2.5 px-2 font-medium">{sdr.name}</td>
                          <td className="py-2.5 px-2 text-right">{m.totalActivated || 0}</td>
                          <td className="py-2.5 px-2 text-right">{m.totalScheduled || 0}</td>
                          <td className="py-2.5 px-2 text-right">{sRate.toFixed(1)}%</td>
                          <td className="py-2.5 px-2 text-right">{m.totalAttended || 0}</td>
                          <td className="py-2.5 px-2 text-right">{aRate.toFixed(1)}%</td>
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
