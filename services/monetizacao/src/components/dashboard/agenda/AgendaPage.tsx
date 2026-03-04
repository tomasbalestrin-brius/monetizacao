import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments, useClosersList } from '@/hooks/useAppointments';
import { useCloserAvailability, useDefaultAvailability } from '@/hooks/useCloserAvailability';
import { AppointmentCard } from './AppointmentCard';
import { CallResultModal } from './CallResultModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { Loader2, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppointmentWithLead } from '@/hooks/useAppointments';

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const fullDayLabels = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];

/** Default time slots for the agenda grid */
const DEFAULT_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function AgendaPage() {
  const { isCloser, isAdminOrLider, user } = useAuth();
  const [selectedCloserId, setSelectedCloserId] = useState<string | undefined>(undefined);
  const [callResultAppointment, setCallResultAppointment] = useState<AppointmentWithLead | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<AppointmentWithLead | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const closerId = isCloser ? user?.id : selectedCloserId;

  // Calculate week range based on offset
  const weekStart = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 5); // Saturday
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  // Build the 6 days array (Mon-Sat)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  // Fetch appointments for the visible week
  const { data: appointments, isLoading, error } = useAppointments({
    closerId,
    dateFrom: weekStart.toISOString(),
    dateTo: weekEnd.toISOString(),
  });

  // Fetch availability to show free slots
  const { data: closerSlots } = useCloserAvailability(closerId);
  const { data: defaultSlots } = useDefaultAvailability();
  const { data: closers } = useClosersList();

  // Build availability lookup: day_of_week -> { active, start, end, breakStart, breakEnd }
  const availabilityByDay = useMemo(() => {
    const slots = closerSlots && closerSlots.length > 0 ? closerSlots : defaultSlots;
    const map: Record<number, { active: boolean; start: string; end: string; breakStart: string | null; breakEnd: string | null }> = {};
    slots?.forEach((s) => {
      map[s.day_of_week] = { active: s.active, start: s.start_time, end: s.end_time, breakStart: s.break_start, breakEnd: s.break_end };
    });
    return map;
  }, [closerSlots, defaultSlots]);

  // Group appointments by date key -> time key
  const appointmentMap = useMemo(() => {
    const map: Record<string, Record<string, AppointmentWithLead>> = {};
    appointments?.forEach((apt) => {
      const timeKey = formatTime(apt.scheduled_date);
      const d = new Date(apt.scheduled_date);
      const dateKey = d.toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = {};
      map[dateKey][timeKey] = apt;
    });
    return map;
  }, [appointments]);

  // Determine time slots to show for a given day
  const getSlotsForDay = (dayDate: Date) => {
    const dow = dayDate.getDay();
    const avail = availabilityByDay[dow];
    if (!avail || !avail.active) return [];

    return DEFAULT_SLOTS.filter((slot) => {
      if (slot < avail.start || slot >= avail.end) return false;
      if (avail.breakStart && avail.breakEnd && slot >= avail.breakStart && slot < avail.breakEnd) return false;
      return true;
    });
  };

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  // Stats
  const totalWeek = appointments?.length ?? 0;
  const todayAppts = appointments?.filter(a => {
    const d = new Date(a.scheduled_date);
    return isSameDay(d, today);
  }).length ?? 0;
  const pendingAppts = appointments?.filter(a => a.status === 'agendado' || a.status === 'reagendado').length ?? 0;
  const completedAppts = appointments?.filter(a => a.status === 'realizado').length ?? 0;

  const isThisWeek = weekOffset === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isCloser ? 'Suas calls agendadas' : 'Calls agendadas'}
            {' · '}{formatDateShort(weekStart)} a {formatDateShort(weekEnd)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isThisWeek ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Proxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Closer filter (admin/lider only) */}
          {isAdminOrLider && closers && closers.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCloserId ?? ''}
                onChange={(e) => setSelectedCloserId(e.target.value || undefined)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Todos os closers</option>
                {closers.map((closer) => (
                  <option key={closer.id} value={closer.id}>
                    {closer.name ?? closer.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Hoje</p>
          <p className="text-2xl font-bold text-foreground">{todayAppts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Semana</p>
          <p className="text-2xl font-bold text-foreground">{totalWeek}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-500">{pendingAppts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Realizadas</p>
          <p className="text-2xl font-bold text-green-500">{completedAppts}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          Erro ao carregar agendamentos: {(error as Error).message}
        </div>
      )}

      {/* Weekly Calendar Grid */}
      {!isLoading && !error && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {weekDays.map((dayDate) => {
            const dateKey = dayDate.toISOString().split('T')[0];
            const isToday = dateKey === todayKey;
            const dow = dayDate.getDay();
            const dayAppts = appointmentMap[dateKey] ?? {};
            const slots = getSlotsForDay(dayDate);
            const dayAppointmentsList = appointments?.filter(a => {
              const d = new Date(a.scheduled_date);
              return isSameDay(d, dayDate);
            }) ?? [];

            // Count available (empty) slots
            const occupiedTimes = new Set(Object.keys(dayAppts));
            const freeSlots = slots.filter(s => !occupiedTimes.has(s)).length;

            return (
              <div key={dateKey} className={`border-b border-border last:border-b-0 ${isToday ? 'bg-primary/5' : ''}`}>
                {/* Day Header */}
                <div className={`flex items-center gap-3 px-4 py-3 ${isToday ? 'bg-primary/10' : 'bg-muted/30'}`}>
                  <div className={`
                    w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium shrink-0
                    ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    <span className="text-[10px] uppercase leading-none">{dayLabels[dow]}</span>
                    <span className="text-base font-bold leading-none">{dayDate.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {isToday ? 'Hoje' : fullDayLabels[dow]}
                      <span className="text-muted-foreground font-normal ml-2">{formatDateShort(dayDate)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayAppointmentsList.length} {dayAppointmentsList.length === 1 ? 'call' : 'calls'}
                      {freeSlots > 0 && (
                        <span className="text-green-600 ml-2">
                          · {freeSlots} {freeSlots === 1 ? 'horario livre' : 'horarios livres'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Time Slots */}
                {slots.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {slots.map((slotTime) => {
                      const apt = dayAppts[slotTime];
                      return (
                        <div key={slotTime} className="flex items-stretch min-h-[56px]">
                          {/* Time label */}
                          <div className="w-16 shrink-0 flex items-center justify-center border-r border-border/50 text-xs font-mono text-muted-foreground bg-muted/20">
                            {slotTime}
                          </div>
                          {/* Slot content */}
                          <div className="flex-1 px-3 py-1.5">
                            {apt ? (
                              <AppointmentCard
                                appointment={apt}
                                isCloserView={isCloser}
                                onViewDetails={() => setDetailsAppointment(apt)}
                                onRegisterResult={() => setCallResultAppointment(apt)}
                              />
                            ) : (
                              <div className="flex items-center h-full">
                                <span className="text-xs text-muted-foreground/40 italic">Disponivel</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground italic">Sem horarios configurados</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Call Result Modal */}
      {callResultAppointment && (
        <CallResultModal
          appointment={callResultAppointment}
          onClose={() => setCallResultAppointment(null)}
        />
      )}

      {/* Appointment Details Modal */}
      {detailsAppointment && (
        <AppointmentDetailsModal
          appointment={detailsAppointment}
          onClose={() => setDetailsAppointment(null)}
          onRegisterResult={() => {
            setCallResultAppointment(detailsAppointment);
            setDetailsAppointment(null);
          }}
        />
      )}
    </div>
  );
}
