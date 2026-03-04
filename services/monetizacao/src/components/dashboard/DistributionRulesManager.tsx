import { useState } from 'react';
import { Loader2, Plus, Trash2, Play, Pause, Users, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  useDistributionRules,
  useCreateDistributionRule,
  useUpdateDistributionRule,
  useDeleteDistributionRule,
  useDistributionLogs,
  useSdrCapacities,
} from '@/hooks/useDistributionRules';
import { useFunnels } from '@/hooks/useFunnels';
import { useSDRs } from '@/hooks/useSdrMetrics';

const CLASSIFICATION_OPTIONS = [
  { value: 'diamante', label: 'Diamante' },
  { value: 'ouro', label: 'Ouro' },
  { value: 'prata', label: 'Prata' },
  { value: 'bronze', label: 'Bronze' },
];

const DISTRIBUTION_MODES = [
  { value: 'equal', label: 'Igual' },
  { value: 'percentage', label: 'Percentual' },
  { value: 'funnel_limit', label: 'Limite por Funil' },
];

export function DistributionRulesManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showCapacities, setShowCapacities] = useState(false);

  const { data: rules, isLoading } = useDistributionRules();
  const { data: logs } = useDistributionLogs();
  const { data: capacities } = useSdrCapacities();
  const { data: funnels } = useFunnels();
  const { data: sdrs } = useSDRs();
  const createRule = useCreateDistributionRule();
  const updateRule = useUpdateDistributionRule();
  const deleteRule = useDeleteDistributionRule();

  // Create form state
  const [formName, setFormName] = useState('');
  const [formFunnelId, setFormFunnelId] = useState<string>('');
  const [formMode, setFormMode] = useState('equal');
  const [formSdrIds, setFormSdrIds] = useState<string[]>([]);
  const [formMaxLeads, setFormMaxLeads] = useState('50');
  const [formClassifications, setFormClassifications] = useState<string[]>([]);

  const resetForm = () => {
    setFormName('');
    setFormFunnelId('');
    setFormMode('equal');
    setFormSdrIds([]);
    setFormMaxLeads('50');
    setFormClassifications([]);
  };

  const handleCreate = async () => {
    if (!formName.trim() || formSdrIds.length === 0) {
      toast.error('Preencha o nome e selecione pelo menos um SDR');
      return;
    }
    try {
      await createRule.mutateAsync({
        name: formName,
        funnel_id: formFunnelId || null,
        distribution_mode: formMode,
        sdr_ids: formSdrIds,
        max_leads_per_sdr: parseInt(formMaxLeads) || 50,
        classifications: formClassifications,
      });
      toast.success('Regra criada com sucesso');
      resetForm();
      setIsCreateOpen(false);
    } catch {
      toast.error('Erro ao criar regra');
    }
  };

  const handleToggleActive = async (rule: { id: string; active: boolean | null }) => {
    try {
      await updateRule.mutateAsync({ id: rule.id, active: !rule.active });
      toast.success(rule.active ? 'Regra desativada' : 'Regra ativada');
    } catch {
      toast.error('Erro ao atualizar regra');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success('Regra removida');
    } catch {
      toast.error('Erro ao remover regra');
    }
  };

  const getSdrName = (id: string) => sdrs?.find(s => s.id === id)?.name || id.slice(0, 8);
  const getFunnelName = (id: string | null) => {
    if (!id) return 'Todos';
    return funnels?.find(f => f.id === id)?.name || id.slice(0, 8);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Regras de Distribuição</h2>
              <p className="text-sm text-muted-foreground">Configure como leads são distribuídos entre SDRs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCapacities(!showCapacities)}>
              <Users className="h-4 w-4 mr-1" />
              Capacidades
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLogs(!showLogs)}>
              Logs ({logs?.length || 0})
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Regra
            </Button>
          </div>
        </div>

        {/* Rules List */}
        {!rules?.length ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma regra de distribuição cadastrada</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-muted/50 rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{rule.name}</h3>
                    <Badge variant={rule.active ? 'default' : 'secondary'}>
                      {rule.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">
                      {DISTRIBUTION_MODES.find(m => m.value === rule.distribution_mode)?.label || rule.distribution_mode}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>Funil: {getFunnelName(rule.funnel_id)}</span>
                    <span>|</span>
                    <span>Max: {rule.max_leads_per_sdr}/SDR</span>
                    <span>|</span>
                    <span>SDRs: {rule.sdr_ids.map(getSdrName).join(', ')}</span>
                  </div>
                  {rule.classifications.length > 0 && (
                    <div className="flex gap-1">
                      {rule.classifications.map(c => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(rule)}
                  >
                    {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SDR Capacities */}
      {showCapacities && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Capacidade dos SDRs</h3>
          {!capacities?.length ? (
            <p className="text-muted-foreground text-sm">Nenhuma capacidade configurada. Use as regras de distribuição para definir limites.</p>
          ) : (
            <div className="space-y-2">
              {capacities.map((cap) => (
                <div key={cap.id} className="flex items-center justify-between bg-muted/50 rounded p-3">
                  <div className="text-sm">
                    <span className="font-medium">{getSdrName(cap.sdr_id)}</span>
                    <span className="text-muted-foreground ml-2">
                      Funil: {getFunnelName(cap.funnel_id)} | Max: {cap.max_leads ?? '-'} | {cap.percentage ?? '-'}%
                    </span>
                  </div>
                  <Badge variant={cap.active ? 'default' : 'secondary'}>
                    {cap.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Distribution Logs */}
      {showLogs && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Histórico de Distribuições</h3>
          {!logs?.length ? (
            <p className="text-muted-foreground text-sm">Nenhuma distribuição registrada ainda</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-muted/50 rounded p-3 text-sm">
                  <div>
                    <span className="font-medium">{log.leads_count} leads</span>
                    <span className="text-muted-foreground ml-2">
                      via {log.distribution_mode} para {log.sdr_ids.length} SDR(s)
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Regra de Distribuição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Regra</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Distribuição Águias" />
            </div>

            <div>
              <label className="text-sm font-medium">Funil (opcional)</label>
              <Select value={formFunnelId} onValueChange={setFormFunnelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {funnels?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Modo de Distribuição</label>
              <Select value={formMode} onValueChange={setFormMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTION_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Max Leads por SDR</label>
              <Input type="number" min="1" value={formMaxLeads} onChange={(e) => setFormMaxLeads(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">SDRs</label>
              <div className="flex flex-wrap gap-2">
                {sdrs?.map(sdr => {
                  const selected = formSdrIds.includes(sdr.id);
                  return (
                    <button
                      key={sdr.id}
                      type="button"
                      onClick={() => setFormSdrIds(prev =>
                        selected ? prev.filter(id => id !== sdr.id) : [...prev, sdr.id]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {sdr.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Classificações (opcional)</label>
              <div className="flex flex-wrap gap-2">
                {CLASSIFICATION_OPTIONS.map(opt => {
                  const selected = formClassifications.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormClassifications(prev =>
                        selected ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createRule.isPending}>
              {createRule.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Criar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
