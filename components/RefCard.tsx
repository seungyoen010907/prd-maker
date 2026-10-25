"use client";

import { useState } from "react";
import type { Ref } from "@/lib/types";

type Props =
  | { item: Ref; compact?: false }
  // 보드에서는 이미지와 제목만 보여준다
  | { item: Pick<Ref, "image_url" | "title"> & { tags: string[] | null }; compact: true };

export default function RefCard(props: Props) {
  const { item } = props;
  const [broken, setBroken] = useState(false);
  // Step 4 이전에 저장한 row는 태그가 없다
  const tags = (props.compact ? props.item.tags : props.item.meta.tags) ?? [];

  return (
    <article>
      <div className="relative">
        {broken ? (
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-card text-sm text-muted">
            이미지를 불러올 수 없다
          </div>
        ) : (
          // 아무 사이트 이미지나 쓰므로 next/image 대신 img (docs/API.md 2번)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            onError={() => setBroken(true)}
            className="block w-full rounded-2xl bg-card"
          />
        )}
        {/* PRD 8-3 태그: 이미지 왼쪽 아래 흰 칩 (DESIGN.md 5번) */}
        {tags.length > 0 && (
          <ul className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-black"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className={props.compact ? "mt-2 px-1 text-sm font-bold" : "mt-3 text-base font-bold"}>
        {item.title}
      </h2>

      {!props.compact && (
        <>
          <p className="mt-1 text-sm text-muted">{props.item.meta.one_liner}</p>
          <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-card p-4 text-sm leading-relaxed">
            {props.item.memo}
          </p>
          {props.item.source_url && (
            <a
              href={props.item.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-xs text-muted underline"
            >
              출처: {props.item.source_url}
            </a>
          )}
        </>
      )}
    </article>
  );
}
