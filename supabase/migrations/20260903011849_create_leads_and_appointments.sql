-- Match the business-scoped schema already present in production.
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  service varchar(255) NOT NULL,
  source varchar(255) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'new',
  value integer DEFAULT 0,
  notes text,
  next_follow_up timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  service varchar(255) NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_leads" ON public.leads;
DROP POLICY IF EXISTS "Users can read own business leads" ON public.leads;
DROP POLICY IF EXISTS "Users can read leads from their business" ON public.leads;
DROP POLICY IF EXISTS "insert_own_leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads for their business" ON public.leads;
DROP POLICY IF EXISTS "update_own_leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their business" ON public.leads;
DROP POLICY IF EXISTS "delete_own_leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their business" ON public.leads;

CREATE POLICY "Users can read leads from their business" ON public.leads FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = leads.business_id
  ));
CREATE POLICY "Users can create leads for their business" ON public.leads FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = leads.business_id
  ));
CREATE POLICY "Users can update leads in their business" ON public.leads FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = leads.business_id
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = leads.business_id
  ));
CREATE POLICY "Users can delete leads in their business" ON public.leads FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = leads.business_id
  ));

DROP POLICY IF EXISTS "select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can read appointments in their business" ON public.appointments;
DROP POLICY IF EXISTS "insert_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments for their business" ON public.appointments;
DROP POLICY IF EXISTS "update_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update appointments in their business" ON public.appointments;
DROP POLICY IF EXISTS "delete_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete appointments in their business" ON public.appointments;

CREATE POLICY "Users can read appointments in their business" ON public.appointments FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = appointments.business_id
  ));
CREATE POLICY "Users can create appointments for their business" ON public.appointments FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = appointments.business_id
  ));
CREATE POLICY "Users can update appointments in their business" ON public.appointments FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = appointments.business_id
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = appointments.business_id
  ));
CREATE POLICY "Users can delete appointments in their business" ON public.appointments FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_businesses ub
    WHERE ub.user_id = auth.uid() AND ub.business_id = appointments.business_id
  ));

CREATE INDEX IF NOT EXISTS leads_business_id_idx ON public.leads (business_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS appointments_business_id_idx ON public.appointments (business_id);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON public.appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments (status);
