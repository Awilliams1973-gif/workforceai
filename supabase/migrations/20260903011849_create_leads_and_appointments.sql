/*
# Create leads and appointments tables (retry)

1. New Tables
- `leads` — owner-scoped lead records (name, phone, email, service, source, status, value, notes, next_follow_up)
- `appointments` — owner-scoped appointment records (customer_name, phone, service, date, time, status, notes)

2. Security
- RLS enabled on both tables with owner-scoped CRUD (auth.uid() = user_id).
- user_id defaults to auth.uid().

3. Important Notes
- Idempotent: uses IF NOT EXISTS for tables and indexes, DROP POLICY IF EXISTS before CREATE.
- No existing data is modified.
*/

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'AI Receptionist',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  value numeric(12, 2) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  next_follow_up text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_leads" ON public.leads;
CREATE POLICY "select_own_leads" ON public.leads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_leads" ON public.leads;
CREATE POLICY "insert_own_leads" ON public.leads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_leads" ON public.leads;
CREATE POLICY "update_own_leads" ON public.leads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_leads" ON public.leads;
CREATE POLICY "delete_own_leads" ON public.leads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON public.appointments;
CREATE POLICY "select_own_appointments" ON public.appointments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_appointments" ON public.appointments;
CREATE POLICY "insert_own_appointments" ON public.appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_appointments" ON public.appointments;
CREATE POLICY "update_own_appointments" ON public.appointments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON public.appointments;
CREATE POLICY "delete_own_appointments" ON public.appointments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments (user_id);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON public.appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments (status);
