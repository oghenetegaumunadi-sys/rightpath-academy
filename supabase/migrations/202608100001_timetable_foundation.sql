-- ============================================================
-- SCHOOL TIMETABLE FOUNDATION
-- RIGHTPATH ACADEMY DAILY SCHEDULE
-- ============================================================

create table if not exists public.school_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period_number integer not null,
  starts_at time not null,
  ends_at time not null,
  is_break boolean not null default false,
  is_instructional boolean not null default true,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint school_periods_period_number_positive
    check (period_number > 0),

  constraint school_periods_time_valid
    check (ends_at > starts_at),

  constraint school_periods_period_number_unique
    unique (period_number)
);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),

  academic_session_id uuid not null
    references public.academic_sessions(id)
    on delete cascade,

  term_id uuid not null
    references public.terms(id)
    on delete cascade,

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  class_subject_id uuid
    references public.class_subjects(id)
    on delete cascade,

  teacher_id uuid
    references public.teachers(id)
    on delete set null,

  period_id uuid not null
    references public.school_periods(id)
    on delete restrict,

  weekday smallint not null,

  room text,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timetable_entries_weekday_valid
    check (weekday between 1 and 5),

  constraint timetable_entries_class_period_unique
    unique (
      academic_session_id,
      term_id,
      class_id,
      weekday,
      period_id
    )
);

create unique index if not exists
  timetable_entries_teacher_period_unique
on public.timetable_entries (
  academic_session_id,
  term_id,
  teacher_id,
  weekday,
  period_id
)
where teacher_id is not null;

create index if not exists
  timetable_entries_class_idx
on public.timetable_entries (
  class_id,
  weekday
);

create index if not exists
  timetable_entries_teacher_idx
on public.timetable_entries (
  teacher_id,
  weekday
);

create trigger school_periods_set_updated_at
before update on public.school_periods
for each row
execute function public.set_updated_at();

create trigger timetable_entries_set_updated_at
before update on public.timetable_entries
for each row
execute function public.set_updated_at();

-- ============================================================
-- RIGHTPATH ACADEMY DAILY PERIODS
-- ============================================================

insert into public.school_periods (
  name,
  period_number,
  starts_at,
  ends_at,
  is_break,
  is_instructional
)
values
  (
    'Quran Memorization',
    1,
    '07:00',
    '10:00',
    false,
    false
  ),
  (
    'Short Break',
    2,
    '10:00',
    '10:15',
    true,
    false
  ),
  (
    'Assembly',
    3,
    '10:15',
    '10:30',
    false,
    false
  ),
  (
    'Period 1',
    4,
    '10:30',
    '11:00',
    false,
    true
  ),
  (
    'Period 2',
    5,
    '11:00',
    '11:30',
    false,
    true
  ),
  (
    'Period 3',
    6,
    '11:30',
    '12:00',
    false,
    true
  ),
  (
    'Period 4',
    7,
    '12:00',
    '12:30',
    false,
    true
  ),
  (
    'Period 5',
    8,
    '12:30',
    '13:00',
    false,
    true
  ),
  (
    'Prayer',
    9,
    '13:00',
    '13:30',
    false,
    false
  ),
  (
    'Rest Break',
    10,
    '13:30',
    '14:00',
    true,
    false
  ),
  (
    'Period 6',
    11,
    '14:00',
    '14:30',
    false,
    true
  ),
  (
    'Period 7',
    12,
    '14:30',
    '15:00',
    false,
    true
  ),
  (
    'Period 8',
    13,
    '15:00',
    '15:30',
    false,
    true
  ),
  (
    'Period 9',
    14,
    '15:30',
    '16:00',
    false,
    true
  )
on conflict (period_number)
do update set
  name = excluded.name,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_break = excluded.is_break,
  is_instructional = excluded.is_instructional,
  updated_at = now();
