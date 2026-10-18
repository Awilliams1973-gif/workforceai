DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_secrets'
      AND column_name = 'STRIPE_SECRET_KEY'
  ) THEN
    ALTER TABLE public.app_secrets
      ALTER COLUMN "STRIPE_SECRET_KEY" DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_secrets'
      AND column_name = '(sk_test_...)'
  ) THEN
    ALTER TABLE public.app_secrets
      ALTER COLUMN "(sk_test_...)" DROP NOT NULL;
  END IF;
END;
$$;