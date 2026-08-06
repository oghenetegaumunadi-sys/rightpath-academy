-- Add a short admission code to every class.

alter table public.classes
add column if not exists admission_code text;

update public.classes
set admission_code = case name
  when 'Pre-School' then 'PS'
  when 'Basic 1' then 'B1'
  when 'Basic 2' then 'B2'
  when 'Basic 3' then 'B3'
  when 'Basic 4' then 'B4'
  when 'Basic 5' then 'B5'
  when 'Basic 6' then 'B6'
  when 'JSS 1' then 'J1'
  when 'JSS 2' then 'J2'
  when 'JSS 3' then 'J3'
end
where admission_code is null;

alter table public.classes
alter column admission_code set not null;

alter table public.classes
add constraint classes_admission_code_unique
unique (admission_code);

-- Use RPA as the school admission prefix.

update public.school_profile
set admission_prefix = 'RPA';

-- Replace the student registration function.

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
  v_class_code text;
  v_next_number bigint;
begin
  if not public.has_any_role(
    array['principal', 'vice_principal', 'admin']
  ) then
    raise exception
      'You do not have permission to register students.';
  end if;

  select admission_code
  into v_class_code
  from public.classes
  where id = p_class_id
    and status = 'active';

  if v_class_code is null then
    raise exception
      'The selected class is invalid or inactive.';
  end if;

  if not exists (
    select 1
    from public.academic_sessions
    where id = p_academic_session_id
  ) then
    raise exception
      'The selected academic session is invalid.';
  end if;

  select admission_prefix
  into v_prefix
  from public.school_profile
  order by created_at
  limit 1;

  v_prefix := coalesce(
    nullif(trim(v_prefix), ''),
    'RPA'
  );

  -- Prevent two students in the same class from
  -- receiving the same serial number.

  perform pg_advisory_xact_lock(
    hashtext(
      'student-admission-number:' ||
      p_class_id::text
    )
  );

  select coalesce(
    max(
      substring(
        s.admission_number
        from '([0-9]+)$'
      )::bigint
    ),
    0
  ) + 1
  into v_next_number
  from public.students s
  join public.student_enrollments se
    on se.student_id = s.id
  where se.class_id = p_class_id;

  v_admission_number :=
    upper(v_prefix) ||
    '/' ||
    upper(v_class_code) ||
    '/' ||
    lpad(v_next_number::text, 4, '0');

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
    nullif(
      initcap(trim(coalesce(p_other_name, ''))),
      ''
    ),
    p_gender,
    p_date_of_birth,
    p_admission_date,
    nullif(
      trim(coalesce(p_residential_address, '')),
      ''
    ),
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
      nullif(
        lower(trim(coalesce(p_guardian_email, ''))),
        ''
      ),
      trim(p_guardian_address),
      nullif(
        trim(coalesce(p_guardian_occupation, '')),
        ''
      ),
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
