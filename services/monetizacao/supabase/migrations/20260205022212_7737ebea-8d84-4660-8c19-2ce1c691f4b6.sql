-- Create a function to check if a user is linked to a specific entity
CREATE OR REPLACE FUNCTION public.is_linked_to_entity(_user_id uuid, _entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entity_links
    WHERE user_id = _user_id
      AND entity_type = _entity_type
      AND entity_id = _entity_id
  )
$$;

-- Drop existing sdr_metrics policies to recreate with entity linking
DROP POLICY IF EXISTS "Admins can manage all sdr_metrics" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Managers can manage all sdr_metrics" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Authenticated users can view sdr_metrics" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can update their own sdr_metrics" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can delete their own sdr_metrics" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can insert sdr_metrics" ON public.sdr_metrics;

-- Recreate policies with proper entity linking logic

-- Admins can do everything
CREATE POLICY "Admins can manage all sdr_metrics"
ON public.sdr_metrics
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Managers can do everything
CREATE POLICY "Managers can manage all sdr_metrics"
ON public.sdr_metrics
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- All authenticated users can view sdr_metrics
CREATE POLICY "Authenticated users can view sdr_metrics"
ON public.sdr_metrics
FOR SELECT
TO authenticated
USING (true);

-- Users can insert metrics for SDRs they are linked to
CREATE POLICY "Users can insert sdr_metrics for linked SDRs"
ON public.sdr_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  is_linked_to_entity(auth.uid(), 'sdr', sdr_id) 
  AND created_by = auth.uid()
);

-- Users can update metrics for SDRs they are linked to (and they created)
CREATE POLICY "Users can update sdr_metrics for linked SDRs"
ON public.sdr_metrics
FOR UPDATE
TO authenticated
USING (
  is_linked_to_entity(auth.uid(), 'sdr', sdr_id) 
  AND created_by = auth.uid()
)
WITH CHECK (
  is_linked_to_entity(auth.uid(), 'sdr', sdr_id) 
  AND created_by = auth.uid()
);

-- Users can delete metrics for SDRs they are linked to (and they created)
CREATE POLICY "Users can delete sdr_metrics for linked SDRs"
ON public.sdr_metrics
FOR DELETE
TO authenticated
USING (
  is_linked_to_entity(auth.uid(), 'sdr', sdr_id) 
  AND created_by = auth.uid()
);