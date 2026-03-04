
-- Permitir que users vejam apenas suas entidades vinculadas (closers)
CREATE POLICY "Users can view linked closers"
  ON public.closers FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', id)
  );

-- Permitir que users vejam apenas suas entidades vinculadas (sdrs)
CREATE POLICY "Users can view linked sdrs"
  ON public.sdrs FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', id)
  );

-- Permitir que users vejam metricas das suas entidades vinculadas
CREATE POLICY "Users can view metrics for linked closers"
  ON public.metrics FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
  );

-- Permitir que users insiram metricas para suas entidades vinculadas
CREATE POLICY "Users can insert metrics for linked closers"
  ON public.metrics FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
    AND created_by = auth.uid()
  );

-- Permitir que users atualizem suas proprias metricas
CREATE POLICY "Users can update metrics for linked closers"
  ON public.metrics FOR UPDATE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
    AND created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
    AND created_by = auth.uid()
  );

-- Permitir que users deletem suas proprias metricas
CREATE POLICY "Users can delete metrics for linked closers"
  ON public.metrics FOR DELETE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
    AND created_by = auth.uid()
  );

-- Permitir que users vejam metricas SDR das suas entidades vinculadas
CREATE POLICY "Users can view sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
  );

-- Permitir que users insiram metricas SDR para suas entidades
CREATE POLICY "Users can insert sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
    AND created_by = auth.uid()
  );

-- Permitir que users atualizem suas metricas SDR
CREATE POLICY "Users can update sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR UPDATE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
    AND created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
    AND created_by = auth.uid()
  );

-- Permitir que users deletem suas metricas SDR
CREATE POLICY "Users can delete sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR DELETE
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
    AND created_by = auth.uid()
  );
