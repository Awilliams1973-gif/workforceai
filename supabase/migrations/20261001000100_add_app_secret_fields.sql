ALTER TABLE public.app_secrets
  ADD COLUMN IF NOT EXISTS key_name text,
  ADD COLUMN IF NOT EXISTS key_value text;

CREATE UNIQUE INDEX IF NOT EXISTS app_secrets_key_name_idx
  ON public.app_secrets (key_name)
  WHERE key_name IS NOT NULL;
