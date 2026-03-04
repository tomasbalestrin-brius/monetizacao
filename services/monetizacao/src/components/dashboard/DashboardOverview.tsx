import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Target, TrendingUp, DollarSign } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { SquadSection, SquadSectionLoading } from './SquadSection';
import { EmptyState } from './EmptyState';
import { MonthSelector, getMonthPeriod } from './MonthSelector';
import { useTotalMetrics } from '@/hooks/useMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';

export function DashboardOverview() {
  // Enable realtime subscriptions for automatic updates
  useRealtimeMetrics();
  
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  
  const { periodStart, periodEnd } = useMemo(() => getMonthPeriod(selectedMonth), [selectedMonth]);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Geral</h1>
          <p className="text-muted-foreground">Acompanhe as métricas de todas as equipes de vendas</p>
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <MetricCard
            title="Faturamento Total do Setor"
            value={totals.revenue}
            icon={DollarSign}
            large
            isCurrency
            variant="success"
          />
          <MetricCard
            title="Tendência Faturamento"
            value={totals.revenueTrend}
            icon={TrendingUp}
            isCurrency
            variant="success"
          />
        </div>
        <div className="space-y-3">
          <MetricCard
            title="Entradas Total do Setor"
            value={totals.entries}
            icon={DollarSign}
            large
            isCurrency
            variant="warning"
          />
          <MetricCard
            title="Tendência Entradas"
            value={totals.entriesTrend}
            icon={TrendingUp}
            isCurrency
            variant="warning"
          />
        </div>
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
