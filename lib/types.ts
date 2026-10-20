// AI가 메모를 읽고 붙여 주는 값 (docs/API.md 6번)
export type RefMeta = {
  title: string;
  one_liner: string;
};

// 레퍼런스 하나 (docs/API.md 5번 refs 테이블)
export type Ref = {
  image_url: string;
  source_url: string | null;
  memo: string;
  title: string;
  meta: RefMeta;
};
