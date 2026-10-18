-- Public chat writes must go through the rate-limited ai-chat Edge Function.
-- The function uses service_role; dashboard human replies remain admin-only.

DROP POLICY IF EXISTS "anon_insert_chat_conversations" ON public.chat_conversations;
REVOKE INSERT ON public.chat_conversations FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can insert chat messages" ON public.chat_messages;
CREATE POLICY "Admins can insert chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));
REVOKE INSERT ON public.chat_messages FROM PUBLIC, anon;
GRANT INSERT ON public.chat_messages TO authenticated;
