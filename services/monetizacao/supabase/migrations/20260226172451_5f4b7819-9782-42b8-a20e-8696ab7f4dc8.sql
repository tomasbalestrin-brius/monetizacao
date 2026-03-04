
-- Update get_all_funnels_summary to include sdr_metrics data
CREATE OR REPLACE FUNCTION public.get_all_funnels_summary(p_period_start date DEFAULT NULL::date, p_period_end date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(json_agg(funnel_data), '[]'::json)
  FROM (
    SELECT 
      f.id as funnel_id,
      f.name as funnel_name,
      f.category,
      COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0) as total_leads,
      COALESCE(closer.total_qualified, 0) as total_qualified,
      COALESCE(closer.total_calls_scheduled, 0) + COALESCE(sdr.total_scheduled, 0) as total_calls_scheduled,
      COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0) as total_calls_done,
      COALESCE(closer.total_sales, 0) + COALESCE(sdr.total_sales, 0) as total_sales,
      COALESCE(closer.total_revenue, 0) as total_revenue,
      CASE 
        WHEN (COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0)) > 0 
        THEN ROUND(COALESCE(closer.total_qualified, 0)::numeric / (COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0)) * 100, 2)
        ELSE 0 
      END as leads_to_qualified_rate,
      CASE 
        WHEN (COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0)) > 0 
        THEN ROUND((COALESCE(closer.total_sales, 0) + COALESCE(sdr.total_sales, 0))::numeric / (COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0)) * 100, 2)
        ELSE 0 
      END as conversion_rate
    FROM funnels f
    LEFT JOIN LATERAL (
      SELECT 
        SUM(fdd.leads_count) as total_leads,
        SUM(fdd.qualified_count) as total_qualified,
        SUM(fdd.calls_scheduled) as total_calls_scheduled,
        SUM(fdd.calls_done) as total_calls_done,
        SUM(fdd.sales_count) as total_sales,
        SUM(fdd.sales_value) as total_revenue
      FROM funnel_daily_data fdd
      WHERE fdd.funnel_id = f.id
        AND (p_period_start IS NULL OR fdd.date >= p_period_start)
        AND (p_period_end IS NULL OR fdd.date <= p_period_end)
    ) closer ON true
    LEFT JOIN LATERAL (
      SELECT 
        SUM(sm.activated) as total_activated,
        SUM(sm.scheduled) as total_scheduled,
        SUM(sm.attended) as total_attended,
        SUM(sm.sales) as total_sales
      FROM sdr_metrics sm
      WHERE sm.funnel = f.name
        AND sm.funnel != ''
        AND (p_period_start IS NULL OR sm.date >= p_period_start)
        AND (p_period_end IS NULL OR sm.date <= p_period_end)
    ) sdr ON true
    WHERE f.is_active = true
    ORDER BY f.name
  ) funnel_data;
$function$;

-- Update get_funnel_report to include sdr_metrics data
CREATE OR REPLACE FUNCTION public.get_funnel_report(p_funnel_id uuid, p_period_start date DEFAULT NULL::date, p_period_end date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'funnel_id', p_funnel_id,
    'funnel_name', (SELECT name FROM funnels WHERE id = p_funnel_id),
    'total_leads', COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0),
    'total_qualified', COALESCE(closer.total_qualified, 0),
    'total_calls_scheduled', COALESCE(closer.total_calls_scheduled, 0) + COALESCE(sdr.total_scheduled, 0),
    'total_calls_done', COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0),
    'total_sales', COALESCE(closer.total_sales, 0) + COALESCE(sdr.total_sales, 0),
    'total_revenue', COALESCE(closer.total_revenue, 0),
    'leads_to_qualified_rate', CASE 
      WHEN (COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0)) > 0 
      THEN ROUND(COALESCE(closer.total_qualified, 0)::numeric / (COALESCE(closer.total_leads, 0) + COALESCE(sdr.total_activated, 0)) * 100, 2)
      ELSE 0 
    END,
    'qualified_to_scheduled_rate', CASE 
      WHEN COALESCE(closer.total_qualified, 0) > 0 
      THEN ROUND((COALESCE(closer.total_calls_scheduled, 0) + COALESCE(sdr.total_scheduled, 0))::numeric / COALESCE(closer.total_qualified, 0) * 100, 2)
      ELSE 0 
    END,
    'scheduled_to_done_rate', CASE 
      WHEN (COALESCE(closer.total_calls_scheduled, 0) + COALESCE(sdr.total_scheduled, 0)) > 0 
      THEN ROUND((COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0))::numeric / (COALESCE(closer.total_calls_scheduled, 0) + COALESCE(sdr.total_scheduled, 0)) * 100, 2)
      ELSE 0 
    END,
    'done_to_sales_rate', CASE 
      WHEN (COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0)) > 0 
      THEN ROUND((COALESCE(closer.total_sales, 0) + COALESCE(sdr.total_sales, 0))::numeric / (COALESCE(closer.total_calls_done, 0) + COALESCE(sdr.total_attended, 0)) * 100, 2)
      ELSE 0 
    END
  )
  FROM (
    SELECT 
      SUM(fdd.leads_count) as total_leads,
      SUM(fdd.qualified_count) as total_qualified,
      SUM(fdd.calls_scheduled) as total_calls_scheduled,
      SUM(fdd.calls_done) as total_calls_done,
      SUM(fdd.sales_count) as total_sales,
      SUM(fdd.sales_value) as total_revenue
    FROM funnel_daily_data fdd
    WHERE fdd.funnel_id = p_funnel_id
      AND (p_period_start IS NULL OR fdd.date >= p_period_start)
      AND (p_period_end IS NULL OR fdd.date <= p_period_end)
  ) closer,
  (
    SELECT 
      SUM(sm.activated) as total_activated,
      SUM(sm.scheduled) as total_scheduled,
      SUM(sm.attended) as total_attended,
      SUM(sm.sales) as total_sales
    FROM sdr_metrics sm
    WHERE sm.funnel = (SELECT name FROM funnels WHERE id = p_funnel_id)
      AND sm.funnel != ''
      AND (p_period_start IS NULL OR sm.date >= p_period_start)
      AND (p_period_end IS NULL OR sm.date <= p_period_end)
  ) sdr;
$function$;
