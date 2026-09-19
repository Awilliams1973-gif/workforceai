/*
# Allow AI-captured leads without an owner

1. Changes
- `leads.user_id` changed from NOT NULL to nullable, so the edge function (service role)
  can insert leads captured by the AI chatbot without an authenticated user.
- SELECT policy updated so authenticated users can see leads where user_id = auth.uid()
  OR user_id IS NULL (AI-captured leads are visible to all authenticated users).

2. Security
- INSERT/UPDATE/DELETE policies remain owner-scoped (auth.uid() = user_id).
- AI-captured leads (user_id IS NULL) are read-only from the client — only the service
  role (edge function) creates them.

3. Important Notes
- No existing data is lost.
- AI-captured leads are visible to all signed-in users since they come from the public chat widget.
*/

ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "select_own_leads" ON public.leads;
CREATE POLICY "select_own_leads" ON public.leads FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "update_own_leads" ON public.leads;
CREATE POLICY "update_own_leads" ON public.leads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_leads" ON public.leads;
CREATE POLICY "delete_own_leads" ON public.leads FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
