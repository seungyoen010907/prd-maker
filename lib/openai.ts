import "server-only";

import OpenAI from "openai";
import { refMetaSchema } from "@/lib/ref-schema";
import type { RefMeta } from "@/lib/types";

// AI 성격: docs/PRD.md 8-2, 규칙: docs/API.md 6번
const instructions = `너는 말수 적은 아카이브 정리 조수다. 사용자가 쓴 메모만 근거로 정리한다.
메모에 없는 내용(이미지에 대한 추측, 평가, 칭찬, 조언)을 지어내지 않는다.
한국어로 쓴다.
- title: 메모를 대표하는 짧은 제목, 2~20자. 명사구로.
- one_liner: 메모를 한 문장으로 줄인 것, 60자 이내.`;

export async function generateRefMeta(input: { memo: string }): Promise<RefMeta> {
  // 키는 여기서만 읽는다. 클라이언트도 함수 안에서 만든다 (환경변수가 없어도 빌드가 터지지 않게).
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-6-luna",
    instructions,
    input: `메모:\n${input.memo}`,
    text: {
      format: {
        type: "json_schema",
        name: "ref_meta",
        strict: true,
        schema: refMetaSchema,
      },
    },
  });

  return JSON.parse(response.output_text) as RefMeta;
}
