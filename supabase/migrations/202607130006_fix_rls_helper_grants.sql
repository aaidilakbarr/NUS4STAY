begin;

-- These helpers are used inside RLS policies. They only return a boolean and
-- do not mutate data, so authenticated users must be allowed to execute them
-- for profile/property/booking reads to work.
grant execute on function public.is_booking_staff() to authenticated;
grant execute on function public.is_booking_admin() to authenticated;

commit;
