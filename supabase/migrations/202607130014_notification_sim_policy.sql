-- Allow authenticated users to insert their own notifications (for simulation/testing)
create policy "Users can insert own notifications"
on public.notifications
for insert
to authenticated
with check (user_id = auth.uid());
