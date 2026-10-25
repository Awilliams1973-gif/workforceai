-- Wrap auth.uid() in (select ...) so Postgres evaluates it once per statement
-- instead of once per row (Supabase advisor 0003_auth_rls_initplan).
-- Only the policy expressions change; commands, roles, and permissive mode do
-- not. Each policy is skipped if it does not exist in the target database.

DO $migration$
DECLARE
  item record;
  clause text;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('appointments', 'Users can create appointments for their business', NULL::text,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = appointments.business_id))))$e$),
      ('appointments', 'Users can delete appointments in their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = appointments.business_id))))$e$, NULL),
      ('appointments', 'Users can read appointments in their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = appointments.business_id))))$e$, NULL),
      ('appointments', 'Users can update appointments in their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = appointments.business_id))))$e$,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = appointments.business_id))))$e$),
      ('business_audit_submissions', 'admin_audit_select',
        $e$(EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true))))$e$, NULL),
      ('business_settings', 'delete_own_business_settings',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = business_settings.business_id))))$e$, NULL),
      ('business_settings', 'insert_own_business_settings', NULL,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = business_settings.business_id))))$e$),
      ('business_settings', 'select_own_business_settings',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = business_settings.business_id))))$e$, NULL),
      ('business_settings', 'update_own_business_settings',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = business_settings.business_id))))$e$,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = business_settings.business_id))))$e$),
      ('businesses', 'Users can read their own business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = businesses.id))))$e$, NULL),
      ('chat_conversations', 'Admins can read chat conversations',
        $e$(EXISTS (SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.is_admin = true))))$e$, NULL),
      ('chat_conversations', 'Admins can update chat conversations',
        $e$(EXISTS (SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.is_admin = true))))$e$,
        $e$(EXISTS (SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.is_admin = true))))$e$),
      ('chat_messages', 'Admins can insert chat messages', NULL,
        $e$(EXISTS (SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.is_admin = true))))$e$),
      ('chat_messages', 'Admins can read chat messages',
        $e$(EXISTS (SELECT 1 FROM (chat_conversations c JOIN profiles p ON (((p.id = (select auth.uid())) AND (p.is_admin = true)))) WHERE (c.id = chat_messages.conversation_id)))$e$, NULL),
      ('leads', 'Users can create leads for their business', NULL,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = leads.business_id))))$e$),
      ('leads', 'Users can delete leads in their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = leads.business_id))))$e$, NULL),
      ('leads', 'Users can read leads from their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = leads.business_id))))$e$, NULL),
      ('leads', 'Users can update leads in their business',
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = leads.business_id))))$e$,
        $e$(EXISTS (SELECT 1 FROM user_businesses ub WHERE ((ub.user_id = (select auth.uid())) AND (ub.business_id = leads.business_id))))$e$),
      ('profiles', 'insert_own_profile', NULL, $e$((select auth.uid()) = id)$e$),
      ('profiles', 'select_own_profile', $e$((select auth.uid()) = id)$e$, NULL),
      ('profiles', 'update_own_profile', $e$((select auth.uid()) = id)$e$, $e$((select auth.uid()) = id)$e$),
      ('subscriptions', 'delete_own_subscriptions', $e$((select auth.uid()) = user_id)$e$, NULL),
      ('subscriptions', 'insert_own_subscriptions', NULL, $e$((select auth.uid()) = user_id)$e$),
      ('subscriptions', 'select_own_subscriptions', $e$((select auth.uid()) = user_id)$e$, NULL),
      ('subscriptions', 'update_own_subscriptions', $e$((select auth.uid()) = user_id)$e$, $e$((select auth.uid()) = user_id)$e$),
      ('user_businesses', 'Users can read their own memberships', $e$(user_id = (select auth.uid()))$e$, NULL)
    ) AS v(tbl, pol, using_expr, check_expr)
  LOOP
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = item.tbl AND policyname = item.pol
    );
    clause := '';
    IF item.using_expr IS NOT NULL THEN
      clause := clause || ' USING (' || item.using_expr || ')';
    END IF;
    IF item.check_expr IS NOT NULL THEN
      clause := clause || ' WITH CHECK (' || item.check_expr || ')';
    END IF;
    EXECUTE format('ALTER POLICY %I ON public.%I%s', item.pol, item.tbl, clause);
  END LOOP;
END
$migration$;
