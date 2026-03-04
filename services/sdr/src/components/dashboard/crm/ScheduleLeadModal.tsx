import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Calendar, Clock, Loader2, Check, User } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/hooks/useLeads';

interface ScheduleLeadModalProps {
  lead: Lead;
  onClose: () => void;
}

interface Closer {
  id: string;
  email: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

function useClosers() {
  return useQuery({
    queryKey: ['closers-for-scheduling'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['closer', 'user', 'admin', 'lider']);
      if (error) throw error;

      const userIds = (roles || []).map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      if (pError) throw pError;
      return (profiles || []) as Closer[];
    },
  });
}

function useCloserAvailabilityForScheduling(closerId?: string) {
  return useQuery({
    queryKey: ['closer-avail-schedule', closerId],
    queryFn: async () => {
      if (!closerId) return [];
      const { data, error } = await supabase
        .from('closer_availability')
        .select('day_of_week, start_time, end_time, active')
        .eq('closer_id', closerId)
        .eq('active', true)
        .order('day_of_week');
      if (error) throw error;
      return (data || []) as AvailabilitySlot[];
    },
    enabled: !!closerId,
  });
}

function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: {
      lead_id: string;
      closer_id: string;
      date: string;
      time: string;
      status: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          lead_id: appointment.lead_id,
          closer_id: appointment.closer_id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += 30;
  }
  return slots;
}

export function ScheduleLeadModal({ lead, onClose }: ScheduleLeadModalProps) {
  const { data: closers, isLoading: loadingClosers } = useClosers();
  const [selectedCloser, setSelectedCloser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const { data: availability } = useCloserAvailabilityForScheduling(selectedCloser || undefined);
  const createAppointment = useCreateAppointment();

  // Next 14 days
  const availableDates = useMemo(() => {
    if (!availability || availability.length === 0) return [];
    const dates: { date: Date; dayOfWeek: number; formatted: string; label: string }[] = [];
    const today = startOfDay(new Date());

    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, i);
      const dow = d.getDay(); // 0=Sunday
      if (availability.some((a) => a.day_of_week === dow)) {
        dates.push({
          date: d,
          dayOfWeek: dow,
          formatted: format(d, 'yyyy-MM-dd'),
          label: format(d, "EEE, dd/MM", { locale: ptBR }),
        });
      }
    }
    return dates;
  }, [availability]);

  // Time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !availability) return [];
    const dateObj = availableDates.find((d) => d.formatted === selectedDate);
    if (!dateObj) return [];

    const daySlots = availability.filter((a) => a.day_of_week === dateObj.dayOfWeek);
    const allSlots: string[] = [];
    daySlots.forEach((slot) => {
      allSlots.push(...generateTimeSlots(slot.start_time, slot.end_time));
    });
    return [...new Set(allSlots)].sort();
  }, [selectedDate, availability, availableDates]);

  const handleSchedule = async () => {
    if (!selectedCloser || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await createAppointment.mutateAsync({
        lead_id: lead.id,
        closer_id: selectedCloser,
        date: selectedDate,
        time: selectedTime,
        status: 'agendado',
      });
      toast.success('Agendamento criado com sucesso!');
      onClose();
    } catch {
      toast.error('Erro ao criar agendamento');
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Agendar Lead
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{lead.full_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Select Closer */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <User className="h-4 w-4 inline mr-1" />
              Selecione o Closer
            </label>
            {loadingClosers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {closers?.map((closer) => (
                  <button
                    key={closer.id}
                    onClick={() => {
                      setSelectedCloser(closer.id);
                      setSelectedDate('');
                      setSelectedTime('');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedCloser === closer.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600">
                      {closer.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{closer.email}</span>
                    {selectedCloser === closer.id && (
                      <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select Date */}
          {selectedCloser && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                Selecione a Data
              </label>
              {availableDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableDates.map((d) => (
                    <button
                      key={d.formatted}
                      onClick={() => { setSelectedDate(d.formatted); setSelectedTime(''); }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedDate === d.formatted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Este closer não possui disponibilidade configurada.
                </p>
              )}
            </div>
          )}

          {/* Select Time */}
          {selectedDate && timeSlots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Clock className="h-4 w-4 inline mr-1" />
                Selecione o Horário
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedCloser || !selectedDate || !selectedTime || createAppointment.isPending}
            className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {createAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
