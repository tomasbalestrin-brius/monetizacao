import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleSheetsConfig {
  id: string;
  spreadsheet_id: string;
  spreadsheet_name: string | null;
  last_sync_at: string | null;
  sync_status: string | null;
  sync_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoogleSheetsConfig() {
  return useQuery({
    queryKey: ['google-sheets-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_sheets_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GoogleSheetsConfig | null;
    },
  });
}

export function useSaveGoogleSheetsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (spreadsheetId: string) => {
      // Check if config already exists
      const { data: existing } = await supabase
        .from('google_sheets_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing config
        const { data, error } = await supabase
          .from('google_sheets_config')
          .update({ 
            spreadsheet_id: spreadsheetId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new config
        const { data, error } = await supabase
          .from('google_sheets_config')
          .insert({ spreadsheet_id: spreadsheetId })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-config'] });
      toast.success('Planilha conectada com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast.error('Erro ao conectar planilha');
    },
  });
}

export function useDisconnectGoogleSheets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('google_sheets_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-config'] });
      toast.success('Planilha desconectada');
    },
    onError: (error) => {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar planilha');
    },
  });
}

export function useSyncGoogleSheets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // TODO: Call the sync-google-sheets edge function when implemented
      const { data, error } = await supabase.functions.invoke('sync-google-sheets');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-config'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success(`Sincronização concluída! ${data?.recordsImported || 0} registros importados.`);
    },
    onError: (error: any) => {
      console.error('Error syncing:', error);
      toast.error(error?.message || 'Erro ao sincronizar dados');
    },
  });
}
