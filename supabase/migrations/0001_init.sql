-- 오늘의 최애 (ochoi) 초기 스키마
-- 공유 테이블: 아티스트 단위로 한 번만 조회해 모든 사용자가 같이 씀 (읽기는 로그인 사용자 전체, 쓰기는 서버(service role)만)
-- 개인 테이블: RLS로 본인 데이터만 접근

create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────── 공유: 아티스트 ─────────────────────────

create table public.artists (
  id            uuid primary key default gen_random_uuid(),
  wikidata_id   text unique not null,            -- 예: Q20145 (아이유), Q25056945 (블랙핑크)
  kind          text not null check (kind in ('solo', 'group')),
  name_ko       text not null,
  name_en       text,
  birth_date    date,                            -- 솔로만
  debut_date    date,                            -- 연도만 알면 null, debut_year에 저장
  debut_year    int,
  color         text,                            -- 방 테마 컬러 (#RRGGBB)
  musicbrainz_id text,
  deezer_id     text,
  discogs_id    text,
  tmdb_id       text,
  links         jsonb not null default '{}'::jsonb, -- {youtube:[], instagram:[], x:[], website:[], spotify:[], weibo:[]}
  fetched_at    timestamptz,                     -- 마지막 외부 조회 시각 (하루 1회 갱신)
  created_at    timestamptz not null default now()
);

-- 그룹 ↔ 멤버 (멤버도 artists 행 하나, kind='solo')
create table public.group_members (
  group_id  uuid not null references public.artists(id) on delete cascade,
  member_id uuid not null references public.artists(id) on delete cascade,
  primary key (group_id, member_id)
);

create table public.albums (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null references public.artists(id) on delete cascade,
  title            text not null,                -- 한글 제목 우선 (MusicBrainz), 없으면 Deezer
  title_alt        text,
  release_type     text,                         -- album | ep | single | ost | other
  release_date     date,
  cover_url        text,
  musicbrainz_rg_id text unique,
  deezer_album_id  text unique,
  created_at       timestamptz not null default now()
);
create index albums_artist_idx on public.albums (artist_id, release_date);

-- 앨범 버전 (포토북, 디지팩, 플랫폼 등) — 선반의 책등 두께와 미보유 도감에 사용
create table public.album_versions (
  id        uuid primary key default gen_random_uuid(),
  album_id  uuid not null references public.albums(id) on delete cascade,
  name      text not null,
  format    text check (format in ('photobook', 'digipack', 'jewel', 'platform', 'other')),
  unique (album_id, name)
);

-- 일정 (뉴스·유튜브 자동 수집, 생일·기념일 자동 생성)
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.artists(id) on delete cascade,
  kind         text not null,                    -- birthday | anniversary | comeback | mv | showcase | music_show | concert | ticket_open | broadcast | other
  title        text not null,
  starts_at    timestamptz not null,
  all_day      boolean not null default false,
  status       text not null default 'confirmed' check (status in ('unconfirmed', 'confirmed')),
  recurring_yearly boolean not null default false,
  sources      jsonb not null default '[]'::jsonb, -- [{url, title, fetched_at}]
  report_count int not null default 0,           -- 오류 신고 수 (쌓이면 숨김)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index events_artist_time_idx on public.events (artist_id, starts_at);
create index events_title_trgm_idx on public.events using gin (title extensions.gin_trgm_ops); -- 중복 검사용 유사도

-- 공식 채널 영상 (N년 전 오늘)
create table public.videos (
  youtube_id   text primary key,
  artist_id    uuid not null references public.artists(id) on delete cascade,
  title        text not null,
  published_at timestamptz not null,
  thumbnail_url text
);
create index videos_artist_day_idx on public.videos (artist_id, (extract(month from published_at at time zone 'Asia/Seoul')), (extract(day from published_at at time zone 'Asia/Seoul')));

-- 팬 수정 제안 (데뷔일·생일·링크 등). 서로 다른 사용자 2명 이상이 같은 값이면 서버가 artists에 반영
create table public.artist_corrections (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artists(id) on delete cascade,
  field      text not null,                      -- debut_date | birth_date | links.instagram ...
  value      text not null,
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  unique (artist_id, field, user_id)
);

-- ───────────────────────── 개인 ─────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text,
  monthly_budget int,                            -- 원
  created_at    timestamptz not null default now()
);

create table public.user_artists (
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  artist_id   uuid not null references public.artists(id) on delete cascade,
  bias_member_id uuid references public.artists(id),   -- 최애 멤버
  sort_order  int not null default 0,
  is_memory_room boolean not null default false,     -- 추억의 방 (알림·수집 끔)
  monthly_budget int,
  primary key (user_id, artist_id)
);

create table public.collection_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  artist_ids  uuid[] not null,                   -- 콜라보 굿즈는 여러 방에 진열
  kind        text not null check (kind in ('album', 'photocard', 'goods')),
  album_id    uuid references public.albums(id),
  album_version_id uuid references public.album_versions(id),
  member_id   uuid references public.artists(id),-- 포카 멤버
  category    text,                              -- 굿즈: lightstick | doll | keyring | slogan | poster | apparel | season_greeting | concert_md | free_gift
  title       text,
  image_path  text,                              -- Supabase Storage 경로 (본인만 접근)
  status      text not null default 'owned' check (status in ('owned', 'wishlist')),
  opened      boolean,
  quantity    int not null default 1,
  storage_location text,
  acquired_on date,
  binder_slot jsonb,                             -- {binder_id, page, pocket}
  created_at  timestamptz not null default now()
);
create index collection_user_idx on public.collection_items (user_id, kind);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  artist_id   uuid references public.artists(id),
  spent_on    date not null,
  amount      int not null check (amount >= 0),  -- 원
  category    text not null,                     -- album | goods | ticket | birthday_cafe | transport | membership | other
  merchant    text,
  memo        text,
  collection_item_id uuid references public.collection_items(id) on delete set null,
  source      text not null default 'manual' check (source in ('manual', 'receipt', 'recurring')),
  created_at  timestamptz not null default now()
);
create index expenses_user_month_idx on public.expenses (user_id, spent_on);

create table public.recurring_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  artist_id   uuid references public.artists(id),
  title       text not null,
  amount      int not null,
  repeat_every text not null check (repeat_every in ('monthly', 'yearly')),
  next_on     date not null
);

-- 생일시 출석 도장
create table public.birthday_time_stamps (
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  member_id  uuid not null references public.artists(id) on delete cascade,
  stamped_on date not null,
  primary key (user_id, member_id, stamped_on)
);

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint   text unique not null,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

create table public.event_reports (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade default auth.uid(),
  primary key (event_id, user_id)
);

-- ───────────────────────── RLS ─────────────────────────

alter table public.artists             enable row level security;
alter table public.group_members       enable row level security;
alter table public.albums              enable row level security;
alter table public.album_versions      enable row level security;
alter table public.events              enable row level security;
alter table public.videos              enable row level security;
alter table public.artist_corrections  enable row level security;
alter table public.profiles            enable row level security;
alter table public.user_artists        enable row level security;
alter table public.collection_items    enable row level security;
alter table public.expenses            enable row level security;
alter table public.recurring_expenses  enable row level security;
alter table public.birthday_time_stamps enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.event_reports       enable row level security;

-- 공유 테이블: 로그인 사용자 읽기 전용 (쓰기는 service role이 RLS를 우회)
create policy "read shared" on public.artists        for select to authenticated using (true);
create policy "read shared" on public.group_members  for select to authenticated using (true);
create policy "read shared" on public.albums         for select to authenticated using (true);
create policy "read shared" on public.album_versions for select to authenticated using (true);
create policy "read shared" on public.events         for select to authenticated using (report_count < 3);
create policy "read shared" on public.videos         for select to authenticated using (true);

-- 수정 제안·오류 신고: 본인 것만 쓰고 읽기
create policy "own corrections" on public.artist_corrections for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own reports" on public.event_reports for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 개인 테이블: 본인만
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own rows" on public.user_artists        for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.collection_items    for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.expenses            for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.recurring_expenses  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.birthday_time_stamps for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.push_subscriptions  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 가입 시 프로필 자동 생성
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 개인 사진 버킷 (비공개, 경로 첫 폴더 = 사용자 id)
insert into storage.buckets (id, name, public) values ('collection', 'collection', false)
  on conflict (id) do nothing;
create policy "own photos" on storage.objects for all to authenticated
  using (bucket_id = 'collection' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'collection' and (storage.foldername(name))[1] = (select auth.uid())::text);
