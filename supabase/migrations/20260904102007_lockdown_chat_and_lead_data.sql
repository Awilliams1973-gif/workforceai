-- Public visitors can create chats, but only admins can inspect or manage them.
DROP POLICY IF EXISTS "anon_select_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "auth_select_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "anon_insert_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "auth_update_chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can read chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update chat conversations" ON public.chat_conversations;

CREATE POLICY "anon_insert_chat_conversations" ON public.chat_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read chat conversations" ON public.chat_conversations FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));
CREATE POLICY "Admins can update chat conversations" ON public.chat_conversations FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "anon_select_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "auth_select_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can read chat messages" ON public.chat_messages;

CREATE POLICY "anon_insert_chat_messages" ON public.chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read chat messages" ON public.chat_messages FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    JOIN public.profiles p ON p.id = auth.uid() AND p.is_admin = true
    WHERE c.id = chat_messages.conversation_id
  ));
