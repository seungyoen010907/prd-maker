"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// DESIGN.md 4번: 보드(/refs)는 1280px, 나머지는 672px. 오른쪽 링크도 화면마다 바뀐다.
export default function Header() {
  const onBoard = usePathname() === "/refs";

  return (
    <header
      className={`mx-auto flex w-full items-start justify-between gap-4 px-4 pt-8 pb-6 ${
        onBoard ? "max-w-7xl" : "max-w-2xl"
      }`}
    >
      <div>
        <p className="text-lg font-bold">레퍼런스 아카이브</p>
        <p className="text-sm text-muted">
          이미지를 모으고 메모를 붙여 나만의 레퍼런스를 쌓는 곳
        </p>
      </div>
      <Link
        href={onBoard ? "/" : "/refs"}
        className="shrink-0 rounded-full bg-card px-4 py-2 text-sm font-bold"
      >
        {onBoard ? "추가" : "보드"}
      </Link>
    </header>
  );
}
