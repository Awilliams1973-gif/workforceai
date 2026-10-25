-- The always-false SELECT policy was redundant for authenticated users and
-- overlapped with admin_audit_select. Scope it to anon so only one permissive
-- SELECT policy applies per role.
drop policy if exists "public_audit_select_denied" on public.business_audit_submissions;

create policy "public_audit_select_denied"
  on public.business_audit_submissions
  for select
  to anon
  using (false);
