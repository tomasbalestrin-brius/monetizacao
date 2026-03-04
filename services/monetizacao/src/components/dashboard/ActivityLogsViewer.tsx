import React, { useState } from 'react';
import { Loader2, FileText, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useActivityLogs } from '@/hooks/useActivityLogs';

const ENTITY_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'lead', label: 'Leads' },
  { value: 'appointment', label: 'Agendamentos' },
  { value: 'user', label: 'Usuários' },
  { value: 'funnel', label: 'Funis' },
  { value: 'distribution', label: 'Distribuição' },
  { value: 'qualification', label: 'Qualificação' },
];

const ACTION_BADGE_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600',
  update: 'bg-blue-500/10 text-blue-600',
  delete: 'bg-red-500/10 text-red-600',
  distribute: 'bg-purple-500/10 text-purple-600',
  qualify: 'bg-yellow-500/10 text-yellow-600',
  login: 'bg-gray-500/10 text-gray-600',
};

export function ActivityLogsViewer() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data: logs, isLoading } = useActivityLogs({
    entityType: entityType || undefined,
    action: action || undefined,
    limit: 200,
  });

  const getActionColor = (act: string) => {
    const key = Object.keys(ACTION_BADGE_COLORS).find(k => act.toLowerCase().includes(k));
    return key ? ACTION_BADGE_COLORS[key] : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Logs de Atividade</h2>
              <p className="text-sm text-muted-foreground">
                Auditoria completa de ações no sistema ({logs?.length || 0} registros)
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo de entidade" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(t => (
                  <SelectItem key={t.value || 'all'} value={t.value || 'all'}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="create">Criar</SelectItem>
              <SelectItem value="update">Atualizar</SelectItem>
              <SelectItem value="delete">Deletar</SelectItem>
              <SelectItem value="distribute">Distribuir</SelectItem>
              <SelectItem value="qualify">Qualificar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !logs?.length ? (
          <p className="text-muted-foreground text-center py-8">Nenhum log de atividade encontrado</p>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-[140px_100px_100px_1fr_auto] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 bg-card">
              <span>Data/Hora</span>
              <span>Ação</span>
              <span>Entidade</span>
              <span>Detalhes</span>
              <span>IP</span>
            </div>
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[140px_100px_100px_1fr_auto] gap-2 px-3 py-2 text-sm rounded hover:bg-muted/50 items-center"
              >
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <Badge className={`text-xs justify-center ${getActionColor(log.action)}`}>
                  {log.action}
                </Badge>
                <span className="text-xs text-foreground">{log.entity_type}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {log.entity_id ? `ID: ${log.entity_id.slice(0, 8)}...` : ''}
                  {log.details && typeof log.details === 'object' && Object.keys(log.details as object).length > 0
                    ? ` ${JSON.stringify(log.details).slice(0, 80)}`
                    : ''
                  }
                </span>
                <span className="text-xs text-muted-foreground">{log.ip_address || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
