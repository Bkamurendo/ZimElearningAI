-- ============================================================
-- ANNOUNCEMENTS TABLE
-- Admin/teachers post announcements visible to all or by role
-- ============================================================

create table if not exists public.announcements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text not null,
  audience    text not null default 'all',   -- 'all' | 'students' | 'teachers' | 'parents'
  priority    text not null default 'normal', -- 'normal' | 'important' | 'urgent'
  posted_by   uuid not null references public.profiles(id) on delete cascade,
  is_active   boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Anyone logged in can read active announcements for their audience
create policy "Anyone can read active announcements"
  on public.announcements for select
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );

-- Only admins and teachers can create/update/delete
create policy "Admins and teachers can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'teacher')
    )
  );

-- ============================================================
-- BOOKMARKS TABLE
-- Students bookmark documents for quick access
-- ============================================================

create table if not exists public.bookmarks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.uploaded_documents(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, document_id)
);

alter table public.bookmarks enable row level security;

-- Users can only see their own bookmarks
create policy "Users see own bookmarks"
  on public.bookmarks for select
  using (user_id = auth.uid());

-- Users can create their own bookmarks
create policy "Users can create own bookmarks"
  on public.bookmarks for insert
  with check (user_id = auth.uid());

-- Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (user_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_announcements_active on public.announcements(is_active, created_at desc);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id, created_at desc);
