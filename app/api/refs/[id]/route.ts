import { getSupabase } from "@/lib/supabase";

// id 모양이 아니면 DB까지 가지 않고 바로 404
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/refs/[id] (P1, docs/API.md 4번)
export async function GET(_request: Request, ctx: RouteContext<"/api/refs/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return Response.json({ error: "그런 레퍼런스는 없다." }, { status: 404 });
  }

  const { data, error } = await getSupabase().from("refs").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("select ref failed:", error);
    return Response.json({ error: `불러오지 못했다: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "그런 레퍼런스는 없다." }, { status: 404 });
  }
  return Response.json({ item: data });
}

// DELETE /api/refs/[id] (P1). Storage에 올린 파일은 지우지 않는다 (오늘 범위 밖).
export async function DELETE(_request: Request, ctx: RouteContext<"/api/refs/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return Response.json({ error: "그런 레퍼런스는 없다." }, { status: 404 });
  }

  const { error } = await getSupabase().from("refs").delete().eq("id", id);
  if (error) {
    console.error("delete ref failed:", error);
    return Response.json({ error: `지우지 못했다: ${error.message}` }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
