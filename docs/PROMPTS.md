# PROMPTS: 단계별로 AI에게 시키는 법

> 바이브 코딩의 핵심은 "한 번에 다 시키지 않기"다. Step 하나 시키고 -> 직접 눈으로 확인하고 -> 이해 질문 하나 던지고 -> 커밋. 이 루프를 4번 돈다.
> Claude Code는 `claude`, Codex는 `codex`로 프로젝트 폴더에서 실행한다. 둘 다 `AGENTS.md`를 읽는다 (Claude Code는 `CLAUDE.md`를 통해).

## 루프

```
문서 확인 -> 프롬프트 -> AI 구현 -> 내가 직접 확인 -> 이해 질문 -> git commit
```

AI가 "다 됐습니다"라고 해도 믿지 마라. 확인은 내가 한다. 브라우저에서 눌러 보고, 터미널 로그 보고, Supabase 화면 열어 본다.

---

## Step 0. 계획 세우기 (코드 0줄)

```
docs/PRD.md, docs/DESIGN.md, docs/API.md, AGENTS.md를 읽어.
1) 이 프로젝트가 뭘 만드는지 5줄로 요약해.
2) Step 1~4 구현 계획을 단계별로 짧게 세워. 각 단계에서 만들거나 고칠 파일 이름을 적어.
아직 코드는 쓰지 마.
```

- 계획 모드로 보내면 더 좋다. Claude Code는 화면 아래 plan mode on이 보일 때까지 Shift+Tab(보통 세 번) 또는 프롬프트 앞에 `/plan`, Codex는 프롬프트 앞에 `/plan`.
- 확인: 요약이 PRD(레퍼런스 아카이브)랑 다르면 여기서 바로 잡는다. 나중에 잡으면 비싸다.

---

## Step 1. 화면만 (가짜 데이터)

```
Step 1만 해.
- docs/API.md 6번의 RefMeta 타입과, 화면에 쓸 Ref 타입(image_url, source_url, memo, title, meta)을 lib/types.ts에 만들어.
- docs/DESIGN.md 규칙대로 app/page.tsx에 입력 폼 + 이미지 미리보기, components/RefCard.tsx에 레퍼런스 카드를 만들어. 내가 고른 프리셋은 DESIGN.md 8번에 있어.
- 아직 API가 없으니까, 저장을 누르면 1초 뒤에 내가 넣은 이미지와 메모에 가짜 제목/한 줄 요약을 붙인 카드를 보여줘.
끝나면 바뀐 파일 목록, 브라우저에서 확인하는 방법, 코드 실행 순서를 3줄로 알려줘.
```

- 확인: `npm run dev` -> http://localhost:3000 -> 이미지 주소를 붙여넣으면 미리보기가 뜨고, 메모 쓰고 저장 -> 1초 뒤 카드가 뜬다.
- 이해 질문: `app/page.tsx 맨 위 "use client"는 왜 있어? 지우면 어떤 에러가 나고 왜 나?`
- 커밋: `git add . && git commit -m "step1: UI with mock data"`

---

## Step 2. OpenAI 연결

준비 (사람이 직접): `.env.local`에 `OPENAI_API_KEY`, `OPENAI_MODEL` 넣고 저장. 터미널에 `Reload env`가 안 뜨면 dev 서버 재시작.

```
Step 2만 해. docs/API.md 4번, 6번대로:
- lib/ref-schema.ts에 RefMeta JSON Schema를 만들어 (strict 규칙 지켜).
- lib/openai.ts에 generateRefMeta({ memo })를 만들어. 맨 위에 import "server-only". instructions는 docs/PRD.md 8-2 톤과 API.md 6번 규칙대로.
- app/api/refs/route.ts에 POST를 만들어. 이번 단계에서는 Supabase 저장 없이 { image_url, memo, title, meta }만 돌려줘.
- app/page.tsx의 가짜 데이터를 지우고 fetch("/api/refs")로 바꿔. 로딩/에러 상태는 DESIGN.md 6번대로.
끝나면 바뀐 파일 목록, 확인 방법, 실행 순서를 알려줘.
```

- 확인 1: 내 메모를 바탕으로 한 진짜 제목과 한 줄 요약이 뜬다. 메모에 없는 칭찬이나 평가가 붙으면 instructions를 고친다.
- 확인 2: 브라우저 개발자도구 > Network 탭 > `refs` 요청을 눌러 본다. 요청과 응답 어디에도 `sk-`로 시작하는 키가 없어야 한다.
- 확인 3: `npm run dev` 터미널에 `POST /api/refs 201` 같은 로그가 찍힌다. 이게 서버에서 돈 코드다.
- 이해 질문: `저장 버튼을 누른 순간부터 카드가 뜰 때까지, 어떤 파일의 어떤 함수가 어떤 순서로 실행되는지 번호 매겨서 설명해. 브라우저에서 도는 것과 서버에서 도는 것을 구분해서.`
- 커밋: `git add . && git commit -m "step2: title and summary with OpenAI"`

---

## Step 3. Supabase 저장 + 보드

준비 (사람이 직접, AI한테 시키지 말 것):
1. Supabase 대시보드 > SQL Editor > `supabase/schema.sql` 내용 전체 붙여넣고 Run
2. Table Editor에서 `refs` 테이블이 생겼는지 확인
3. `.env.local`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 넣고 저장 (`Reload env`가 안 뜨면 dev 서버 재시작)

```
Step 3만 해. docs/API.md 4번, 5번대로:
- lib/supabase.ts에 getSupabase()를 만들어. 맨 위에 import "server-only", secret 키 사용.
- POST /api/refs가 결과를 refs 테이블에 저장하고 저장된 row를 돌려주게 바꿔.
- GET /api/refs와 app/refs/page.tsx 보드 페이지를 만들어. 메이슨리 격자는 DESIGN.md 5번, 8번대로. 빈 상태/에러 상태도 처리해.
- 메인 헤더에 "보드" 링크를 달아.
끝나면 바뀐 파일 목록, 확인 방법, 실행 순서를 알려줘.
```

- 확인 1: 레퍼런스를 하나 저장하고 Supabase Table Editor를 새로고침하면 row가 보인다.
- 확인 2: `/refs`에 이미지 격자가 뜨고, 새로고침해도 남아 있다. 브라우저 폭을 줄이면 열 개수가 4 → 3 → 2로 바뀐다.
- 이해 질문: `secret 키를 'use client' 파일에서 쓰면 무슨 일이 생겨? 지금 refs 테이블의 RLS는 어떤 상태고, 왜 그렇게 해도 우리 앱은 동작해?`
- 커밋: `git add . && git commit -m "step3: save to Supabase and board"`

---

## Step 4. 내 버전

8-3(태그)과 8-4(붙여넣기)를 한 번에 시키지 말고 하나씩 한다. 태그가 작아서 먼저 한다.

### 4-1. 태그 (PRD 8-3)

```
docs/PRD.md 8-3만 구현해. docs/API.md 6번 "내 버전 필드 추가하는 법" 순서를 따라.
먼저 계획(바꿀 파일과 이유)만 보여주고, 내가 OK 하면 구현해.
```

- 확인: 새로 저장한 레퍼런스의 보드 카드에 태그 칩 3개가 보인다. 예전 카드는 칩 없이 깨지지 않고 보인다.
- 커밋: `git add . && git commit -m "step4: my version - tags"`

### 4-2. 붙여넣기 / 드래그 추가 (PRD 8-4)

준비 (사람이 직접): Step 3에서 `schema.sql`을 다 실행했다면 Supabase 대시보드 > Storage에 `refs` 버킷이 이미 있다. 없으면 `schema.sql` 맨 아래 `insert into storage.buckets ...` 부분만 다시 Run.

```
docs/PRD.md 8-4만 구현해. docs/API.md 4번의 POST /api/uploads와 DESIGN.md 5번 입력 폼 규칙대로.
붙여넣기는 paste 이벤트, 드래그는 dragover/drop 이벤트로. 새 패키지는 설치하지 마.
먼저 계획(바꿀 파일과 이유)만 보여주고, 내가 OK 하면 구현해.
```

- 확인 1: 스크린샷을 찍고(Mac은 `Cmd+Ctrl+Shift+4`로 클립보드에 복사) `/`에서 `Cmd+V` -> 미리보기가 뜬다 -> 메모 쓰고 저장 -> 새로고침해도 보드에 보인다.
- 확인 2: Supabase Storage > `refs` 버킷에 파일이 하나 생겼다.
- 커밋: `git add . && git commit -m "step4: my version - paste and drop"` 그리고 `git push`

시간 남으면: `/refs/[id]` 상세/삭제 (PRD 4번 P1).

---

## 막혔을 때 쓰는 프롬프트

### 에러가 났다
```
아래 에러가 났다. 고치기 전에 원인을 먼저 설명해. 어느 파일 몇 번째 줄 문제인지, 왜 그런지.
그다음 최소한으로만 고쳐. 관련 없는 파일은 건드리지 마.

[브라우저 에러 화면 또는 빨간 박스 메시지]
[npm run dev 터미널에 찍힌 로그]
```
에러 메시지는 화면에 보이는 것과 터미널에 찍힌 것 둘 다 붙인다. 서버 에러는 터미널에만 찍힌다.

### AI가 갑자기 너무 많이 바꿨다
```
git status
git diff
git restore .
```
마지막 커밋으로 돌아간다. 그다음 요청을 더 작게 쪼개서 다시 시킨다.

### 코드가 이해가 안 된다
```
방금 바꾼 코드를 Next.js 처음 하는 사람한테 설명하듯 설명해.
파일별로 3줄 이내, 비유 하나 써도 됨. 그리고 내가 이해했는지 확인할 질문 하나 내줘.
```

### AI가 문서랑 다르게 만든다
```
docs/API.md 몇 번 항목과 지금 코드가 다르다: (다른 점)
문서가 기준이다. 문서대로 고쳐.
```
문서가 틀린 거라면 문서를 먼저 고치고 다시 시킨다. 코드만 고치면 다음 Step에서 AI가 또 문서대로 되돌린다.
