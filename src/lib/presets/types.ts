export type PixelSpec =
  | { mode: 'exact'; w: number; h: number }
  | {
      mode: 'range';
      recommended: { w: number; h: number };
      min?: { w: number; h: number };
      max?: { w: number; h: number };
    };

export type PhotoPreset = {
  slug: string;
  name: string;
  org: string;
  physicalCm: { w: number; h: number };
  pixels: PixelSpec;
  format: 'jpg';
  fileSizeKB: { min?: number; max: number };
  /** 머리 길이(정수리~턱) 규정이 공식 출처에 있을 때만 */
  head?: { minCm: number; maxCm: number };
  background?: 'white' | 'plain';
  checklist: string[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  /** 공식 출처로 확인한 날짜 (YYYY-MM-DD). null이면 비공개 */
  verifiedAt: string | null;
};
