
# Filtro por Semana nos Closers

## Objetivo

Replicar o filtro por semana e destaque visual no grafico que ja foi implementado no modulo SDR para os modulos de Closers (CloserDetailPage e CloserWeeklyComparisonChart).

## O que muda

### 1. CloserDetailPage

- Adicionar estado `selectedWeek` (string | null)
- Importar `WeekSelector` e `getWeeksOfMonth`
- Calcular `weekFilter` a partir da semana selecionada
- Filtrar metricas por semana para metric cards e tabela (o grafico continua recebendo dados do mes completo)
- Resetar semana ao trocar de mes ou navegar entre closers
- Adicionar o componente `WeekSelector` ao lado do `MonthSelector` no header

### 2. CloserWeeklyComparisonChart

- Adicionar prop `activeWeekKey` (string | null)
- Importar `Cell` do Recharts
- Quando uma semana esta selecionada:
  - Barras da semana ativa com opacidade 1.0
  - Barras das demais semanas com opacidade 0.35
- Indicadores de variacao comparam a semana ativa com a anterior (em vez de sempre usar as duas ultimas semanas)

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/closer/CloserDetailPage.tsx` | Adicionar estado de semana, filtro, WeekSelector no header |
| `src/components/dashboard/closer/CloserWeeklyComparisonChart.tsx` | Adicionar prop activeWeekKey, Cell para opacidade, logica de comparacao ativa |

## Detalhes Tecnicos

### CloserDetailPage - Mudancas

1. Importar `WeekSelector`, `getWeeksOfMonth` e `parseDateString`
2. Novo estado: `const [selectedWeek, setSelectedWeek] = useState<string | null>(null)`
3. Calcular filtro de semana via `useMemo` usando `getWeeksOfMonth(selectedMonth)`
4. Filtrar metricas: `weekFilteredMetrics` para cards e tabela, `metrics` completo para o grafico
5. Usar `weekFilteredMetrics` no calculo de `aggregatedMetrics` (em vez de `metrics`)
6. Resetar `selectedWeek` em `handleNavigateToCloser` e ao trocar mes
7. Passar `activeWeekKey={selectedWeek}` para `CloserWeeklyComparisonChart`
8. Passar `weekFilteredMetrics` para `CloserDataTable`

### CloserWeeklyComparisonChart - Mudancas

1. Adicionar `activeWeekKey?: string | null` na interface de props
2. Importar `Cell` do Recharts
3. Criar `chartData` com campo `opacity` baseado na semana ativa
4. Atualizar logica de `comparison` para usar semana ativa como referencia
5. Adicionar `Cell` nos componentes `Bar` (calls e sales) para aplicar opacidade individual

### Layout dos filtros no header do Closer

```text
[← Voltar] [Closer Name]     [Adicionar] [◀ Fevereiro 2026 ▶] [Semana ▼]
```
