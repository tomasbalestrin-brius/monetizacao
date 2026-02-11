
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
