-- ============================================================
-- ZIM E-LEARNING PLATFORM — SUPABASE DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('student', 'teacher', 'parent', 'admin');
create type zimsec_level as enum ('primary', 'olevel', 'alevel');

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================================

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text,
  avatar_url   text,
  role         user_role not null default 'student',
  onboarding_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- STUDENT PROFILES
-- ============================================================

create table public.student_profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  zimsec_level zimsec_level not null,
  grade        text,           -- e.g. "Grade 6", "Form 3", "Upper 6"
  parent_id    uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TEACHER PROFILES
-- ============================================================

create table public.teacher_profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  qualification text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PARENT PROFILES
-- ============================================================

create table public.parent_profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  phone_number text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS
-- Seeded with ZIMSEC subjects per level
-- ============================================================

create table public.subjects (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  code         text not null unique,
  zimsec_level zimsec_level not null,
  description  text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- STUDENT ↔ SUBJECT ENROLMENTS
-- ============================================================

create table public.student_subjects (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(student_id, subject_id)
);

-- ============================================================
-- TEACHER ↔ SUBJECT ASSIGNMENTS
-- ============================================================

create table public.teacher_subjects (
  id         uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(teacher_id, subject_id)
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.handle_updated_at();

create trigger teacher_profiles_updated_at
  before update on public.teacher_profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP TRIGGER
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.parent_profiles  enable row level security;
alter table public.subjects         enable row level security;
alter table public.student_subjects enable row level security;
alter table public.teacher_subjects enable row level security;

-- Helper: get the calling user's role
create or replace function public.get_my_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- profiles: users can read own row; admins can read all
create policy "profiles: own row"
  on public.profiles for select
  using (id = auth.uid() or public.get_my_role() = 'admin');

create policy "profiles: update own row"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin full access"
  on public.profiles for all
  using (public.get_my_role() = 'admin');

-- student_profiles: student sees own; parent sees linked child; teacher/admin see all
create policy "student_profiles: own"
  on public.student_profiles for select
  using (user_id = auth.uid());

create policy "student_profiles: parent view"
  on public.student_profiles for select
  using (parent_id = auth.uid());

create policy "student_profiles: teacher view"
  on public.student_profiles for select
  using (public.get_my_role() in ('teacher', 'admin'));

create policy "student_profiles: student update own"
  on public.student_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "student_profiles: student insert own"
  on public.student_profiles for insert
  with check (user_id = auth.uid());

-- teacher_profiles
create policy "teacher_profiles: own"
  on public.teacher_profiles for all
  using (user_id = auth.uid() or public.get_my_role() = 'admin');

create policy "teacher_profiles: all can view"
  on public.teacher_profiles for select
  using (true);

-- parent_profiles
create policy "parent_profiles: own"
  on public.parent_profiles for all
  using (user_id = auth.uid() or public.get_my_role() = 'admin');

-- subjects: everyone can read; only admins can write
create policy "subjects: all can view"
  on public.subjects for select
  using (true);

create policy "subjects: admin write"
  on public.subjects for all
  using (public.get_my_role() = 'admin');

-- student_subjects: student can manage own; teachers/admins can view
create policy "student_subjects: own"
  on public.student_subjects for all
  using (
    student_id in (
      select id from public.student_profiles where user_id = auth.uid()
    )
  );

create policy "student_subjects: teacher view"
  on public.student_subjects for select
  using (public.get_my_role() in ('teacher', 'admin'));

-- teacher_subjects: teacher manages own
create policy "teacher_subjects: own"
  on public.teacher_subjects for all
  using (
    teacher_id in (
      select id from public.teacher_profiles where user_id = auth.uid()
    )
    or public.get_my_role() = 'admin'
  );

-- ============================================================
-- SEED DATA — ZIMSEC SUBJECTS
-- ============================================================

-- PRIMARY LEVEL
insert into public.subjects (name, code, zimsec_level) values
  ('Mathematics',             'PRI-MATH',   'primary'),
  ('English Language',        'PRI-ENG',    'primary'),
  ('Shona',                   'PRI-SHO',    'primary'),
  ('Ndebele',                 'PRI-NDE',    'primary'),
  ('Environmental Science',   'PRI-ENV',    'primary'),
  ('Social Studies',          'PRI-SS',     'primary'),
  ('Heritage Studies',        'PRI-HER',    'primary');

-- O-LEVEL
insert into public.subjects (name, code, zimsec_level) values
  ('Mathematics',             'OL-MATH',    'olevel'),
  ('English Language',        'OL-ENG',     'olevel'),
  ('Shona',                   'OL-SHO',     'olevel'),
  ('Ndebele',                 'OL-NDE',     'olevel'),
  ('Combined Science',        'OL-CSCI',    'olevel'),
  ('Physics',                 'OL-PHY',     'olevel'),
  ('Chemistry',               'OL-CHEM',    'olevel'),
  ('Biology',                 'OL-BIO',     'olevel'),
  ('History',                 'OL-HIST',    'olevel'),
  ('Geography',               'OL-GEO',     'olevel'),
  ('Commerce',                'OL-COM',     'olevel'),
  ('Accounts',                'OL-ACC',     'olevel'),
  ('Business Studies',        'OL-BS',      'olevel'),
  ('Computer Science',        'OL-CS',      'olevel'),
  ('Food & Nutrition',        'OL-FN',      'olevel'),
  ('Art',                     'OL-ART',     'olevel'),
  ('Music',                   'OL-MUS',     'olevel'),
  ('Physical Education',      'OL-PE',      'olevel');

-- A-LEVEL
insert into public.subjects (name, code, zimsec_level) values
  ('Pure Mathematics',        'AL-PMATH',   'alevel'),
  ('Further Mathematics',     'AL-FMATH',   'alevel'),
  ('Statistics',              'AL-STAT',    'alevel'),
  ('Physics',                 'AL-PHY',     'alevel'),
  ('Chemistry',               'AL-CHEM',    'alevel'),
  ('Biology',                 'AL-BIO',     'alevel'),
  ('History',                 'AL-HIST',    'alevel'),
  ('Geography',               'AL-GEO',     'alevel'),
  ('Economics',               'AL-ECON',    'alevel'),
  ('Accounting',              'AL-ACC',     'alevel'),
  ('Business Studies',        'AL-BS',      'alevel'),
  ('Computer Science',        'AL-CS',      'alevel'),
  ('Literature in English',   'AL-LIT',     'alevel'),
  ('Shona',                   'AL-SHO',     'alevel'),
  ('Ndebele',                 'AL-NDE',     'alevel'),
  ('Divinity',                'AL-DIV',     'alevel'),
  ('Sociology',               'AL-SOC',     'alevel');
