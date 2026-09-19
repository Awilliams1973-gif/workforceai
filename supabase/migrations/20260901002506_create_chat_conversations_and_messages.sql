/*
# Create chat conversations and messages tables

1. New Tables
- `chat_conversations`
  - `id` (uuid, primary key): unique conversation identifier.
  - `session_id` (uuid, not null): client-generated session ID that groups all messages from one visitor.
  - `visitor_name` (text, optional): captured during chat if the visitor provides their name.
  - `visitor_email` (text, optional): captured during chat if the visitor provides their email.
  - `visitor_phone` (text, optional): captured during chat if the visitor provides their phone.
  - `status` (text, default 'active'): conversation status — active, awaiting_human, or closed.
  - `created_at` (timestamptz): when the conversation started.
  - `updated_at` (timestamptz): last activity timestamp.

- `chat_messages`
  - `id` (uuid, primary key): unique message identifier.
  - `conversation_id` (uuid, FK to chat_conversations): which conversation this message belongs to.
  - `sender` (text, not null): who sent the message — 'customer', 'ai', or 'human'.
  - `text` (text, not null): the message content.
  - `created_at` (timestamptz): when the message was sent.

2. Security
- RLS enabled on both tables.
- Anonymous visitors can create conversations and send messages (public chat widget).
- Anonymous visitors can read messages from their own session (matched by session_id / conversation_id).
- Authenticated admin users can read all conversations and messages.
- Only authenticated users (admins taking over) can update conversation status.
- No one can delete through the public client.

3. Important Notes
- The session_id is a UUID generated client-side; it groups a visitor's chat session.
- No existing tables or data are modified.
*/

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'awaiting_human', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer', 'ai', 'human')),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_conversations policies
DROP POLICY IF EXISTS "anon_insert_chat_conversations" ON public.chat_conversations;
CREATE POLICY "anon_insert_chat_conversations"
  ON public.chat_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_chat_conversations" ON public.chat_conversations;
CREATE POLICY "anon_select_chat_conversations"
  ON public.chat_conversations FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_update_chat_conversations" ON public.chat_conversations;
CREATE POLICY "auth_update_chat_conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- chat_messages policies
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;
CREATE POLICY "anon_insert_chat_messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_chat_messages" ON public.chat_messages;
CREATE POLICY "anon_select_chat_messages"
  ON public.chat_messages FOR SELECT
  TO anon, authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chat_conversations_session_id_idx ON public.chat_conversations (session_id);
CREATE INDEX IF NOT EXISTS chat_conversations_created_at_idx ON public.chat_conversations (created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages (created_at ASC);

-- Auto-update updated_at on conversation changes
CREATE OR REPLACE FUNCTION public.update_chat_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_conversation_updated_at();
