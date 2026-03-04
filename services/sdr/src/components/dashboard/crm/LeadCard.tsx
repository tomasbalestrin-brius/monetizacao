import React from 'react';
import { Phone, Mail, Instagram, DollarSign, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/hooks/useLeads';

const classificationColors: Record<string, string> = {
  diamante: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ouro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  prata: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  bronze: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  agendado: 'Agendado',
  concluido: 'Concluido',
};

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onSchedule?: () => void;
}

export function LeadCard({ lead, onClick, onDragStart, onSchedule }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-start justify-between">
        <p className="font-medium text-sm text-foreground truncate flex-1">{lead.full_name}</p>
        {lead.classification && (
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium uppercase', classificationColors[lead.classification])}>
            {lead.classification}
          </span>
        )}
      </div>

      {lead.niche && (
        <p className="text-xs text-muted-foreground">{lead.niche}</p>
      )}

      <div className="flex items-center gap-3 text-muted-foreground">
        {lead.phone && (
          <div className="flex items-center gap-1">
            <Phone size={12} />
            <span className="text-xs truncate max-w-[100px]">{lead.phone}</span>
          </div>
        )}
        {lead.email && <Mail size={12} />}
        {lead.instagram && <Instagram size={12} />}
        {lead.revenue != null && lead.revenue > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign size={12} />
            <span className="text-xs">{(lead.revenue / 1000).toFixed(0)}k</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{statusLabels[lead.status] ?? lead.status}</span>
        <div className="flex items-center gap-2">
          {onSchedule && lead.status !== 'agendado' && lead.status !== 'concluido' && (
            <button
              onClick={(e) => { e.stopPropagation(); onSchedule(); }}
              className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-1.5 py-0.5 transition-colors"
            >
              <CalendarPlus size={10} />
              Agendar
            </button>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}
