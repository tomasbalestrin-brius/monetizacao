import { useState, useEffect, useMemo } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import {
  useCloserAvailability,
  useDefaultAvailability,
  useSaveCloserAvailability,
  useSaveDefaultAvailability,
} from '@/hooks/useCloserAvailability';
import { useClosersList } from '@/hooks/useAppointments';
import { useAuth } from '@bethel/shared-auth';
import { toast } from 'sonner';

const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

/** All available 30-min time slots */
const ALL_TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

interface DaySchedule {
  active: boolean;
  slots: Set<string>;
}

type WeekSchedule = Record<number, DaySchedule>;

function createEmptyWeek(): WeekSchedule {
  const w: WeekSchedule = {};
  for (let d = 0; d < 7; d++) {
    w[d] = { active: d >= 1 && d <= 5, slots: new Set() };
  }
  return w;
}

function rangeToSlots(start: string, end: string, breakStart: string | null, breakEnd: string | null): Set<string> {
  const s = new Set<string>();
  for (const t of ALL_TIME_SLOTS) {
    if (t >= start && t < end) {
      if (breakStart && breakEnd && t >= breakStart && t < breakEnd) continue;
      s.add(t);
    }
  }
  return s;
}

function slotsToRange(slots: Set<string>): { start: string; end: string; breakStart: string | null; breakEnd: string | null } {
  const sorted = [...slots].sort();
  if (sorted.length === 0) return { start: '09:00', end: '18:00', breakStart: null, breakEnd: null };
  const start = sorted[0];
  const lastSlot = sorted[sorted.length - 1];
  const [h, m] = lastSlot.split(':').map(Number);
  const endMin = h * 60 + m + 30;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

  // Detect first gap as break
  let breakStart: string | null = null;
  let breakEnd: string | null = null;
  for (let i = 0; i < ALL_TIME_SLOTS.length; i++) {
    const t = ALL_TIME_SLOTS[i];
    if (t >= start && t < end && !slots.has(t)) {
      if (!breakStart) breakStart = t;
      breakEnd = ALL_TIME_SLOTS[i + 1] ?? t;
    } else if (breakStart && breakEnd) {
      break;
    }
  }

  return { start, end, breakStart, breakEnd };
}

export function AvailabilityPage() {
  const { isCloser, isAdminOrLider, user } = useAuth();
  const [selectedCloserId, setSelectedCloserId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<'closer' | 'default'>(isCloser ? 'closer' : 'default');

  const effectiveCloserId = isCloser ? user?.id : selectedCloserId;
  const { data: closerSlots, isLoading: loadingCloser } = useCloserAvailability(effectiveCloserId);
  const { data: defaultSlotsData, isLoading: loadingDefault } = useDefaultAvailability();
  const { data: closers } = useClosersList();
  const saveCloser = useSaveCloserAvailability();
  const saveDefault = useSaveDefaultAvailability();

  const [closerSchedule, setCloserSchedule] = useState<WeekSchedule>(createEmptyWeek);
  const [defaultSchedule, setDefaultSchedule] = useState<WeekSchedule>(createEmptyWeek);

  // Init closer schedule from data
  useEffect(() => {
    if (!closerSlots) return;
    const w = createEmptyWeek();
    closerSlots.forEach((s) => {
      w[s.day_of_week] = {
        active: s.active,
        slots: rangeToSlots(s.start_time, s.end_time, s.break_start, s.break_end),
      };
    });
    setCloserSchedule(w);
  }, [closerSlots]);

  // Init default schedule from data
  useEffect(() => {
    if (!defaultSlotsData) return;
    const w = createEmptyWeek();
    defaultSlotsData.forEach((s) => {
      w[s.day_of_week] = {
        active: s.active,
        slots: rangeToSlots(s.start_time, s.end_time, s.break_start, s.break_end),
      };
    });
    setDefaultSchedule(w);
  }, [defaultSlotsData]);

  const schedule = tab === 'closer' ? closerSchedule : defaultSchedule;
  const setSchedule = tab === 'closer' ? setCloserSchedule : setDefaultSchedule;
  const isLoading = tab === 'closer' ? loadingCloser : loadingDefault;

  const toggleDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const toggleSlot = (day: number, slot: string) => {
    setSchedule((prev) => {
      const newSlots = new Set(prev[day].slots);
      if (newSlots.has(slot)) newSlots.delete(slot);
      else newSlots.add(slot);
      return { ...prev, [day]: { ...prev[day], slots: newSlots } };
    });
  };

  const handleSaveCloser = () => {
    if (!effectiveCloserId) {
      toast.error('Selecione um closer');
      return;
    }
    const activeSlots = Object.entries(closerSchedule)
      .filter(([_, ds]) => ds.active && ds.slots.size > 0)
      .map(([dayStr, ds]) => {
        const range = slotsToRange(ds.slots);
        return {
          closer_id: effectiveCloserId,
          day_of_week: Number(dayStr),
          start_time: range.start,
          end_time: range.end,
          break_start: range.breakStart,
          break_end: range.breakEnd,
          active: true,
        };
      });
    saveCloser.mutate(
      { closerId: effectiveCloserId, slots: activeSlots },
      { onSuccess: () => toast.success('Disponibilidade salva com sucesso') }
    );
  };

  const handleSaveDefault = () => {
    const slots = Object.entries(defaultSchedule).map(([dayStr, ds]) => {
      const range = slotsToRange(ds.slots);
      return {
        day_of_week: Number(dayStr),
        start_time: range.start,
        end_time: range.end,
        break_start: range.breakStart,
        break_end: range.breakEnd,
        active: ds.active,
      };
    });
    saveDefault.mutate(slots, { onSuccess: () => toast.success('Horario padrao salvo com sucesso') });
  };

  // Get default slots for comparison (closer tab - show which are leader-defined)
  const defaultSlotsByDay = useMemo(() => {
    const map: Record<number, Set<string>> = {};
    defaultSlotsData?.forEach((s) => {
      map[s.day_of_week] = rangeToSlots(s.start_time, s.end_time, s.break_start, s.break_end);
    });
    return map;
  }, [defaultSlotsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Disponibilidade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tab === 'default'
            ? 'Defina os horarios padrao para todos os closers'
            : 'Marque os horarios em que voce esta disponivel para calls. Clique em cada horario individualmente.'}
        </p>
      </div>

      {/* Tabs (admin/lider) */}
      {isAdminOrLider && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab('default')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'default' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Horario Padrao
          </button>
          <button
            onClick={() => setTab('closer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'closer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Por Closer
          </button>
        </div>
      )}

      {/* Closer selector */}
      {tab === 'closer' && isAdminOrLider && closers && (
        <select
          value={selectedCloserId ?? ''}
          onChange={(e) => setSelectedCloserId(e.target.value || undefined)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Selecionar closer...</option>
          {closers.map((c) => (
            <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
          ))}
        </select>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Schedule grid */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((dow) => {
              const ds = schedule[dow];
              const defaultSet = defaultSlotsByDay[dow];
              return (
                <div key={dow} className={`bg-card border border-border rounded-lg p-4 transition-opacity ${ds.active ? '' : 'opacity-50'}`}>
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ds.active}
                        onChange={() => toggleDay(dow)}
                        className="rounded"
                      />
                      <span className="text-sm font-semibold">{dayNames[dow]}</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {ds.slots.size} {ds.slots.size === 1 ? 'horario' : 'horarios'}
                    </span>
                  </div>

                  {/* Time slot grid */}
                  {ds.active && (
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TIME_SLOTS.map((slot) => {
                        const selected = ds.slots.has(slot);
                        const isDefault = tab === 'closer' && defaultSet?.has(slot);
                        return (
                          <button
                            key={slot}
                            onClick={() => toggleSlot(dow, slot)}
                            className={`
                              px-2.5 py-1.5 rounded text-xs font-mono transition-colors
                              ${selected
                                ? 'bg-primary text-primary-foreground'
                                : isDefault
                                  ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                              }
                            `}
                            title={isDefault && !selected ? 'Horario definido pelo lider (clique para adicionar)' : ''}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Legend for closer tab */}
                  {ds.active && tab === 'closer' && (
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-primary inline-block" /> Selecionado
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30 inline-block" /> Padrao do lider
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-muted inline-block" /> Disponivel
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <button
            onClick={tab === 'closer' ? handleSaveCloser : handleSaveDefault}
            disabled={saveCloser.isPending || saveDefault.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {(saveCloser.isPending || saveDefault.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </>
      )}
    </div>
  );
}
