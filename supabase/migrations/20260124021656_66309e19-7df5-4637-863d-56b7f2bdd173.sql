-- 1) Update existing squad_sheets_config for alcateia and sharks to use blockOffset: 12
UPDATE public.squad_sheets_config c
SET row_mapping = jsonb_set(c.row_mapping, '{blockOffset}', '12'::jsonb, true),
    updated_at = now()
FROM public.squads s
WHERE c.squad_id = s.id
  AND s.slug IN ('alcateia', 'sharks');

-- 2) Update default value for row_mapping column to use blockOffset: 12
ALTER TABLE public.squad_sheets_config
ALTER COLUMN row_mapping
SET DEFAULT '{"column":"H","firstBlockStartRow":5,"blockOffset":12,"numberOfBlocks":4,"dateRow":1,"metrics":{"calls":0,"sales":1,"revenue":3,"entries":4,"revenueTrend":5,"entriesTrend":6,"cancellations":7,"cancellationValue":9,"cancellationEntries":10}}'::jsonb;