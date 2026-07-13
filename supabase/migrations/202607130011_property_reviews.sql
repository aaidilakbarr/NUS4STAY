begin;

alter table public.properties
  add column if not exists review_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_review_count_check'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_review_count_check check (review_count >= 0);
  end if;
end;
$$;

create table if not exists public.property_reviews (
  review_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(booking_id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null,
  comment text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_reviews_rating_check check (rating between 1 and 5),
  constraint property_reviews_comment_length_check check (comment is null or char_length(comment) <= 1000)
);

create index if not exists idx_property_reviews_property_created
  on public.property_reviews(property_id, created_at desc)
  where is_published;

create index if not exists idx_property_reviews_user
  on public.property_reviews(user_id, created_at desc);

drop trigger if exists set_updated_at on public.property_reviews;
create trigger set_updated_at
before update on public.property_reviews
for each row execute function public.handle_updated_at();

alter table public.property_reviews enable row level security;

revoke all on table public.property_reviews from anon, authenticated;
grant select on table public.property_reviews to authenticated;

drop policy if exists "Guests can read own reviews and staff can read all" on public.property_reviews;
create policy "Guests can read own reviews and staff can read all"
on public.property_reviews
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_booking_staff()
);

create or replace function public.sync_property_rating(p_property_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.properties properties
  set rating = (
        select coalesce(round(avg(reviews.rating)::numeric, 2), 0.00)
        from public.property_reviews reviews
        where reviews.property_id = p_property_id
          and reviews.is_published
      ),
      review_count = (
        select count(*)::integer
        from public.property_reviews reviews
        where reviews.property_id = p_property_id
          and reviews.is_published
      )
  where properties.id = p_property_id;
$$;

create or replace function public.refresh_property_rating_after_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_property_rating(old.property_id);
  elsif tg_op = 'INSERT' then
    perform public.sync_property_rating(new.property_id);
  else
    if new.property_id is distinct from old.property_id then
      perform public.sync_property_rating(old.property_id);
    end if;
    perform public.sync_property_rating(new.property_id);
  end if;

  return null;
end;
$$;

drop trigger if exists refresh_property_rating on public.property_reviews;
create trigger refresh_property_rating
after insert or update or delete on public.property_reviews
for each row execute function public.refresh_property_rating_after_review();

update public.properties properties
set rating = (
      select coalesce(round(avg(reviews.rating)::numeric, 2), 0.00)
      from public.property_reviews reviews
      where reviews.property_id = properties.id
        and reviews.is_published
    ),
    review_count = (
      select count(*)::integer
      from public.property_reviews reviews
      where reviews.property_id = properties.id
        and reviews.is_published
    );

create or replace function public.submit_property_review(
  p_booking_id uuid,
  p_rating integer,
  p_comment text default null
)
returns table (
  review_id uuid,
  booking_id uuid,
  property_id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  property_rating numeric,
  property_review_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_review public.property_reviews%rowtype;
  v_property_rating numeric;
  v_property_review_count integer;
  v_comment text := nullif(btrim(p_comment), '');
begin
  if v_user_id is null then
    perform public.booking_error('AUTH_REQUIRED');
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    perform public.booking_error('INVALID_REVIEW_RATING');
  end if;

  if v_comment is not null and char_length(v_comment) > 1000 then
    perform public.booking_error('INVALID_REVIEW_COMMENT');
  end if;

  select * into v_booking
  from public.bookings bookings
  where bookings.booking_id = p_booking_id
    and bookings.user_id = v_user_id
  for update;

  if not found then
    perform public.booking_error('BOOKING_NOT_FOUND');
  end if;

  if v_booking.booking_status <> 'confirmed' or v_booking.payment_status <> 'paid' then
    perform public.booking_error('REVIEW_NOT_ALLOWED');
  end if;

  if current_date < v_booking.check_out then
    perform public.booking_error('STAY_NOT_COMPLETED');
  end if;

  if exists (
    select 1
    from public.property_reviews reviews
    where reviews.booking_id = p_booking_id
  ) then
    perform public.booking_error('REVIEW_ALREADY_SUBMITTED');
  end if;

  begin
    insert into public.property_reviews (
      booking_id,
      property_id,
      user_id,
      rating,
      comment
    )
    values (
      p_booking_id,
      v_booking.property_id,
      v_user_id,
      p_rating,
      v_comment
    )
    returning * into v_review;
  exception
    when unique_violation then
      perform public.booking_error('REVIEW_ALREADY_SUBMITTED');
  end;

  select properties.rating, properties.review_count
  into v_property_rating, v_property_review_count
  from public.properties properties
  where properties.id = v_booking.property_id;

  return query
  select v_review.review_id,
    v_review.booking_id,
    v_review.property_id,
    v_review.rating::integer,
    v_review.comment,
    v_review.created_at,
    v_property_rating,
    v_property_review_count;
end;
$$;

create or replace function public.get_property_reviews(
  p_property_id uuid,
  p_limit integer default 12
)
returns table (
  review_id uuid,
  property_id uuid,
  rating integer,
  comment text,
  reviewer_label text,
  stayed_at date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select reviews.review_id,
    reviews.property_id,
    reviews.rating::integer,
    reviews.comment,
    'Tamu terverifikasi'::text as reviewer_label,
    bookings.check_out as stayed_at,
    reviews.created_at
  from public.property_reviews reviews
  join public.bookings bookings
    on bookings.booking_id = reviews.booking_id
  join public.properties properties
    on properties.id = reviews.property_id
  where reviews.property_id = p_property_id
    and reviews.is_published
    and properties.is_active
  order by reviews.created_at desc
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$$;

revoke all on function public.submit_property_review(uuid, integer, text) from public, anon;
grant execute on function public.submit_property_review(uuid, integer, text) to authenticated;

revoke all on function public.get_property_reviews(uuid, integer) from public;
grant execute on function public.get_property_reviews(uuid, integer) to anon, authenticated;

revoke all on function public.sync_property_rating(uuid) from public, anon, authenticated, service_role;
revoke all on function public.refresh_property_rating_after_review() from public, anon, authenticated, service_role;

commit;
