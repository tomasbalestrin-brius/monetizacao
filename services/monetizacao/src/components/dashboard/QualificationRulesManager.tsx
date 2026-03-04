import { useState } from 'react';
import { Loader2, Plus, Trash2, Play, Pause, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  useQualificationRules,
  useCreateQualificationRule,
  useUpdateQualificationRule,
  useDeleteQualificationRule,
} from '@/hooks/useQualificationRules';
import { useFunnels } from '@/hooks/useFunnels';

const CLASSIFICATION_OPTIONS = [
  { value: 'diamante', label: 'Diamante', color: 'text-cyan-400' },
  { value: 'ouro', label: 'Ouro', color: 'text-yellow-400' },
  { value: 'prata', label: 'Prata', color: 'text-gray-400' },
  { value: 'bronze', label: 'Bronze', color: 'text-orange-400' },
];

export function QualificationRulesManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterFunnelId, setFilterFunnelId] = useState<string>('');

  const { data: rules, isLoading } = useQualificationRules(filterFunnelId || undefined);
  const { data: funnels } = useFunnels();
  const createRule = useCreateQualificationRule();
  const updateRule = useUpdateQualificationRule();
  const deleteRule = useDeleteQualificationRule();

  // Form state
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formClassification, setFormClassification] = useState<string>('');
  const [formFunnelId, setFormFunnelId] = useState<string>('');
  const [formPriority, setFormPriority] = useState('1');
  const [formField, setFormField] = useState('revenue');
  const [formOperator, setFormOperator] = useState('>=');
  const [formValue, setFormValue] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormLabel('');
    setFormClassification('');
    setFormFunnelId('');
    setFormPriority('1');
    setFormField('revenue');
    setFormOperator('>=');
    setFormValue('');
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formLabel.trim()) {
      toast.error('Preencha o nome e o label da regra');
      return;
    }
    try {
      const conditions = formValue
        ? [{ field: formField, operator: formOperator, value: formValue }]
        : [];
      await createRule.mutateAsync({
        rule_name: formName,
        qualification_label: formLabel,
        classification: (formClassification as 'diamante' | 'ouro' | 'prata' | 'bronze') || null,
        funnel_id: formFunnelId || null,
        priority: parseInt(formPriority) || 1,
        conditions: conditions,
      });
      toast.success('Regra criada com sucesso');
      resetForm();
      setIsCreateOpen(false);
    } catch {
      toast.error('Erro ao criar regra');
    }
  };

  const handleToggleActive = async (rule: { id: string; active: boolean }) => {
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

  const getFunnelName = (id: string | null) => {
    if (!id) return 'Global';
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
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Regras de Qualificação</h2>
              <p className="text-sm text-muted-foreground">
                Defina regras automáticas para classificar leads
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Regra
          </Button>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Select value={filterFunnelId} onValueChange={setFilterFunnelId}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Filtrar por funil..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funis</SelectItem>
              {funnels?.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rules list */}
        {!rules?.length ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma regra de qualificação cadastrada</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => {
              const classInfo = CLASSIFICATION_OPTIONS.find(c => c.value === rule.classification);
              const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];

              return (
                <div key={rule.id} className="bg-muted/50 rounded-lg p-4 flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{rule.rule_name}</h3>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {classInfo && (
                        <Badge variant="outline" className={classInfo.color}>
                          {classInfo.label}
                        </Badge>
                      )}
                      <Badge variant="outline">Prioridade: {rule.priority}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Label: <strong>{rule.qualification_label}</strong></span>
                      <span className="ml-3">Funil: {getFunnelName(rule.funnel_id)}</span>
                    </div>
                    {conditions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Condições: {conditions.map((c: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs mr-1">
                            {c.field} {c.operator} {c.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(rule)}>
                      {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Regra de Qualificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Regra</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Lead Alto Valor" />
            </div>
            <div>
              <label className="text-sm font-medium">Label de Qualificação</label>
              <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex: Qualificado - Alto Ticket" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Classificação</label>
                <Select value={formClassification} onValueChange={setFormClassification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Input type="number" min="1" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Funil (opcional)</label>
              <Select value={formFunnelId} onValueChange={setFormFunnelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Global (todos)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {funnels?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Condição (opcional)</label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={formField} onValueChange={setFormField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Faturamento</SelectItem>
                    <SelectItem value="niche">Nicho</SelectItem>
                    <SelectItem value="state">Estado</SelectItem>
                    <SelectItem value="difficulty">Dificuldade</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formOperator} onValueChange={setFormOperator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">=">{'>='}  Maior ou igual</SelectItem>
                    <SelectItem value="<=">{'<='} Menor ou igual</SelectItem>
                    <SelectItem value="=">{'='} Igual</SelectItem>
                    <SelectItem value="!=">{'!='} Diferente</SelectItem>
                    <SelectItem value="contains">Contém</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Valor" />
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
