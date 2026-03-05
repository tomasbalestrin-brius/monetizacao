import { useState } from 'react';
import { useAuth } from '@bethel/shared-auth';
import { useSDRs, useCreateSDR, useUpdateSDR, useDeleteSDR } from '@/hooks/useSdrMetrics';
import {
  useCrmColumns,
  useCreateCrmColumn,
  useUpdateCrmColumn,
  useDeleteCrmColumn,
  useReorderCrmColumns,
} from '@/hooks/useLeads';
import { useAllFunnels, useCreateFunnel, useUpdateFunnel, useDeleteFunnel } from '@/hooks/useFunnels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  Users,
  Kanban,
  Shield,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  GripVertical,
  ArrowUp,
  ArrowDown,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── SDR Management Tab ───
function SDRsTab() {
  const { data: sdrs, isLoading } = useSDRs();
  const createSDR = useCreateSDR();
  const updateSDR = useUpdateSDR();
  const deleteSDR = useDeleteSDR();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'sdr' | 'social_selling'>('sdr');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormType('sdr');
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (editingId) {
      await updateSDR.mutateAsync({ id: editingId, name: formName.trim(), type: formType });
    } else {
      await createSDR.mutateAsync({ name: formName.trim(), type: formType });
    }
    resetForm();
  };

  const startEdit = (sdr: any) => {
    setEditingId(sdr.id);
    setFormName(sdr.name);
    setFormType(sdr.type);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSDR.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            SDRs Cadastrados ({sdrs?.length || 0})
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Novo SDR
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar SDR' : 'Novo SDR'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nome do SDR"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="social_selling">Social Selling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createSDR.isPending || updateSDR.isPending}>
                {(createSDR.isPending || updateSDR.isPending) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                <Check className="h-3 w-3 mr-1" />
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {sdrs && sdrs.length > 0 ? (
          <div className="space-y-2">
            {sdrs.map((sdr: any) => (
              <div key={sdr.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="font-bold text-emerald-600">{sdr.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium">{sdr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(sdr.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sdr.type === 'social_selling' ? 'secondary' : 'default'}>
                    {sdr.type === 'social_selling' ? 'Social Selling' : 'SDR'}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(sdr)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {deleteConfirmId === sdr.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(sdr.id)} disabled={deleteSDR.isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteConfirmId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirmId(sdr.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhum SDR cadastrado.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CRM Columns Tab ───
function CrmColumnsTab() {
  const { data: columns, isLoading } = useCrmColumns();
  const createColumn = useCreateCrmColumn();
  const updateColumn = useUpdateCrmColumn();
  const deleteColumn = useDeleteCrmColumn();
  const reorderColumns = useReorderCrmColumns();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6b7280');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormColor('#6b7280');
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (editingId) {
      await updateColumn.mutateAsync({ id: editingId, name: formName.trim(), color: formColor });
    } else {
      const nextPosition = (columns?.length || 0) + 1;
      await createColumn.mutateAsync({ name: formName.trim(), color: formColor, position: nextPosition });
    }
    resetForm();
  };

  const startEdit = (col: any) => {
    setEditingId(col.id);
    setFormName(col.name);
    setFormColor(col.color || '#6b7280');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteColumn.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!columns) return;
    const newColumns = [...columns];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newColumns.length) return;

    const temp = newColumns[index];
    newColumns[index] = newColumns[swapIndex];
    newColumns[swapIndex] = temp;

    const updates = newColumns.map((col, i) => ({ id: col.id, position: i + 1 }));
    await reorderColumns.mutateAsync(updates);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Kanban size={20} />
            Colunas do Kanban ({columns?.length || 0})
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Coluna
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar Coluna' : 'Nova Coluna'}
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Nome da coluna"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cor</label>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createColumn.isPending || updateColumn.isPending}>
                {(createColumn.isPending || updateColumn.isPending) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                <Check className="h-3 w-3 mr-1" />
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {columns && columns.length > 0 ? (
          <div className="space-y-2">
            {columns.map((col: any, index: number) => (
              <div key={col.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: col.color || '#6b7280' }}
                  />
                  <span className="font-medium">{col.name}</span>
                  <span className="text-xs text-muted-foreground">#{col.position}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0 || reorderColumns.isPending}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === columns.length - 1 || reorderColumns.isPending}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(col)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {deleteConfirmId === col.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDelete(col.id)} disabled={deleteColumn.isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteConfirmId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirmId(col.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhuma coluna configurada.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Funnels Tab ───
function FunnelsTab() {
  const { data: funnels, isLoading } = useAllFunnels();
  const createFunnel = useCreateFunnel();
  const updateFunnel = useUpdateFunnel();
  const deleteFunnel = useDeleteFunnel();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formExpert, setFormExpert] = useState('');
  const [formImportType, setFormImportType] = useState('manual');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormExpert('');
    setFormImportType('manual');
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (editingId) {
      await updateFunnel.mutateAsync({
        id: editingId,
        name: formName.trim(),
        expert_name: formExpert.trim() || undefined,
        import_type: formImportType,
      });
    } else {
      await createFunnel.mutateAsync({
        name: formName.trim(),
        expert_name: formExpert.trim() || undefined,
        import_type: formImportType,
      });
    }
    resetForm();
  };

  const startEdit = (funnel: any) => {
    setEditingId(funnel.id);
    setFormName(funnel.name);
    setFormExpert(funnel.expert_name || '');
    setFormImportType(funnel.import_type || 'manual');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFunnel.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch size={20} />
            Funis ({funnels?.length || 0})
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Funil
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar Funil' : 'Novo Funil'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Nome do funil"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Input
                placeholder="Nome do expert"
                value={formExpert}
                onChange={(e) => setFormExpert(e.target.value)}
              />
              <Select value={formImportType} onValueChange={setFormImportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="sheets">Google Sheets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createFunnel.isPending || updateFunnel.isPending}>
                {(createFunnel.isPending || updateFunnel.isPending) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                <Check className="h-3 w-3 mr-1" />
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {funnels && funnels.length > 0 ? (
          <div className="space-y-2">
            {funnels.map((funnel: any) => (
              <div key={funnel.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${funnel.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{funnel.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {funnel.expert_name && <span>Expert: {funnel.expert_name}</span>}
                      <span className="capitalize">{funnel.import_type === 'sheets' ? 'Google Sheets' : 'Manual'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={funnel.is_active ? 'default' : 'secondary'}>
                    {funnel.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(funnel)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {deleteConfirmId === funnel.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(funnel.id)} disabled={deleteFunnel.isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteConfirmId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirmId(funnel.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhum funil configurado.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Admin Panel ───
export function SDRAdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-foreground">Acesso Restrito</p>
          <p className="text-muted-foreground">Apenas administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings size={24} />
          Painel Admin SDR
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie SDRs, colunas do CRM e funis</p>
      </div>

      <Tabs defaultValue="sdrs">
        <TabsList>
          <TabsTrigger value="sdrs" className="gap-2">
            <Users size={16} />
            SDRs
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2">
            <Kanban size={16} />
            Colunas CRM
          </TabsTrigger>
          <TabsTrigger value="funnels" className="gap-2">
            <GitBranch size={16} />
            Funis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sdrs" className="mt-4">
          <SDRsTab />
        </TabsContent>

        <TabsContent value="crm" className="mt-4">
          <CrmColumnsTab />
        </TabsContent>

        <TabsContent value="funnels" className="mt-4">
          <FunnelsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
