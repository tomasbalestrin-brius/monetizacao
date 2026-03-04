import { useState } from 'react';
import { useLeads, useCreateLead } from '@/hooks/useLeads';
import { useFunnels } from '@/hooks/useFunnels';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  Plus,
  Search,
  Loader2,
  X,
  Check,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  agendado: 'Agendado',
  concluido: 'Concluído',
};

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
  em_atendimento: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
  agendado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
  concluido: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30',
};

interface NewLeadForm {
  full_name: string;
  phone: string;
  email: string;
  niche: string;
  funnel_id: string;
  revenue: string;
  state: string;
  instagram: string;
}

const emptyForm: NewLeadForm = {
  full_name: '',
  phone: '',
  email: '',
  niche: '',
  funnel_id: '',
  revenue: '',
  state: '',
  instagram: '',
};

export function LeadsImportPage() {
  const [search, setSearch] = useState('');
  const [filterFunnel, setFilterFunnel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(emptyForm);

  const { data: leads, isLoading } = useLeads({
    search: search || undefined,
    funnelId: filterFunnel !== 'all' ? filterFunnel : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });
  const { data: funnels } = useFunnels();
  const createLead = useCreateLead();

  const handleCreateLead = async () => {
    if (!form.full_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    try {
      await createLead.mutateAsync({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        niche: form.niche.trim() || undefined,
        funnel_id: form.funnel_id || undefined,
      });
      toast.success('Lead importado com sucesso!');
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      toast.error('Erro ao importar lead');
    }
  };

  const getFunnelName = (funnelId: string | null) => {
    if (!funnelId || !funnels) return '-';
    return funnels.find((f) => f.id === funnelId)?.name || '-';
  };

  // Stats
  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter((l) => l.status === 'novo').length || 0;
  const inProgress = leads?.filter((l) => l.status === 'em_atendimento').length || 0;
  const scheduled = leads?.filter((l) => l.status === 'agendado').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Upload size={24} />
            Base de Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe e gerencie a base de leads do sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Importar Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-foreground">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{newLeads}</p>
            <p className="text-xs text-muted-foreground">Novos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-amber-600">{inProgress}</p>
            <p className="text-xs text-muted-foreground">Em Atendimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{scheduled}</p>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </CardContent>
        </Card>
      </div>

      {/* Import form */}
      {showForm && (
        <Card className="border-emerald-500/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Novo Lead</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
                <Input
                  placeholder="Nome completo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <Input
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Funil de Origem</label>
                <Select value={form.funnel_id} onValueChange={(v) => setForm({ ...form, funnel_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nicho</label>
                <Input
                  placeholder="Ex: Saúde, Marketing..."
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Instagram</label>
                <Input
                  placeholder="@usuario"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Faturamento</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.revenue}
                  onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
                <Input
                  placeholder="Ex: SP, RJ..."
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreateLead} disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Importar Lead
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterFunnel} onValueChange={setFilterFunnel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Funil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os funis</SelectItem>
            {funnels?.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : leads && leads.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Funil</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nicho</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
                            {lead.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium truncate max-w-[150px]">{lead.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.phone || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[180px]">{lead.email || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {getFunnelName(lead.funnel_id)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.niche || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={statusColors[lead.status] || ''}>
                          {statusLabels[lead.status] || lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum lead encontrado</p>
            <p className="text-sm mt-1">Importe leads usando o botão acima</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
