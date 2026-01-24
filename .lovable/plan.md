

# Plano: Adicionar Inserção Manual de Dados

## Objetivo

Implementar funcionalidade de adição manual de dados para métricas de closers, com opção de selecionar o tipo de período: **Dia**, **Semana** ou **Mês**.

## Localização da Funcionalidade

A opção de inserção manual estará disponível em:
1. **Página do Squad** - Botão "Adicionar Métrica" ao lado do botão "Sincronizar"
2. **Página de Detalhes do Closer** - Botão para adicionar dados diretamente para aquele closer

## Interface do Usuário

### Dialog de Inserção Manual (SquadMetricsDialog)

```text
┌─────────────────────────────────────────────────┐
│  Adicionar Métrica Manual                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tipo de Período:                               │
│  ┌──────┐ ┌─────────┐ ┌───────┐                │
│  │ Dia  │ │ Semana  │ │  Mês  │                │
│  └──────┘ └─────────┘ └───────┘                │
│                                                 │
│  Closer:         [▼ Selecione um closer ]       │
│                                                 │
│  Data/Período:   [📅 Selecione a data   ]       │
│                  (exibe intervalo automático)   │
│                                                 │
│  ───────────────────────────────────────────    │
│  Calls:          [ 0 ]    Vendas:    [ 0 ]      │
│  Faturamento:    [ 0,00 ] Entradas:  [ 0,00 ]   │
│  ───────────────────────────────────────────    │
│  Tend. Fat.:     [ 0,00 ] Tend. Ent: [ 0,00 ]   │
│  Cancelamentos:  [ 0 ]    Vlr Cancel:[ 0,00 ]   │
│  Ent. Cancel.:   [ 0,00 ]                       │
│                                                 │
│             [ Cancelar ]  [ Adicionar ]         │
└─────────────────────────────────────────────────┘
```

### Comportamento por Tipo de Período

| Período | Comportamento |
|---------|--------------|
| **Dia** | Seleciona uma data única. `period_start` = `period_end` = data selecionada |
| **Semana** | Seleciona uma semana (segunda a domingo). Calendário mostra seleção de semana |
| **Mês** | Seleciona um mês. Calendário mostra seleção de mês inteiro |

## Componentes a Criar

### 1. `SquadMetricsDialog.tsx` (Novo)
Dialog específico para adicionar métricas no contexto do squad, com:
- Seletor de tipo de período (Tabs)
- Seletor de closer filtrado pelo squad atual
- Formulário com todos os campos de métricas

### 2. `PeriodTypeSelector.tsx` (Novo)
Componente reutilizável com tabs para selecionar Dia/Semana/Mês

### 3. `SquadMetricsForm.tsx` (Novo)
Formulário estendido do MetricsForm existente, incluindo:
- Campos de tendência (revenue_trend, entries_trend)
- Campos de cancelamento (cancellations, cancellation_value, cancellation_entries)
- Lógica inteligente de cálculo de período baseado no tipo selecionado

## Modificações em Arquivos Existentes

### `SquadPage.tsx`
- Adicionar estado para controlar abertura do dialog
- Adicionar botão "Adicionar Métrica" no header
- Importar e renderizar `SquadMetricsDialog`

### `CloserDetailPage.tsx`
- Adicionar botão para inserção manual (opcional, para o closer específico)

### `useMetrics.ts`
- Atualizar `useCreateMetric` para aceitar todos os campos (trends, cancellations)

## Estrutura dos Arquivos

```text
src/components/dashboard/
├── SquadMetricsDialog.tsx      ← Novo
├── SquadMetricsForm.tsx        ← Novo
├── PeriodTypeSelector.tsx      ← Novo
├── SquadPage.tsx               ← Modificar
└── closer/
    └── CloserDetailPage.tsx    ← Modificar
```

## Fluxo de Dados

```text
1. Usuário clica em "Adicionar Métrica"
2. Dialog abre com squad pré-selecionado
3. Usuário seleciona tipo de período (Dia/Semana/Mês)
4. Usuário seleciona closer do squad
5. Usuário seleciona data (calendário adapta ao tipo)
6. Sistema calcula automaticamente period_start e period_end
7. Usuário preenche métricas
8. Submit → useCreateMetric → Supabase
9. React Query invalida cache → UI atualiza
```

## Detalhes Técnicos

### Schema do Formulário (Zod)

```typescript
const squadMetricsSchema = z.object({
  period_type: z.enum(['day', 'week', 'month']),
  closer_id: z.string().min(1),
  selected_date: z.date(),
  calls: z.coerce.number().int().min(0),
  sales: z.coerce.number().int().min(0),
  revenue: z.coerce.number().min(0),
  entries: z.coerce.number().min(0),
  revenue_trend: z.coerce.number().min(0).optional(),
  entries_trend: z.coerce.number().min(0).optional(),
  cancellations: z.coerce.number().int().min(0).optional(),
  cancellation_value: z.coerce.number().min(0).optional(),
  cancellation_entries: z.coerce.number().min(0).optional(),
});
```

### Cálculo de Período

```typescript
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth 
} from 'date-fns';

function calculatePeriod(date: Date, type: 'day' | 'week' | 'month') {
  switch (type) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date)
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
  }
}
```

### Payload para Supabase

```typescript
const payload = {
  closer_id: values.closer_id,
  period_start: format(period.start, 'yyyy-MM-dd'),
  period_end: format(period.end, 'yyyy-MM-dd'),
  calls: values.calls,
  sales: values.sales,
  revenue: values.revenue,
  entries: values.entries,
  revenue_trend: values.revenue_trend ?? 0,
  entries_trend: values.entries_trend ?? 0,
  cancellations: values.cancellations ?? 0,
  cancellation_value: values.cancellation_value ?? 0,
  cancellation_entries: values.cancellation_entries ?? 0,
  source: 'manual',
};
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/dashboard/PeriodTypeSelector.tsx` | Criar | Componente de seleção Dia/Semana/Mês |
| `src/components/dashboard/SquadMetricsForm.tsx` | Criar | Formulário completo com todos os campos |
| `src/components/dashboard/SquadMetricsDialog.tsx` | Criar | Dialog de inserção manual |
| `src/components/dashboard/SquadPage.tsx` | Modificar | Adicionar botão e integrar dialog |
| `src/components/dashboard/closer/CloserDetailPage.tsx` | Modificar | Adicionar botão de inserção (opcional) |
| `src/hooks/useMetrics.ts` | Modificar | Expandir payload do createMetric |

## Resultado Esperado

1. Botão "Adicionar Métrica" visível na página do squad ao lado de "Sincronizar"
2. Dialog intuitivo com seleção de período (Dia/Semana/Mês)
3. Calendário adaptativo ao tipo de período selecionado
4. Todos os campos de métricas disponíveis (incluindo trends e cancelamentos)
5. Dados salvos com `source: 'manual'` para diferenciação
6. UI atualiza automaticamente após inserção (realtime)

