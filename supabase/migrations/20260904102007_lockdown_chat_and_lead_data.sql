/*
# Lock down chat and lead data

1. Chat conversations/messages: remove world-readable anon SELECT.
   - Anon can still INSERT (chat widget creates conversations/messages).
   - Only authenticated users can SELECT (dashboard inbox).
   - Only authenticated users can UPDATE (human takeover).

2. Leads with NULL user_id (AI-captured): restrict SELECT to admins only.
   - Regular users can only see their own leads (auth.uid() = user_id).
   - Admins can see all leads including AI-captured ones.
   - UPDATE/DELETE of NULL-user_id leads restricted to admins.
*/

-- ===== chat_conversations =====
DROP POLICY IF EXISTS "anon_select_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "anon_insert_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "auth_update_chat_conversations" ON public.chat_conversations;

-- Anon can insert (chat widget), cannot select
CREATE POLICY "anon_insert_chat_conversations"
  ON public.chat_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can select all conversations (dashboard inbox)
CREATE POLICY "auth_select_chat_conversations"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update (human takeover)
CREATE POLICY "auth_update_chat_conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===== chat_messages =====
DROP POLICY IF EXISTS "anon_select_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;

-- Anon can insert (chat widget), cannot select
CREATE POLICY "anon_insert_chat_messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can select (dashboard inbox)
CREATE POLICY "auth_select_chat_messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

-- ===== leads: restrict NULL-user_id to admins =====
DROP POLICY IF EXISTS "select_own_leads" ON public.leads;
CREATE POLICY "select_own_leads" ON public.leads FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    )
  );

DROP POLICY IF EXISTS "update_own_leads" ON public.leads;
CREATE POLICY "update_own_leads" ON public.leads FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    )
  )
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_leads" ON public.leads;
CREATE POLICY "delete_own_leads" ON public.leads FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    )
  );
