-- Supabase grants EXECUTE on new public functions directly to anon and
-- authenticated, so the earlier REVOKE ... FROM PUBLIC did not remove it.
-- Rate limiting is only consumed by Edge Functions (service_role) and by
-- triggers, which do not need the caller to hold EXECUTE.

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.enforce_audit_submission_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_user_profile_and_business() FROM PUBLIC, anon, authenticated;
