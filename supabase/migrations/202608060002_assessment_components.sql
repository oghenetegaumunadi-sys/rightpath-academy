-- RightPath Academy assessment structure
-- CA: 30 marks
-- Assignment: 10 marks
-- Exam: 60 marks
-- Total: 100 marks

-- Deactivate any previous assessment components.
update public.assessment_components
set is_active = false
where code not in ('CA', 'ASSIGNMENT', 'EXAM');

-- Continuous Assessment
update public.assessment_components
set
  name = 'Continuous Assessment',
  maximum_score = 30,
  weight_percentage = 30,
  sort_order = 1,
  is_active = true
where code = 'CA';

insert into public.assessment_components (
  name,
  code,
  maximum_score,
  weight_percentage,
  sort_order,
  is_active
)
select
  'Continuous Assessment',
  'CA',
  30,
  30,
  1,
  true
where not exists (
  select 1
  from public.assessment_components
  where code = 'CA'
);

-- Assignment
update public.assessment_components
set
  name = 'Assignment',
  maximum_score = 10,
  weight_percentage = 10,
  sort_order = 2,
  is_active = true
where code = 'ASSIGNMENT';

insert into public.assessment_components (
  name,
  code,
  maximum_score,
  weight_percentage,
  sort_order,
  is_active
)
select
  'Assignment',
  'ASSIGNMENT',
  10,
  10,
  2,
  true
where not exists (
  select 1
  from public.assessment_components
  where code = 'ASSIGNMENT'
);

-- Examination
update public.assessment_components
set
  name = 'Examination',
  maximum_score = 60,
  weight_percentage = 60,
  sort_order = 3,
  is_active = true
where code = 'EXAM';

insert into public.assessment_components (
  name,
  code,
  maximum_score,
  weight_percentage,
  sort_order,
  is_active
)
select
  'Examination',
  'EXAM',
  60,
  60,
  3,
  true
where not exists (
  select 1
  from public.assessment_components
  where code = 'EXAM'
);

-- Confirm active assessment weights total 100.
do $$
declare
  total_weight numeric;
begin
  select coalesce(sum(weight_percentage), 0)
  into total_weight
  from public.assessment_components
  where is_active = true;

  if total_weight <> 100 then
    raise exception
      'Active assessment component weights must total 100. Current total: %',
      total_weight;
  end if;
end;
$$;
