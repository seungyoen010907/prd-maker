import "server-only";

import { createClient } from "@supabase/supabase-js";

// secret 키는 RLS를 우회하는 마스터키라 서버에서만 쓴다 (docs/API.md 5번).
// 클라이언트는 함수 안에서 만든다 (환경변수가 없어도 빌드가 터지지 않게).
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 .env.local에 없다.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
