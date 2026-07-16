create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid());

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  booking_updates boolean not null default true,
  promotions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences"
on public.notification_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can upsert own notification preferences"
on public.notification_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own notification preferences"
on public.notification_preferences
for update
to authenticated
using (user_id = auth.uid());

drop trigger if exists set_updated_at on public.notification_preferences;
create trigger set_updated_at
before update on public.notification_preferences
for each row execute function public.handle_updated_at();
