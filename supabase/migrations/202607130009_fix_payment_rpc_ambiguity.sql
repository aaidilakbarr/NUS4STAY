begin;

-- The output column booking_id conflicts with the payments.booking_id column
-- when PostgreSQL parses ON CONFLICT (booking_id) inside these RPCs. Refer to
-- the primary-key constraint explicitly so proof submission and admin review
-- remain unambiguous.

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
  on conflict on constraint payments_pkey do update
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

  if v_booking.booking_status = 'expired'
    or (v_booking.booking_status = 'pending_payment' and v_booking.expires_at <= now()) then
    if v_booking.booking_status = 'pending_payment' then
      perform public.expire_booking(p_booking_id);
    end if;
    update public.bookings
    set payment_status = 'late_payment', updated_at = now()
    where public.bookings.booking_id = p_booking_id;
    insert into public.payments (booking_id, status, provider_event_id, reviewed_at, reviewed_by)
    values (p_booking_id, 'late_payment', p_provider_event_id, now(), auth.uid())
    on conflict on constraint payments_pkey do update
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
      paid_at = coalesce(public.bookings.paid_at, now()),
      updated_at = now()
  where public.bookings.booking_id = p_booking_id
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at, public.bookings.paid_at
  into booking_id, booking_code, booking_status, payment_status, expires_at, paid_at;

  insert into public.payments (booking_id, status, provider_event_id, paid_at, reviewed_at, reviewed_by)
  values (p_booking_id, 'paid', p_provider_event_id, paid_at, now(), auth.uid())
  on conflict on constraint payments_pkey do update
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
    and public.bookings.booking_status in ('pending_payment', 'payment_review')
  returning public.bookings.booking_id, public.bookings.booking_code,
    public.bookings.booking_status, public.bookings.payment_status,
    public.bookings.expires_at
  into booking_id, booking_code, booking_status, payment_status, expires_at;

  if not found then
    perform public.booking_error('INVALID_STATUS_TRANSITION');
  end if;

  insert into public.payments (booking_id, status, reviewed_at, reviewed_by)
  values (p_booking_id, 'rejected', now(), auth.uid())
  on conflict on constraint payments_pkey do update
  set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now();

  return next;
end;
$$;

commit;
