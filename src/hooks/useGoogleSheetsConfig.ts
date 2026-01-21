import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configuration for weekly block structure
export interface MetricOffsets {
  calls: number;
  sales: number;
  revenue: number;
  entries: number;
  revenueTrend: number;
  entriesTrend: number;
  cancellations: number;
  cancellationValue: number;
  cancellationEntries: number;
}

export interface WeekBlockConfig {
  // Block structure configuration
  firstBlockStartRow: number;    // Row where first week block starts
  blockOffset: number;           // Number of rows between blocks
  numberOfBlocks: number;        // How many weeks per tab
  dateRow: number;               // Relative row for date extraction within block
  
  // Column to read from
  column: string;
  
  // Relative metric positions within each block
  metrics: MetricOffsets;
}

export const DEFAULT_WEEK_BLOCK_CONFIG: WeekBlockConfig = {
  firstBlockStartRow: 3,
  blockOffset: 16,
  numberOfBlocks: 4,
  dateRow: 1,
  column: 'G',
  metrics: {
    calls: 2,
    sales: 3,
    revenue: 5,
    entries: 6,
    revenueTrend: 7,
    entriesTrend: 8,
    cancellations: 9,
    cancellationValue: 11,
    cancellationEntries: 12,
  }
};

// Legacy support - map old format to new format
function normalizeConfig(rawConfig: unknown): WeekBlockConfig {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return { ...DEFAULT_WEEK_BLOCK_CONFIG };
  }
  
  const config = rawConfig as Record<string, unknown>;
  
  // Check if it's already the new format
  if ('metrics' in config && typeof config.metrics === 'object') {
    return {
      ...DEFAULT_WEEK_BLOCK_CONFIG,
      firstBlockStartRow: (config.firstBlockStartRow as number) || DEFAULT_WEEK_BLOCK_CONFIG.firstBlockStartRow,
      blockOffset: (config.blockOffset as number) || DEFAULT_WEEK_BLOCK_CONFIG.blockOffset,
      numberOfBlocks: (config.numberOfBlocks as number) || DEFAULT_WEEK_BLOCK_CONFIG.numberOfBlocks,
      dateRow: (config.dateRow as number) ?? DEFAULT_WEEK_BLOCK_CONFIG.dateRow,
      column: (config.column as string) || DEFAULT_WEEK_BLOCK_CONFIG.column,
      metrics: {
        ...DEFAULT_WEEK_BLOCK_CONFIG.metrics,
        ...(config.metrics as Record<string, number>),
      }
    };
  }
  
  // Legacy format - convert to new format
  return {
    ...DEFAULT_WEEK_BLOCK_CONFIG,
    column: (config.column as string) || DEFAULT_WEEK_BLOCK_CONFIG.column,
  };
}

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
  week_block_config: WeekBlockConfig;
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
      if (!data) return null;
      
      return {
        ...data,
        week_block_config: normalizeConfig(data.row_mapping),
      } as GoogleSheetsConfig;
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

      const configJson = JSON.parse(JSON.stringify(DEFAULT_WEEK_BLOCK_CONFIG));
      
      if (existing) {
        // Update existing config
        const { data, error } = await supabase
          .from('google_sheets_config')
          .update({ 
            spreadsheet_id: spreadsheetId,
            row_mapping: configJson,
            sync_status: 'pending',
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
          .insert({ 
            spreadsheet_id: spreadsheetId,
            row_mapping: configJson,
          })
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

export function useSaveWeekBlockConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configId, config }: { configId: string; config: WeekBlockConfig }) => {
      const configJson = JSON.parse(JSON.stringify(config));
      const { data, error } = await supabase
        .from('google_sheets_config')
        .update({ 
          row_mapping: configJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-config'] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
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
      const { data, error } = await supabase.functions.invoke('sync-google-sheets');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-config'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success(data?.message || 'Sincronização concluída!');
    },
    onError: (error: Error) => {
      console.error('Error syncing:', error);
      toast.error('Erro na sincronização: ' + (error.message || 'Erro desconhecido'));
    },
  });
}
