import React from 'react';
import { Clock, Phone, User, Tag, ChevronRight, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import type { AppointmentWithLead } from '@/hooks/useAppointments';

interface AppointmentCardProps {
  appointment: AppointmentWithLead;
  isCloserView: boolean;
  onViewDetails: () => void;
  onRegisterResult: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  agendado: { label: 'Agendada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  reagendado: { label: 'Reagendada', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: RotateCcw },
  realizado: { label: 'Realizada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  nao_compareceu: { label: 'Nao compareceu', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  cancelado: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: AlertCircle },
};

const classificationColors: Record<string, string> = {
  diamante: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ouro: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  prata: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function AppointmentCard({ appointment, isCloserView, onViewDetails, onRegisterResult }: AppointmentCardProps) {
  const status = statusConfig[appointment.status] ?? statusConfig.agendado;
  const StatusIcon = status.icon;
  const isPending = appointment.status === 'agendado' || appointment.status === 'reagendado';
  const lead = appointment.lead;

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onViewDetails}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Time + Lead info */}
        <div className="flex-1 min-w-0">
          {/* Time and status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-foreground">{formatTime(appointment.scheduled_date)}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            {lead?.classification && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${classificationColors[lead.classification] ?? ''}`}>
                {lead.classification}
              </span>
            )}
          </div>

          {/* Lead name */}
          <p className="font-semibold text-foreground truncate">
            {lead?.full_name ?? 'Lead sem nome'}
          </p>

          {/* Lead details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {lead?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </span>
            )}
            {lead?.instagram && (
              <span className="flex items-center gap-1">
                @{lead.instagram.replace('@', '')}
              </span>
            )}
            {lead?.niche && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {lead.niche}
              </span>
            )}
            {appointment.funnel?.name && (
              <span className="text-primary/70">
                {appointment.funnel.name}
              </span>
            )}
          </div>

          {/* SDR info (for admin/lider view) */}
          {!isCloserView && appointment.sdr_profile && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <User className="h-3 w-3" />
              SDR: {appointment.sdr_profile.name ?? appointment.sdr_profile.email}
            </p>
          )}

          {/* Closer info (for admin/lider view when filtering all) */}
          {!isCloserView && appointment.closer_profile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Closer: {appointment.closer_profile.name ?? appointment.closer_profile.email}
            </p>
          )}

          {/* Main pain preview */}
          {lead?.main_pain && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
              "{lead.main_pain}"
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegisterResult();
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Registrar
            </button>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Conversion result (if completed) */}
      {appointment.status === 'realizado' && appointment.converted !== null && (
        <div className={`mt-3 pt-3 border-t border-border text-xs font-medium ${appointment.converted ? 'text-green-600' : 'text-muted-foreground'}`}>
          {appointment.converted
            ? `Venda realizada${appointment.conversion_value ? ` - R$ ${Number(appointment.conversion_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
            : 'Sem conversao'
          }
        </div>
      )}
    </div>
  );
}
