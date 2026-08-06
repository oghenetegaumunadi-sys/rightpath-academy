-- One overall result per enrollment and term.

create unique index if not exists
term_results_unique_enrollment_term
on public.term_results (
  enrollment_id,
  term_id
);
