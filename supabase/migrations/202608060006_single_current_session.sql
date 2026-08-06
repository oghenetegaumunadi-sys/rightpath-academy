-- Keep only the newest session marked as current.
with ranked_sessions as (
  select
    id,
    row_number() over (
      order by starts_on desc, created_at desc, id desc
    ) as position
  from public.academic_sessions
  where is_current = true
)
update public.academic_sessions
set
  is_current = false,
  updated_at = now()
where id in (
  select id
  from ranked_sessions
  where position > 1
);

-- Prevent multiple sessions from being current again.
create unique index if not exists
academic_sessions_single_current_idx
on public.academic_sessions (is_current)
where is_current = true;
