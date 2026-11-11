-- Subscriptions are written only by the stripe-webhook Edge Function (service role).
-- Clients may read their own row but must not be able to grant themselves a plan.
DROP POLICY IF EXISTS "insert_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "delete_own_subscriptions" ON public.subscriptions;

REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;
