import { generateRefMeta } from "@/lib/openai";
import type { Ref } from "@/lib/types";

// POST /api/refs (docs/API.md 4번)
// Step 2: AI로 제목/요약만 붙여서 돌려준다. Supabase 저장은 Step 3에서 붙인다.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 JSON이 아니다." }, { status: 400 });
  }

  const { image_url, source_url, memo } = (body ?? {}) as Record<string, unknown>;

  // 1. 검증
  if (
    typeof image_url !== "string" ||
    !/^https?:\/\//.test(image_url.trim()) ||
    image_url.trim().length > 2000
  ) {
    return Response.json(
      { error: "이미지 주소는 http:// 또는 https://로 시작해야 한다 (2000자 이하)." },
      { status: 400 },
    );
  }
  if (typeof memo !== "string" || memo.trim().length < 1 || memo.trim().length > 1000) {
    return Response.json({ error: "메모는 1~1000자로 적어 줘." }, { status: 400 });
  }
  const source =
    typeof source_url === "string" && source_url.trim() ? source_url.trim() : null;

  // 2. AI 호출 (이미지 주소는 보내지 않는다)
  let meta;
  try {
    meta = await generateRefMeta({ memo: memo.trim() });
  } catch (err) {
    console.error("generateRefMeta failed:", err);
    return Response.json(
      { error: "AI가 정리하지 못했다. 잠시 뒤 다시 시도해 줘." },
      { status: 502 },
    );
  }

  // 3. 저장은 Step 3에서

  // 4. 응답
  const ref: Ref = {
    image_url: image_url.trim(),
    source_url: source,
    memo: memo.trim(),
    title: meta.title,
    meta,
  };
  return Response.json(ref, { status: 201 });
}
