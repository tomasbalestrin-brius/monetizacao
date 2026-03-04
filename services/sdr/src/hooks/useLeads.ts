import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  revenue: number | null;
  niche: string | null;
  instagram: string | null;
  main_pain: string | null;
  difficulty: string | null;
  state: string | null;
  business_name: string | null;
  business_position: string | null;
  has_partner: boolean | null;
  knows_specialist_since: string | null;
  funnel_id: string | null;
  classification: 'diamante' | 'ouro' | 'prata' | 'bronze' | null;
  qualification: string | null;
  assigned_sdr_id: string | null;
  status: 'novo' | 'em_atendimento' | 'agendado' | 'concluido';
  crm_column_id: string | null;
  custom_fields: Record<string, unknown>;
  distributed_at: string | null;
  distribution_origin: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmColumn {
  id: string;
  name: string;
  position: number;
  color: string;
  editable: boolean;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  column_id: string | null;
  user_id: string | null;
  action_type: string;
  notes: string | null;
  tags: string[];
  details: Record<string, unknown>;
  created_at: string;
}

interface UseLeadsOptions {
  columnId?: string;
  status?: string;
  classification?: string;
  funnelId?: string;
  sdrId?: string;
  search?: string;
}

export function useCrmColumns() {
  return useQuery({
    queryKey: ['crm-columns'],
    queryFn: async (): Promise<CrmColumn[]> => {
      const { data, error } = await supabase
        .from('crm_columns')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CrmColumn[];
    },
  });
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', options],
    queryFn: async (): Promise<Lead[]> => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.columnId) {
        query = query.eq('crm_column_id', options.columnId);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.classification) {
        query = query.eq('classification', options.classification);
      }
      if (options.funnelId) {
        query = query.eq('funnel_id', options.funnelId);
      }
      if (options.sdrId) {
        query = query.eq('assigned_sdr_id', options.sdrId);
      }
      if (options.search) {
        query = query.or(`full_name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
    enabled: !!user,
  });
}

export function useLeadsByColumn() {
  const { data: columns } = useCrmColumns();
  const { data: leads, isLoading, error } = useLeads();

  const grouped: Record<string, Lead[]> = {};
  if (columns && leads) {
    for (const col of columns) {
      grouped[col.id] = leads.filter((l) => l.crm_column_id === col.id);
    }
    // Unassigned leads
    grouped['unassigned'] = leads.filter((l) => !l.crm_column_id);
  }

  return { columns: columns ?? [], grouped, isLoading, error };
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async (): Promise<LeadActivity[]> => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadActivity[];
    },
    enabled: !!leadId,
  });
}

export function useMoveLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, columnId }: { leadId: string; columnId: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ crm_column_id: columnId })
        .eq('id', leadId);
      if (error) throw error;

      // Log activity
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        column_id: columnId,
        user_id: user?.id ?? null,
        action_type: 'column_change',
        details: { new_column_id: columnId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('leads')
        .update(data as never)
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { full_name: string; phone?: string; email?: string; niche?: string; funnel_id?: string; crm_column_id?: string }) => {
      const { data: result, error } = await supabase
        .from('leads')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// CRM Column CRUD
export function useCreateCrmColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: { name: string; color: string; position: number }) => {
      const { data, error } = await supabase
        .from('crm_columns')
        .insert(column)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-columns'] });
    },
  });
}

export function useUpdateCrmColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; position?: number }) => {
      const { data, error } = await supabase
        .from('crm_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-columns'] });
    },
  });
}

export function useDeleteCrmColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_columns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-columns'] });
    },
  });
}

export function useReorderCrmColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columns: { id: string; position: number }[]) => {
      for (const col of columns) {
        const { error } = await supabase
          .from('crm_columns')
          .update({ position: col.position })
          .eq('id', col.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-columns'] });
    },
  });
}

export function useAddLeadActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, actionType, notes }: { leadId: string; actionType: string; notes?: string }) => {
      const { error } = await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user?.id ?? null,
        action_type: actionType,
        notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
    },
  });
}
