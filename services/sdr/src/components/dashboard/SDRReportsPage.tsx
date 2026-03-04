import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSDRTotalMetrics, useSDRsWithMetrics } from '@/hooks/useSdrMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { data: totalMetrics, isLoading: loadingTotal } = useSDRTotalMetrics(undefined, start, end);
  const { data: sdrsWithMetrics, isLoading: loadingSDRs } = useSDRsWithMetrics(undefined, start, end);

  if (loadingTotal || loadingSDRs) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={24} />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análise de performance do time SDR</p>
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
            <p className="text-3xl font-bold text-blue-600">{metrics.total_activated || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Ativados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{metrics.total_scheduled || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{metrics.total_attended || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{metrics.total_sales || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* SDR Ranking */}
      {(isAdmin || isLider) && sdrsWithMetrics && sdrsWithMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Ranking de SDRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">SDR</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ativados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Agendados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">% Agend.</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Realizados</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">% Comp.</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">% Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sdrsWithMetrics]
                    .sort((a: any, b: any) => (b.metrics?.total_sales || 0) - (a.metrics?.total_sales || 0))
                    .map((sdr: any, index: number) => (
                      <tr key={sdr.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-2 font-bold text-muted-foreground">{index + 1}</td>
                        <td className="py-3 px-2 font-medium">{sdr.name}</td>
                        <td className="py-3 px-2 text-right">{sdr.metrics?.total_activated || 0}</td>
                        <td className="py-3 px-2 text-right">{sdr.metrics?.total_scheduled || 0}</td>
                        <td className="py-3 px-2 text-right">{(sdr.metrics?.avg_scheduled_rate || 0).toFixed(1)}%</td>
                        <td className="py-3 px-2 text-right">{sdr.metrics?.total_attended || 0}</td>
                        <td className="py-3 px-2 text-right">{(sdr.metrics?.avg_attendance_rate || 0).toFixed(1)}%</td>
                        <td className="py-3 px-2 text-right font-semibold text-emerald-600">{sdr.metrics?.total_sales || 0}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-medium ${(sdr.metrics?.avg_conversion_rate || 0) >= 30 ? 'text-emerald-600' : (sdr.metrics?.avg_conversion_rate || 0) >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
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

      {/* Conversion Rates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{(metrics.avg_scheduled_rate || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Agendamento</p>
              </div>
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
                <p className="text-xl font-bold">{(metrics.avg_attendance_rate || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Comparecimento</p>
              </div>
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
                <p className="text-xl font-bold">{(metrics.avg_conversion_rate || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
