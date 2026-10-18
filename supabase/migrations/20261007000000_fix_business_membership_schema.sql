-- Consolidate business membership provisioning into one consistent path.
-- This ensures the app's expected tables and RLS setup actually exist.

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_businesses ENABLE ROW LEVEL SECURITY;

-- Ensure profiles has the expected business-scoping columns used by the app.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'owner';

-- Remove any older duplicate triggers/functions before creating the canonical one.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_provision_business ON auth.users;
DROP FUNCTION IF EXISTS public.provision_new_user_business();

CREATE OR REPLACE FUNCTION public.ensure_user_profile_and_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_business_id uuid;
  selected_business_email text;
  selected_business_name text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin, business_id, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), NEW.id::text || '@unverified.invalid'),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    false,
    NULL,
    'owner'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name);

  SELECT ub.business_id
  INTO selected_business_id
  FROM public.user_businesses ub
  WHERE ub.user_id = NEW.id
  ORDER BY ub.joined_at ASC, ub.id ASC
  LIMIT 1;

  IF selected_business_id IS NULL THEN
    SELECT p.business_id
    INTO selected_business_id
    FROM public.profiles p
    WHERE p.id = NEW.id;
  END IF;

  IF selected_business_id IS NULL THEN
    selected_business_email := COALESCE(
      NULLIF(NEW.email, ''),
      NEW.id::text || '@unverified.invalid'
    );

    IF EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE lower(b.email) = lower(selected_business_email)
    ) THEN
      selected_business_email := NEW.id::text || '@unverified.invalid';
    END IF;

    selected_business_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'business_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', '') || ' Business',
      'My Business'
    );

    INSERT INTO public.businesses (name, email)
    VALUES (selected_business_name, selected_business_email)
    RETURNING id INTO selected_business_id;
  END IF;

  INSERT INTO public.user_businesses (user_id, business_id, role)
  VALUES (NEW.id, selected_business_id, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;

  UPDATE public.profiles
  SET business_id = selected_business_id,
      role = COALESCE(NULLIF(role, ''), 'owner')
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_ensure_profile_and_business
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_profile_and_business();

-- RLS for memberships and businesses.
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.user_businesses;
CREATE POLICY "Users can read their own memberships"
  ON public.user_businesses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read their own business" ON public.businesses;
CREATE POLICY "Users can read their own business"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_businesses ub
      WHERE ub.user_id = auth.uid() AND ub.business_id = businesses.id
    )
  );

CREATE INDEX IF NOT EXISTS user_businesses_user_id_idx ON public.user_businesses (user_id);
CREATE INDEX IF NOT EXISTS user_businesses_business_id_idx ON public.user_businesses (business_id);

-- Backfill any existing users who do not yet have a business membership.
INSERT INTO public.profiles (id, email, full_name, is_admin, business_id, role)
SELECT
  u.id,
  COALESCE(NULLIF(u.email, ''), u.id::text || '@unverified.invalid'),
  NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
  false,
  NULL,
  'owner'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  user_row record;
  provisioned_business_id uuid;
  provisioned_business_email text;
  provisioned_business_name text;
BEGIN
  FOR user_row IN
    SELECT u.id, u.email, u.raw_user_meta_data, p.full_name, p.business_id
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_businesses ub WHERE ub.user_id = u.id
    )
  LOOP
    provisioned_business_id := user_row.business_id;

    IF provisioned_business_id IS NULL THEN
      provisioned_business_email := COALESCE(
        NULLIF(user_row.email, ''),
        user_row.id::text || '@unverified.invalid'
      );

      IF EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE lower(b.email) = lower(provisioned_business_email)
      ) THEN
        provisioned_business_email := user_row.id::text || '@unverified.invalid';
      END IF;

      provisioned_business_name := COALESCE(
        NULLIF(user_row.raw_user_meta_data ->> 'business_name', ''),
        NULLIF(user_row.full_name, '') || ' Business',
        'My Business'
      );

      INSERT INTO public.businesses (name, email)
      VALUES (provisioned_business_name, provisioned_business_email)
      RETURNING id INTO provisioned_business_id;
    END IF;

    INSERT INTO public.user_businesses (user_id, business_id, role)
    VALUES (user_row.id, provisioned_business_id, 'owner')
    ON CONFLICT (user_id, business_id) DO NOTHING;

    UPDATE public.profiles
    SET business_id = provisioned_business_id,
        role = COALESCE(NULLIF(role, ''), 'owner')
    WHERE id = user_row.id;
  END LOOP;
END;
$$;
