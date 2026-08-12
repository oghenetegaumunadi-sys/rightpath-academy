-- ============================================================
-- HEAD TEACHER ASSIGNMENTS
-- ============================================================
--
-- A Head Teacher remains a normal teacher, but receives
-- management responsibility over one school level/section.
--
-- Examples:
--   Teacher A -> Basic School
--   Teacher B -> Junior School
-- ============================================================

create table if not exists public.head_teacher_assignments (
  id uuid primary key default gen_random_uuid(),

  teacher_id uuid not null
    references public.teachers(id)
    on delete cascade,

  school_level_id uuid not null
    references public.school_levels(id)
    on delete cascade,

  assigned_by uuid
    references public.profiles(id)
    on delete set null,

  assigned_at timestamptz not null default now(),

  status public.record_status not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint head_teacher_assignments_teacher_unique
    unique (teacher_id),

  constraint head_teacher_assignments_level_unique
    unique (school_level_id)
);

create index if not exists
  head_teacher_assignments_level_idx
on public.head_teacher_assignments (
  school_level_id
);

create trigger head_teacher_assignments_set_updated_at
before update on public.head_teacher_assignments
for each row
execute function public.set_updated_at();
