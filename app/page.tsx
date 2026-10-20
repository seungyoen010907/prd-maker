"use client";

import { useState } from "react";
import RefCard from "@/components/RefCard";
import type { Ref } from "@/lib/types";

// Step 1 전용 가짜 결과. Step 2에서 fetch("/api/refs")로 바꾼다.
function fakeRef(imageUrl: string, sourceUrl: string, memo: string): Ref {
  const firstLine = memo.split("\n")[0];
  const title = firstLine.length > 20 ? firstLine.slice(0, 20) + "…" : firstLine;
  return {
    image_url: imageUrl,
    source_url: sourceUrl || null,
    memo,
    title,
    meta: {
      title,
      one_liner: "(가짜 요약) Step 2에서 AI가 메모를 한 줄로 줄여 준다.",
    },
  };
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Ref | null>(null);

  const trimmedUrl = imageUrl.trim();
  const showPreview = /^https?:\/\//.test(trimmedUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!showPreview) {
      setError("이미지 주소는 http:// 또는 https://로 시작해야 한다.");
      return;
    }
    if (!memo.trim()) {
      setError("메모를 한 줄이라도 적어 줘.");
      return;
    }

    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(fakeRef(trimmedUrl, sourceUrl.trim(), memo.trim()));
      setLoading(false);
    }, 1000);
  }

  const inputClass =
    "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-text";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {showPreview &&
          (previewBroken ? (
            <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted">
              이미지를 불러올 수 없다
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmedUrl}
              alt="미리보기"
              onError={() => setPreviewBroken(true)}
              className="mx-auto block max-h-[400px] max-w-full rounded-2xl"
            />
          ))}

        <input
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewBroken(false);
          }}
          placeholder="https://... (이미지 우클릭 > 이미지 주소 복사)"
          className={inputClass}
        />
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="출처 (선택) https://www.pinterest.com/pin/..."
          className={inputClass}
        />
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="왜 저장했는지 한두 줄. 예: 여백이 넓어서 제목 하나만 보이는 게 좋다"
          className={`${inputClass} resize-none`}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "정리하는 중... (3~10초)" : "저장"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-10">
          <RefCard item={result} />
        </section>
      )}
    </main>
  );
}
