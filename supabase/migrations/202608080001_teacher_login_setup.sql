alter table public.teachers
add column if not exists must_change_password boolean not null default true;

create unique index if not exists teachers_employee_id_lower_unique
on public.teachers (lower(employee_id));
