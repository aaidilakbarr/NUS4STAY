begin;

create extension if not exists pgcrypto;

-- The project already has a profiles table in some environments. This makes
-- the migration safe for a fresh Supabase project as well.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('guest', 'admin', 'manager'))
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'guest';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('guest', 'admin', 'manager'));
  end if;
end;
$$;

alter table public.rooms add column if not exists inventory_count integer not null default 1;
alter table public.rooms add column if not exists max_guests integer not null default 2;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rooms_inventory_count_check'
      and conrelid = 'public.rooms'::regclass
  ) then
    alter table public.rooms
      add constraint rooms_inventory_count_check check (inventory_count > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'rooms_max_guests_check'
      and conrelid = 'public.rooms'::regclass
  ) then
    alter table public.rooms
      add constraint rooms_max_guests_check check (max_guests > 0);
  end if;
end;
$$;

create table if not exists public.room_availability (
  room_id uuid not null references public.rooms(id) on delete cascade,
  stay_date date not null,
  total_units integer not null,
  available_units integer not null,
  updated_at timestamptz not null default now(),
  primary key (room_id, stay_date),
  constraint room_availability_total_units_check check (total_units > 0),
  constraint room_availability_available_units_check check (
    available_units >= 0 and available_units <= total_units
  )
);

create index if not exists idx_room_availability_stay_date
  on public.room_availability(stay_date);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.room_availability;
create trigger set_updated_at
before update on public.room_availability
for each row execute function public.handle_updated_at();

-- The old bookings table used a text primary key called id. Keep it as a
-- legacy compatibility key while all new code uses booking_id UUID.
alter table public.bookings add column if not exists booking_id uuid;
update public.bookings
set booking_id = gen_random_uuid()
where booking_id is null;
alter table public.bookings alter column booking_id set default gen_random_uuid();
alter table public.bookings alter column booking_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_booking_id_key'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_booking_id_key unique (booking_id);
  end if;
end;
$$;

alter table public.bookings add column if not exists booking_code text;
update public.bookings
set booking_code = coalesce(nullif(id, ''), 'LEGACY-' || booking_id::text)
where booking_code is null;
alter table public.bookings alter column booking_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_booking_code_key'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_booking_code_key unique (booking_code);
  end if;
end;
$$;

alter table public.bookings add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists guest_count integer;
alter table public.bookings add column if not exists unit_price numeric(14, 2);
alter table public.bookings add column if not exists night_count integer;
alter table public.bookings add column if not exists booking_status text;
alter table public.bookings add column if not exists payment_status text;
alter table public.bookings add column if not exists expires_at timestamptz;
alter table public.bookings add column if not exists expired_at timestamptz;
alter table public.bookings add column if not exists inventory_released_at timestamptz;
alter table public.bookings add column if not exists idempotency_key uuid;
alter table public.bookings add column if not exists paid_at timestamptz;
alter table public.bookings add column if not exists cancelled_at timestamptz;

alter table public.bookings
  alter column total_price type numeric(14, 2)
  using total_price::numeric;

update public.bookings
set guest_count = coalesce(
  nullif(regexp_replace(coalesce(guests, ''), '[^0-9]', '', 'g'), '')::integer,
  1
)
where guest_count is null;

update public.bookings
set night_count = greatest(check_out - check_in, 1)
where night_count is null;

update public.bookings
set unit_price = case
  when night_count > 0 then total_price::numeric / night_count
  else total_price::numeric
end
where unit_price is null;

update public.bookings
set booking_status = case lower(coalesce(status, 'pending'))
  when 'confirmed' then 'confirmed'
  when 'cancelled' then 'cancelled'
  when 'expired' then 'expired'
  else 'pending_payment'
end
where booking_status is null;

update public.bookings
set payment_status = case booking_status
  when 'confirmed' then 'paid'
  when 'cancelled' then 'rejected'
  else 'unpaid'
end
where payment_status is null;

update public.bookings
set expires_at = created_at + interval '30 minutes'
where expires_at is null and booking_status = 'pending_payment';

alter table public.bookings alter column guest_count set default 1;
alter table public.bookings alter column guest_count set not null;
alter table public.bookings alter column unit_price set default 0;
alter table public.bookings alter column unit_price set not null;
alter table public.bookings alter column night_count set default 1;
alter table public.bookings alter column night_count set not null;
alter table public.bookings alter column booking_status set default 'pending_payment';
alter table public.bookings alter column booking_status set not null;
alter table public.bookings alter column payment_status set default 'unpaid';
alter table public.bookings alter column payment_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_dates_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_dates_check check (check_out > check_in);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_guest_count_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_guest_count_check check (guest_count > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_night_count_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_night_count_check check (night_count > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_booking_status_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_booking_status_check check (
        booking_status in ('pending_payment', 'payment_review', 'confirmed', 'expired', 'cancelled')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_payment_status_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_payment_status_check check (
        payment_status in ('unpaid', 'submitted', 'paid', 'rejected', 'late_payment')
      );
  end if;
end;
$$;

create index if not exists idx_bookings_expiry
  on public.bookings(expires_at)
  where booking_status = 'pending_payment';

create index if not exists idx_bookings_room_dates
  on public.bookings(room_id, check_in, check_out);

create index if not exists idx_bookings_user_created_at
  on public.bookings(user_id, created_at desc);

create unique index if not exists idx_bookings_user_idempotency
  on public.bookings(user_id, idempotency_key)
  where user_id is not null and idempotency_key is not null;

drop trigger if exists set_updated_at on public.bookings;
create trigger set_updated_at
before update on public.bookings
for each row execute function public.handle_updated_at();

create table if not exists public.payments (
  booking_id uuid primary key references public.bookings(booking_id) on delete cascade,
  status text not null default 'unpaid',
  proof_url text,
  provider_event_id text unique,
  submitted_at timestamptz,
  paid_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_check check (
    status in ('unpaid', 'submitted', 'paid', 'rejected', 'late_payment')
  )
);

alter table public.payments add column if not exists proof_url text;
alter table public.payments add column if not exists provider_event_id text;
alter table public.payments add column if not exists submitted_at timestamptz;
alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.payments add column if not exists created_at timestamptz not null default now();
alter table public.payments add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at on public.payments;
create trigger set_updated_at
before update on public.payments
for each row execute function public.handle_updated_at();

-- Seed a concrete booking horizon. Missing rows are deliberately treated as
-- unavailable by create_booking(), never as unlimited inventory.
create or replace function public.seed_room_availability(p_horizon_days integer default 540)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted integer;
begin
  if p_horizon_days < 1 or p_horizon_days > 730 then
    raise exception using message = 'Invalid availability horizon', detail = 'INVALID_AVAILABILITY_HORIZON';
  end if;

  insert into public.room_availability (room_id, stay_date, total_units, available_units)
  select r.id, day::date, r.inventory_count, r.inventory_count
  from public.rooms r
  cross join generate_series(current_date, current_date + p_horizon_days, interval '1 day') as day
  where r.is_active = true
  on conflict (room_id, stay_date) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.seed_room_availability_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.room_availability (room_id, stay_date, total_units, available_units)
  select new.id, day::date, new.inventory_count, new.inventory_count
  from generate_series(current_date, current_date + 540, interval '1 day') as day
  on conflict (room_id, stay_date) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_room_availability_on_room_insert on public.rooms;
create trigger seed_room_availability_on_room_insert
after insert on public.rooms
for each row execute function public.seed_room_availability_after_insert();

select public.seed_room_availability(540);

commit;
