ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('requested', 'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show'));
