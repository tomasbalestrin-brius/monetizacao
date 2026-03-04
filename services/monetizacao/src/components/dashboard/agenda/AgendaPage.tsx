import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWeekAppointments, useClosersList } from '@/hooks/useAppointments';
import { AppointmentCard } from './AppointmentCard';
import { CallResultModal } from './CallResultModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { Loader2, Calendar, Filter } from 'lucide-react';
import type { AppointmentWithLead } from '@/hooks/useAppointments';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const fullDayNames = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(appointments: AppointmentWithLead[]) {
  const groups: Record<string, AppointmentWithLead[]> = {};

  for (const apt of appointments) {
    const date = new Date(apt.scheduled_date);
    const key = date.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(apt);
  }

  // Sort each group by time
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }

  return groups;
}

export function AgendaPage() {
  const { isCloser, isAdminOrLider, user } = useAuth();
  const [selectedCloserId, setSelectedCloserId] = useState<string | undefined>(undefined);
  const [callResultAppointment, setCallResultAppointment] = useState<AppointmentWithLead | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<AppointmentWithLead | null>(null);

  const closerId = isCloser ? user?.id : selectedCloserId;
  const { data: appointments, isLoading, error } = useWeekAppointments(closerId);
  const { data: closers } = useClosersList();

  const grouped = groupByDay(appointments ?? []);
  const sortedDays = Object.keys(grouped).sort();

  const today = new Date().toISOString().split('T')[0];

  // Stats
  const totalWeek = appointments?.length ?? 0;
  const todayAppts = grouped[today]?.length ?? 0;
  const pendingAppts = appointments?.filter(a => a.status === 'agendado' || a.status === 'reagendado').length ?? 0;
  const completedAppts = appointments?.filter(a => a.status === 'realizado').length ?? 0;

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
            {isCloser ? 'Suas calls agendadas da semana' : 'Calls agendadas da semana'}
          </p>
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

      {/* Empty state */}
      {!isLoading && !error && totalWeek === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum agendamento esta semana</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quando calls forem agendadas, elas aparecerao aqui.
          </p>
        </div>
      )}

      {/* Appointments grouped by day */}
      {!isLoading && sortedDays.map((dayKey) => {
        const date = new Date(dayKey + 'T12:00:00');
        const isToday = dayKey === today;
        const dayOfWeek = date.getDay();
        const appts = grouped[dayKey];

        return (
          <div key={dayKey} className="space-y-3">
            {/* Day header */}
            <div className={`flex items-center gap-3 ${isToday ? 'text-primary' : 'text-foreground'}`}>
              <div className={`
                w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-medium
                ${isToday
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                <span className="text-[10px] uppercase">{dayNames[dayOfWeek]}</span>
                <span className="text-lg font-bold leading-none">{date.getDate()}</span>
              </div>
              <div>
                <p className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {isToday ? 'Hoje' : fullDayNames[dayOfWeek]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appts.length} {appts.length === 1 ? 'call' : 'calls'}
                </p>
              </div>
            </div>

            {/* Appointment cards */}
            <div className="space-y-2 ml-[60px]">
              {appts.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isCloserView={isCloser}
                  onViewDetails={() => setDetailsAppointment(appointment)}
                  onRegisterResult={() => setCallResultAppointment(appointment)}
                />
              ))}
            </div>
          </div>
        );
      })}

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
