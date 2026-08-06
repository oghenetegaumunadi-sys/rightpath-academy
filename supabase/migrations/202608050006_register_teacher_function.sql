create or replace function public.register_teacher(
  p_full_name text,
  p_phone text,
  p_email text,
  p_gender public.gender_type,
  p_date_of_birth date,
  p_employment_date date,
  p_qualification text,
  p_specialization text,
  p_address text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid;
  v_employee_id text;
  v_prefix text;
  v_next_number bigint;
begin
  if not public.has_any_role(
    array['principal', 'vice_principal', 'admin']
  ) then
    raise exception
      'You do not have permission to register teachers.';
  end if;

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
    hashtext('teacher-employee-number')
  );

  select coalesce(
    max(
      substring(
        employee_id
        from '([0-9]+)$'
      )::bigint
    ),
    0
  ) + 1
  into v_next_number
  from public.teachers;

  v_employee_id :=
    upper(v_prefix) ||
    '/STF/' ||
    lpad(v_next_number::text, 4, '0');

  insert into public.teachers (
    employee_id,
    full_name,
    phone,
    email,
    gender,
    date_of_birth,
    employment_date,
    qualification,
    specialization,
    address,
    status
  )
  values (
    v_employee_id,
    initcap(trim(p_full_name)),
    trim(p_phone),
    nullif(lower(trim(coalesce(p_email, ''))), ''),
    p_gender,
    p_date_of_birth,
    p_employment_date,
    trim(p_qualification),
    nullif(trim(coalesce(p_specialization, '')), ''),
    nullif(trim(coalesce(p_address, '')), ''),
    'active'
  )
  returning id into v_teacher_id;

  return v_teacher_id;
end;
$$;

revoke all on function public.register_teacher(
  text,
  text,
  text,
  public.gender_type,
  date,
  date,
  text,
  text,
  text
) from public;

grant execute on function public.register_teacher(
  text,
  text,
  text,
  public.gender_type,
  date,
  date,
  text,
  text,
  text
) to authenticated;
