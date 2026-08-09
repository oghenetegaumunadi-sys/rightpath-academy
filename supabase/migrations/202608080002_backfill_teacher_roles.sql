-- Ensure every linked teacher profile has the teacher role.

insert into public.profile_roles (
  profile_id,
  role_id
)
select
  t.profile_id,
  r.id
from public.teachers t
cross join public.roles r
where
  t.profile_id is not null
  and r.name = 'teacher'
  and not exists (
    select 1
    from public.profile_roles pr
    where
      pr.profile_id = t.profile_id
      and pr.role_id = r.id
  );

