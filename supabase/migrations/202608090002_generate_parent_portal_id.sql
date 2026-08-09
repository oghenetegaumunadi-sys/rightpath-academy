create or replace function public.generate_parent_portal_id()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_next_number bigint;
begin
  select staff_prefix
  into v_prefix
  from public.school_profile
  order by created_at
  limit 1;

  v_prefix := coalesce(
    nullif(trim(v_prefix), ''),
    'RPA'
  );

  perform pg_advisory_xact_lock(
    hashtext('parent-portal-number')
  );

  select coalesce(
    max(
      substring(
        parent_portal_id
        from '([0-9]+)$'
      )::bigint
    ),
    0
  ) + 1
  into v_next_number
  from public.parents
  where parent_portal_id is not null;

  return
    upper(v_prefix) ||
    '/PAR/' ||
    lpad(v_next_number::text, 4, '0');
end;
$$;

revoke all
on function public.generate_parent_portal_id()
from public;

grant execute
on function public.generate_parent_portal_id()
to authenticated;
