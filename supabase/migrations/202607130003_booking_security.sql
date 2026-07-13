begin;

alter table public.profiles enable row level security;
alter table public.room_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

revoke insert, update, delete on public.bookings from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.room_availability from anon, authenticated;

drop policy if exists "Guests can create own bookings" on public.bookings;
drop policy if exists "Guests can view own bookings" on public.bookings;
drop policy if exists "Admins can view all bookings" on public.bookings;
drop policy if exists "Admins can update bookings" on public.bookings;
drop policy if exists "Admins can delete bookings" on public.bookings;

create policy "Guests and staff can read permitted bookings"
on public.bookings
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_booking_staff()
);

-- There are intentionally no guest INSERT/UPDATE/DELETE policies on bookings.
-- Booking writes go through the RPCs below, where auth.uid() and transitions
-- are checked inside a transaction.

drop policy if exists "Guests can read own payments" on public.payments;
drop policy if exists "Staff can read all payments" on public.payments;

create policy "Guests and staff can read permitted payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.booking_id = payments.booking_id
      and (b.user_id = auth.uid() or public.is_booking_staff())
  )
);

drop policy if exists "Public can view room availability" on public.room_availability;
-- Availability counts are not exposed directly. Booking creation reads them
-- from a SECURITY DEFINER transaction, avoiding an inventory side channel.

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_booking_staff());

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "Guests can upload own payment proofs" on storage.objects;
create policy "Guests can upload own payment proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Guests can read own payment proofs" on storage.objects;
create policy "Guests can read own payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Staff can read payment proofs" on storage.objects;
create policy "Staff can read payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.is_booking_staff()
);

revoke all on function public.create_booking(uuid, date, date, integer, uuid) from public, anon;
grant execute on function public.create_booking(uuid, date, date, integer, uuid) to authenticated;

revoke all on function public.upload_payment_proof(uuid, text) from public, anon;
grant execute on function public.upload_payment_proof(uuid, text) to authenticated;

revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

revoke all on function public.approve_payment(uuid, text) from public, anon;
grant execute on function public.approve_payment(uuid, text) to authenticated, service_role;

revoke all on function public.reject_payment(uuid) from public, anon;
grant execute on function public.reject_payment(uuid) to authenticated, service_role;

revoke all on function public.expire_booking(uuid) from public, anon, authenticated;
grant execute on function public.expire_booking(uuid) to service_role;

revoke all on function public.expire_pending_bookings(integer) from public, anon, authenticated;
grant execute on function public.expire_pending_bookings(integer) to service_role;

revoke all on function public.release_booking_inventory(uuid) from public, anon, authenticated, service_role;
revoke all on function public.generate_booking_code() from public, anon, authenticated, service_role;
revoke all on function public.booking_error(text, text) from public, anon, authenticated, service_role;
revoke all on function public.is_booking_staff() from public, anon, authenticated, service_role;
revoke all on function public.is_booking_admin() from public, anon, authenticated, service_role;
revoke all on function public.seed_room_availability(integer) from public, anon, authenticated;
revoke all on function public.seed_room_availability_after_insert() from public, anon, authenticated, service_role;
revoke all on function public.get_server_time() from public, anon;
grant execute on function public.get_server_time() to authenticated;

commit;
