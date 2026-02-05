
# Correção: Data Exibida um Dia Antes na Tabela SDR

## Problema Identificado

O problema NÃO está na gravação dos dados (as datas estão sendo salvas corretamente como `2026-02-05` no banco de dados), mas sim na **exibição** das datas na tabela.

Na linha 115 do `SDRDataTable.tsx`:
```typescript
{format(new Date(metric.date), 'dd/MM/yyyy', { locale: ptBR })}
```

Quando `new Date("2026-02-05")` é chamado com uma string ISO sem hora, o JavaScript interpreta como **meia-noite UTC**. Para um usuário no Brasil (UTC-3), isso resulta em:
- `2026-02-05T00:00:00Z` (UTC) = `2026-02-04T21:00:00-03:00` (Brasil)
- Ao formatar, aparece **04/02/2026** ao invés de **05/02/2026**

## Solucao

Usar a funcao `parseDateString` que ja existe no projeto para fazer o parsing correto da data no timezone local em todos os componentes que exibem datas.

## Arquivos a Modificar

1. `src/components/dashboard/sdr/SDRDataTable.tsx` - Exibicao de datas na tabela de metricas SDR
2. Possivelmente outros componentes que exibem datas de metricas

## Alteracoes Tecnicas

### SDRDataTable.tsx

```diff
- import { format } from 'date-fns';
+ import { format } from 'date-fns';
+ import { parseDateString } from '@/lib/utils';

// Linha 61 - Ordenacao de datas
- const sortedMetrics = [...metrics].sort(
-   (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
- );
+ const sortedMetrics = [...metrics].sort(
+   (a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
+ );

// Linha 115 - Exibicao da data
- {format(new Date(metric.date), 'dd/MM/yyyy', { locale: ptBR })}
+ {format(parseDateString(metric.date), 'dd/MM/yyyy', { locale: ptBR })}
```

## Verificacao de Outros Componentes

Apos essa correcao, sera necessario verificar se outros componentes tambem usam `new Date(metric.date)` para exibir datas e aplicar a mesma correcao:
- `CloserDataTable.tsx`
- Graficos de comparacao semanal
- Outras tabelas de metricas

## Resultado Esperado

A data exibida na tabela correspondera exatamente a data salva no banco de dados, independente do timezone do usuario.
