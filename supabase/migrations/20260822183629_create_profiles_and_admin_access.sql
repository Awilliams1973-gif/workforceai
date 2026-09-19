/*
# Create profiles table and admin access to audit submissions

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users): links to the authenticated user.
  - `email` (text): the user's email address, copied from auth on signup.
  - `full_name` (text, optional): display name for the user.
  - `is_admin` (boolean, default false): whether this user can view audit submissions and manage the app.
  - `created_at` (timestamptz): when the profile was created.

2. Automation
- A trigger function `handle_new_user()` runs whenever a new row is inserted into `auth.users`.
- It creates a matching `profiles` row with the user's email.
- The very first user to sign up is automatically made admin (`is_admin = true`).
- Subsequent users get `is_admin = false`.

3. Security
- RLS enabled on `profiles`.
- Users can read and update their own profile row.
- Users cannot set their own `is_admin` flag (admin status is only granted by the trigger or by another admin via SQL).
- The `business_audit_submissions` table gets a new SELECT policy allowing admin users to read all audit submissions.
- The existing public deny policy remains so non-admin visitors still cannot read submissions.

4. Important Notes
- This migration does not modify or delete any existing data.
- The first user who signs up becomes the admin automatically. If you need additional admins, update `profiles` via SQL.
- Email/password auth is used; email confirmation stays OFF.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but not is_admin — enforced by column privilege)
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile row (trigger handles this, but policy allows it as fallback)
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Prevent users from updating is_admin via column-level privilege
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email) ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- Trigger: auto-create profile on signup, first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    (SELECT COUNT(*) = 0 FROM public.profiles)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow admin users to read audit submissions
DROP POLICY IF EXISTS "admin_audit_select" ON public.business_audit_submissions;
CREATE POLICY "admin_audit_select"
  ON public.business_audit_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
