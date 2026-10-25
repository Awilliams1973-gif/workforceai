-- Pin search_path on the remaining trigger functions so they do not depend on
-- the caller's search_path. Both only call pg_catalog.now().

ALTER FUNCTION public.update_chat_conversation_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_business_settings_updated_at() SET search_path = public, pg_catalog;
