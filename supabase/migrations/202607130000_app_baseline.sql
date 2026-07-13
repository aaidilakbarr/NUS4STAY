begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'guest';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  location text not null,
  region text not null,
  price bigint not null default 0,
  rating numeric(3, 2) not null default 0.00,
  image text,
  images text[] not null default '{}',
  description text,
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties add column if not exists images text[] not null default '{}';

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  price bigint not null default 0,
  image text,
  description text,
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  guests text,
  total_price bigint not null default 0,
  status text not null default 'Pending',
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_region on public.properties(region);
create index if not exists idx_properties_is_active on public.properties(is_active);
create index if not exists idx_rooms_property_id on public.rooms(property_id);
create index if not exists idx_rooms_is_active on public.rooms(is_active);
create index if not exists idx_bookings_property_id on public.bookings(property_id);
create index if not exists idx_bookings_status on public.bookings(status);

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

create or replace function public.generate_property_slug()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(new.name, '[^a-zA-Z0-9]+', '-', 'g'));
    new.slug := regexp_replace(new.slug, '^-+|-+$', '', 'g');
  end if;
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.properties;
create trigger set_updated_at before update on public.properties
for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.rooms;
create trigger set_updated_at before update on public.rooms
for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.bookings;
create trigger set_updated_at before update on public.bookings
for each row execute function public.handle_updated_at();

drop trigger if exists set_property_slug on public.properties;
create trigger set_property_slug before insert or update on public.properties
for each row execute function public.generate_property_slug();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "Anyone can view active properties" on public.properties;
create policy "Anyone can view active properties" on public.properties
for select to public using (is_active = true);

drop policy if exists "Admins can view all properties" on public.properties;
create policy "Admins can view all properties" on public.properties
for select to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Managers can view all properties read only" on public.properties;
create policy "Managers can view all properties read only" on public.properties
for select to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties" on public.properties
for insert to authenticated with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties" on public.properties
for update to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties" on public.properties
for delete to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Anyone can view active rooms" on public.rooms;
create policy "Anyone can view active rooms" on public.rooms
for select to public using (is_active = true);

drop policy if exists "Admins can manage rooms" on public.rooms;
create policy "Admins can manage rooms" on public.rooms
for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view property images" on storage.objects;
create policy "Public can view property images" on storage.objects
for select to public using (bucket_id = 'property-images');

drop policy if exists "Admins can upload property images" on storage.objects;
create policy "Admins can upload property images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'property-images'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update property images" on storage.objects;
create policy "Admins can update property images" on storage.objects
for update to authenticated using (
  bucket_id = 'property-images'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete property images" on storage.objects;
create policy "Admins can delete property images" on storage.objects
for delete to authenticated using (
  bucket_id = 'property-images'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

commit;
