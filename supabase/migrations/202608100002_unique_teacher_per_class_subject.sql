-- ============================================================
-- ONE PRIMARY TEACHER PER CLASS SUBJECT
-- ============================================================
--
-- A teacher may teach many class-subjects.
-- Different teachers may teach the same subject in different classes.
-- But each individual class-subject should have one primary teacher.
-- ============================================================

-- Safety check: fail clearly if duplicate assignments already exist.
do $$
begin
  if exists (
    select
      class_subject_id
    from public.teacher_assignments
    group by class_subject_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot add unique class-subject teacher constraint because duplicate teacher assignments already exist.';
  end if;
end
$$;

create unique index if not exists
  teacher_assignments_class_subject_unique
on public.teacher_assignments (
  class_subject_id
);
