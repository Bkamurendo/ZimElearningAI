-- ============================================================
-- MIGRATION 002 — LESSONS, ASSIGNMENTS, AI TUTOR, NOTIFICATIONS
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- COURSES (teacher-created, linked to a subject)
-- ============================================================

create table public.courses (
  id           uuid primary key default uuid_generate_v4(),
  subject_id   uuid not null references public.subjects(id),
  teacher_id   uuid not null references public.teacher_profiles(id),
  title        text not null,
  description  text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.handle_updated_at();

-- ============================================================
-- LESSONS (belong to a course, ordered)
-- ============================================================

create table public.lessons (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  content_type text not null check (content_type in ('text', 'video', 'pdf')),
  content      text not null,   -- markdown for text, URL for video/pdf
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.handle_updated_at();

-- ============================================================
-- LESSON PROGRESS (student completions)
-- ============================================================

create table public.lesson_progress (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.student_profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

-- ============================================================
-- ASSIGNMENTS (teacher-created per subject)
-- ============================================================

create table public.assignments (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.subjects(id),
  teacher_id  uuid not null references public.teacher_profiles(id),
  title       text not null,
  description text not null,
  due_date    timestamptz,
  max_score   integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger assignments_updated_at
  before update on public.assignments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================

create table public.assignment_submissions (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.student_profiles(id) on delete cascade,
  content       text not null,
  submitted_at  timestamptz not null default now(),
  score         integer,
  feedback      text,
  graded_at     timestamptz,
  unique(assignment_id, student_id)
);

-- ============================================================
-- AI CHAT MESSAGES (per user + subject, persistent history)
-- ============================================================

create table public.ai_chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index ai_chat_messages_user_subject on public.ai_chat_messages(user_id, subject_id, created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,  -- 'lesson_complete' | 'assignment_submitted' | 'assignment_graded'
  title      text not null,
  message    text not null,
  read       boolean not null default false,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_unread on public.notifications(user_id, read, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.courses              enable row level security;
alter table public.lessons              enable row level security;
alter table public.lesson_progress      enable row level security;
alter table public.assignments          enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.ai_chat_messages     enable row level security;
alter table public.notifications        enable row level security;

-- courses: teacher manages own; students/others can view published
create policy "courses: teacher full"
  on public.courses for all
  using (
    teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
    or public.get_my_role() = 'admin'
  );

create policy "courses: view published"
  on public.courses for select
  using (published = true);

-- lessons: same as courses
create policy "lessons: teacher full"
  on public.lessons for all
  using (
    course_id in (
      select id from public.courses
      where teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
    )
    or public.get_my_role() = 'admin'
  );

create policy "lessons: view if course published"
  on public.lessons for select
  using (
    course_id in (select id from public.courses where published = true)
  );

-- lesson_progress: student manages own; teachers/admin view all
create policy "lesson_progress: student own"
  on public.lesson_progress for all
  using (
    student_id in (select id from public.student_profiles where user_id = auth.uid())
  );

create policy "lesson_progress: teacher view"
  on public.lesson_progress for select
  using (public.get_my_role() in ('teacher', 'admin'));

-- assignments: teacher manages own; students view (enrolled subject)
create policy "assignments: teacher full"
  on public.assignments for all
  using (
    teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
    or public.get_my_role() = 'admin'
  );

create policy "assignments: student view"
  on public.assignments for select
  using (
    subject_id in (
      select ss.subject_id from public.student_subjects ss
      join public.student_profiles sp on sp.id = ss.student_id
      where sp.user_id = auth.uid()
    )
  );

-- assignment_submissions: student manages own; teacher views for their assignments
create policy "submissions: student own"
  on public.assignment_submissions for all
  using (
    student_id in (select id from public.student_profiles where user_id = auth.uid())
  );

create policy "submissions: teacher view"
  on public.assignment_submissions for select
  using (
    assignment_id in (
      select id from public.assignments
      where teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
    )
  );

create policy "submissions: teacher grade"
  on public.assignment_submissions for update
  using (
    assignment_id in (
      select id from public.assignments
      where teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
    )
  );

-- ai_chat_messages: user sees/inserts own only
create policy "ai_chat: own"
  on public.ai_chat_messages for all
  using (user_id = auth.uid());

-- notifications: user sees/updates own only
create policy "notifications: own"
  on public.notifications for all
  using (user_id = auth.uid());
