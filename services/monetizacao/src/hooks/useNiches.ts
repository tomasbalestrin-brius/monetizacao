import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Niche {
  id: string;
  name: string;
  active: boolean | null;
  created_at: string | null;
}

export function useNiches(onlyActive = false) {
  return useQuery({
    queryKey: ['niches', onlyActive],
    queryFn: async () => {
      let query = supabase
        .from('niches')
        .select('*')
        .order('name', { ascending: true });

      if (onlyActive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Niche[];
    },
  });
}

export function useCreateNiche() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('niches')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data as Niche;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niches'] });
    },
  });
}

export function useUpdateNiche() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('niches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Niche;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niches'] });
    },
  });
}

export function useDeleteNiche() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('niches')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niches'] });
    },
  });
}
