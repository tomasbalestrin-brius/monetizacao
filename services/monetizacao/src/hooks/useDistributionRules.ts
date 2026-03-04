import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface DistributionRule {
  id: string;
  name: string;
  funnel_id: string | null;
  classifications: string[];
  sdr_ids: string[];
  max_leads_per_sdr: number | null;
  active: boolean | null;
  schedule_enabled: boolean | null;
  schedule_days: number[];
  schedule_time: string | null;
  distribution_mode: string | null;
  sdr_percentages: Json;
  sdr_funnel_limits: Json;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DistributionLog {
  id: string;
  distributed_by: string | null;
  funnel_id: string | null;
  rule_id: string | null;
  leads_count: number;
  sdr_ids: string[];
  distribution_mode: string;
  classifications: string[] | null;
  lead_ids: string[] | null;
  workload_snapshot: Json | null;
  created_at: string;
}

export interface SdrCapacity {
  id: string;
  sdr_id: string;
  funnel_id: string | null;
  max_leads: number | null;
  percentage: number | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// --- Distribution Rules ---

export function useDistributionRules() {
  return useQuery({
    queryKey: ['distribution-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DistributionRule[];
    },
  });
}

export function useCreateDistributionRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rule: {
      name: string;
      funnel_id?: string | null;
      classifications?: string[];
      sdr_ids: string[];
      max_leads_per_sdr?: number;
      distribution_mode?: string;
      sdr_percentages?: Json;
      sdr_funnel_limits?: Json;
      schedule_enabled?: boolean;
      schedule_days?: number[];
      schedule_time?: string;
    }) => {
      const { data, error } = await supabase
        .from('distribution_rules')
        .insert({ ...rule, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as DistributionRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] });
    },
  });
}

export function useUpdateDistributionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DistributionRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('distribution_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DistributionRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] });
    },
  });
}

export function useDeleteDistributionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('distribution_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] });
    },
  });
}

// --- Distribution Logs ---

export function useDistributionLogs(limit = 50) {
  return useQuery({
    queryKey: ['distribution-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_distribution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DistributionLog[];
    },
  });
}

// --- SDR Capacities ---

export function useSdrCapacities() {
  return useQuery({
    queryKey: ['sdr-capacities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_capacities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SdrCapacity[];
    },
  });
}

export function useUpsertSdrCapacity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (capacity: {
      sdr_id: string;
      funnel_id?: string | null;
      max_leads?: number;
      percentage?: number;
      active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('sdr_capacities')
        .upsert(
          { ...capacity, updated_at: new Date().toISOString() },
          { onConflict: 'sdr_id,funnel_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as SdrCapacity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-capacities'] });
    },
  });
}

export function useDeleteSdrCapacity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sdr_capacities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-capacities'] });
    },
  });
}
