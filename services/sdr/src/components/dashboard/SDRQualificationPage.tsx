import { useState } from 'react';
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useFunnels } from '@/hooks/useFunnels';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UserCheck, Search, Diamond, Award, Medal, Shield } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const classificationConfig = {
  diamante: { label: 'Diamante', icon: Diamond, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' },
  ouro: { label: 'Ouro', icon: Award, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' },
  prata: { label: 'Prata', icon: Medal, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30' },
  bronze: { label: 'Bronze', icon: Shield, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
};

export function SDRQualificationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFunnel, setFilterFunnel] = useState<string>('all');

  const { data: funnels } = useFunnels();

  const { data: leads, isLoading } = useLeads({
    search: searchTerm || undefined,
    classification: filterClassification !== 'all' ? filterClassification : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    funnelId: filterFunnel !== 'all' ? filterFunnel : undefined,
  });

  const updateLead = useUpdateLead();

  const handleClassificationChange = (leadId: string, classification: string) => {
    updateLead.mutate({ leadId, data: { classification: classification === 'none' ? null : classification } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck size={24} />
          Qualificação de Leads
        </h1>
        <p className="text-muted-foreground mt-1">Selecione o funil e classifique os leads</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterFunnel} onValueChange={setFilterFunnel}>
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
        <Select value={filterClassification} onValueChange={setFilterClassification}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Classificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="diamante">Diamante</SelectItem>
            <SelectItem value="ouro">Ouro</SelectItem>
            <SelectItem value="prata">Prata</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {leads && leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(classificationConfig).map(([key, config]) => {
            const count = leads.filter((l: any) => l.classification === key).length;
            return (
              <div key={key} className={`rounded-lg p-3 ${config.color}`}>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs">{config.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-3">
        {leads && leads.length > 0 ? (
          leads.map((lead: any) => {
            const config = lead.classification ? classificationConfig[lead.classification as keyof typeof classificationConfig] : null;

            return (
              <Card key={lead.id} className="hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{lead.full_name}</h3>
                        {config && (
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {lead.phone && <span>{lead.phone}</span>}
                        {lead.email && <span>{lead.email}</span>}
                        {lead.niche && <span>{lead.niche}</span>}
                        {lead.revenue && <span>R$ {lead.revenue.toLocaleString()}</span>}
                      </div>
                    </div>

                    <Select
                      value={lead.classification || 'none'}
                      onValueChange={(value) => handleClassificationChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Classificar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem classificação</SelectItem>
                        <SelectItem value="diamante">Diamante</SelectItem>
                        <SelectItem value="ouro">Ouro</SelectItem>
                        <SelectItem value="prata">Prata</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum lead encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
