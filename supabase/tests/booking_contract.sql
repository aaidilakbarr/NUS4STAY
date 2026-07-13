-- Run this file against the target Supabase database after applying the
-- migrations. It is intentionally read-only and can be used in CI or the
-- Supabase SQL editor when pgTAP is not enabled.

select 'room_availability has a composite primary key' as check_name,
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.room_availability'::regclass
      and contype = 'p'
      and conname = 'room_availability_pkey'
  ) as passed;

select 'booking_id and booking_code are unique' as check_name,
  exists (select 1 from pg_constraint where conname = 'bookings_booking_id_key')
  and exists (select 1 from pg_constraint where conname = 'bookings_booking_code_key') as passed;

select 'guest direct booking insert is not granted' as check_name,
  not has_table_privilege('authenticated', 'public.bookings', 'INSERT') as passed;

select 'create_booking is executable by authenticated only' as check_name,
  has_function_privilege('authenticated', 'public.create_booking(uuid,date,date,integer,uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.create_booking(uuid,date,date,integer,uuid)', 'EXECUTE') as passed;

select 'expiry index exists' as check_name,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_bookings_expiry'
  ) as passed;

select 'booking events capture state changes' as check_name,
  to_regclass('public.booking_events') is not null
  and exists (
    select 1 from pg_trigger
    where tgrelid = 'public.bookings'::regclass
      and tgname = 'record_booking_state_event'
  ) as passed;

select 'inventory reconciliation function is service-only' as check_name,
  has_function_privilege('service_role', 'public.reconcile_room_inventory()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.reconcile_room_inventory()', 'EXECUTE') as passed;

-- Concurrency test procedure (run in two authenticated sessions):
--   select public.create_booking(:room_id, :check_in, :check_out, 1, gen_random_uuid());
-- With one available unit exactly one session must return ROOM_UNAVAILABLE.
