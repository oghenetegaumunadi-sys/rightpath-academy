-- One attendance record per enrollment per school day.

delete from public.student_attendance a
using public.student_attendance b
where a.enrollment_id = b.enrollment_id
  and a.attendance_date = b.attendance_date
  and a.created_at < b.created_at;

create unique index if not exists
student_attendance_enrollment_date_unique
on public.student_attendance (
  enrollment_id,
  attendance_date
);
