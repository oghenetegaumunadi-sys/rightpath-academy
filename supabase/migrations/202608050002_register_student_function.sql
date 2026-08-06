create or replace function public.register_student(
  p_surname text,
  p_first_name text,
  p_other_name text,
  p_gender public.gender_type,
  p_date_of_birth date,
  p_admission_date date,
  p_class_id uuid,
  p_academic_session_id uuid,
  p_residential_address text,
  p_guardian_name text,
  p_guardian_phone text,
  p_guardian_email text,
  p_guardian_address text,
  p_guardian_occupation text,
  p_guardian_relationship public.relationship_type
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_parent_id uuid;
  v_admission_number text;
  v_prefix text;
  v_next_number bigint;
begin
  if not public.has_any_role(
    array['principal', 'vice_principal', 'admin']
  ) then
    raise exception 'You do not have permission to register students.';
  end if;

  if not exists (
    select 1
    from public.classes
    where id = p_class_id
      and status = 'active'
  ) then
    raise exception 'The selected class is invalid or inactive.';
  end if;

  if not exists (
    select 1
    from public.academic_sessions
    where id = p_academic_session_id
  ) then
    raise exception 'The selected academic session is invalid.';
  end if;

  select admission_prefix
  into v_prefix
  from public.school_profile
  order by created_at
  limit 1;

  v_prefix := coalesce(nullif(v_prefix, ''), 'RA');

  perform pg_advisory_xact_lock(hashtext('student-admission-number'));

  select coalesce(
    max(
      nullif(
        regexp_replace(admission_number, '[^0-9]', '', 'g'),
        ''
      )::bigint
    ),
    0
  ) + 1
  into v_next_number
  from public.students;

  v_admission_number :=
    v_prefix || to_char(current_date, 'YY') || lpad(v_next_number::text, 5, '0');

  insert into public.students (
    admission_number,
    surname,
    first_name,
    other_name,
    gender,
    date_of_birth,
    admission_date,
    residential_address,
    created_by
  )
  values (
    v_admission_number,
    initcap(trim(p_surname)),
    initcap(trim(p_first_name)),
    nullif(initcap(trim(coalesce(p_other_name, ''))), ''),
    p_gender,
    p_date_of_birth,
    p_admission_date,
    nullif(trim(coalesce(p_residential_address, '')), ''),
    auth.uid()
  )
  returning id into v_student_id;

  select id
  into v_parent_id
  from public.parents
  where phone = trim(p_guardian_phone)
  order by created_at
  limit 1;

  if v_parent_id is null then
    insert into public.parents (
      full_name,
      phone,
      email,
      address,
      occupation,
      relationship
    )
    values (
      initcap(trim(p_guardian_name)),
      trim(p_guardian_phone),
      nullif(lower(trim(coalesce(p_guardian_email, ''))), ''),
      trim(p_guardian_address),
      nullif(trim(coalesce(p_guardian_occupation, '')), ''),
      p_guardian_relationship
    )
    returning id into v_parent_id;
  end if;

  insert into public.student_parents (
    student_id,
    parent_id,
    relationship,
    is_primary_contact,
    can_pick_up
  )
  values (
    v_student_id,
    v_parent_id,
    p_guardian_relationship,
    true,
    true
  );

  insert into public.student_enrollments (
    student_id,
    class_id,
    academic_session_id,
    enrolled_on,
    status,
    created_by
  )
  values (
    v_student_id,
    p_class_id,
    p_academic_session_id,
    p_admission_date,
    'active',
    auth.uid()
  );

  return v_student_id;
end;
$$;

revoke all on function public.register_student(
  text,
  text,
  text,
  public.gender_type,
  date,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.relationship_type
) from public;

grant execute on function public.register_student(
  text,
  text,
  text,
  public.gender_type,
  date,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.relationship_type
) to authenticated;
