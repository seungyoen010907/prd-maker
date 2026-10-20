# API / 데이터 / 외부 의존성 설계

> "어떻게 동작하는가"를 정하는 문서. 구조를 바꾸고 싶으면 이 문서부터 고치고 AI에게 시킨다.

## 1. 전체 구조

```
[브라우저]                         [Next.js 서버]                        [외부 서비스]
app/page.tsx       --- fetch --->  app/api/refs/route.ts   ---------->  OpenAI (제목/요약 붙이기)
app/refs/page.tsx                    |  lib/openai.ts
                                     |  lib/supabase.ts    ---------->  Supabase (저장/조회, Step 4부터 Storage)
```

규칙은 하나다. **브라우저 코드는 `/api/*`만 부른다. OpenAI와 Supabase는 서버 코드에서만 부른다.**

이유: 브라우저에서 돌아가는 코드는 누구나 개발자도구로 열어볼 수 있다. 거기에 OpenAI 키가 있으면 키가 털리고, 키가 털리면 크레딧이 털린다. 그래서 키를 들고 있는 "중간 서버"로 Next.js Route Handler(`app/api/.../route.ts`)를 하나 끼운다.

지난 세션과 비교: 지난번엔 React에서 Supabase를 publishable(anon) 키로 바로 불렀다. 그 키는 공개돼도 되는 키라서 가능했던 것이다. OpenAI 키는 공개되면 안 되는 키라서 이번엔 서버가 필요하다. Step 4의 이미지 업로드도 같은 이유로 서버(`/api/uploads`)를 거친다.

## 2. 폴더 구조 (완성 기준)

```
app/
  page.tsx                  추가: 입력 폼 + 미리보기 + 결과 카드 (client component)
  refs/page.tsx             보드 (client component)
  refs/[id]/page.tsx        상세 (P1, Suspense로 감싸기)
  api/refs/route.ts         POST, GET
  api/refs/[id]/route.ts    GET, DELETE (P1)
  api/uploads/route.ts      POST (Step 4, 8-4)
components/
  RefCard.tsx               레퍼런스 카드 (결과 카드, 보드 칸 공용)
lib/
  types.ts                  Ref, RefMeta 등 타입
  ref-schema.ts             AI 출력 JSON Schema
  openai.ts                 generateRefMeta()   서버 전용
  supabase.ts               getSupabase()       서버 전용
supabase/
  schema.sql                테이블 생성 SQL (+ Step 4 Storage 버킷)
```

이미지는 `next/image`가 아니라 일반 `<img>`로 보여준다. `next/image`는 외부 주소마다 `next.config.ts` 설정이 필요해서, 아무 사이트 이미지나 붙여넣는 이 서비스와 안 맞는다. (eslint의 `no-img-element` 경고는 무시해도 된다.)

## 3. 환경 변수 (`.env.local`)

| 이름 | 값 가져오는 곳 | 브라우저 노출 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI 대시보드 API keys (본인 키) | 절대 안 됨 |
| `OPENAI_MODEL` | 기본 `gpt-6-luna` | 안 됨 |
| `SUPABASE_URL` | Supabase 프로젝트 화면 위쪽 Connect 버튼 | 안 씀 (서버 전용) |
| `SUPABASE_SECRET_KEY` | Settings > API Keys > Secret keys (`sb_secret_...`). 옛날 프로젝트라 레거시 키만 있으면 `service_role` 키 | 절대 안 됨 |

- 이름 앞에 `NEXT_PUBLIC_`을 붙이면 브라우저 번들에 그대로 들어간다. 오늘은 `NEXT_PUBLIC_`을 쓸 일이 없다.
- `npm run dev`가 켜진 상태에서 `.env.local`을 저장하면 보통 자동으로 다시 읽어요(터미널에 `Reload env: .env.local`이 떠요). 값이 안 바뀐 것 같으면 브라우저를 새로고침하고, 그래도 안 되면 `Ctrl+C` → `npm run dev`로 다시 켜요.
- `.env.local`은 `.gitignore`에 이미 들어 있다 (`.env*`). 커밋되면 안 된다.

## 4. 엔드포인트

모든 에러 응답은 같은 모양이다: `{ "error": "사람이 읽을 수 있는 메시지" }`. 프론트는 이 메시지를 그대로 보여준다.

### POST `/api/refs` (P0)

레퍼런스 하나를 받아 AI로 제목/요약을 붙이고 저장한다.

요청 body:
```json
{
  "image_url": "https://example.com/poster.jpg",
  "source_url": "https://www.pinterest.com/pin/123/",
  "memo": "여백이 넓어서 제목 하나만 크게 보이는 게 좋다. 빨강 하나만 쓴 것도."
}
```

처리 순서:
1. 검증: `image_url`은 `http://` 또는 `https://`로 시작하고 2000자 이하, `memo` 1~1000자 (아니면 400). `source_url`은 비어도 됨(빈 문자열이면 null로 저장).
2. `generateRefMeta({ memo })`로 OpenAI 호출 (실패하면 502). 이미지 주소는 AI에게 보내지 않는다.
3. `refs` 테이블에 insert (실패하면 500)
4. 응답

응답 201:
```json
{ "id": "uuid", "created_at": "2026-10-20T...", "image_url": "...", "source_url": "...", "memo": "...", "title": "...", "meta": { "...": "RefMeta 객체 (6번 참고)" } }
```

Step 2에서는 3번(저장)을 빼고 `{ "image_url": "...", "memo": "...", "title": "...", "meta": ... }`만 돌려준다. Step 3에서 저장을 붙인다.

### GET `/api/refs` (P0)

응답 200:
```json
{ "items": [ { "id": "uuid", "created_at": "...", "image_url": "...", "title": "...", "one_liner": "..." } ] }
```

- 최신순 100개.
- `one_liner`는 jsonb 안에 있다. `select("id, created_at, image_url, title, one_liner:meta->>one_liner")`처럼 꺼낼 수 있다.
- Step 4(8-3)에서 `tags:meta->tags`를 select에 추가한다.

### GET `/api/refs/[id]` (P1)

응답 200 `{ "item": { ...refs row 전체 } }`, 없으면 404.

### DELETE `/api/refs/[id]` (P1)

응답 204 (본문 없음). Storage에 올린 파일은 지우지 않는다 (오늘 범위 밖).

### POST `/api/uploads` (Step 4, PRD 8-4)

붙여넣거나 끌어다 놓은 이미지 파일을 Storage에 올리고 공개 URL을 돌려준다. 브라우저는 이 URL을 받아서 평소처럼 `POST /api/refs`의 `image_url`로 보낸다.

요청: `FormData`, 필드 이름 `file`.

처리 순서:
1. 검증: 파일이 있고, 타입이 `image/png` / `image/jpeg` / `image/webp` / `image/gif` 중 하나, 5MB 이하 (아니면 400)
2. 파일 이름은 `crypto.randomUUID()` + 확장자로 새로 만든다 (원래 이름은 안 씀)
3. `getSupabase().storage.from("refs").upload(이름, 파일, { contentType })` (실패하면 500)
4. `getPublicUrl(이름)`으로 공개 URL을 얻어 응답

응답 201: `{ "url": "https://xxxx.supabase.co/storage/v1/object/public/refs/....png" }`

## 5. DB: `refs` 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid, PK, 기본값 `gen_random_uuid()` | |
| `created_at` | timestamptz, 기본값 `now()` | |
| `image_url` | text, not null | 이미지 주소 (Step 4부터는 Storage 공개 URL도) |
| `source_url` | text, null 허용 | 출처 페이지 주소 |
| `memo` | text, not null | 내가 쓴 메모 |
| `title` | text, not null | AI가 붙인 짧은 제목 (보드 표시용) |
| `meta` | jsonb, not null | AI 출력 전체 |

왜 AI 출력을 jsonb 한 칸에 통째로 넣나: 내 버전에서 태그 같은 필드를 추가해도 테이블을 안 고쳐도 된다. 보드에 꼭 필요한 값(`title`)만 따로 컬럼으로 뺐다.

권한 (`supabase/schema.sql`에 다 들어 있음):
- RLS를 켜고 정책은 하나도 안 만든다. 그러면 publishable 키(브라우저용)로는 아무것도 못 읽는다.
- 서버는 secret 키로 접속한다. secret 키는 RLS를 우회한다. 그래서 secret 키는 절대 브라우저로 가면 안 된다.
- 2026년 5월 30일 이후 만든 Supabase 프로젝트는 새 테이블이 API에 자동 노출되지 않는다. `grant` 문이 없으면 `42501 permission denied for table refs` 에러가 난다.
- Storage `refs` 버킷(Step 4)은 공개(public) 버킷이다. 주소만 알면 누구나 이미지를 볼 수 있지만, 올리기는 서버(secret 키)만 한다.

## 6. AI 호출 설계

| 항목 | 정한 것 |
|---|---|
| SDK | `openai` 공식 Node SDK |
| API | Responses API (`client.responses.create`) |
| 모델 | `process.env.OPENAI_MODEL`, 없으면 `gpt-6-luna` |
| 프롬프트 | `instructions` = 역할(PRD 8-2) + 규칙, `input` = 사용자가 쓴 메모 |
| 출력 형식 | 구조화 출력: `text.format = { type: "json_schema", name: "ref_meta", strict: true, schema }` |
| 결과 읽기 | `JSON.parse(response.output_text)` |

구조화 출력이 핵심이다. 그냥 "JSON으로 줘"라고 하면 가끔 형식이 깨지는데, JSON Schema를 주고 `strict: true`로 걸면 모델이 그 모양대로만 답한다. 그래서 화면 코드가 `meta.one_liner`를 안심하고 쓸 수 있다.

`instructions`에 꼭 넣을 규칙:
- 너는 말수 적은 아카이브 정리 조수다. 사용자가 쓴 메모만 근거로 정리한다.
- 메모에 없는 내용(이미지에 대한 추측, 평가, 칭찬, 조언)을 지어내지 않는다.
- 한국어로 쓴다.

### 출력 스키마: `RefMeta`

| 필드 | 타입 | 내용 |
|---|---|---|
| `title` | string | 메모를 대표하는 짧은 제목, 2~20자 (예: "넓은 여백의 단일 헤드라인") |
| `one_liner` | string | 메모를 한 문장으로 줄인 것, 60자 이내 |

`strict: true` 규칙 (어기면 OpenAI가 400 에러를 준다):
- 모든 object에 `additionalProperties: false`
- 모든 속성을 `required`에 넣는다. 선택 값이 필요하면 빈 문자열이나 빈 배열로 받는다.
- 글자 수, 개수 제한은 스키마가 아니라 `instructions` 문장으로 지시한다.

### 내 버전 필드 추가하는 법 (PRD 8-3: `tags`)

1. `lib/types.ts`의 `RefMeta`에 `tags: string[]` 추가
2. `lib/ref-schema.ts`에 같은 필드 추가 (`required`에도)
3. `lib/openai.ts`의 `instructions`에 규칙 한 줄 추가: "tags는 메모에 나온 시각 요소(형태·색·타이포·구도)를 2~6자 명사구 3개로"
4. `GET /api/refs`의 select에 `tags:meta->tags` 추가, `components/RefCard.tsx`에 태그 칩 표시
5. DB는 안 건드린다 (jsonb라서). 태그가 없는 예전 row는 칩을 안 보여준다.

## 7. 외부 의존성

| 패키지 | 왜 |
|---|---|
| `next`, `react`, `tailwindcss` | create-next-app 기본 |
| `openai` | OpenAI 공식 SDK |
| `@supabase/supabase-js` | Supabase 클라이언트 (DB와 Storage 둘 다) |

이 외에는 설치하지 않는다. AI가 `zod`, `axios`, `shadcn`, `prisma`, `@supabase/ssr`, 드래그앤드롭/메이슨리 라이브러리 같은 걸 깔자고 하면 거절한다. 붙여넣기는 `paste` 이벤트, 드래그는 `dragover`/`drop` 이벤트, 메이슨리 격자는 CSS `columns`로 충분하다. (`@supabase/ssr`은 로그인 쿠키 처리용인데 오늘은 로그인이 없다.) `server-only`는 Next.js가 내부에서 처리하므로 설치하지 않아도 된다.

## 8. Next.js 16 주의점

- Next 16.4부터 `create-next-app`이 `next.config.ts`에 `cacheComponents: true`를 켜 둔다. 이 상태에서 `params`, 쿠키, 캐시 안 한 데이터(Supabase 조회 등)를 기다리는 페이지는 `<Suspense>`로 감싸거나 그 폴더에 `loading.tsx`를 둬야 `npm run build`가 통과한다. 끄지 말고 감싼다.
- `AGENTS.md` 위쪽의 Next.js 블록은 `next dev`가 다시 써 넣는 영역이다. 지우지 말고, 우리 규칙은 그 아래에 둔다.
