

# Plano: Subtrair Cancelamentos do Número de Vendas

## Objetivo

Aplicar a mesma lógica de cálculo líquido ao número de vendas:

```text
Vendas Líquidas = Vendas Brutas - Número de Cancelamentos
```

**Exemplo:**
- Vendas Brutas: 10
- Cancelamentos: 2
- **Vendas Líquidas: 8** (exibido nos cards)

## Locais de Modificação

| Local | Função | O que muda |
|-------|--------|------------|
| `useMetrics.ts` | `useSquadMetrics` (linha ~192-227) | Subtrair cancelamentos das vendas por closer |
| `useMetrics.ts` | Squad totals (linha ~229-257) | Já será líquido pois soma os closers |
| `useMetrics.ts` | `useTotalMetrics` (linha ~269-277) | Já será líquido pois soma os squads |
| `CloserDetailPage.tsx` | `calculateAggregatedMetrics` (linha ~56-87) | Subtrair cancelamentos das vendas |

## Alterações no Código

### 1. `src/hooks/useMetrics.ts` - Cálculo por Closer

Linha ~206-227: Adicionar cálculo de vendas líquidas

```typescript
// Aplicar desconto de cancelamentos - valores líquidos
const netRevenue = closerTotals.revenue - closerTotals.cancellationValue;
const netEntries = closerTotals.entries - closerTotals.cancellationEntries;
const netSales = closerTotals.sales - closerTotals.cancellations; // NOVO

// Calcula tendência dinamicamente para cada closer
const revenueTrend = calculateTrend(netRevenue, referenceDate);
const entriesTrend = calculateTrend(netEntries, referenceDate);

// Taxa de cancelamento baseada nas vendas BRUTAS (para não distorcer)
const cancellationRate = closerTotals.sales > 0 
  ? (closerTotals.cancellations / closerTotals.sales) * 100 
  : 0;

return {
  closer,
  metrics: {
    ...closerTotals,
    sales: netSales,             // NOVO: Vendas líquidas
    revenue: netRevenue,
    entries: netEntries,
    revenueTrend,
    entriesTrend,
    conversion: closerTotals.calls > 0 
      ? (netSales / closerTotals.calls) * 100  // NOVO: Usar vendas líquidas
      : 0,
    cancellationRate,
  },
};
```

### 2. `src/components/dashboard/closer/CloserDetailPage.tsx`

Linha ~56-87: Adicionar cálculo de vendas líquidas

```typescript
const totalCalls = metrics.reduce((sum, m) => sum + (m.calls || 0), 0);
const grossSales = metrics.reduce((sum, m) => sum + (m.sales || 0), 0);  // Renomear
const grossRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
const grossEntries = metrics.reduce((sum, m) => sum + (m.entries || 0), 0);
const totalCancellations = metrics.reduce((sum, m) => sum + (m.cancellations || 0), 0);
const totalCancellationValue = metrics.reduce((sum, m) => sum + (m.cancellation_value || 0), 0);
const totalCancellationEntries = metrics.reduce((sum, m) => sum + (m.cancellation_entries || 0), 0);

// Valores líquidos (descontando cancelamentos)
const totalSales = grossSales - totalCancellations;    // NOVO
const totalRevenue = grossRevenue - totalCancellationValue;
const totalEntries = grossEntries - totalCancellationEntries;

// Conversão baseada em vendas líquidas
const conversionRate = totalCalls > 0 ? (totalSales / totalCalls) * 100 : 0;

// Taxa de cancelamento baseada em vendas brutas
const cancellationRate = grossSales > 0 ? (totalCancellations / grossSales) * 100 : 0;
```

## Impacto na Taxa de Conversão

Com vendas líquidas, a taxa de conversão também será ajustada:

- **Antes**: Conversão = Vendas Brutas / Ligações
- **Depois**: Conversão = Vendas Líquidas / Ligações

Isso reflete melhor a conversão efetiva (vendas que permaneceram).

## Taxa de Cancelamento

A taxa de cancelamento continuará sendo calculada sobre as vendas **brutas** para não distorcer a métrica:

```text
% Cancelamento = Cancelamentos / Vendas Brutas × 100
```

## Arquivos a Modificar

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/hooks/useMetrics.ts` | ~206-227 | Aplicar netSales no cálculo por closer |
| `src/components/dashboard/closer/CloserDetailPage.tsx` | ~56-73 | Aplicar netSales na função calculateAggregatedMetrics |

## Resultado Esperado

Após a implementação:

1. **Cards de Vendas** - Mostrarão vendas líquidas (após descontar cancelamentos)
2. **Taxa de Conversão** - Baseada em vendas líquidas
3. **Taxa de Cancelamento** - Continua baseada em vendas brutas (para não distorcer)
4. **Cards de Cancelamento** - Continuarão exibindo os valores separadamente (em vermelho)

