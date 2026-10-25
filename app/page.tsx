"use client";

import { useEffect, useMemo, useState } from "react";
import RefCard from "@/components/RefCard";
import type { Ref } from "@/lib/types";

// 클립보드나 드래그로 들어온 파일 중 첫 번째 이미지 (PRD 8-4)
function firstImage(files: FileList | undefined | null): File | null {
  if (!files) return null;
  return Array.from(files).find((f) => f.type.startsWith("image/")) ?? null;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Ref | null>(null);

  const trimmedUrl = imageUrl.trim();
  const isHttpUrl = /^https?:\/\//.test(trimmedUrl);

  // 붙여넣은 파일은 브라우저 안에서만 미리보기 (저장할 때 서버로 올린다)
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const previewSrc = file ? fileUrl : isHttpUrl ? trimmedUrl : "";

  function pickFile(f: File) {
    setFile(f);
    setImageUrl("");
    setPreviewBroken(false);
    setError("");
  }

  function clearImage() {
    setFile(null);
    setImageUrl("");
    setPreviewBroken(false);
  }

  // 화면 어디서든 Cmd+V / 끌어다 놓기 (PRD 8-4)
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const f = firstImage(e.clipboardData?.files);
      if (!f) return; // 글자 붙여넣기는 평소대로
      e.preventDefault();
      pickFile(f);
    }
    function onDragOver(e: DragEvent) {
      e.preventDefault();
      setDragging(true);
    }
    function onDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) setDragging(false);
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      setDragging(false);
      const f = firstImage(e.dataTransfer?.files);
      if (f) pickFile(f);
    }
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file && !isHttpUrl) {
      setError("이미지를 붙여넣거나, http:// 또는 https://로 시작하는 이미지 주소를 넣어 줘.");
      return;
    }
    if (!memo.trim()) {
      setError("메모를 한 줄이라도 적어 줘.");
      return;
    }

    setResult(null);
    try {
      // 1. 붙여넣은 파일이면 먼저 Storage에 올려서 주소를 받는다
      let finalUrl = trimmedUrl;
      if (file) {
        setLoadingText("이미지 올리는 중...");
        const form = new FormData();
        form.append("file", file);
        const up = await fetch("/api/uploads", { method: "POST", body: form });
        const upData = await up.json();
        if (!up.ok) {
          setError(upData.error ?? "이미지를 올리지 못했다.");
          return;
        }
        finalUrl = upData.url;
      }

      // 2. 평소처럼 저장 (AI → refs 테이블)
      setLoadingText("정리하는 중... (3~10초)");
      const res = await fetch("/api/refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: finalUrl,
          source_url: sourceUrl.trim(),
          memo: memo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "알 수 없는 오류가 났다.");
        return;
      }
      setResult(data as Ref);
      // 다음 레퍼런스를 바로 붙여넣을 수 있게 폼을 비운다
      clearImage();
      setSourceUrl("");
      setMemo("");
    } catch {
      setError("서버에 연결하지 못했다. npm run dev가 켜져 있는지 확인해 줘.");
    } finally {
      setLoadingText("");
    }
  }

  const loading = loadingText !== "";
  const inputClass =
    "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-text";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {previewSrc ? (
          <div className="relative">
            {previewBroken ? (
              <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted">
                이미지를 불러올 수 없다
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="미리보기"
                onError={() => setPreviewBroken(true)}
                className="mx-auto block max-h-[400px] max-w-full rounded-2xl"
              />
            )}
            <button
              type="button"
              onClick={clearImage}
              aria-label="이미지 빼기"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white text-sm font-bold text-black"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className={`flex h-40 items-center justify-center rounded-2xl border-2 border-dashed text-sm text-muted ${
              dragging ? "border-text" : "border-border"
            }`}
          >
            이미지를 붙여넣거나(Cmd+V) 끌어다 놓기
          </div>
        )}

        <input
          value={file ? "" : imageUrl}
          onChange={(e) => {
            setFile(null);
            setImageUrl(e.target.value);
            setPreviewBroken(false);
          }}
          placeholder={
            file
              ? `붙여넣은 이미지: ${file.name}`
              : "또는 이미지 주소 https://... (이미지 우클릭 > 이미지 주소 복사)"
          }
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
          {loading ? loadingText : "저장"}
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
