import React, { useState, useEffect } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import {
  useCloserAvailability,
  useDefaultAvailability,
  useSaveCloserAvailability,
  useSaveDefaultAvailability,
  type CloserAvailability,
} from '@/hooks/useCloserAvailability';
import { useClosersList } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

interface SlotForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  active: boolean;
}

const defaultSlot = (day: number): SlotForm => ({
  day_of_week: day,
  start_time: '09:00',
  end_time: '18:00',
  break_start: '12:00',
  break_end: '13:00',
  active: day >= 1 && day <= 5, // Mon-Fri active by default
});

function slotsFromData(data: { day_of_week: number; start_time: string; end_time: string; break_start: string | null; break_end: string | null; active: boolean }[]): SlotForm[] {
  const slots: SlotForm[] = [];
  for (let d = 0; d < 7; d++) {
    const existing = data.find((s) => s.day_of_week === d);
    if (existing) {
      slots.push({
        day_of_week: d,
        start_time: existing.start_time,
        end_time: existing.end_time,
        break_start: existing.break_start ?? '',
        break_end: existing.break_end ?? '',
        active: existing.active,
      });
    } else {
      slots.push(defaultSlot(d));
    }
  }
  return slots;
}

export function AvailabilityPage() {
  const { isCloser, isAdminOrLider, user } = useAuth();
  const [selectedCloserId, setSelectedCloserId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<'closer' | 'default'>(isCloser ? 'closer' : 'default');

  const effectiveCloserId = isCloser ? user?.id : selectedCloserId;
  const { data: closerSlots, isLoading: loadingCloser } = useCloserAvailability(effectiveCloserId);
  const { data: defaultSlots, isLoading: loadingDefault } = useDefaultAvailability();
  const { data: closers } = useClosersList();
  const saveCloser = useSaveCloserAvailability();
  const saveDefault = useSaveDefaultAvailability();

  const [closerForm, setCloserForm] = useState<SlotForm[]>([]);
  const [defaultForm, setDefaultForm] = useState<SlotForm[]>([]);

  // Init closer form
  useEffect(() => {
    if (closerSlots) setCloserForm(slotsFromData(closerSlots));
  }, [closerSlots]);

  // Init default form
  useEffect(() => {
    if (defaultSlots) setDefaultForm(slotsFromData(defaultSlots));
    else setDefaultForm(Array.from({ length: 7 }, (_, i) => defaultSlot(i)));
  }, [defaultSlots]);

  const updateSlot = (form: SlotForm[], setForm: React.Dispatch<React.SetStateAction<SlotForm[]>>, day: number, field: keyof SlotForm, value: string | boolean) => {
    setForm(form.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)));
  };

  const handleSaveCloser = () => {
    if (!effectiveCloserId) {
      toast.error('Selecione um closer');
      return;
    }
    const activeSlots = closerForm.filter((s) => s.active).map((s) => ({
      closer_id: effectiveCloserId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      break_start: s.break_start || null,
      break_end: s.break_end || null,
      active: true,
    }));
    saveCloser.mutate(
      { closerId: effectiveCloserId, slots: activeSlots },
      { onSuccess: () => toast.success('Disponibilidade salva') }
    );
  };

  const handleSaveDefault = () => {
    const slots = defaultForm.map((s) => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      break_start: s.break_start || null,
      break_end: s.break_end || null,
      active: s.active,
    }));
    saveDefault.mutate(slots, { onSuccess: () => toast.success('Horario padrao salvo') });
  };

  const isLoading = tab === 'closer' ? loadingCloser : loadingDefault;
  const form = tab === 'closer' ? closerForm : defaultForm;
  const setForm = tab === 'closer' ? setCloserForm : setDefaultForm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Disponibilidade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os horarios de atendimento
        </p>
      </div>

      {/* Tabs (admin/lider) */}
      {isAdminOrLider && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab('default')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'default' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            Horario Padrao
          </button>
          <button
            onClick={() => setTab('closer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'closer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
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
          <div className="space-y-3">
            {form.map((slot) => (
              <div key={slot.day_of_week} className={`bg-card border border-border rounded-lg p-4 transition-opacity ${slot.active ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Active toggle */}
                  <label className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={slot.active}
                      onChange={(e) => updateSlot(form, setForm, slot.day_of_week, 'active', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{dayNames[slot.day_of_week]}</span>
                  </label>

                  {/* Time inputs */}
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(form, setForm, slot.day_of_week, 'start_time', e.target.value)}
                      disabled={!slot.active}
                      className="bg-background border border-border rounded px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">ate</span>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(form, setForm, slot.day_of_week, 'end_time', e.target.value)}
                      disabled={!slot.active}
                      className="bg-background border border-border rounded px-2 py-1 text-sm"
                    />
                  </div>

                  {/* Break */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">Intervalo:</span>
                    <input
                      type="time"
                      value={slot.break_start}
                      onChange={(e) => updateSlot(form, setForm, slot.day_of_week, 'break_start', e.target.value)}
                      disabled={!slot.active}
                      className="bg-background border border-border rounded px-2 py-1 text-sm w-24"
                    />
                    <span className="text-xs">-</span>
                    <input
                      type="time"
                      value={slot.break_end}
                      onChange={(e) => updateSlot(form, setForm, slot.day_of_week, 'break_end', e.target.value)}
                      disabled={!slot.active}
                      className="bg-background border border-border rounded px-2 py-1 text-sm w-24"
                    />
                  </div>
                </div>
              </div>
            ))}
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
