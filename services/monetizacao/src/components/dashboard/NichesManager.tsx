import React, { useState } from 'react';
import { Loader2, Plus, Trash2, Tag, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNiches, useCreateNiche, useUpdateNiche, useDeleteNiche } from '@/hooks/useNiches';

export function NichesManager() {
  const [newNiche, setNewNiche] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: niches, isLoading } = useNiches();
  const createNiche = useCreateNiche();
  const updateNiche = useUpdateNiche();
  const deleteNiche = useDeleteNiche();

  const handleCreate = async () => {
    if (!newNiche.trim()) {
      toast.error('Digite o nome do nicho');
      return;
    }
    try {
      await createNiche.mutateAsync(newNiche.trim());
      setNewNiche('');
      toast.success('Nicho criado');
    } catch {
      toast.error('Erro ao criar nicho (nome pode já existir)');
    }
  };

  const handleToggleActive = async (id: string, active: boolean | null) => {
    try {
      await updateNiche.mutateAsync({ id, active: !active });
      toast.success(active ? 'Nicho desativado' : 'Nicho ativado');
    } catch {
      toast.error('Erro ao atualizar nicho');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateNiche.mutateAsync({ id, name: editName.trim() });
      setEditingId(null);
      toast.success('Nicho atualizado');
    } catch {
      toast.error('Erro ao atualizar nicho');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNiche.mutateAsync(id);
      toast.success('Nicho removido');
    } catch {
      toast.error('Erro ao remover nicho');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = niches?.filter(n => n.active !== false).length || 0;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cadastro de Nichos</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} nichos ativos de {niches?.length || 0} total
            </p>
          </div>
        </div>

        {/* Add new niche */}
        <div className="flex gap-2 mb-6">
          <Input
            value={newNiche}
            onChange={(e) => setNewNiche(e.target.value)}
            placeholder="Nome do novo nicho..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={createNiche.isPending}>
            {createNiche.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Niches List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {niches?.map((niche) => (
            <div
              key={niche.id}
              className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                niche.active !== false ? 'bg-muted/50' : 'bg-muted/20 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Switch
                  checked={niche.active !== false}
                  onCheckedChange={() => handleToggleActive(niche.id, niche.active)}
                />
                {editingId === niche.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(niche.id)}
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleSaveEdit(niche.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className="text-sm font-medium text-foreground truncate cursor-pointer hover:underline"
                    onClick={() => { setEditingId(niche.id); setEditName(niche.name); }}
                  >
                    {niche.name}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 ml-2 shrink-0"
                onClick={() => handleDelete(niche.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
