import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface QualificationRule {
  id: string;
  funnel_id: string | null;
  rule_name: string;
  conditions: Json;
  qualification_label: string;
  classification: 'diamante' | 'ouro' | 'prata' | 'bronze' | null;
  priority: number;
  active: boolean;
  created_at: string;
}

export function useQualificationRules(funnelId?: string) {
  return useQuery({
    queryKey: ['qualification-rules', funnelId],
    queryFn: async () => {
      let query = supabase
        .from('qualification_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (funnelId) {
        query = query.eq('funnel_id', funnelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QualificationRule[];
    },
  });
}

export function useCreateQualificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      rule_name: string;
      qualification_label: string;
      funnel_id?: string | null;
      conditions?: Json;
      classification?: 'diamante' | 'ouro' | 'prata' | 'bronze' | null;
      priority?: number;
      active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('qualification_rules')
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data as QualificationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-rules'] });
    },
  });
}

export function useUpdateQualificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QualificationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('qualification_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as QualificationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-rules'] });
    },
  });
}

export function useDeleteQualificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('qualification_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-rules'] });
    },
  });
}

export function useApplyQualificationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.rpc('apply_qualification_rules', {
        p_lead_id: leadId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
