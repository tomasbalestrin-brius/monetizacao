

# Plano: Excluir Alcateia do Cálculo Líquido

## Objetivo

Modificar a lógica de cálculo para que a subtração de cancelamentos (vendas, faturamento e entradas) seja aplicada **EXCETO** para o módulo **Alcateia**. Para Alcateia, os valores serão exibidos como brutos (sem subtração).

## Resumo das Mudanças

| Squad | Vendas | Faturamento | Entradas | Conversão |
|-------|--------|-------------|----------|-----------|
| Eagles | Líquido (- cancelamentos) | Líquido (- valor cancel.) | Líquido (- entradas cancel.) | Baseada em vendas líquidas |
| Sharks | Líquido (- cancelamentos) | Líquido (- valor cancel.) | Líquido (- entradas cancel.) | Baseada em vendas líquidas |
| **Alcateia** | **Bruto** | **Bruto** | **Bruto** | Baseada em vendas brutas |

## Alterações no Código

### 1. `src/hooks/useMetrics.ts` - useSquadMetrics

Linha ~177-264: Adicionar verificação condicional por squad

```typescript
const squadMetrics: SquadMetrics[] = squads?.map(squad => {
  const squadCloserMetrics = metrics?.filter(m => m.closer?.squad_id === squad.id) || [];
  
  // Alcateia NÃO aplica valores líquidos - exibe bruto
  const isAlcateia = squad.slug.toLowerCase() === 'alcateia';
  
  // Group by closer
  const closerMap = new Map<string, { closer: Closer; metrics: Metric[] }>();
  // ... (código existente de agrupamento)

  const closers = Array.from(closerMap.values()).map(({ closer, metrics }) => {
    const closerTotals = metrics.reduce(/* ... */);
    
    // Aplicar desconto de cancelamentos EXCETO para Alcateia
    const netRevenue = isAlcateia 
      ? closerTotals.revenue 
      : closerTotals.revenue - closerTotals.cancellationValue;
    const netEntries = isAlcateia 
      ? closerTotals.entries 
      : closerTotals.entries - closerTotals.cancellationEntries;
    const netSales = isAlcateia 
      ? closerTotals.sales 
      : closerTotals.sales - closerTotals.cancellations;
    
    // Tendências e taxas...
    return {
      closer,
      metrics: {
        ...closerTotals,
        sales: netSales,
        revenue: netRevenue,
        entries: netEntries,
        conversion: closerTotals.calls > 0 ? (netSales / closerTotals.calls) * 100 : 0,
        // ...
      },
    };
  });

  // Ajuste da taxa de cancelamento no total do squad
  // Para squads com valores líquidos, precisa recalcular grossSales
  const grossSales = isAlcateia 
    ? totals.sales  // Já é bruto
    : totals.sales + totals.cancellations;  // Líquido + cancelamentos = bruto
  const squadCancellationRate = grossSales > 0 ? (totals.cancellations / grossSales) * 100 : 0;

  return { squad, closers, totals: { ... } };
});
```

### 2. `src/components/dashboard/closer/CloserDetailPage.tsx`

Linha ~39-91: Receber `squadSlug` como parâmetro na função e aplicar lógica condicional

```typescript
function calculateAggregatedMetrics(metrics: CloserMetricRecord[], squadSlug: string) {
  // ...
  
  // Alcateia NÃO aplica valores líquidos
  const isAlcateia = squadSlug.toLowerCase() === 'alcateia';

  const totalCalls = metrics.reduce((sum, m) => sum + (m.calls || 0), 0);
  const grossSales = metrics.reduce((sum, m) => sum + (m.sales || 0), 0);
  const grossRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const grossEntries = metrics.reduce((sum, m) => sum + (m.entries || 0), 0);
  const totalCancellations = metrics.reduce((sum, m) => sum + (m.cancellations || 0), 0);
  const totalCancellationValue = metrics.reduce((sum, m) => sum + (m.cancellation_value || 0), 0);
  const totalCancellationEntries = metrics.reduce((sum, m) => sum + (m.cancellation_entries || 0), 0);

  // Valores líquidos EXCETO para Alcateia
  const totalSales = isAlcateia ? grossSales : grossSales - totalCancellations;
  const totalRevenue = isAlcateia ? grossRevenue : grossRevenue - totalCancellationValue;
  const totalEntries = isAlcateia ? grossEntries : grossEntries - totalCancellationEntries;

  // Conversão baseada nos valores calculados
  const conversionRate = totalCalls > 0 ? (totalSales / totalCalls) * 100 : 0;
  // Taxa de cancelamento sempre baseada em vendas brutas
  const cancellationRate = grossSales > 0 ? (totalCancellations / grossSales) * 100 : 0;

  return { /* ... */ };
}
```

Linha ~127: Atualizar chamada da função passando squadSlug

```typescript
const aggregatedMetrics = metrics && metrics.length > 0 
  ? calculateAggregatedMetrics(metrics, squadSlug) 
  : null;
```

## Arquivos a Modificar

| Arquivo | Linhas Aproximadas | Descrição |
|---------|-------------------|-----------|
| `src/hooks/useMetrics.ts` | ~177-264 | Adicionar verificação `isAlcateia` e inverter lógica condicional |
| `src/components/dashboard/closer/CloserDetailPage.tsx` | ~39-127 | Adicionar parâmetro `squadSlug` e aplicar lógica inversa |

## Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
│  revenue: 100000 | cancellations: 2 | sales: 10             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 HOOKS DE AGREGAÇÃO                          │
│                                                             │
│  if (squad.slug === 'alcateia') {                          │
│    // Mantém bruto - sem subtrações                        │
│    netSales = sales;                                        │
│    netRevenue = revenue;                                    │
│  } else {                                                   │
│    // Aplica valores líquidos                              │
│    netSales = sales - cancellations;                       │
│    netRevenue = revenue - cancellationValue;               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXIBIÇÃO NA UI                           │
│                                                             │
│  Eagles/Sharks:               Alcateia:                     │
│  ┌─────────────┐              ┌─────────────┐               │
│  │ Vendas: 8   │              │ Vendas: 10  │               │
│  │ (líquido)   │              │ (bruto)     │               │
│  └─────────────┘              └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

Após a implementação:

1. **Eagles** - Exibe vendas, faturamento e entradas LÍQUIDOS (descontando cancelamentos)
2. **Sharks** - Exibe vendas, faturamento e entradas LÍQUIDOS (descontando cancelamentos)
3. **Alcateia** - Exibe vendas, faturamento e entradas BRUTOS (sem descontar cancelamentos)
4. **Taxa de Cancelamento** - Continua calculada sobre vendas brutas em todos os squads
5. **Cards de Cancelamento** - Continuam visíveis em todos os squads com os valores separados

