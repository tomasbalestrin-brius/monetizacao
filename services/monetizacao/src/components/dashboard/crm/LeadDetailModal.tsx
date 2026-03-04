import React, { useState } from 'react';
import { X, Phone, Mail, Instagram, Building, MapPin, DollarSign, Send } from 'lucide-react';
import { useLeadActivities, useAddLeadActivity, useUpdateLead } from '@/hooks/useLeads';
import { useArchiveLead } from '@/hooks/useLeadCleanup';
import { toast } from 'sonner';
import type { Lead } from '@/hooks/useLeads';

const classificationOptions = ['diamante', 'ouro', 'prata', 'bronze'] as const;
const statusOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'concluido', label: 'Concluido' },
];

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const [newNote, setNewNote] = useState('');
  const { data: activities, isLoading: loadingActivities } = useLeadActivities(lead.id);
  const addActivity = useAddLeadActivity();
  const updateLead = useUpdateLead();
  const archiveLead = useArchiveLead();

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addActivity.mutate(
      { leadId: lead.id, actionType: 'note', notes: newNote },
      {
        onSuccess: () => {
          setNewNote('');
          toast.success('Nota adicionada');
        },
      }
    );
  };

  const handleClassificationChange = (classification: string) => {
    updateLead.mutate(
      { leadId: lead.id, data: { classification } },
      { onSuccess: () => toast.success('Classificacao atualizada') }
    );
  };

  const handleStatusChange = (status: string) => {
    updateLead.mutate(
      { leadId: lead.id, data: { status } },
      { onSuccess: () => toast.success('Status atualizado') }
    );
  };

  const handleArchive = (reason: 'nao_fit' | 'manual') => {
    if (!confirm('Tem certeza que deseja arquivar este lead?')) return;
    archiveLead.mutate(
      { leadId: lead.id, reason },
      {
        onSuccess: () => {
          toast.success('Lead arquivado');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{lead.full_name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3">
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-muted-foreground" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.instagram && (
              <div className="flex items-center gap-2 text-sm">
                <Instagram size={14} className="text-muted-foreground" />
                <span>{lead.instagram}</span>
              </div>
            )}
            {lead.business_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building size={14} className="text-muted-foreground" />
                <span>{lead.business_name}</span>
              </div>
            )}
            {lead.state && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-muted-foreground" />
                <span>{lead.state}</span>
              </div>
            )}
            {lead.revenue != null && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={14} className="text-muted-foreground" />
                <span>R$ {lead.revenue.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>

          {lead.main_pain && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dor Principal</p>
              <p className="text-sm">{lead.main_pain}</p>
            </div>
          )}

          {/* Classification */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Classificacao</p>
            <div className="flex gap-2">
              {classificationOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => handleClassificationChange(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                    lead.classification === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Activity / Notes */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Atividades</p>
            <div className="flex gap-2 mb-3">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Adicionar nota..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddNote}
                disabled={addActivity.isPending || !newNote.trim()}
                className="bg-primary text-primary-foreground rounded-lg px-3 py-2 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loadingActivities && <p className="text-xs text-muted-foreground">Carregando...</p>}
              {activities?.map((activity) => (
                <div key={activity.id} className="bg-muted/50 rounded-lg p-2 text-sm">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{activity.action_type.replace('_', ' ')}</span>
                    <span>{new Date(activity.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {activity.notes && <p>{activity.notes}</p>}
                </div>
              ))}
              {activities?.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma atividade registrada.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => handleArchive('nao_fit')}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              Nao Fit
            </button>
            <button
              onClick={() => handleArchive('manual')}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Arquivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
