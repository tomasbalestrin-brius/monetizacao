import React from 'react';
import {
  X, Phone, Mail, AtSign, Tag, User, Calendar, Clock,
  DollarSign, AlertTriangle, CheckCircle, RotateCcw, Ban,
} from 'lucide-react';
import { useCancelAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AppointmentWithLead } from '@/hooks/useAppointments';

interface AppointmentDetailsModalProps {
  appointment: AppointmentWithLead;
  onClose: () => void;
  onRegisterResult: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  agendado: { label: 'Agendada', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  reagendado: { label: 'Reagendada', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  realizado: { label: 'Realizada', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  nao_compareceu: { label: 'Nao compareceu', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  cancelado: { label: 'Cancelada', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
};

export function AppointmentDetailsModal({ appointment, onClose, onRegisterResult }: AppointmentDetailsModalProps) {
  const { isCloser, isAdminOrLider } = useAuth();
  const cancelMutation = useCancelAppointment();
  const lead = appointment.lead;
  const status = statusConfig[appointment.status] ?? statusConfig.agendado;
  const isPending = appointment.status === 'agendado' || appointment.status === 'reagendado';

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      await cancelMutation.mutateAsync(appointment.id);
      toast.success('Agendamento cancelado. O SDR sera notificado.');
      onClose();
    } catch (err) {
      toast.error('Erro ao cancelar: ' + (err as Error).message);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Detalhes da Call</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.color}`}>
              {status.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Schedule info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium capitalize">
                {formatDateTime(appointment.scheduled_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duracao: {appointment.duration} minutos</span>
            </div>
            {appointment.reschedule_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <RotateCcw className="h-4 w-4" />
                <span>Reagendada {appointment.reschedule_count}x</span>
              </div>
            )}
          </div>

          {/* Lead info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Dados do Lead</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">{lead?.full_name ?? 'Sem nome'}</span>
                {lead?.classification && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium capitalize">
                    {lead.classification}
                  </span>
                )}
              </div>

              {lead?.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="h-4 w-4 shrink-0" />
                  {lead.phone}
                </a>
              )}

              {lead?.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4 shrink-0" />
                  {lead.email}
                </a>
              )}

              {lead?.instagram && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AtSign className="h-4 w-4 shrink-0" />
                  {lead.instagram.replace('@', '')}
                </div>
              )}

              {lead?.niche && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4 shrink-0" />
                  {lead.niche}
                </div>
              )}

              {lead?.revenue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 shrink-0" />
                  Faturamento: R$ {Number(lead.revenue).toLocaleString('pt-BR')}
                </div>
              )}

              {lead?.main_pain && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Principal dor:</p>
                  <p className="text-sm text-foreground">{lead.main_pain}</p>
                </div>
              )}
            </div>
          </div>

          {/* Funnel + SDR info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {appointment.funnel?.name && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Funil</p>
                <p className="font-medium text-foreground">{appointment.funnel.name}</p>
              </div>
            )}
            {appointment.sdr_profile && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">SDR</p>
                <p className="font-medium text-foreground">{appointment.sdr_profile.name ?? appointment.sdr_profile.email}</p>
              </div>
            )}
            {!isCloser && appointment.closer_profile && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Closer</p>
                <p className="font-medium text-foreground">{appointment.closer_profile.name ?? appointment.closer_profile.email}</p>
              </div>
            )}
          </div>

          {/* Conversion result (if completed) */}
          {appointment.status === 'realizado' && (
            <div className={`p-4 rounded-lg border ${appointment.converted ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-border bg-muted/30'}`}>
              <p className="text-sm font-medium text-foreground">
                {appointment.attended ? 'Lead compareceu' : 'Lead nao compareceu'}
              </p>
              {appointment.converted !== null && (
                <p className={`text-sm mt-1 ${appointment.converted ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                  {appointment.converted
                    ? `Venda: R$ ${Number(appointment.conversion_value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Sem conversao'
                  }
                </p>
              )}
              {appointment.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">"{appointment.notes}"</p>
              )}
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onRegisterResult}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Registrar Resultado
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2.5 border border-destructive/30 text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
