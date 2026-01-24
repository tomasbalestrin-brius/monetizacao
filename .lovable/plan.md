
# Plano: Corrigir BlockOffset do Eagles

## Problema

A configuração atual do Eagles usa `blockOffset: 12`, mas a planilha real tem **blockOffset: 13** (cada bloco semanal tem 13 linhas, incluindo 2 linhas de header).

## Estrutura da Planilha Eagles

```text
Row 3-4:   Header Semana 1 (SEGUNDA, TERÇA...)
Row 5:     Calls Realizadas        ← firstBlockStartRow
Row 6:     Vendas Fechadas
Row 7:     Taxa de Conversão
Row 8:     Valor Total (Revenue)
Row 9:     Valor Entrada
Row 10:    Tendência Valor Total
Row 11:    Tendência Valor Entrada
Row 12:    Número de cancelamento
Row 13:    % de Cancelamento
Row 14:    Valor de venda Cancelamento
Row 15:    Valor total de entrada Can
─────────────────────────────────────
Row 16-17: Header Semana 2          ← blockOffset = 13 (18 - 5 = 13)
Row 18:    Calls Realizadas
...
Row 29-30: Header Semana 3
Row 31:    Calls Realizadas
...
```

## Correção no Banco de Dados

Atualizar o `row_mapping` do Eagles com blockOffset correto:

```sql
UPDATE squad_sheets_config 
SET row_mapping = '{
  "column": "G",
  "firstBlockStartRow": 5,
  "blockOffset": 13,
  "numberOfBlocks": 4,
  "dateRow": 3,
  "metrics": {
    "calls": 0,
    "sales": 1,
    "revenue": 3,
    "entries": 4,
    "revenueTrend": 5,
    "entriesTrend": 6,
    "cancellations": 7,
    "cancellationValue": 9,
    "cancellationEntries": 10
  }
}'::jsonb,
updated_at = now()
WHERE squad_id = 'd007406c-5354-4188-b1a7-83818abfa354';
```

## Após a Correção

1. Executar o UPDATE no banco
2. Disparar `sync-squad-sheets` para Eagles
3. Verificar que os dados das 4 semanas foram importados corretamente

## Resultado Esperado

| Semana | Closer | Calls | Sales | Revenue |
|--------|--------|-------|-------|---------|
| Week 1 | Hannah | 12 | 1 | R$ 14.997 |
| Week 2 | Hannah | 5 | 2 | R$ 14.997 |
| Week 3 | Hannah | 9 | 1 | (valor da planilha) |
| Week 4 | Hannah | (valor) | (valor) | (valor) |

## Alterações

| Entidade | Campo | Antes | Depois |
|----------|-------|-------|--------|
| `squad_sheets_config` (Eagles) | `row_mapping.blockOffset` | 12 | 13 |
| `squad_sheets_config` (Eagles) | `row_mapping.column` | G | G (mantém) |
