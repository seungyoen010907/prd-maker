// AI 출력 JSON Schema (docs/API.md 6번 RefMeta)
// strict 규칙: 모든 object에 additionalProperties: false, 모든 속성을 required에.
// 글자 수 제한은 스키마가 아니라 lib/openai.ts의 instructions로 지시한다.
export const refMetaSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    one_liner: { type: "string" },
  },
  required: ["title", "one_liner"],
  additionalProperties: false,
};
