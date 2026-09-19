/*
# Create business audit submissions

1. New Tables
- `business_audit_submissions`
- `id` (uuid, primary key): unique submission identifier.
- `name` (text): contact name provided by the visitor.
- `business_name` (text): business name provided by the visitor.
- `email` (text): contact email for the opportunity report.
- `phone` (text): optional contact phone number.
- `website` (text): optional business website.
- `industry` (text): selected local service industry.
- `monthly_inquiries` (integer): estimated monthly customer inquiries.
- `unanswered_inquiries` (integer): estimated unanswered inquiries.
- `average_customer_value` (numeric): estimated average customer value.
- `estimated_opportunity` (numeric): illustrative calculated opportunity.
- `created_at` (timestamptz): submission time.

2. Security
- Row level security is enabled.
- Anonymous visitors may submit an audit.
- Submitted audit details are not readable or editable through the public browser client.
- Authenticated access is also denied until an internal review workflow is intentionally added.

3. Important Notes
- This table stores lead-generation submissions only; it does not make revenue guarantees.
- No existing tables or user data are modified.
*/

CREATE TABLE IF NOT EXISTS public.business_audit_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  industry text NOT NULL,
  monthly_inquiries integer NOT NULL CHECK (monthly_inquiries >= 0),
  unanswered_inquiries integer NOT NULL CHECK (unanswered_inquiries >= 0),
  average_customer_value numeric(12, 2) NOT NULL CHECK (average_customer_value >= 0),
  estimated_opportunity numeric(14, 2) NOT NULL CHECK (estimated_opportunity >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_audit_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_audit_select_denied" ON public.business_audit_submissions;
CREATE POLICY "public_audit_select_denied"
  ON public.business_audit_submissions FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "public_audit_insert" ON public.business_audit_submissions;
CREATE POLICY "public_audit_insert"
  ON public.business_audit_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_audit_update_denied" ON public.business_audit_submissions;
CREATE POLICY "public_audit_update_denied"
  ON public.business_audit_submissions FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "public_audit_delete_denied" ON public.business_audit_submissions;
CREATE POLICY "public_audit_delete_denied"
  ON public.business_audit_submissions FOR DELETE
  TO anon, authenticated
  USING (false);

CREATE INDEX IF NOT EXISTS business_audit_submissions_created_at_idx
  ON public.business_audit_submissions (created_at DESC);
