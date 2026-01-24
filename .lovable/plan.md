

# Plano: Descontar Cancelamentos dos Valores de Venda e Entrada

## Objetivo

Modificar o cálculo de `revenue` (Faturamento) e `entries` (Valor de Entrada) para subtrair automaticamente os respectivos valores de cancelamento, exibindo assim o **valor líquido** nas métricas do dashboard.

## Fórmula de Cálculo

```text
Faturamento Líquido = Faturamento Bruto - Valor Venda Cancelamento
Entradas Líquido    = Entradas Bruto   - Valor Entrada Cancelamento
```

**Exemplo:**
- Faturamento Bruto: R$ 100.000
- Valor Venda Cancelamento: R$ 8.000
- **Faturamento Líquido: R$ 92.000** (exibido nos cards)

## Locais de Modificação

A lógica de subtração deve ser aplicada em **todos os pontos de agregação** para garantir consistência em todo o dashboard:

| Local | Função | O que muda |
|-------|--------|------------|
| `useMetrics.ts` | `useSquadMetrics` (linha ~192) | Subtrai no cálculo por closer |
| `useMetrics.ts` | Squad totals (linha ~223) | Subtrai no total do squad |
| `useMetrics.ts` | `useTotalMetrics` (linha ~263) | Subtrai no total geral |
| `CloserDetailPage.tsx` | `calculateAggregatedMetrics` (linha ~39) | Subtrai na visão individual |

## Alterações no Código

### 1. `src/hooks/useMetrics.ts` - Cálculo por Closer

```typescript
// Linha ~192-220 - Dentro de useSquadMetrics
const closers = Array.from(closerMap.values()).map(({ closer, metrics }) => {
  const closerTotals = metrics.reduce(
    (acc, m) => ({
      calls: acc.calls + m.calls,
      sales: acc.sales + m.sales,
      revenue: acc.revenue + Number(m.revenue),
      entries: acc.entries + Number(m.entries),
      cancellations: acc.cancellations + (m.cancellations || 0),
      cancellationValue: acc.cancellationValue + Number(m.cancellation_value || 0),
      cancellationEntries: acc.cancellationEntries + Number(m.cancellation_entries || 0),
    }),
    { ... }
  );
  
  // NOVO: Aplicar desconto de cancelamentos
  const netRevenue = closerTotals.revenue - closerTotals.cancellationValue;
  const netEntries = closerTotals.entries - closerTotals.cancellationEntries;
  
  const revenueTrend = calculateTrend(netRevenue, referenceDate);
  const entriesTrend = calculateTrend(netEntries, referenceDate);
  
  return {
    closer,
    metrics: {
      ...closerTotals,
      revenue: netRevenue,       // Valor líquido
      entries: netEntries,       // Valor líquido
      revenueTrend,
      entriesTrend,
      // ... resto
    },
  };
});
```

### 2. `src/hooks/useMetrics.ts` - Total do Squad

```typescript
// Linha ~241-251 - Dentro de useSquadMetrics (squad totals)
// Os totals já serão automaticamente líquidos pois somam os closers que já têm valores líquidos

// Se necessário, também aplicar no cálculo direto:
const squadRevenueTrend = calculateTrend(totals.revenue, referenceDate);
const squadEntriesTrend = calculateTrend(totals.entries, referenceDate);
```

### 3. `src/hooks/useMetrics.ts` - Total Geral

```typescript
// Linha ~263-283 - Dentro de useTotalMetrics
// Os totals já serão líquidos pois vêm dos squads que já têm valores líquidos
```

### 4. `src/components/dashboard/closer/CloserDetailPage.tsx`

```typescript
// Função calculateAggregatedMetrics - linhas 39-82
function calculateAggregatedMetrics(metrics: CloserMetricRecord[]) {
  // ... somas existentes ...

  const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalEntries = metrics.reduce((sum, m) => sum + (m.entries || 0), 0);
  const totalCancellationValue = metrics.reduce((sum, m) => sum + (m.cancellation_value || 0), 0);
  const totalCancellationEntries = metrics.reduce((sum, m) => sum + (m.cancellation_entries || 0), 0);

  // NOVO: Calcular valores líquidos
  const netRevenue = totalRevenue - totalCancellationValue;
  const netEntries = totalEntries - totalCancellationEntries;

  // Usar valores líquidos para tendência
  const revenueTrend = metrics.reduce((sum, m) => sum + (m.revenue_trend || 0), 0);
  const entriesTrend = metrics.reduce((sum, m) => sum + (m.entries_trend || 0), 0);

  return {
    totalCalls,
    totalSales,
    totalRevenue: netRevenue,   // Valor líquido
    totalEntries: netEntries,   // Valor líquido
    revenueTrend,
    entriesTrend,
    // ... cancelamentos mantidos para exibição separada
    totalCancellations,
    totalCancellationValue,
    totalCancellationEntries,
    // ...
  };
}
```

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
│  revenue: 100000 | cancellation_value: 8000                 │
│  entries: 50000  | cancellation_entries: 3000               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HOOKS DE AGREGAÇÃO                       │
│  netRevenue = revenue - cancellation_value = 92000          │
│  netEntries = entries - cancellation_entries = 47000        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXIBIÇÃO NA UI                           │
│  ┌─────────────────┐  ┌──────────────────────┐              │
│  │ Faturamento     │  │ Valor Venda Cancel.  │              │
│  │ R$ 92.000       │  │ R$ 8.000             │              │
│  │ (valor líquido) │  │ (separado/vermelho)  │              │
│  └─────────────────┘  └──────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/hooks/useMetrics.ts` | ~192-220, ~241-251 | Aplicar subtração no cálculo de closers e squads |
| `src/components/dashboard/closer/CloserDetailPage.tsx` | ~39-82 | Aplicar subtração na função calculateAggregatedMetrics |

## Impacto Visual

Após a implementação:

1. **Cards de Faturamento** - Mostrarão valor líquido (após descontar cancelamentos)
2. **Cards de Entradas** - Mostrarão valor líquido (após descontar cancelamentos)
3. **Cards de Tendência** - Baseados nos valores líquidos
4. **Cards de Cancelamento** - Continuarão exibindo os valores de cancelamento separadamente (em vermelho)
5. **Tabela de Dados** - Mantém os valores originais por período para transparência

## Resultado Esperado

- Métricas de faturamento e entradas refletirão o **valor real** após cancelamentos
- Valores de cancelamento permanecem visíveis separadamente para análise
- Tendências calculadas sobre valores líquidos
- Consistência em todas as visualizações (Dashboard, Squad, Closer)

