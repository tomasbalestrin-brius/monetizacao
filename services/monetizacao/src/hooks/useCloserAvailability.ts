import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@bethel/shared-auth';

export interface CloserAvailability {
  id: string;
  closer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  active: boolean;
  created_at: string;
}

export interface DefaultAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCloserAvailability(closerId?: string) {
  const { user, isCloser } = useAuth();
  const effectiveCloserId = closerId ?? (isCloser ? user?.id : undefined);

  return useQuery({
    queryKey: ['closer-availability', effectiveCloserId],
    queryFn: async (): Promise<CloserAvailability[]> => {
      const { data, error } = await supabase
        .from('closer_availability')
        .select('*')
        .eq('closer_id', effectiveCloserId!)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CloserAvailability[];
    },
    enabled: !!effectiveCloserId,
  });
}

export function useDefaultAvailability() {
  return useQuery({
    queryKey: ['default-availability'],
    queryFn: async (): Promise<DefaultAvailability[]> => {
      const { data, error } = await supabase
        .from('default_availability')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DefaultAvailability[];
    },
  });
}

export function useSaveCloserAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ closerId, slots }: { closerId: string; slots: Omit<CloserAvailability, 'id' | 'created_at'>[] }) => {
      // Delete existing slots
      const { error: deleteError } = await supabase
        .from('closer_availability')
        .delete()
        .eq('closer_id', closerId);
      if (deleteError) throw deleteError;

      // Insert new slots
      if (slots.length > 0) {
        const { error: insertError } = await supabase
          .from('closer_availability')
          .insert(slots.map((s) => ({ ...s, closer_id: closerId })));
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { closerId }) => {
      queryClient.invalidateQueries({ queryKey: ['closer-availability', closerId] });
    },
  });
}

export function useSaveDefaultAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: Omit<DefaultAvailability, 'id' | 'created_at' | 'updated_at'>[]) => {
      // Delete existing
      const { error: deleteError } = await supabase
        .from('default_availability')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      if (deleteError) throw deleteError;

      if (slots.length > 0) {
        const { error: insertError } = await supabase
          .from('default_availability')
          .insert(slots);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-availability'] });
    },
  });
}
