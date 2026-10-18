-- Add tenant references before the signup provisioning migration backfills
-- profile.business_id and profile.role.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'owner';
