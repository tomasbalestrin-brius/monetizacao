import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateLead, useCrmColumns } from '@/hooks/useLeads';
import { useFunnels } from '@/hooks/useFunnels';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  defaultColumnId?: string;
  onClose: () => void;
}

export function CreateLeadModal({ defaultColumnId, onClose }: CreateLeadModalProps) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    niche: '',
    instagram: '',
    main_pain: '',
    revenue: '',
    state: '',
    business_name: '',
    funnel_id: '',
    crm_column_id: defaultColumnId ?? '',
  });

  const createLead = useCreateLead();
  const { data: columns } = useCrmColumns();
  const { data: funnels } = useFunnels();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('Nome e obrigatorio');
      return;
    }

    createLead.mutate(
      {
        full_name: form.full_name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        niche: form.niche || undefined,
        funnel_id: form.funnel_id || undefined,
        crm_column_id: form.crm_column_id || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Lead criado com sucesso');
          onClose();
        },
        onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
      }
    );
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Novo Lead</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome *</label>
            <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Telefone</label>
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <input value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nicho</label>
              <input value={form.niche} onChange={(e) => update('niche', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Instagram</label>
              <input value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="@" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Dor Principal</label>
            <textarea value={form.main_pain} onChange={(e) => update('main_pain', e.target.value)} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Funil</label>
              <select value={form.funnel_id} onChange={(e) => update('funnel_id', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="">Selecionar...</option>
                {funnels?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Coluna CRM</label>
              <select value={form.crm_column_id} onChange={(e) => update('crm_column_id', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="">Selecionar...</option>
                {columns?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createLead.isPending}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 mt-2"
          >
            {createLead.isPending ? 'Criando...' : 'Criar Lead'}
          </button>
        </form>
      </div>
    </div>
  );
}
