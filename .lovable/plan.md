

# Permitir Edicao de Todos os Dados do SDR Vinculado

## Problema Atual

As politicas de seguranca (RLS) atuais exigem que o usuario so pode editar/excluir metricas que **ele mesmo criou** (`created_by = auth.uid()`). Dados importados do Google Sheets tem `created_by = null`, entao o usuario nao consegue edita-los.

## Solucao

Alterar as politicas de UPDATE e DELETE para usuarios com role `user` para que possam gerenciar **qualquer metrica** do SDR vinculado, independente de quem criou.

## Alteracoes no Banco de Dados

Substituir 4 politicas existentes por 2 novas:

```text
REMOVER:
- "Users can update sdr_metrics for linked sdrs" (UPDATE com created_by check)
- "Users can update their own sdr_metrics" (UPDATE com created_by check)
- "Users can delete sdr_metrics for linked sdrs" (DELETE com created_by check)  
- "Users can delete their own sdr_metrics" (DELETE com created_by check)

CRIAR:
- "Users can update sdr_metrics for linked sdrs" (UPDATE apenas com is_linked_to_entity)
- "Users can delete sdr_metrics for linked sdrs" (DELETE apenas com is_linked_to_entity)
```

### SQL da Migracao

```sql
-- Remove politicas antigas de UPDATE
DROP POLICY IF EXISTS "Users can update sdr_metrics for linked sdrs" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can update their own sdr_metrics" ON public.sdr_metrics;

-- Remove politicas antigas de DELETE
DROP POLICY IF EXISTS "Users can delete sdr_metrics for linked sdrs" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can delete their own sdr_metrics" ON public.sdr_metrics;

-- Nova politica de UPDATE: usuario pode editar qualquer metrica do SDR vinculado
CREATE POLICY "Users can update sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR UPDATE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr'::text, sdr_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr'::text, sdr_id)
  );

-- Nova politica de DELETE: usuario pode excluir qualquer metrica do SDR vinculado
CREATE POLICY "Users can delete sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR DELETE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr'::text, sdr_id)
  );
```

## Resultado

- Usuarios com role `user` poderao editar e excluir **todas** as metricas do SDR vinculado (manuais e importadas)
- Admins e managers mantem acesso total
- A politica de INSERT continua exigindo `created_by = auth.uid()` para rastreabilidade
- Nenhuma alteracao no frontend e necessaria

