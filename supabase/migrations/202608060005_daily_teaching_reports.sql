-- Daily lesson records submitted by teachers.
-- One row represents one class-subject lesson taught.

create table if not exists public.daily_teaching_reports (
  id uuid primary key default gen_random_uuid(),

  teacher_id uuid not null
    references public.teachers(id)
    on delete restrict,

  class_subject_id uuid not null
    references public.class_subjects(id)
    on delete restrict,

  report_date date not null default current_date,

  topic_taught text not null,

  lesson_status text not null default 'completed'
    check (
      lesson_status in (
        'completed',
        'partially_completed',
        'postponed'
      )
    ),

  started_at time without time zone,
  ended_at time without time zone,

  students_present integer
    check (
      students_present is null
      or students_present >= 0
    ),

  notes text,

  submitted_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_teaching_reports_topic_not_blank
    check (length(trim(topic_taught)) > 0),

  constraint daily_teaching_reports_time_order
    check (
      started_at is null
      or ended_at is null
      or ended_at > started_at
    )
);

create index if not exists
daily_teaching_reports_teacher_date_idx
on public.daily_teaching_reports (
  teacher_id,
  report_date desc
);

create index if not exists
daily_teaching_reports_class_subject_date_idx
on public.daily_teaching_reports (
  class_subject_id,
  report_date desc
);

create index if not exists
daily_teaching_reports_report_date_idx
on public.daily_teaching_reports (
  report_date desc
);
