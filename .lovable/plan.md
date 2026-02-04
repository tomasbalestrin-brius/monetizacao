

# Plano: Corrigir Dados Duplicados do Eagles em Fevereiro 2026

## Problema Identificado

A sincronização do Google Sheets criou **12 registros duplicados** do Eagles com datas de **Fevereiro 2026** quando os dados reais são de Janeiro 2025.

**Situação Atual no Banco:**
- Fevereiro 2026 (Eagles): 12 registros, R$ 838.160 → **INCORRETO - deve ser deletado**
- Janeiro 2026 (Eagles): 12 registros, R$ 475.244 → Dados corretos de Janeiro 2025
- Janeiro 2026 (Alcateia): 12 registros → Correto
- Janeiro 2026 (Sharks): 4 registros → Correto

## Solução

Executar uma migração SQL para deletar os 12 registros incorretos de Fevereiro 2026 do Eagles.

## SQL a Executar

```sql
DELETE FROM metrics
WHERE id IN (
  SELECT m.id 
  FROM metrics m
  JOIN closers c ON m.closer_id = c.id
  JOIN squads s ON c.squad_id = s.id
  WHERE s.slug = 'eagles'
  AND m.period_start >= '2026-02-01'
  AND m.period_start < '2026-03-01'
);
```

## Resultado Esperado

Após a execução:
- **Dashboard Geral (Fevereiro 2026):** Mostrará R$ 0,00 em todos os valores
- **Squad Eagles (Fevereiro 2026):** Estará vazio, pronto para entrada manual
- **Squad Eagles (Janeiro 2026):** Continuará com os dados históricos importados

## Impacto

| Antes | Depois |
|-------|--------|
| Faturamento Eagles Fev: R$ 838.160 | Faturamento Eagles Fev: R$ 0,00 |
| 123 calls em Fev | 0 calls em Fev |
| 21 vendas em Fev | 0 vendas em Fev |

## Arquivos Afetados

Nenhum arquivo de código será modificado. Apenas uma migração de banco de dados para limpeza de dados.

