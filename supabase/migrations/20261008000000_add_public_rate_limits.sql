-- Atomic abuse protection for public chat and audit lead capture.

CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_windows FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  IF p_key IS NULL OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_windows (key_hash, window_started_at, request_count, updated_at)
  VALUES (md5(p_key), now(), 1, now())
  ON CONFLICT (key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
      THEN now()
      ELSE public.rate_limit_windows.window_started_at
    END,
    request_count = CASE
      WHEN public.rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
      THEN 1
      ELSE public.rate_limit_windows.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_audit_submission_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.consume_rate_limit('audit-email:' || lower(trim(NEW.email)), 3, 3600) THEN
    RAISE EXCEPTION 'Too many audit submissions. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_submission_rate_limit ON public.business_audit_submissions;
CREATE TRIGGER audit_submission_rate_limit
  BEFORE INSERT ON public.business_audit_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_submission_rate_limit();

CREATE INDEX IF NOT EXISTS rate_limit_windows_updated_at_idx
  ON public.rate_limit_windows (updated_at);
