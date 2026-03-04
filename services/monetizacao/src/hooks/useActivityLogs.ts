import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
  created_at: string;
}

export function useActivityLogs(options: {
  entityType?: string;
  action?: string;
  limit?: number;
} = {}) {
  const { entityType, action, limit = 100 } = options;

  return useQuery({
    queryKey: ['activity-logs', entityType, action, limit],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) query = query.eq('entity_type', entityType);
      if (action) query = query.eq('action', action);

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}
