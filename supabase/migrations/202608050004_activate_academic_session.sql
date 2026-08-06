do $$
declare
  v_session_id uuid;
  v_term_id uuid;
begin
  update public.academic_sessions
  set
    is_current = false,
    updated_at = now()
  where is_current = true;

  update public.terms
  set
    is_current = false,
    updated_at = now()
  where is_current = true;

  insert into public.academic_sessions (
    name,
    starts_on,
    ends_on,
    is_current,
    status
  )
  values (
    '2026/2027',
    '2026-09-01',
    '2027-07-31',
    true,
    'active'
  )
  on conflict (name)
  do update set
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    is_current = true,
    status = 'active',
    updated_at = now()
  returning id into v_session_id;

  insert into public.terms (
    academic_session_id,
    name,
    term_number,
    starts_on,
    ends_on,
    is_current,
    status
  )
  values (
    v_session_id,
    'First Term',
    1,
    '2026-09-01',
    '2026-12-18',
    true,
    'active'
  )
  on conflict (academic_session_id, term_number)
  do update set
    name = excluded.name,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    is_current = true,
    status = 'active',
    updated_at = now()
  returning id into v_term_id;

  update public.school_profile
  set
    current_session_id = v_session_id,
    current_term_id = v_term_id,
    updated_at = now();
end;
$$;
