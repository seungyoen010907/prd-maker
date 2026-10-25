"use client";

import { useState } from "react";
import type { Ref } from "@/lib/types";

type Props =
  | { item: Ref; compact?: false }
  // 보드에서는 이미지와 제목만 보여준다
  | { item: Pick<Ref, "image_url" | "title">; compact: true };

export default function RefCard(props: Props) {
  const { item } = props;
  const [broken, setBroken] = useState(false);

  return (
    <article>
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
