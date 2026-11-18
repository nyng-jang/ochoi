# 오늘의 최애 (ochoi)

최애 일정, 덕질 가계부, 앨범 선반과 포카 바인더를 한곳에 모은 덕질 웹앱이에요. 여러 사용자가 함께 쓰는 서비스이고, 오픈 목표일은 2026년 12월 2일이에요.

## 기술 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS 4). 미들웨어 파일은 Next 16 규칙에 따라 `src/proxy.ts`예요.
- Supabase: Auth, Postgres, Storage, pg_cron(알림·자동 수집 예정)
- Vercel 배포, PWA(홈 화면 추가 + 웹 푸시)

## 폴더 구조

```
src/
  app/
    api/artists/search/route.ts   GET  ?q=블랙핑크 → 위키데이터 후보 (그룹 먼저)
    api/artists/import/route.ts   POST {wikidataId} → 아티스트·멤버·앨범·생일 저장 + 내 아티스트 추가
    manifest.ts                   PWA 매니페스트
  lib/
    sources/http.ts               외부 API 공통 호출 (User-Agent, 재시도, 호스트별 간격)
    sources/wikidata.ts           SPARQL 검색·상세·멤버
    sources/music.ts              MusicBrainz + Deezer 디스코그래피 합치기
    artists/import.ts             온보딩 저장 로직 (하루 1회만 외부 조회)
    supabase/                     브라우저·서버·서비스 클라이언트
  proxy.ts                        로그인 세션 갱신
supabase/migrations/0001_init.sql DB 스키마 + RLS
```

## 데이터 구조

- **공유 테이블** (모든 사용자가 같이 읽고, 서버만 씀): `artists`, `group_members`, `albums`, `album_versions`, `events`, `videos`
- **개인 테이블** (RLS로 본인만): `profiles`, `user_artists`, `collection_items`, `expenses`, `recurring_expenses`, `birthday_time_stamps`, `push_subscriptions`
- **팬 참여**: `artist_corrections`(데뷔일·링크 수정 제안, 서로 다른 2명 이상이 같은 값이면 반영), `event_reports`(일정 오류 신고, 3건 이상이면 숨김)
- 사진은 비공개 Storage 버킷 `collection`에 `{user_id}/...` 경로로 저장해요.

## 외부 데이터 소스 (2026-11-18 검증)

| 소스 | 용도 | 키 |
| --- | --- | --- |
| 위키데이터 SPARQL | 아티스트 검색, 멤버, 생일, 공식 링크, 서비스별 ID | 없음 |
| MusicBrainz | 정규·EP·싱글 (한글 제목) | 없음 (초당 1회, User-Agent 필수) |
| Deezer | 최신 싱글·OST, 커버 | 없음 |
| Cover Art Archive | 앨범 커버 | 없음 |
| 한국어 위키백과 | 데뷔일 등 기념일 추출 (예정) | 없음 |
| YouTube Data API | 공식 영상, N년 전 오늘 (예정) | 필요 |
| 네이버 검색 API | 일정 뉴스 수집 (예정) | 필요 |
| TMDb | 드라마·영화 출연작 (예정) | 필요 |
| KOPIS | 콘서트 일정 (예정) | 필요 |

이름 검색은 동명이인이 많아서(예: "제니", "IU") 위키데이터에서 아티스트를 고른 뒤, 거기 저장된 ID로만 다른 서비스를 조회해요.

## 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```

Supabase 프로젝트에 `supabase/migrations/0001_init.sql`을 적용해야 해요 (SQL Editor에 붙여넣거나 `supabase db push`).

## 알려진 과제

- 디스코그래피 합치기: MusicBrainz와 Deezer의 발매일이 하루 이틀 다르면 같은 앨범이 두 번 들어갈 수 있어요. 제목 유사도로 한 번 더 비교해야 해요.
- 데뷔일: 위키데이터에는 연도만 있어서 `debut_date`는 비워 두고, 위키백과 추출과 팬 확인으로 채울 예정이에요.
