import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Loader2, Archive } from 'lucide-react';
import { useCleanupLogs, useArchiveBronzeLeads, useRestoreLead, type CleanupLog } from '@/hooks/useLeadCleanup';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'sonner';

const reasonLabels: Record<string, string> = {
  bronze: 'Bronze (automatico)',
  nao_fit: 'Nao Fit',
  manual: 'Manual',
};

export function CleanupPage() {
  const { data: logs, isLoading } = useCleanupLogs();
  const { data: leads } = useLeads({ classification: 'bronze' });
  const archiveBronze = useArchiveBronzeLeads();
  const restoreLead = useRestoreLead();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const bronzeCount = leads?.length ?? 0;

  const handleArchiveBronze = () => {
    archiveBronze.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`${result?.count ?? 0} leads bronze arquivados`);
        setConfirmArchive(false);
      },
      onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
    });
  };

  const handleRestore = (logId: string) => {
    restoreLead.mutate(logId, {
      onSuccess: () => toast.success('Lead restaurado'),
      onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Archive className="h-6 w-6" />
          Limpeza de Leads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Arquive leads de baixa qualidade e gerencie o historico
        </p>
      </div>

      {/* Archive bronze action */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Leads Bronze</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {bronzeCount > 0
                ? `Existem ${bronzeCount} leads classificados como bronze. Voce pode arquiva-los em lote.`
                : 'Nenhum lead bronze encontrado no momento.'}
            </p>
            {bronzeCount > 0 && (
              <div className="mt-3">
                {!confirmArchive ? (
                  <button
                    onClick={() => setConfirmArchive(true)}
                    className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-600"
                  >
                    <Trash2 size={14} />
                    Arquivar {bronzeCount} leads bronze
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-orange-400 font-medium">Confirmar arquivamento?</p>
                    <button
                      onClick={handleArchiveBronze}
                      disabled={archiveBronze.isPending}
                      className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {archiveBronze.isPending ? 'Arquivando...' : 'Sim, arquivar'}
                    </button>
                    <button
                      onClick={() => setConfirmArchive(false)}
                      className="border border-border rounded-lg px-4 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cleanup history */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Historico de Arquivamento</h2>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!logs || logs.length === 0) && (
          <div className="text-center py-12">
            <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum lead arquivado ainda.</p>
          </div>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => (
              <CleanupLogRow key={log.id} log={log} onRestore={() => handleRestore(log.id)} restoring={restoreLead.isPending} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CleanupLogRow({ log, onRestore, restoring }: { log: CleanupLog; onRestore: () => void; restoring: boolean }) {
  const leadData = log.lead_data as Record<string, unknown>;
  const name = (leadData.full_name as string) || 'Lead desconhecido';
  const classification = leadData.classification as string | null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">{reasonLabels[log.cleanup_reason] ?? log.cleanup_reason}</span>
          {classification && <span className="text-xs text-muted-foreground capitalize">{classification}</span>}
          {log.cleaned_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(log.cleaned_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRestore}
        disabled={restoring}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 disabled:opacity-50"
      >
        <RotateCcw size={12} />
        Restaurar
      </button>
    </div>
  );
}
