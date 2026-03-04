-- Drop existing INSERT policy that requires entity link
DROP POLICY IF EXISTS "Users can insert sdr_metrics for linked SDRs" ON public.sdr_metrics;

-- Create a simpler INSERT policy that allows any authenticated user to insert
-- as long as they set created_by to their own user id
CREATE POLICY "Users can insert sdr_metrics" 
ON public.sdr_metrics 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Also fix the UPDATE and DELETE policies to be less restrictive
-- Users should be able to update/delete their own records without needing entity link
DROP POLICY IF EXISTS "Users can update sdr_metrics for linked SDRs" ON public.sdr_metrics;
DROP POLICY IF EXISTS "Users can delete sdr_metrics for linked SDRs" ON public.sdr_metrics;

-- Users can update their own records
CREATE POLICY "Users can update their own sdr_metrics" 
ON public.sdr_metrics 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Users can delete their own records
CREATE POLICY "Users can delete their own sdr_metrics" 
ON public.sdr_metrics 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());