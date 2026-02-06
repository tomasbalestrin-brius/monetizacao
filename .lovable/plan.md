

# Remover Sincronização com Google Sheets

Como os dados de fevereiro em diante serão inseridos manualmente, toda a infraestrutura de sincronização automática será removida.

## O que será removido

### 1. Cron Jobs (banco de dados)
- `sync-google-sheets-cron` (job 1) - roda a cada 1 minuto
- `sync-sdr-sheets-cron` (job 2) - roda a cada 1 minuto

Isso vai liberar os ~54 MB ocupados pelo pg_net ao longo do tempo.

### 2. Edge Functions (3 funções)
- `supabase/functions/sync-google-sheets/` - sync de closers
- `supabase/functions/sync-sdr-sheets/` - sync de SDRs
- `supabase/functions/sync-squad-sheets/` - sync por squad

### 3. Componentes de UI de configuração de planilhas
- `src/components/dashboard/GoogleSheetsConfig.tsx` - config global
- `src/components/dashboard/WeekBlockConfig.tsx` - config de blocos semanais
- `src/components/dashboard/SquadSheetsConfig.tsx` - config por squad
- `src/components/dashboard/SquadSyncButton.tsx` - botão sync squad
- `src/components/dashboard/sdr/SDRSheetsConfig.tsx` - config SDR

### 4. Hooks de sincronização
- `src/hooks/useGoogleSheetsConfig.ts`
- `src/hooks/useSDRSheetsConfig.ts`
- `src/hooks/useSquadSheetsConfig.ts`

### 5. Referências nos componentes existentes
- `AdminPanel.tsx` - remover aba/seção de integrações com GoogleSheetsConfig
- `SDRDashboard.tsx` - remover SDRSheetsConfig e lógica de conexão
- `SquadPage.tsx` - remover SquadSheetsConfig e SquadSyncButton

### 6. Configuração
- `supabase/config.toml` - remover entradas das 3 funções de sync

## O que NÃO será removido
- Dados históricos já sincronizados (tabelas `metrics`, `sdr_metrics`)
- Tabelas de configuração (`google_sheets_config`, `sdr_sheets_config`, `squad_sheets_config`) - ficam no banco sem impacto
- Edge function `admin-create-user` - continua funcionando normalmente
- Todo o fluxo de entrada manual de dados

## Detalhes Técnicos

### SQL para remover cron jobs
```sql
SELECT cron.unschedule('sync-google-sheets-cron');
SELECT cron.unschedule('sync-sdr-sheets-cron');
```

### Limpeza dos logs do pg_net (libera ~54 MB)
```sql
DELETE FROM net._http_response;
DELETE FROM net.http_request_queue;
```

