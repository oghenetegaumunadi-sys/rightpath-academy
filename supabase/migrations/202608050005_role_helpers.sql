-- ============================================================
-- Rightpath Academy role helper functions
-- ============================================================

create or replace function public.has_role(
  required_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles pr
    inner join public.roles r
      on r.id = pr.role_id
    where pr.profile_id = auth.uid()
      and r.name = required_role
  );
$$;

create or replace function public.has_any_role(
  required_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles pr
    inner join public.roles r
      on r.id = pr.role_id
    where pr.profile_id = auth.uid()
      and r.name = any(required_roles)
  );
$$;

revoke all on function public.has_role(text) from public;
revoke all on function public.has_any_role(text[]) from public;

grant execute on function public.has_role(text)
to authenticated;

grant execute on function public.has_any_role(text[])
to authenticated;

grant execute on function public.has_role(text)
to service_role;

grant execute on function public.has_any_role(text[])
to service_role;
