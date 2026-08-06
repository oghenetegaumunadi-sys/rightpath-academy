-- ============================================================
-- Rightpath Academy School Management System
-- Initial database schema
-- Built by Kosta Technologies
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type public.record_status as enum (
  'active',
  'inactive',
  'suspended',
  'graduated',
  'withdrawn',
  'archived'
);

create type public.gender_type as enum (
  'male',
  'female'
);

create type public.attendance_status as enum (
  'present',
  'absent',
  'late',
  'excused'
);

create type public.term_status as enum (
  'draft',
  'active',
  'completed',
  'archived'
);

create type public.result_status as enum (
  'draft',
  'submitted',
  'approved',
  'published',
  'rejected'
);

create type public.payment_status as enum (
  'pending',
  'partial',
  'paid',
  'failed',
  'refunded',
  'cancelled'
);

create type public.payment_method as enum (
  'cash',
  'bank_transfer',
  'card',
  'mobile_money',
  'other'
);

create type public.relationship_type as enum (
  'father',
  'mother',
  'guardian',
  'brother',
  'sister',
  'uncle',
  'aunt',
  'other'
);

-- ============================================================
-- SHARED TIMESTAMP FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- SCHOOL PROFILE
-- ============================================================

create table public.school_profile (
  id uuid primary key default gen_random_uuid(),
  school_name text not null default 'Rightpath Academy',
  short_name text not null default 'Rightpath Academy',
  motto text,
  email text,
  phone text,
  address text,
  logo_url text,
  website text,
  currency_code text not null default 'NGN',
  country_code text not null default 'NG',
  timezone text not null default 'Africa/Lagos',
  admission_prefix text not null default 'RA',
  staff_prefix text not null default 'RAS',
  current_session_id uuid,
  current_term_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROLES AND AUTHENTICATED USER PROFILES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  description text,
  is_system_role boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  status public.record_status not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx
  on public.profiles (lower(email));

create table public.profile_roles (
  profile_id uuid not null
    references public.profiles(id) on delete cascade,
  role_id uuid not null
    references public.roles(id) on delete cascade,
  assigned_by uuid
    references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

-- ============================================================
-- ACADEMIC STRUCTURE
-- ============================================================

create table public.school_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_levels_sort_order_positive
    check (sort_order > 0)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_level_id uuid not null
    references public.school_levels(id) on delete restrict,
  name text not null unique,
  slug text not null unique,
  sort_order integer not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_sort_order_positive
    check (sort_order > 0)
);

create index classes_school_level_idx
  on public.classes(school_level_id);

create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  status public.term_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_sessions_valid_dates
    check (ends_on > starts_on)
);

create unique index academic_sessions_one_current_idx
  on public.academic_sessions(is_current)
  where is_current = true;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  academic_session_id uuid not null
    references public.academic_sessions(id) on delete cascade,
  name text not null,
  term_number smallint not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  status public.term_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_session_id, term_number),
  unique (academic_session_id, name),
  constraint terms_valid_number
    check (term_number between 1 and 3),
  constraint terms_valid_dates
    check (ends_on > starts_on)
);

create unique index terms_one_current_idx
  on public.terms(is_current)
  where is_current = true;

-- Add deferred school profile relationships after academic tables exist.

alter table public.school_profile
  add constraint school_profile_current_session_fk
  foreign key (current_session_id)
  references public.academic_sessions(id)
  on delete set null;

alter table public.school_profile
  add constraint school_profile_current_term_fk
  foreign key (current_term_id)
  references public.terms(id)
  on delete set null;

-- ============================================================
-- PARENTS AND STUDENTS
-- ============================================================

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique
    references public.profiles(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  address text not null,
  occupation text,
  relationship public.relationship_type not null default 'guardian',
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parents_phone_idx on public.parents(phone);

create index parents_email_lower_idx
  on public.parents(lower(email))
  where email is not null;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  admission_number text not null unique,
  surname text not null,
  first_name text not null,
  other_name text,
  gender public.gender_type not null,
  date_of_birth date not null,
  admission_date date not null,
  passport_url text,
  residential_address text,
  medical_notes text,
  status public.record_status not null default 'active',
  created_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_date_of_birth_valid
    check (date_of_birth < current_date),
  constraint students_admission_date_valid
    check (admission_date <= current_date)
);

create index students_name_idx
  on public.students(surname, first_name);

create index students_status_idx
  on public.students(status);

create table public.student_parents (
  student_id uuid not null
    references public.students(id) on delete cascade,
  parent_id uuid not null
    references public.parents(id) on delete cascade,
  relationship public.relationship_type not null default 'guardian',
  is_primary_contact boolean not null default false,
  can_pick_up boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (student_id, parent_id)
);

create unique index student_one_primary_parent_idx
  on public.student_parents(student_id)
  where is_primary_contact = true;

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null
    references public.students(id) on delete cascade,
  class_id uuid not null
    references public.classes(id) on delete restrict,
  academic_session_id uuid not null
    references public.academic_sessions(id) on delete restrict,
  enrolled_on date not null default current_date,
  roll_number text,
  status public.record_status not null default 'active',
  promoted_from_enrollment_id uuid
    references public.student_enrollments(id) on delete set null,
  created_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, academic_session_id)
);

create index student_enrollments_class_idx
  on public.student_enrollments(class_id);

create index student_enrollments_session_idx
  on public.student_enrollments(academic_session_id);

-- ============================================================
-- TEACHERS, SUBJECTS AND ASSIGNMENTS
-- ============================================================

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique
    references public.profiles(id) on delete set null,
  employee_id text not null unique,
  full_name text not null,
  phone text not null,
  email text,
  gender public.gender_type,
  date_of_birth date,
  employment_date date,
  qualification text,
  specialization text,
  passport_url text,
  address text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teachers_name_idx
  on public.teachers(full_name);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  is_core boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subjects_name_lower_idx
  on public.subjects(lower(name));

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null
    references public.classes(id) on delete cascade,
  subject_id uuid not null
    references public.subjects(id) on delete cascade,
  academic_session_id uuid not null
    references public.academic_sessions(id) on delete cascade,
  is_compulsory boolean not null default true,
  created_at timestamptz not null default now(),
  unique(class_id, subject_id, academic_session_id)
);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null
    references public.teachers(id) on delete cascade,
  class_subject_id uuid not null
    references public.class_subjects(id) on delete cascade,
  is_class_teacher boolean not null default false,
  assigned_by uuid
    references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(teacher_id, class_subject_id)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null
    references public.student_enrollments(id) on delete cascade,
  attendance_date date not null default current_date,
  status public.attendance_status not null,
  note text,
  recorded_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id, attendance_date)
);

create index student_attendance_date_idx
  on public.student_attendance(attendance_date);

create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null
    references public.teachers(id) on delete cascade,
  attendance_date date not null default current_date,
  status public.attendance_status not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  note text,
  recorded_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id, attendance_date)
);

-- ============================================================
-- ASSESSMENTS AND RESULTS
-- ============================================================

create table public.assessment_components (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  maximum_score numeric(6,2) not null,
  weight_percentage numeric(5,2) not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(code),
  constraint assessment_components_max_score_positive
    check (maximum_score > 0),
  constraint assessment_components_weight_valid
    check (weight_percentage > 0 and weight_percentage <= 100)
);

create table public.assessment_sheets (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null
    references public.class_subjects(id) on delete cascade,
  term_id uuid not null
    references public.terms(id) on delete cascade,
  teacher_id uuid not null
    references public.teachers(id) on delete restrict,
  status public.result_status not null default 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid
    references public.profiles(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_subject_id, term_id)
);

create table public.student_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_sheet_id uuid not null
    references public.assessment_sheets(id) on delete cascade,
  enrollment_id uuid not null
    references public.student_enrollments(id) on delete cascade,
  component_id uuid not null
    references public.assessment_components(id) on delete restrict,
  raw_score numeric(6,2) not null,
  weighted_score numeric(6,2) not null default 0,
  entered_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assessment_sheet_id, enrollment_id, component_id),
  constraint student_scores_raw_score_nonnegative
    check (raw_score >= 0),
  constraint student_scores_weighted_score_nonnegative
    check (weighted_score >= 0)
);

create table public.subject_results (
  id uuid primary key default gen_random_uuid(),
  assessment_sheet_id uuid not null
    references public.assessment_sheets(id) on delete cascade,
  enrollment_id uuid not null
    references public.student_enrollments(id) on delete cascade,
  total_score numeric(6,2) not null default 0,
  grade text,
  remark text,
  subject_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assessment_sheet_id, enrollment_id),
  constraint subject_results_total_valid
    check (total_score >= 0 and total_score <= 100)
);

create table public.term_results (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null
    references public.student_enrollments(id) on delete cascade,
  term_id uuid not null
    references public.terms(id) on delete cascade,
  total_score numeric(10,2) not null default 0,
  average_score numeric(6,2) not null default 0,
  class_position integer,
  attendance_present integer not null default 0,
  attendance_absent integer not null default 0,
  attendance_late integer not null default 0,
  teacher_comment text,
  principal_comment text,
  status public.result_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id, term_id),
  constraint term_results_average_valid
    check (average_score >= 0 and average_score <= 100)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_roles text[] not null default '{}',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_published boolean not null default false,
  created_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_expiry_valid
    check (expires_at is null or expires_at > starts_at)
);

-- ============================================================
-- FINANCE
-- ============================================================

create table public.fee_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  fee_category_id uuid not null
    references public.fee_categories(id) on delete restrict,
  class_id uuid not null
    references public.classes(id) on delete restrict,
  academic_session_id uuid not null
    references public.academic_sessions(id) on delete restrict,
  term_id uuid
    references public.terms(id) on delete restrict,
  amount numeric(12,2) not null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fee_category_id, class_id, academic_session_id, term_id),
  constraint fee_structures_amount_positive
    check (amount >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  student_id uuid not null
    references public.students(id) on delete restrict,
  fee_structure_id uuid
    references public.fee_structures(id) on delete set null,
  amount numeric(12,2) not null,
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  payment_reference text,
  paid_at timestamptz not null default now(),
  received_by uuid
    references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive
    check (amount > 0)
);

create index payments_student_idx on public.payments(student_id);
create index payments_paid_at_idx on public.payments(paid_at);

-- ============================================================
-- LIBRARY
-- ============================================================

create table public.library_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text,
  category text,
  accession_number text not null unique,
  total_copies integer not null default 1,
  available_copies integer not null default 1,
  shelf_location text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_books_total_positive
    check (total_copies >= 0),
  constraint library_books_available_valid
    check (
      available_copies >= 0
      and available_copies <= total_copies
    )
);

create table public.library_loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null
    references public.library_books(id) on delete restrict,
  student_id uuid
    references public.students(id) on delete restrict,
  teacher_id uuid
    references public.teachers(id) on delete restrict,
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  issued_by uuid
    references public.profiles(id) on delete set null,
  received_by uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint library_loans_one_borrower
    check (
      (student_id is not null and teacher_id is null)
      or
      (student_id is null and teacher_id is not null)
    ),
  constraint library_loans_due_date_valid
    check (due_at > borrowed_at)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid
    references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at);
create index audit_logs_table_record_idx
  on public.audit_logs(table_name, record_id);

-- ============================================================
-- AUTH PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.email, '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ============================================================
-- ROLE HELPER FUNCTION
-- ============================================================

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = (select auth.uid())
      and r.name = required_role
  );
$$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger school_profile_set_updated_at
before update on public.school_profile
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger school_levels_set_updated_at
before update on public.school_levels
for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger academic_sessions_set_updated_at
before update on public.academic_sessions
for each row execute function public.set_updated_at();

create trigger terms_set_updated_at
before update on public.terms
for each row execute function public.set_updated_at();

create trigger parents_set_updated_at
before update on public.parents
for each row execute function public.set_updated_at();

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create trigger student_enrollments_set_updated_at
before update on public.student_enrollments
for each row execute function public.set_updated_at();

create trigger teachers_set_updated_at
before update on public.teachers
for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger student_attendance_set_updated_at
before update on public.student_attendance
for each row execute function public.set_updated_at();

create trigger teacher_attendance_set_updated_at
before update on public.teacher_attendance
for each row execute function public.set_updated_at();

create trigger assessment_sheets_set_updated_at
before update on public.assessment_sheets
for each row execute function public.set_updated_at();

create trigger student_scores_set_updated_at
before update on public.student_scores
for each row execute function public.set_updated_at();

create trigger subject_results_set_updated_at
before update on public.subject_results
for each row execute function public.set_updated_at();

create trigger term_results_set_updated_at
before update on public.term_results
for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create trigger fee_categories_set_updated_at
before update on public.fee_categories
for each row execute function public.set_updated_at();

create trigger fee_structures_set_updated_at
before update on public.fee_structures
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger library_books_set_updated_at
before update on public.library_books
for each row execute function public.set_updated_at();

-- ============================================================
-- SEED SYSTEM ROLES
-- ============================================================

insert into public.roles (
  name,
  display_name,
  description
)
values
  ('principal', 'Principal', 'Overall school administrator and final result approver'),
  ('vice_principal', 'Vice Principal', 'Supports academic and administrative oversight'),
  ('admin', 'Administrator', 'Manages students, staff, classes and system records'),
  ('teacher', 'Teacher', 'Manages attendance, assessments and class activities'),
  ('accountant', 'Accountant', 'Manages school fees, payments and financial reports'),
  ('librarian', 'Librarian', 'Manages books, borrowing and returns'),
  ('parent', 'Parent or Guardian', 'Views linked children, announcements and published results');

-- ============================================================
-- SEED SCHOOL LEVELS
-- ============================================================

insert into public.school_levels (
  name,
  slug,
  sort_order
)
values
  ('Pre-School', 'pre-school', 1),
  ('Basic School', 'basic-school', 2),
  ('Junior School', 'junior-school', 3);

-- ============================================================
-- SEED CLASSES
-- ============================================================

insert into public.classes (
  school_level_id,
  name,
  slug,
  sort_order
)
select
  sl.id,
  class_data.name,
  class_data.slug,
  class_data.sort_order
from public.school_levels sl
join (
  values
    ('Pre-School', 'Pre-School', 'pre-school', 1),
    ('Basic School', 'Basic 1', 'basic-1', 2),
    ('Basic School', 'Basic 2', 'basic-2', 3),
    ('Basic School', 'Basic 3', 'basic-3', 4),
    ('Basic School', 'Basic 4', 'basic-4', 5),
    ('Basic School', 'Basic 5', 'basic-5', 6),
    ('Basic School', 'Basic 6', 'basic-6', 7),
    ('Junior School', 'JSS 1', 'jss-1', 8),
    ('Junior School', 'JSS 2', 'jss-2', 9),
    ('Junior School', 'JSS 3', 'jss-3', 10)
) as class_data(level_name, name, slug, sort_order)
  on class_data.level_name = sl.name;

-- ============================================================
-- SEED ASSESSMENT COMPONENTS
-- The values can later be changed in Settings.
-- ============================================================

insert into public.assessment_components (
  name,
  code,
  maximum_score,
  weight_percentage,
  sort_order
)
values
  ('Continuous Assessment 1', 'CA1', 10, 10, 1),
  ('Continuous Assessment 2', 'CA2', 10, 10, 2),
  ('Assignment', 'ASSIGNMENT', 10, 10, 3),
  ('Examination', 'EXAM', 70, 70, 4);

-- ============================================================
-- INITIAL SCHOOL PROFILE
-- ============================================================

insert into public.school_profile (
  school_name,
  short_name,
  currency_code,
  country_code,
  timezone,
  admission_prefix,
  staff_prefix
)
values (
  'Rightpath Academy',
  'Rightpath Academy',
  'NGN',
  'NG',
  'Africa/Lagos',
  'RA',
  'RAS'
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- Policies will be expanded according to each module.
-- ============================================================

alter table public.school_profile enable row level security;
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.school_levels enable row level security;
alter table public.classes enable row level security;
alter table public.academic_sessions enable row level security;
alter table public.terms enable row level security;
alter table public.parents enable row level security;
alter table public.students enable row level security;
alter table public.student_parents enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.student_attendance enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.assessment_components enable row level security;
alter table public.assessment_sheets enable row level security;
alter table public.student_scores enable row level security;
alter table public.subject_results enable row level security;
alter table public.term_results enable row level security;
alter table public.announcements enable row level security;
alter table public.fee_categories enable row level security;
alter table public.fee_structures enable row level security;
alter table public.payments enable row level security;
alter table public.library_books enable row level security;
alter table public.library_loans enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- BASIC READ POLICIES FOR AUTHENTICATED USERS
-- ============================================================

create policy "Authenticated users can read school profile"
on public.school_profile
for select
to authenticated
using (true);

create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "Users can update their own basic profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Authenticated users can read school levels"
on public.school_levels
for select
to authenticated
using (true);

create policy "Authenticated users can read classes"
on public.classes
for select
to authenticated
using (true);

create policy "Authenticated users can read academic sessions"
on public.academic_sessions
for select
to authenticated
using (true);

create policy "Authenticated users can read terms"
on public.terms
for select
to authenticated
using (true);

create policy "Authenticated users can read subjects"
on public.subjects
for select
to authenticated
using (true);

create policy "Authenticated users can read assessment components"
on public.assessment_components
for select
to authenticated
using (true);

create policy "Users can read their assigned roles"
on public.profile_roles
for select
to authenticated
using (profile_id = (select auth.uid()));

-- Administrators and school leaders can read profiles.

create policy "Management can read user profiles"
on public.profiles
for select
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

-- Admin management policies.

create policy "Management can manage school levels"
on public.school_levels
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('admin')
);

create policy "Management can manage classes"
on public.classes
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('admin')
);

create policy "Management can manage sessions"
on public.academic_sessions
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('admin')
);

create policy "Management can manage terms"
on public.terms
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('admin')
);

create policy "Management can manage students"
on public.students
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

create policy "Management can manage parents"
on public.parents
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

create policy "Management can manage student parent links"
on public.student_parents
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

create policy "Management can manage enrollments"
on public.student_enrollments
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

create policy "Management can manage teachers"
on public.teachers
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

create policy "Management can manage subjects"
on public.subjects
for all
to authenticated
using (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
)
with check (
  public.has_role('principal')
  or public.has_role('vice_principal')
  or public.has_role('admin')
);

