/*
# Create app_secrets table for server-side API keys

1. New Tables
- `app_secrets`
  - `id` (uuid, primary key)
  - `key_name` (text, unique): identifier for the secret (e.g. 'OPENAI_API_KEY')
  - `key_value` (text): the secret value
  - `created_at` (timestamptz)

2. Security
- RLS enabled with NO policies — only the service role (used by edge functions) can read/write.
- The anon and authenticated roles get zero access. This ensures API keys are never
  exposed to the browser under any circumstances.

3. Important Notes
- This table is intentionally inaccessible from the public client.
- Edge functions use the SUPABASE_SERVICE_ROLE_KEY to read from it.
*/

CREATE TABLE IF NOT EXISTS public.app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies — deny all access to anon and authenticated roles.
-- Only the service role (which bypasses RLS) can read/write.
DROP POLICY IF EXISTS "deny_anon_select_secrets" ON public.app_secrets;
CREATE POLICY "deny_anon_select_secrets"
  ON public.app_secrets FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "deny_anon_insert_secrets" ON public.app_secrets;
CREATE POLICY "deny_anon_insert_secrets"
  ON public.app_secrets FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_update_secrets" ON public.app_secrets;
CREATE POLICY "deny_anon_update_secrets"
  ON public.app_secrets FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_delete_secrets" ON public.app_secrets;
CREATE POLICY "deny_anon_delete_secrets"
  ON public.app_secrets FOR DELETE
  TO anon, authenticated
  USING (false);
