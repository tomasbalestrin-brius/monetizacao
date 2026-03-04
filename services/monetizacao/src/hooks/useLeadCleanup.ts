import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CleanupLog {
  id: string;
  lead_id: string | null;
  lead_data: Record<string, unknown>;
  cleanup_reason: string;
  google_sheet_row: number | null;
  google_sheet_url: string | null;
  sheet_name: string | null;
  exported_at: string | null;
  cleaned_at: string | null;
}

export function useCleanupLogs() {
  return useQuery({
    queryKey: ['cleanup-logs'],
    queryFn: async (): Promise<CleanupLog[]> => {
      const { data, error } = await supabase
        .from('cleanup_logs')
        .select('*')
        .order('cleaned_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as CleanupLog[];
    },
  });
}

export function useArchiveLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason: 'bronze' | 'nao_fit' | 'manual' }) => {
      // Fetch lead data before archiving
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      if (fetchError) throw fetchError;

      // Create cleanup log
      const { error: logError } = await supabase
        .from('cleanup_logs')
        .insert({
          lead_id: leadId,
          lead_data: lead as unknown as Record<string, unknown>,
          cleanup_reason: reason,
          cleaned_at: new Date().toISOString(),
        });
      if (logError) throw logError;

      // Delete lead
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-logs'] });
    },
  });
}

export function useArchiveBronzeLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all bronze leads
      const { data: bronzeLeads, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('classification', 'bronze');
      if (fetchError) throw fetchError;
      if (!bronzeLeads || bronzeLeads.length === 0) return { count: 0 };

      // Create cleanup logs
      const logs = bronzeLeads.map((lead) => ({
        lead_id: lead.id,
        lead_data: lead as unknown as Record<string, unknown>,
        cleanup_reason: 'bronze',
        cleaned_at: new Date().toISOString(),
      }));
      const { error: logError } = await supabase.from('cleanup_logs').insert(logs);
      if (logError) throw logError;

      // Delete bronze leads
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('classification', 'bronze');
      if (deleteError) throw deleteError;

      return { count: bronzeLeads.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-logs'] });
    },
  });
}

export function useRestoreLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cleanupLogId: string) => {
      // Get cleanup log
      const { data: log, error: fetchError } = await supabase
        .from('cleanup_logs')
        .select('*')
        .eq('id', cleanupLogId)
        .single();
      if (fetchError) throw fetchError;

      const leadData = log.lead_data as Record<string, unknown>;
      // Remove id so a new one is generated, or keep original
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          id: leadData.id as string,
          full_name: leadData.full_name as string,
          phone: leadData.phone as string | null,
          email: leadData.email as string | null,
          revenue: leadData.revenue as number | null,
          niche: leadData.niche as string | null,
          instagram: leadData.instagram as string | null,
          main_pain: leadData.main_pain as string | null,
          classification: leadData.classification as string | null,
          qualification: leadData.qualification as string | null,
          status: 'novo' as const,
          funnel_id: leadData.funnel_id as string | null,
          crm_column_id: leadData.crm_column_id as string | null,
        });
      if (insertError) throw insertError;

      // Delete cleanup log
      await supabase.from('cleanup_logs').delete().eq('id', cleanupLogId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-logs'] });
    },
  });
}
