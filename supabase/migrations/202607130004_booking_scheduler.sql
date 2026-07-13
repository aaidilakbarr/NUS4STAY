begin;

create extension if not exists pg_cron;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'nus4stay-expire-pending-bookings'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'nus4stay-expire-pending-bookings',
    '* * * * *',
    'select public.expire_pending_bookings(100);'
  );
end;
$$;

commit;
