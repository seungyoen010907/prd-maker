import { Suspense } from "react";
import RefDetail from "@/components/RefDetail";

// [id]는 요청할 때 정해져서 useParams가 기다린다 → Suspense로 감싼다 (cacheComponents, AGENTS.md)
export default function RefDetailPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16">
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중...</p>}>
        <RefDetail />
      </Suspense>
    </main>
  );
}
