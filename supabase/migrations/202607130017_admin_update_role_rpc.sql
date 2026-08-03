-- Create admin_update_user_role RPC to securely allow admins to update user roles
begin;

create or replace function public.admin_update_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_booking_admin() then
    raise exception 'Unauthorized: Only admins can change user roles.';
  end if;

  if p_role not in ('guest', 'admin', 'manager') then
    raise exception 'Invalid role: must be guest, admin, or manager.';
  end if;

  update public.profiles
  set role = p_role,
      updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_update_user_role(uuid, text) from public, anon;
grant execute on function public.admin_update_user_role(uuid, text) to authenticated;

commit;
