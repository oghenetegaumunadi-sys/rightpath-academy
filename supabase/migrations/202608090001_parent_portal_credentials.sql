alter table public.parents
add column if not exists parent_portal_id text;

alter table public.parents
add column if not exists must_change_password boolean not null default true;

create unique index if not exists parents_parent_portal_id_lower_unique
on public.parents (lower(parent_portal_id))
where parent_portal_id is not null;

create index if not exists parents_profile_id_idx
on public.parents (profile_id);
