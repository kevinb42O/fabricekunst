-- Daily privacy-retention maintenance for analytics and public form limiters.

begin;

create extension if not exists pg_cron;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'atelier-rembrandt-daily-retention'
  ) then
    perform cron.schedule(
      'atelier-rembrandt-daily-retention',
      '17 3 * * *',
      $command$
        select public.purge_analytics_v2();
        select public.purge_collector_list_rate_limits();
      $command$
    );
  end if;
end
$$;

commit;
