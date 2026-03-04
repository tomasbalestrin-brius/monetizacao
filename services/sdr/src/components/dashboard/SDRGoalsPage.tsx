import React, { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useSDRs } from '@/hooks/useSdrMetrics';
import { useAllGoals, useUpsertGoal, SDR_METRIC_KEYS, getGoalTarget } from '@/hooks/useGoals';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SDRGoalsPage() {
  const { isAdmin, isAdminOrLider } = useAuth();
  const { data: sdrs, isLoading: loadingSDRs } = useSDRs();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedSdrId, setSelectedSdrId] = useState<string>('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const monthStr = format(selectedMonth, 'yyyy-MM-dd');
  const { data: allGoals, isLoading: loadingGoals } = useAllGoals(monthStr);
  const upsertGoal = useUpsertGoal();

  // Get goals for the selected SDR
  const sdrGoals = useMemo(() => {
    if (!allGoals || !selectedSdrId) return {};
    const map: Record<string, number> = {};
    allGoals
      .filter(g => g.entity_type === 'sdr' && g.entity_id === selectedSdrId)
      .forEach(g => { map[g.metric_key] = g.target_value; });
    return map;
  }, [allGoals, selectedSdrId]);

  // Sync form values when selection changes
  useEffect(() => {
    const newValues: Record<string, string> = {};
    SDR_METRIC_KEYS.forEach(({ key }) => {
      newValues[key] = sdrGoals[key]?.toString() || '';
    });
    setValues(newValues);
  }, [sdrGoals]);

  const handleSave = async () => {
    if (!selectedSdrId) {
      toast.error('Selecione um SDR');
      return;
    }
    setSaving(true);
    try {
      const promises = SDR_METRIC_KEYS
        .filter(({ key }) => values[key] && parseFloat(values[key]) > 0)
        .map(({ key }) =>
          upsertGoal.mutateAsync({
            entity_type: 'sdr',
            entity_id: selectedSdrId,
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

  if (loadingSDRs) {
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
          <Target size={24} />
          Metas SDR
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe e configure as metas individuais dos SDRs</p>
      </div>

      {/* Goal configuration for admin/lider */}
      {isAdminOrLider && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Configurar Metas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">SDR</label>
              <select
                value={selectedSdrId}
                onChange={(e) => setSelectedSdrId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione um SDR...</option>
                {sdrs?.map((sdr: any) => (
                  <option key={sdr.id} value={sdr.id}>
                    {sdr.name} ({sdr.type === 'social_selling' ? 'Social Selling' : 'SDR'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mes</label>
              <input
                type="month"
                value={format(selectedMonth, 'yyyy-MM')}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedMonth(new Date(y, m - 1, 1));
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {selectedSdrId && (
            <>
              {loadingGoals ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SDR_METRIC_KEYS.map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={values[key] || ''}
                          onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Metas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Individual SDR Goals overview */}
      {sdrs && sdrs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sdrs.map((sdr: any) => {
            const goals = allGoals?.filter(g => g.entity_type === 'sdr' && g.entity_id === sdr.id) ?? [];
            return (
              <Card key={sdr.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="font-bold text-emerald-600">{sdr.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{sdr.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sdr.type === 'social_selling' ? 'Social Selling' : 'SDR'}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    {SDR_METRIC_KEYS.map(({ key, label }) => {
                      const target = getGoalTarget(goals, key);
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">{target ? `Meta: ${target}` : '-'}</span>
                          </div>
                          <Progress value={target ? 0 : 0} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
