import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Loader2, Save, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { useClosers } from '@/hooks/useMetrics';
import { useAllGoals, useUpsertGoal, CLOSER_METRIC_KEYS } from '@/hooks/useGoals';
import { useAuth } from '@/contexts/AuthContext';

export function GoalsConfig() {
  const { isAdmin, permissions } = useAuth();
  const entityType = 'closer' as const;
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: closers } = useClosers();
  const upsertGoal = useUpsertGoal();

  const monthStr = format(selectedMonth, 'yyyy-MM-dd');
  const { data: existingGoals, isLoading } = useAllGoals(monthStr);

  // For managers, filter closers by their squad permissions
  const managerSquadSlugs = useMemo(() => {
    if (isAdmin) return null;
    return permissions.filter(p => ['eagles', 'sharks'].includes(p));
  }, [isAdmin, permissions]);

  const entities = useMemo(() => {
    const allClosers = (closers || []).map(c => ({ id: c.id, name: c.name, extra: c.squad?.name, squadSlug: c.squad?.slug }));
    if (isAdmin) return allClosers;
    return allClosers.filter(c => managerSquadSlugs?.includes(c.squadSlug || ''));
  }, [closers, isAdmin, managerSquadSlugs]);

  const metricKeys = CLOSER_METRIC_KEYS;

  // Load existing goals when entity changes
  const entityGoals = useMemo(() => {
    if (!existingGoals || !selectedEntityId) return {};
    const map: Record<string, number> = {};
    existingGoals
      .filter(g => g.entity_type === entityType && g.entity_id === selectedEntityId)
      .forEach(g => { map[g.metric_key] = g.target_value; });
    return map;
  }, [existingGoals, selectedEntityId, entityType]);

  // Sync values when entity goals change
  useEffect(() => {
    const newValues: Record<string, string> = {};
    metricKeys.forEach(({ key }) => {
      newValues[key] = entityGoals[key]?.toString() || '';
    });
    setValues(newValues);
  }, [entityGoals, entityType]);

  const handleSave = async () => {
    if (!selectedEntityId) {
      toast.error('Selecione uma entidade');
      return;
    }

    setSaving(true);
    try {
      const promises = metricKeys
        .filter(({ key }) => values[key] && parseFloat(values[key]) > 0)
        .map(({ key }) =>
          upsertGoal.mutateAsync({
            entity_type: entityType,
            entity_id: selectedEntityId,
            month: monthStr,
            metric_key: key,
            target_value: parseFloat(values[key]),
          })
        );
      await Promise.all(promises);
      toast.success('Metas salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar metas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Metas dos Closers</h2>
            <p className="text-sm text-muted-foreground">Defina metas mensais para os closers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um closer..." />
            </SelectTrigger>
            <SelectContent>
              {entities.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} {e.extra ? `(${e.extra})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>

        {/* Goals Form */}
        {selectedEntityId && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metricKeys.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">{label}</label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={values[key] || ''}
                        onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Metas
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
