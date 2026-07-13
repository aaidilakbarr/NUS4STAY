begin;

create or replace function public.booking_error(p_code text, p_message text default null)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception using
    message = coalesce(p_message, p_code),
    detail = p_code,
    hint = 'NUS4STAY_BOOKING_ERROR';
end;
$$;

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
      || '-' || upper(encode(gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1 from public.bookings where booking_code = v_code
    );
  end loop;
  return v_code;
end;
$$;

create or replace function public.is_booking_staff()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('admin', 'manager')
    );
$$;

create or replace function public.is_booking_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
set search_path = public, pg_temp
as $$
  select now();
$$;

create or replace function public.release_booking_inventory(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
  v_room public.rooms%rowtype;
  v_availability public.room_availability%rowtype;
  v_rows integer;
begin
  select * into v_booking
  from public.bookings
  where booking_id = p_booking_id
  for update;

  if not found or v_booking.inventory_released_at is not null then
    return false;
  end if;

  if v_booking.booking_status not in ('pending_payment', 'payment_review') then
    return false;
  end if;

  select * into v_room
  from public.rooms
  where id = v_booking.room_id
  for update;

  if not found then
    perform public.booking_error('ROOM_NOT_FOUND');
  end if;

  select count(*) into v_rows
  from public.room_availability
  where room_id = v_booking.room_id
    and stay_date >= v_booking.check_in
    and stay_date < v_booking.check_out;

  if v_rows <> v_booking.night_count then
    perform public.booking_error('AVAILABILITY_NOT_INITIALIZED');
  end if;

  for v_availability in
    select *
    from public.room_availability
    where room_id = v_booking.room_id
      and stay_date >= v_booking.check_in
      and stay_date < v_booking.check_out
    order by stay_date
    for update
  loop
    update public.room_availability
    set available_units = least(total_units, available_units + 1),
        updated_at = now()
    where room_id = v_availability.room_id
      and stay_date = v_availability.stay_date;
  end loop;

  update public.bookings
  set inventory_released_at = coalesce(inventory_released_at, now()),
      updated_at = now()
  where booking_id = p_booking_id;

  return true;
end;
$$;

create or replace function public.expire_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
  from public.bookings
  where booking_id = p_booking_id
  for update;

  if not found
    or v_booking.inventory_released_at is not null
    or v_booking.booking_status <> 'pending_payment'
    or v_booking.payment_status not in ('unpaid', 'rejected')
    or v_booking.expires_at is null
    or v_booking.expires_at > now() then
    return false;
  end if;

  perform public.release_booking_inventory(p_booking_id);

  update public.bookings
  set booking_status = 'expired',
      status = 'Expired',
      expired_at = coalesce(expired_at, now()),
      updated_at = now()
  where booking_id = p_booking_id;

  return true;
end;
$$;

create or replace function public.create_booking(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_count integer,
  p_idempotency_key uuid
)
returns table (
  booking_id uuid,
  booking_code text,
  booking_status text,
  payment_status text,
  expires_at timestamptz,
  unit_price numeric,
  night_count integer,
  total_price numeric,
  check_in date,
  check_out date,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.bookings%rowtype;
  v_room public.rooms%rowtype;
  v_availability public.room_availability%rowtype;
  v_code text;
  v_guest_email text;
  v_guest_name text;
  v_guest_phone text;
  v_nights integer;
  v_updated_rows integer;
begin
  if v_user_id is null then
    perform public.booking_error('AUTH_REQUIRED');
  end if;

  if p_idempotency_key is null then
    perform public.booking_error('INVALID_IDEMPOTENCY_KEY');
  end if;

  -- Serialize retries for the same user/key before the initial lookup. This
  -- makes a concurrent duplicate return the original booking instead of a
  -- unique-constraint error.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_idempotency_key::text, 0)
  );

  select * into v_existing
  from public.bookings
  where user_id = v_user_id
    and idempotency_key = p_idempotency_key
  for update;

  if found then
    return query
    select v_existing.booking_id, v_existing.booking_code,
      v_existing.booking_status, v_existing.payment_status,
      v_existing.expires_at, v_existing.unit_price, v_existing.night_count,
      v_existing.total_price::numeric, v_existing.check_in, v_existing.check_out,
      clock_timestamp();
    return;
  end if;

  if p_check_in is null or p_check_out is null or p_check_in < current_date
    or p_check_out <= p_check_in then
    perform public.booking_error('INVALID_DATE_RANGE');
  end if;

  v_nights := p_check_out - p_check_in;
  if v_nights > 30 then
    perform public.booking_error('INVALID_DATE_RANGE', 'Maksimum masa menginap adalah 30 malam.');
  end if;

  if p_guest_count is null or p_guest_count < 1 then
    perform public.booking_error('GUEST_LIMIT_EXCEEDED');
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    perform public.booking_error('ROOM_NOT_FOUND');
  end if;

  if not v_room.is_active then
    perform public.booking_error('ROOM_INACTIVE');
  end if;

  if p_guest_count > v_room.max_guests then
    perform public.booking_error('GUEST_LIMIT_EXCEEDED');
  end if;

  -- Expire due holds for this room while the room lock is already held. The
  -- SKIP LOCKED clause avoids a booking/room lock inversion with the worker.
  for v_existing in
    select *
    from public.bookings
    where room_id = p_room_id
      and booking_status = 'pending_payment'
      and payment_status in ('unpaid', 'rejected')
      and expires_at <= now()
      and inventory_released_at is null
    order by expires_at
    for update skip locked
  loop
    perform public.expire_booking(v_existing.booking_id);
  end loop;

  -- Lock every consumed night in deterministic date order.
  for v_availability in
    select *
    from public.room_availability
    where room_id = p_room_id
      and stay_date >= p_check_in
      and stay_date < p_check_out
    order by stay_date
    for update
  loop
    if v_availability.available_units < 1 then
      perform public.booking_error('ROOM_UNAVAILABLE');
    end if;
  end loop;

  if (
    select count(*)
    from public.room_availability
    where room_id = p_room_id
      and stay_date >= p_check_in
      and stay_date < p_check_out
  ) <> v_nights then
    perform public.booking_error('AVAILABILITY_NOT_INITIALIZED');
  end if;

  v_code := public.generate_booking_code();
  v_guest_email := nullif(auth.jwt() ->> 'email', '');
  v_guest_name := coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), v_guest_email, 'Guest');
  v_guest_phone := nullif(auth.jwt() -> 'user_metadata' ->> 'phone', '');

  insert into public.bookings (
    id,
    booking_id,
    booking_code,
    user_id,
    property_id,
    room_id,
    guest_name,
    guest_email,
    guest_phone,
    check_in,
    check_out,
    guests,
    guest_count,
    unit_price,
    night_count,
    total_price,
    status,
    booking_status,
    payment_status,
    payment_method,
    expires_at,
    idempotency_key
  )
  values (
    v_code,
    gen_random_uuid(),
    v_code,
    v_user_id,
    v_room.property_id,
    v_room.id,
    v_guest_name,
    coalesce(v_guest_email, 'unknown@nus4stay.invalid'),
    v_guest_phone,
    p_check_in,
    p_check_out,
    p_guest_count || ' Tamu',
    p_guest_count,
    v_room.price,
    v_nights,
    v_room.price * v_nights,
    'Pending',
    'pending_payment',
    'unpaid',
    'transfer',
    now() + interval '30 minutes',
    p_idempotency_key
  )
  returning * into v_existing;

  update public.room_availability
  set available_units = available_units - 1,
      updated_at = now()
  where room_id = p_room_id
    and stay_date >= p_check_in
    and stay_date < p_check_out
    and available_units > 0;

  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> v_nights then
    perform public.booking_error('ROOM_UNAVAILABLE');
  end if;

  return query
  select v_existing.booking_id, v_existing.booking_code,
    v_existing.booking_status, v_existing.payment_status,
    v_existing.expires_at, v_existing.unit_price, v_existing.night_count,
    v_existing.total_price::numeric, v_existing.check_in, v_existing.check_out,
    clock_timestamp();
end;
$$;

create or replace function public.expire_pending_bookings(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking_id uuid;
  v_expired integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 1000));
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin') then
    perform public.booking_error('FORBIDDEN');
  end if;

  for v_booking_id in
    select booking_id
    from public.bookings
    where booking_status = 'pending_payment'
      and payment_status in ('unpaid', 'rejected')
      and expires_at <= now()
      and inventory_released_at is null
    order by expires_at
    for update skip locked
    limit v_limit
  loop
    if public.expire_booking(v_booking_id) then
      v_expired := v_expired + 1;
    end if;
  end loop;

  return v_expired;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns table (
  booking_id uuid,
  booking_code text,
  booking_status text,
  payment_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
  from public.bookings
  where public.bookings.booking_id = p_booking_id
  for update;

  if not found then
    perform public.booking_error('BOOKING_NOT_FOUND');
  end if;

  if v_booking.user_id is distinct from auth.uid() and not public.is_booking_admin() then
    perform public.booking_error('FORBIDDEN');
  end if;

  if v_booking.booking_status in ('expired', 'cancelled') then
    return query select v_booking.booking_id, v_booking.booking_code,
      v_booking.booking_status, v_booking.payment_status, v_booking.expires_at;
    return;
  end if;

  if v_booking.booking_status <> 'pending_payment'
    and v_booking.booking_status <> 'payment_review' then
    perform public.booking_error('INVALID_STATUS_TRANSITION');
  end if;

  perform public.release_booking_inventory(p_booking_id);

  update public.bookings
  set booking_status = 'cancelled',
      status = 'Cancelled',
      payment_status = case when payment_status = 'submitted' then 'rejected' else payment_status end,
      cancelled_at = coalesce(cancelled_at, now()),
      updated_at = now()
  where public.bookings.booking_id = p_booking_id
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at
  into booking_id, booking_code, booking_status, payment_status, expires_at;

  return next;
end;
$$;

create or replace function public.upload_payment_proof(
  p_booking_id uuid,
  p_proof_path text
)
returns table (
  booking_id uuid,
  booking_code text,
  booking_status text,
  payment_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    perform public.booking_error('AUTH_REQUIRED');
  end if;

  select * into v_booking
  from public.bookings
  where public.bookings.booking_id = p_booking_id
    and user_id = v_user_id
  for update;

  if not found then
    perform public.booking_error('BOOKING_NOT_FOUND');
  end if;

  if p_proof_path is null or p_proof_path !~ (
    '^' || v_user_id::text || '/' || p_booking_id::text || '/[^/]+$'
  ) then
    perform public.booking_error('INVALID_PAYMENT_PROOF_PATH');
  end if;

  if v_booking.booking_status not in ('pending_payment', 'payment_review')
    or v_booking.payment_status = 'paid' then
    perform public.booking_error('INVALID_STATUS_TRANSITION');
  end if;

  if v_booking.expires_at is null or v_booking.expires_at <= now() then
    perform public.booking_error('BOOKING_EXPIRED');
  end if;

  insert into public.payments (booking_id, status, proof_url, submitted_at)
  values (p_booking_id, 'submitted', p_proof_path, now())
  on conflict (booking_id) do update
  set status = 'submitted', proof_url = excluded.proof_url,
      submitted_at = excluded.submitted_at, updated_at = now();

  update public.bookings
  set booking_status = 'payment_review',
      payment_status = 'submitted',
      updated_at = now()
  where public.bookings.booking_id = p_booking_id
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at
  into booking_id, booking_code, booking_status, payment_status, expires_at;

  return next;
end;
$$;

create or replace function public.approve_payment(
  p_booking_id uuid,
  p_provider_event_id text default null
)
returns table (
  booking_id uuid,
  booking_code text,
  booking_status text,
  payment_status text,
  expires_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
  v_duplicate uuid;
begin
  if not public.is_booking_admin() then
    perform public.booking_error('FORBIDDEN');
  end if;

  if p_provider_event_id is not null then
    select payments.booking_id into v_duplicate
    from public.payments
    where provider_event_id = p_provider_event_id
      and payments.booking_id <> p_booking_id;
    if found then
      perform public.booking_error('PAYMENT_ALREADY_PROCESSED');
    end if;
  end if;

  select * into v_booking
  from public.bookings
  where public.bookings.booking_id = p_booking_id
  for update;

  if not found then
    perform public.booking_error('BOOKING_NOT_FOUND');
  end if;

  if v_booking.booking_status = 'confirmed' and v_booking.payment_status = 'paid' then
    return query select v_booking.booking_id, v_booking.booking_code,
      v_booking.booking_status, v_booking.payment_status, v_booking.expires_at,
      v_booking.paid_at;
    return;
  end if;

  if v_booking.booking_status = 'expired' or v_booking.expires_at <= now() then
    if v_booking.booking_status = 'pending_payment' then
      perform public.expire_booking(p_booking_id);
    end if;
    update public.bookings
    set payment_status = 'late_payment', updated_at = now()
    where public.bookings.booking_id = p_booking_id;
    insert into public.payments (booking_id, status, provider_event_id, reviewed_at, reviewed_by)
    values (p_booking_id, 'late_payment', p_provider_event_id, now(), auth.uid())
    on conflict (booking_id) do update
    set status = 'late_payment', provider_event_id = coalesce(excluded.provider_event_id, payments.provider_event_id),
        reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now();
    select * into v_booking
    from public.bookings
    where public.bookings.booking_id = p_booking_id;
    return query select v_booking.booking_id, v_booking.booking_code,
      v_booking.booking_status, v_booking.payment_status, v_booking.expires_at,
      v_booking.paid_at;
    return;
  end if;

  if v_booking.booking_status not in ('pending_payment', 'payment_review') then
    perform public.booking_error('INVALID_STATUS_TRANSITION');
  end if;

  update public.bookings
  set booking_status = 'confirmed',
      payment_status = 'paid',
      status = 'Confirmed',
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where public.bookings.booking_id = p_booking_id
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at, public.bookings.paid_at
  into booking_id, booking_code, booking_status, payment_status, expires_at, paid_at;

  insert into public.payments (booking_id, status, provider_event_id, paid_at, reviewed_at, reviewed_by)
  values (p_booking_id, 'paid', p_provider_event_id, paid_at, now(), auth.uid())
  on conflict (booking_id) do update
  set status = 'paid', provider_event_id = coalesce(excluded.provider_event_id, payments.provider_event_id),
      paid_at = excluded.paid_at, reviewed_at = excluded.reviewed_at,
      reviewed_by = excluded.reviewed_by, updated_at = now();

  return next;
end;
$$;

create or replace function public.reject_payment(p_booking_id uuid)
returns table (
  booking_id uuid,
  booking_code text,
  booking_status text,
  payment_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_booking_admin() then
    perform public.booking_error('FORBIDDEN');
  end if;

  update public.bookings
  set booking_status = 'pending_payment',
      payment_status = 'rejected',
      status = 'Pending',
      expires_at = now() + interval '30 minutes',
      updated_at = now()
  where public.bookings.booking_id = p_booking_id
    and booking_status in ('pending_payment', 'payment_review')
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at
  into booking_id, booking_code, booking_status, payment_status, expires_at;

  if not found then
    perform public.booking_error('INVALID_STATUS_TRANSITION');
  end if;

  insert into public.payments (booking_id, status, reviewed_at, reviewed_by)
  values (p_booking_id, 'rejected', now(), auth.uid())
  on conflict (booking_id) do update
  set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now();

  return next;
end;
$$;

commit;
