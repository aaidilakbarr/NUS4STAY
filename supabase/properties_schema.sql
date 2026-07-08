create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  location text not null,
  region text not null,
  price bigint not null default 0,
  rating numeric(3,2) not null default 0.00,
  image text,
  description text,
  amenities text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_region on public.properties(region);
create index if not exists idx_properties_is_active on public.properties(is_active);
create index if not exists idx_properties_slug on public.properties(slug);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  price bigint not null default 0,
  image text,
  description text,
  amenities text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_property_id on public.rooms(property_id);
create index if not exists idx_rooms_is_active on public.rooms(is_active);

alter table public.properties enable row level security;
alter table public.rooms enable row level security;

create policy "Anyone can view active properties"
on public.properties
for select
to public
using (is_active = true);

create policy "Admins can view all properties"
on public.properties
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Managers can view all properties read only"
on public.properties
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'manager')
  )
);

create policy "Admins can insert properties"
on public.properties
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can update properties"
on public.properties
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can delete properties"
on public.properties
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Anyone can view active rooms"
on public.rooms
for select
to public
using (is_active = true);

create policy "Admins can manage rooms"
on public.rooms
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.properties;
create trigger set_updated_at
before update on public.properties
for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.rooms;
create trigger set_updated_at
before update on public.rooms
for each row execute function public.handle_updated_at();

create or replace function public.generate_property_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(new.name, '[^a-zA-Z0-9]+', '-', 'g'));
    new.slug := regexp_replace(new.slug, '^-+|-+$', '', 'g');
  end if;
  return new;
end;
$$;

drop trigger if exists set_property_slug on public.properties;
create trigger set_property_slug
before insert or update on public.properties
for each row execute function public.generate_property_slug();
