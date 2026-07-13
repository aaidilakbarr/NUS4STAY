begin;

create or replace function public.generate_booking_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  loop
    v_code := 'N4-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS')
      || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.bookings where booking_code = v_code
    );
  end loop;
  return v_code;
end;
$$;

commit;
