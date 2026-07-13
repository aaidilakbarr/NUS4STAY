begin;

-- A proof can only enter payment_review when it is uploaded before expires_at.
-- Admin review may happen after that deadline, so payment_review must remain
-- approvable instead of being classified as a late payment.
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

commit;
