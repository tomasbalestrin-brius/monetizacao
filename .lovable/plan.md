
# Plano: Adicionar Seletor de Mês Explícito no Formulário de Métricas

## Problema Identificado

O formulário atual requer que o usuário:
1. Selecione o tipo de período (Dia/Semana/Mês)
2. Abra o calendário e navegue até o mês desejado
3. Clique em uma data qualquer daquele mês

Isso é confuso, especialmente quando o usuário quer adicionar métricas de um mês diferente do atual.

## Solução Proposta

Adicionar um **seletor de mês rápido** quando o tipo de período for "Mês", similar ao `MonthSelector` usado no dashboard.

### Novo Comportamento

| Tipo de Período | Seleção |
|-----------------|---------|
| **Dia** | Calendário com seleção de dia específico |
| **Semana** | Calendário com seleção de semana |
| **Mês** | Seletor de mês com setas (◀ Fevereiro 2026 ▶) |

### Design Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  📅 Tipo de Período                                         │
│  [Dia] [Semana] [Mês ✓]                                     │
├─────────────────────────────────────────────────────────────┤
│  📆 Mês                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ◀   Fevereiro 2026   ▶                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  Período: 01/02/2026 a 28/02/2026                          │
└─────────────────────────────────────────────────────────────┘
```

### Comportamento

1. Quando o usuário seleciona tipo "Mês":
   - O calendário é **substituído** pelo seletor de mês
   - As setas permitem navegar entre meses
   - O período é calculado automaticamente (primeiro ao último dia)

2. Quando o usuário seleciona "Dia" ou "Semana":
   - Mantém o comportamento atual com calendário

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/dashboard/SquadMetricsForm.tsx` | Adicionar lógica condicional para mostrar MonthSelector ou Calendar baseado no period_type |

## Seção Técnica

### Lógica Condicional

```tsx
{periodType === 'month' ? (
  <MonthSelector
    selectedMonth={field.value}
    onMonthChange={(date) => field.onChange(date)}
    className="w-full justify-center"
  />
) : (
  <Popover>
    {/* Calendário existente */}
  </Popover>
)}
```

### Importação

```tsx
import { MonthSelector } from './MonthSelector';
```

## Benefícios

1. **Mais intuitivo**: Seleção de mês direta sem navegar no calendário
2. **Menos cliques**: Um clique nas setas vs. múltiplos cliques no calendário
3. **Consistência visual**: Usa o mesmo componente do dashboard principal
4. **Feedback imediato**: Mostra o período calculado em tempo real

## Ordem de Implementação

1. Importar `MonthSelector` no `SquadMetricsForm`
2. Adicionar renderização condicional baseada em `periodType`
3. Ajustar estilos para consistência
4. Testar fluxo completo de adição de métrica mensal
