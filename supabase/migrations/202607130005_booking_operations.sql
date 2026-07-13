begin;

create table if not exists public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(booking_id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint booking_events_type_check check (
    event_type in ('created', 'payment_review', 'confirmed', 'expired', 'cancelled', 'payment_rejected', 'late_payment')
  )
);

create index if not exists idx_booking_events_booking_created
  on public.booking_events(booking_id, created_at desc);
create index if not exists idx_booking_events_type_created
  on public.booking_events(event_type, created_at desc);

create or replace function public.record_booking_state_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_type text;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'created';
  elsif new.booking_status is distinct from old.booking_status then
    v_event_type := case new.booking_status
      when 'payment_review' then 'payment_review'
      when 'confirmed' then 'confirmed'
      when 'expired' then 'expired'
      when 'cancelled' then 'cancelled'
      else null
    end;
  elsif new.payment_status is distinct from old.payment_status then
    v_event_type := case new.payment_status
      when 'rejected' then 'payment_rejected'
      when 'late_payment' then 'late_payment'
      else null
    end;
  end if;

  if v_event_type is not null then
    insert into public.booking_events (booking_id, event_type, actor_id, metadata)
    values (
      new.booking_id,
      v_event_type,
      auth.uid(),
      jsonb_build_object(
        'booking_status', new.booking_status,
        'payment_status', new.payment_status,
        'previous_booking_status', case when tg_op = 'UPDATE' then old.booking_status else null end,
        'previous_payment_status', case when tg_op = 'UPDATE' then old.payment_status else null end
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists record_booking_state_event on public.bookings;
create trigger record_booking_state_event
after insert or update of booking_status, payment_status on public.bookings
for each row execute function public.record_booking_state_event();

create or replace function public.reconcile_room_inventory()
returns table (
  room_id uuid,
  stay_date date,
  total_units integer,
  recorded_available_units integer,
  expected_available_units integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    availability.room_id,
    availability.stay_date,
    availability.total_units,
    availability.available_units,
    greatest(
      0,
      availability.total_units - count(bookings.booking_id)::integer
    ) as expected_available_units
  from public.room_availability availability
  left join public.bookings bookings
    on bookings.room_id = availability.room_id
    and bookings.check_in <= availability.stay_date
    and bookings.check_out > availability.stay_date
    and bookings.booking_status in ('pending_payment', 'payment_review', 'confirmed')
    and bookings.inventory_released_at is null
  group by availability.room_id, availability.stay_date,
    availability.total_units, availability.available_units
  having availability.available_units <> greatest(
    0,
    availability.total_units - count(bookings.booking_id)::integer
  )
  order by availability.stay_date, availability.room_id;
$$;

create or replace function public.booking_operations_snapshot()
returns table (
  overdue_pending_count bigint,
  oldest_overdue_at timestamptz,
  unreleased_terminal_count bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    count(*) filter (
      where booking_status = 'pending_payment'
        and payment_status in ('unpaid', 'rejected')
        and expires_at <= now()
        and inventory_released_at is null
    ),
    min(expires_at) filter (
      where booking_status = 'pending_payment'
        and payment_status in ('unpaid', 'rejected')
        and expires_at <= now()
        and inventory_released_at is null
    ),
    count(*) filter (
      where booking_status in ('expired', 'cancelled')
        and inventory_released_at is null
    )
  from public.bookings;
$$;

alter table public.booking_events enable row level security;
drop policy if exists "Staff can read booking events" on public.booking_events;
create policy "Staff can read booking events"
on public.booking_events
for select to authenticated
using (public.is_booking_staff());

revoke insert, update, delete on public.booking_events from anon, authenticated;
revoke all on function public.reconcile_room_inventory() from public, anon, authenticated;
grant execute on function public.reconcile_room_inventory() to service_role;
revoke all on function public.booking_operations_snapshot() from public, anon, authenticated;
grant execute on function public.booking_operations_snapshot() to service_role;
revoke all on function public.record_booking_state_event() from public, anon, authenticated, service_role;

commit;
