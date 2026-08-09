alter table public.daily_teaching_reports
add column if not exists review_status text not null default 'pending';

alter table public.daily_teaching_reports
add column if not exists reviewed_by uuid
references public.profiles(id)
on delete set null;

alter table public.daily_teaching_reports
add column if not exists reviewed_at timestamptz;

alter table public.daily_teaching_reports
add column if not exists review_comment text;

alter table public.daily_teaching_reports
drop constraint if exists daily_teaching_reports_review_status_check;

alter table public.daily_teaching_reports
add constraint daily_teaching_reports_review_status_check
check (
  review_status in (
    'pending',
    'reviewed',
    'needs_attention'
  )
);

create index if not exists
daily_teaching_reports_review_status_idx
on public.daily_teaching_reports (
  review_status,
  report_date desc
);
