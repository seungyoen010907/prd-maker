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

// refs 테이블에 저장된 row (POST /api/refs 응답)
export type SavedRef = Ref & {
  id: string;
  created_at: string;
};

// 보드 한 칸 (GET /api/refs의 items)
export type RefListItem = {
  id: string;
  created_at: string;
  image_url: string;
  title: string;
  one_liner: string;
};
