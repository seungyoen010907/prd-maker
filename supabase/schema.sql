-- 레퍼런스 아카이브: refs 테이블
-- Supabase 대시보드 > SQL Editor에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하다.

create table if not exists public.refs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  image_url   text not null,
  source_url  text,
  memo        text not null,
  title       text not null,
  meta        jsonb not null
);

create index if not exists refs_created_at_idx on public.refs (created_at desc);

-- RLS를 켜고 정책(policy)은 하나도 만들지 않는다.
-- => publishable(anon) 키로는 이 테이블을 읽지도 쓰지도 못한다.
-- => 우리 서버는 secret 키(service_role)로 접속하는데, 이 키는 RLS를 우회한다.
alter table public.refs enable row level security;

-- 2026-05-30 이후 만든 프로젝트는 새 테이블이 API에 자동 노출되지 않는다.
-- 이 grant가 없으면 "42501 permission denied for table refs" 에러가 난다.
grant select, insert, update, delete on public.refs to service_role;

-- [Step 4, PRD 8-4] 붙여넣은 이미지 파일을 올릴 Storage 버킷.
-- public = true: 공개 URL로 누구나 볼 수 있다. 올리기는 서버(secret 키)만 한다.
-- Step 3에서 같이 실행해도 괜찮다.
insert into storage.buckets (id, name, public)
values ('refs', 'refs', true)
on conflict (id) do nothing;
