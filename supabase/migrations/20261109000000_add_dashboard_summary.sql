-- Dashboard aggregates computed in the database so totals stay correct beyond
-- the 1,000-row API response cap. SECURITY INVOKER keeps RLS in force: the
-- caller only aggregates rows they are allowed to read.

CREATE INDEX IF NOT EXISTS leads_business_created_at_idx
  ON public.leads (business_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_leads', (SELECT count(*) FROM public.leads),
    'new_leads', (SELECT count(*) FROM public.leads WHERE status = 'new'),
    'pipeline_value', (
      SELECT coalesce(sum(value), 0) FROM public.leads
      WHERE status IN ('new', 'contacted', 'qualified')
    ),
    'estimated_revenue', (
      SELECT coalesce(sum(value), 0) FROM public.leads
      WHERE status IN ('won', 'qualified')
    ),
    'upcoming_appointments', (
      SELECT count(*) FROM public.appointments
      WHERE status IN ('requested', 'scheduled', 'confirmed')
    ),
    'active_conversations', (
      SELECT count(*) FROM public.chat_conversations
      WHERE status IN ('active', 'awaiting_human')
    ),
    'total_conversations', (SELECT count(*) FROM public.chat_conversations),
    'attention_leads', (
      SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
        SELECT id, name, service, source, status, value, next_follow_up, created_at
        FROM public.leads
        WHERE status IN ('new', 'contacted')
        ORDER BY created_at DESC
        LIMIT 4
      ) t
    ),
    'upcoming_list', (
      SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
        SELECT id, customer_name, service, date, time, status
        FROM public.appointments
        WHERE status IN ('requested', 'scheduled', 'confirmed')
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated, service_role;
