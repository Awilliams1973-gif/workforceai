-- Backfill isolated business workspaces and provision them for future signups.

ALTER TABLE public.user_businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.user_businesses;
CREATE POLICY "Users can read their own memberships" ON public.user_businesses FOR SELECT
  TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own business" ON public.businesses;
CREATE POLICY "Users can read their own business" ON public.businesses FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = businesses.id
  ));

INSERT INTO public.profiles (id, email, full_name, is_admin)
SELECT
  u.id,
  COALESCE(NULLIF(u.email, ''), u.id::text || '@unverified.invalid'),
  NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
  false
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
    JOIN public.profiles p ON p.id = u.id
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

CREATE OR REPLACE FUNCTION public.provision_new_user_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  provisioned_business_id uuid;
  provisioned_business_email text;
  provisioned_business_name text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), NEW.id::text || '@unverified.invalid'),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name);

  SELECT ub.business_id INTO provisioned_business_id
  FROM public.user_businesses ub
  WHERE ub.user_id = NEW.id
  ORDER BY ub.joined_at NULLS FIRST, ub.id
  LIMIT 1;

  IF provisioned_business_id IS NULL THEN
    SELECT p.business_id INTO provisioned_business_id
    FROM public.profiles p
    WHERE p.id = NEW.id;
  END IF;

  IF provisioned_business_id IS NULL THEN
    provisioned_business_email := COALESCE(
      NULLIF(NEW.email, ''),
      NEW.id::text || '@unverified.invalid'
    );

    IF EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE lower(b.email) = lower(provisioned_business_email)
    ) THEN
      provisioned_business_email := NEW.id::text || '@unverified.invalid';
    END IF;

    provisioned_business_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'business_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', '') || ' Business',
      'My Business'
    );

    INSERT INTO public.businesses (name, email)
    VALUES (provisioned_business_name, provisioned_business_email)
    RETURNING id INTO provisioned_business_id;
  END IF;

  INSERT INTO public.user_businesses (user_id, business_id, role)
  VALUES (NEW.id, provisioned_business_id, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;

  UPDATE public.profiles
  SET business_id = provisioned_business_id,
      role = COALESCE(NULLIF(role, ''), 'owner')
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_provision_business ON auth.users;
CREATE TRIGGER on_auth_user_provision_business
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_new_user_business();