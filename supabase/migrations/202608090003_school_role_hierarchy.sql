-- ============================================================
-- RIGHTPATH ACADEMY ORGANIZATIONAL ROLE HIERARCHY
-- ============================================================
--
-- New operational structure:
--
-- School Director
--      |
-- School Admin
--      |
-- Head Teachers
--      |
-- Teachers
--      |
-- Parents
--
-- Existing legacy roles are deliberately retained during
-- migration so currently working production accounts do not
-- lose access.
-- ============================================================

insert into public.roles (
  name,
  display_name,
  description,
  is_system_role
)
values
  (
    'director',
    'School Director',
    'Highest school authority with whole-school oversight, configuration and administrative control',
    true
  ),
  (
    'school_admin',
    'School Administrator',
    'Manages daily school operations, students, staff, timetable, results and academic administration',
    true
  ),
  (
    'head_teacher',
    'Head Teacher',
    'Oversees assigned school levels or classes while retaining normal teaching responsibilities',
    true
  )
on conflict (name)
do update set
  display_name = excluded.display_name,
  description = excluded.description,
  is_system_role = excluded.is_system_role;

-- Keep existing role descriptions accurate during transition.
update public.roles
set description =
  'Legacy principal role retained temporarily during migration to School Director'
where name = 'principal';

update public.roles
set description =
  'Legacy vice principal role retained temporarily during organizational migration'
where name = 'vice_principal';

update public.roles
set description =
  'Legacy administrator role retained temporarily during migration to School Administrator'
where name = 'admin';
