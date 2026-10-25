"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RefCard from "@/components/RefCard";
import type { SavedRef } from "@/lib/types";

// /refs/[id] 상세 (P1, DESIGN.md 5번)
export default function RefDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<SavedRef | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/refs/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "알 수 없는 오류가 났다.");
        setItem(data.item);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!confirm("이 레퍼런스를 지울까? 되돌릴 수 없다.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/refs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "지우지 못했다.");
      }
      router.push("/refs");
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  if (error && !item) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
        <Link href="/refs" className="text-sm font-bold underline">
          보드로 돌아가기
        </Link>
      </div>
    );
  }
  if (!item) {
    return <p className="text-sm text-muted">불러오는 중...</p>;
  }

  return (
    <div>
      <RefCard item={item} />
      <p className="mt-4 text-xs text-muted">
        저장한 날: {new Date(item.created_at).toLocaleString("ko-KR")}
      </p>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="mt-8 w-full rounded-2xl bg-card py-3 text-sm font-bold text-muted disabled:opacity-60"
      >
        {deleting ? "지우는 중..." : "삭제"}
      </button>
    </div>
  );
}
