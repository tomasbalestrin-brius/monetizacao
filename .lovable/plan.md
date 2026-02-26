

# Aplicar filtro de funil no Closer Detail Page

## Problema
O `selectedFunnel` é declarado como estado mas nunca utilizado na filtragem. Os dados vêm da tabela `metrics` (que não tem campo `funnel_id`), e os dados por funil estão na tabela `funnel_daily_data`.

## Solução

### 1. Buscar dados de `funnel_daily_data` quando um funil é selecionado
- Usar o hook `useCloserFunnelData(closerId, selectedFunnel, periodStart, periodEnd)` já existente em `useFunnels.ts`
- Quando `selectedFunnel` é `null` → usar `metrics` (tabela `metrics`, comportamento atual)
- Quando `selectedFunnel` tem valor → usar dados de `funnel_daily_data` filtrados por funil

### 2. Adaptar dados de `funnel_daily_data` para o formato de métricas
- Criar função de mapeamento: `funnel_daily_data` → formato compatível com `calculateAggregatedMetrics`
- Campos: `calls_done` → `calls`, `sales_count` → `sales`, `sales_value` → `revenue`, etc.

### 3. Atualizar `CloserDetailPage.tsx`
- Importar `useCloserFunnelData` 
- Adicionar query condicional baseada em `selectedFunnel`
- Criar `useMemo` que combina week filter + funnel filter
- Passar dados filtrados para cards, chart e tabela

### Arquivos alterados
- `src/components/dashboard/closer/CloserDetailPage.tsx` — lógica de filtragem e query condicional

