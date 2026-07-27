begin;

-- Function trigger untuk otomatis membuat profil saat user baru terdaftar di auth.users (Temuan A1)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    'guest'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Policy RLS UPDATE untuk profiles (Temuan A2)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Trigger untuk mencegah user non-admin mengubah role profil mereka sendiri (Temuan A1/C1 protection)
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    if auth.role() != 'service_role' and not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Changing user role is not permitted.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists check_profile_role_change on public.profiles;
create trigger check_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

commit;
