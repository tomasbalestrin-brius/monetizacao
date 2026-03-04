import React, { useState } from 'react';
import { Kanban, Plus, Search, Filter } from 'lucide-react';
import { useLeadsByColumn, useMoveLead, type Lead } from '@/hooks/useLeads';
import { useFunnels } from '@/hooks/useFunnels';
import { LeadCard } from './LeadCard';
import { LeadDetailModal } from './LeadDetailModal';
import { CreateLeadModal } from './CreateLeadModal';
import { Loader2 } from 'lucide-react';

export function CrmKanbanPage() {
  const { columns, grouped, isLoading, error } = useLeadsByColumn();
  const moveLead = useMoveLead();
  const { data: funnels } = useFunnels();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [filterFunnel, setFilterFunnel] = useState('');

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      moveLead.mutate({ leadId, columnId });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const filterLeads = (leads: Lead[]) => {
    let filtered = leads;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.full_name.toLowerCase().includes(s) ||
          l.phone?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s)
      );
    }
    if (filterFunnel) {
      filtered = filtered.filter((l) => l.funnel_id === filterFunnel);
    }
    return filtered;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
        Erro ao carregar CRM: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Kanban className="h-6 w-6" />
            CRM - Gestao de Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus leads pelo quadro Kanban
          </p>
        </div>
        <button
          onClick={() => { setCreateColumnId(undefined); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={16} />
          Novo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-3 py-2 text-sm"
          />
        </div>
        {funnels && funnels.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterFunnel}
              onChange={(e) => setFilterFunnel(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos os funis</option>
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {columns.map((column) => {
          const leads = filterLeads(grouped[column.id] ?? []);
          return (
            <div
              key={column.id}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
              className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-border"
            >
              {/* Column header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || '#6b7280' }} />
                  <span className="font-medium text-sm">{column.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {leads.length}
                  </span>
                </div>
                <button
                  onClick={() => { setCreateColumnId(column.id); setShowCreateModal(true); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => setSelectedLead(lead)}
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  />
                ))}
                {leads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Nenhum lead
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Unassigned column */}
        {grouped['unassigned']?.length > 0 && (
          <div className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-dashed border-border">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="font-medium text-sm">Sem Coluna</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {filterLeads(grouped['unassigned']).length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
              {filterLeads(grouped['unassigned']).map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => setSelectedLead(lead)}
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
      {showCreateModal && (
        <CreateLeadModal
          defaultColumnId={createColumnId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
