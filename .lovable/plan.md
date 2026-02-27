

# Adicionar campos de Funil, Leads, Qualificados e SDR ao formulário do Squad

## Situação atual
O `SquadMetricsForm` salva apenas na tabela `metrics` (calls, sales, revenue, entries, cancelamentos). Não possui campos para Funil, Leads, Qualificados ou SDR de Origem. Esses campos existem apenas no `CloserFunnelForm`, que salva na tabela `funnel_daily_data`.

## Mudança proposta

Adicionar uma seção opcional "Dados por Funil" ao `SquadMetricsForm` com os campos: **Seletor de Funil** (funis atribuídos ao closer selecionado via `useUserFunnels`), **Leads**, **Qualificados** e **SDR de Origem** (visível condicionalmente quando há vendas > 0). Quando o funil é selecionado e preenchido, o formulário salva **também** na tabela `funnel_daily_data` além da tabela `metrics`.

### Alterações em `SquadMetricsForm.tsx`
1. Adicionar ao schema zod os campos opcionais: `funnel_id`, `leads_count`, `qualified_count`, `sdr_id`
2. Importar `useUserFunnels` de `@/hooks/useFunnels` e `useSDRs` de `@/hooks/useSdrMetrics` (para o dropdown de SDR)
3. Adicionar seção "Dados do Funil" entre a seção de Performance e Faturamento:
   - Select de Funil (funis do closer selecionado, dinâmico via `useUserFunnels(selectedCloserId)`)
   - Grid 2 colunas: Leads e Qualificados (inputs numéricos)
   - Select de SDR de Origem (condicional: só aparece quando `sales > 0`)
4. Watch `sales` para controlar visibilidade do SDR

### Alterações em `SquadMetricsDialog.tsx`
1. Importar `useCreateFunnelDailyData` de `@/hooks/useFunnels`
2. No `handleSubmit`, após salvar na tabela `metrics`, verificar se `funnel_id` foi preenchido
3. Se sim, criar registro em `funnel_daily_data` com: `user_id` (closer_id), `funnel_id`, `date` (period_start), `calls_scheduled` (calls), `calls_done` (calls), `sales_count` (sales), `sales_value` (revenue), `leads_count`, `qualified_count`, `sdr_id`

### Arquivos alterados
- `src/components/dashboard/SquadMetricsForm.tsx` — novos campos e schema
- `src/components/dashboard/SquadMetricsDialog.tsx` — lógica de duplo save (metrics + funnel_daily_data)

