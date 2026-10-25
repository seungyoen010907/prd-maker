import { getSupabase } from "@/lib/supabase";

// POST /api/uploads (docs/API.md 4번, PRD 8-4)
// 붙여넣거나 끌어다 놓은 이미지 파일을 Storage refs 버킷에 올리고 공개 URL을 돌려준다.
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "요청 형식이 FormData가 아니다." }, { status: 400 });
  }

  // 1. 검증
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "이미지 파일이 없다." }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return Response.json({ error: "png, jpg, webp, gif 이미지만 올릴 수 있다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "이미지는 5MB 이하만 올릴 수 있다." }, { status: 400 });
  }

  // 2. 파일 이름은 새로 만든다 (원래 이름은 안 씀)
  const path = `${crypto.randomUUID()}.${ext}`;

  // 3. Storage에 올리기
  const bucket = getSupabase().storage.from("refs");
  const { error } = await bucket.upload(path, await file.arrayBuffer(), {
    contentType: file.type,
  });
  if (error) {
    console.error("upload failed:", error);
    return Response.json({ error: `이미지를 올리지 못했다: ${error.message}` }, { status: 500 });
  }

  // 4. 공개 URL 응답
  const { data } = bucket.getPublicUrl(path);
  return Response.json({ url: data.publicUrl }, { status: 201 });
}
