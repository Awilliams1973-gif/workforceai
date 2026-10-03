-- Automated leads have no signed-in creator but remain scoped to a business.
ALTER TABLE public.leads ALTER COLUMN created_by DROP NOT NULL;
