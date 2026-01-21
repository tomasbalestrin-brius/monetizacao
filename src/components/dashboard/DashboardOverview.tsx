import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Target, TrendingUp, DollarSign } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { SquadSection, SquadSectionLoading } from './SquadSection';
import { EmptyState } from './EmptyState';
import { PeriodFilter } from './PeriodFilter';
import { useTotalMetrics } from '@/hooks/useMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function DashboardOverview() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [periodStart, setPeriodStart] = useState<string | undefined>();
  const [periodEnd, setPeriodEnd] = useState<string | undefined>();
  const { totals, squadMetrics, isLoading, error } = useTotalMetrics(periodStart, periodEnd);

  const handleConnectSheet = () => {
    if (isAdmin) {
      // Navigate to admin panel where Google Sheets config will be
      navigate('/?module=admin');
      toast.info('Configure o Google Sheets no Painel Administrativo');
    } else {
      toast.error('Apenas administradores podem configurar a integração com Google Sheets');
    }
  };

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Erro ao carregar dados</p>
      </div>
    );
  }

  // Check if there's no data
  const hasData = totals.calls > 0 || totals.sales > 0 || totals.revenue > 0;

  if (!isLoading && !hasData) {
    return <EmptyState onConnectSheet={handleConnectSheet} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Geral</h1>
          <p className="text-muted-foreground">Acompanhe as métricas de todas as equipes de vendas</p>
        </div>
        <PeriodFilter
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodChange={(start, end) => {
            setPeriodStart(start);
            setPeriodEnd(end);
          }}
        />
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard
          title="Faturamento Total do Setor"
          value={totals.revenue}
          trend={totals.revenueTrend}
          icon={DollarSign}
          large
          isCurrency
          variant="success"
        />
        <MetricCard
          title="Entradas Total do Setor"
          value={totals.entries}
          trend={totals.entriesTrend}
          icon={DollarSign}
          large
          isCurrency
          variant="warning"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          title="Calls Realizadas" 
          value={totals.calls} 
          icon={Phone} 
        />
        <MetricCard 
          title="Número de Vendas" 
          value={totals.sales} 
          icon={Target} 
        />
        <MetricCard
          title="Taxa de Conversão"
          value={totals.conversion}
          icon={TrendingUp}
          isPercentage
        />
      </div>

      {/* Squad sections */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Performance por Squad</h2>
        
        {isLoading ? (
          <div className="space-y-6">
            <SquadSectionLoading />
            <SquadSectionLoading />
            <SquadSectionLoading />
          </div>
        ) : (
          <div className="space-y-6">
            {squadMetrics.map((sm) => (
              <SquadSection key={sm.squad.id} squadMetrics={sm} showClosers={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
