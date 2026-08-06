-- One sheet per teacher, class-subject and term.
create unique index if not exists
assessment_sheets_unique_assignment_term
on public.assessment_sheets (
  class_subject_id,
  teacher_id,
  term_id
);

-- One score per student, sheet and component.
create unique index if not exists
student_scores_unique_entry
on public.student_scores (
  assessment_sheet_id,
  enrollment_id,
  component_id
);

-- One computed subject result per student and sheet.
create unique index if not exists
subject_results_unique_entry
on public.subject_results (
  assessment_sheet_id,
  enrollment_id
);
