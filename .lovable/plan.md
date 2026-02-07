

# Filtro por Semana e Comparativo Semanal

## Objetivo

Adicionar um seletor de semana ao lado do seletor de mes no SDR Dashboard e SDR Detail Page, permitindo filtrar dados por semana especifica e visualizar comparativos semana a semana de forma clara.

## O que muda

### 1. Novo Componente: WeekSelector

Um seletor de semana que lista todas as semanas do mes selecionado (ex: "Sem 1 - 03/02 a 07/02", "Sem 2 - 10/02 a 14/02", etc.), com opcao "Todas" para ver o mes completo.

- Calcula automaticamente as semanas do mes selecionado (segunda a domingo)
- Semanas que cruzam meses sao cortadas nos limites do mes
- Opcao padrao: "Todas as Semanas" (comportamento atual)

### 2. Filtro de Dados por Semana

Quando uma semana especifica e selecionada:
- Os metric cards mostram apenas dados daquela semana
- A tabela de dados mostra apenas registros daquela semana
- O grafico comparativo continua mostrando todas as semanas para contexto visual

### 3. Comparativo Visual Semana a Semana (aprimorado)

O grafico `SDRWeeklyComparisonChart` ja existe mas sera aprimorado:
- Destacar visualmente a semana selecionada no grafico (barra mais opaca, as demais ficam semi-transparentes)
- Adicionar indicadores de variacao entre a semana selecionada e a anterior
- Quando "Todas" esta selecionado, manter o comportamento atual

### 4. Onde aparece

O filtro de semana sera adicionado em:
- `SDRDashboard` (dashboard consolidado de todos os SDRs)
- `SDRDetailPage` (pagina individual do SDR)

## Layout dos filtros

```text
[Tipo SDR/SS] [Funil ▼] [◀ Fevereiro 2026 ▶] [Semana ▼]
```

O seletor de semana aparece logo apos o seletor de mes, mantendo a hierarquia: primeiro escolhe o mes, depois opcionalmente filtra por semana.

## Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/WeekSelector.tsx` | **Novo** - Componente de selecao de semana baseado no mes |
| `src/components/dashboard/sdr/SDRDashboard.tsx` | Adicionar estado de semana, filtrar dados, passar para componentes |
| `src/components/dashboard/sdr/SDRDetailPage.tsx` | Adicionar estado de semana, filtrar metricas e tabela |
| `src/components/dashboard/sdr/SDRWeeklyComparisonChart.tsx` | Receber semana selecionada e destacar visualmente |

## Detalhes Tecnicos

### WeekSelector - Logica de semanas do mes

```text
Input: selectedMonth (Date)
Output: array de { weekNumber, startDate, endDate, label }

1. Pegar primeiro e ultimo dia do mes
2. Iterar semana a semana (inicio na segunda)
3. Cortar startDate ao maximo em startOfMonth
4. Cortar endDate ao minimo em endOfMonth
5. Gerar label: "Sem 1 - 03/02 a 07/02"
```

### Filtragem de metricas

O filtro de semana sera aplicado no frontend (dados ja carregados pelo mes). Quando uma semana e selecionada:

```text
filteredMetrics = displayMetrics.filter(m => {
  const date = parseDateString(m.date);
  return date >= weekStart && date <= weekEnd;
});
```

Isso afeta metric cards e tabela, mas o grafico recebe os dados completos do mes para manter o comparativo visual.

### Chart com destaque

O `SDRWeeklyComparisonChart` recebera uma prop `activeWeekKey` opcional. Quando definida:
- A barra da semana ativa tera opacidade 1.0
- As demais barras terao opacidade 0.4
- Os indicadores de variacao comparam a semana ativa com a anterior
