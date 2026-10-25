"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RefCard from "@/components/RefCard";
import type { RefListItem } from "@/lib/types";

export default function BoardPage() {
  const [items, setItems] = useState<RefListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/refs")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "알 수 없는 오류가 났다.");
        setItems(data.items);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16">
      {error ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : items === null ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">
          아직 모은 레퍼런스가 없다.{" "}
          <Link href="/" className="font-bold text-text underline">
            추가하러 가기
          </Link>
        </p>
      ) : (
        // 메이슨리 격자: CSS columns (DESIGN.md 5번, 8번)
        <div className="columns-2 gap-2 md:columns-3 lg:columns-4">
          {items.map((item) => (
            // 카드 전체가 상세 링크 (DESIGN.md 5번)
            <Link
              key={item.id}
              href={`/refs/${item.id}`}
              className="mb-4 block break-inside-avoid"
            >
              <RefCard item={item} compact />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
