begin;

-- Policy RLS INSERT untuk profiles.
-- Diperlukan agar fallback "buat baris profil saat belum ada" pada
-- db.updateProfile (src/services/db.js) bisa berfungsi dari sisi client.
-- Kasus ini terjadi misalnya pada user yang terdaftar sebelum trigger
-- handle_new_user dipasang sehingga belum punya baris di public.profiles.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Trigger untuk memastikan user biasa tidak bisa membuat baris profil dengan
-- role admin/manager lewat policy INSERT di atas (pencegahan eskalasi role).
create or replace function public.prevent_profile_admin_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() != 'service_role' and not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    new.role := 'guest';
  end if;
  return new;
end;
$$;

drop trigger if exists check_profile_admin_insert on public.profiles;
create trigger check_profile_admin_insert
  before insert on public.profiles
  for each row execute function public.prevent_profile_admin_insert();

commit;
