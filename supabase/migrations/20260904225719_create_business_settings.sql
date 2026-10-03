/*
# Create business-scoped business_settings table

1. New Tables
- `business_settings`
  - `id` (uuid, primary key)
  - `business_id` (uuid, not null, references businesses, unique — one settings row per business)
  - `business_name` (text, not null, default '')
  - `industry` (text, not null, default '')
  - `phone` (text, not null, default '')
  - `email` (text, not null, default '')
  - `website` (text, not null, default '')
  - `address` (text, not null, default '')
  - `hours` (text, not null, default '')
  - `service_area` (text, not null, default '')
  - `description` (text, not null, default '')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled, membership-scoped CRUD through user_businesses.

3. Notes
- Unique constraint on business_id ensures one settings row per business.
- updated_at auto-maintained via trigger.
*/

CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT '',
  service_area text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS business_settings_business_id_idx ON public.business_settings (business_id);

DROP POLICY IF EXISTS "select_own_business_settings" ON public.business_settings;
CREATE POLICY "select_own_business_settings" ON public.business_settings FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = business_settings.business_id
  ));

DROP POLICY IF EXISTS "insert_own_business_settings" ON public.business_settings;
CREATE POLICY "insert_own_business_settings" ON public.business_settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = business_settings.business_id
  ));

DROP POLICY IF EXISTS "update_own_business_settings" ON public.business_settings;
CREATE POLICY "update_own_business_settings" ON public.business_settings FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = business_settings.business_id
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = business_settings.business_id
  ));

DROP POLICY IF EXISTS "delete_own_business_settings" ON public.business_settings;
CREATE POLICY "delete_own_business_settings" ON public.business_settings FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = business_settings.business_id
  ));

CREATE OR REPLACE FUNCTION public.update_business_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_settings_updated_at ON public.business_settings;
CREATE TRIGGER business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_settings_updated_at();
