# 증명사진 규격 맞춤기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기관(여권, 주민등록증, 운전면허, Q-net, 공무원 시험, 토익)을 고르면 그 규격(픽셀, 실물 크기, 용량, 머리 비율)에 정확히 맞는 증명사진 JPG를 브라우저에서 만들어 주는 정적 웹사이트를 출시한다.

**Architecture:** Next.js App Router 정적 내보내기(`output: 'export'`). 기관 규격은 `src/lib/presets/data.ts` 한 곳의 데이터이고, 여기서 기관별 페이지(`/photo/[preset]`), 크롭 가이드선, 규격 도해(SVG)가 모두 파생된다. 이미지 처리(로드 → 크롭 → JPEG 용량 맞춤 → DPI 기록)는 전부 브라우저 캔버스에서 하며 서버는 없다. 순수 계산 로직(`src/lib/photo/*`)은 React와 분리해 단위 테스트한다.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, react-easy-crop, heic2any, Vitest + Testing Library, sharp + tsx (빌드 시 예시 결과 용량 측정), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-10-01-id-photo-tool-design.md`

## Global Constraints

- 사진은 절대 서버로 전송하지 않는다. 네트워크 요청은 GA4/AdSense 스크립트뿐이다.
- 공식 출처로 확인하지 못한 규격 값은 넣지 않는다. `verifiedAt`이 `null`인 프리셋은 페이지·sitemap·목록에 나오지 않는다.
- 규격 도해에 표시하는 용량은 빌드 시 실제 인코딩해 측정한 값만 쓴다. 꾸며낸 숫자 금지.
- 용량 판정: 최대 용량은 `maxKB × 1000 − 64` 바이트 이하 (KB 해석 차이와 DPI 헤더 18바이트를 흡수하는 안전 여유), 최소 용량은 `minKB × 1024` 바이트 이상.
- 사이트 이름은 `src/config/site.ts` 한 곳에서만 관리한다 (현재 가칭 "증명사진 규격 맞춤기").
- `src/lib/**`와 `src/data/**`는 `@/` 별칭 없이 상대 경로로만 import한다 (빌드 스크립트가 tsx로 직접 실행하기 때문).
- 이번 범위 제외: 로그인, 결제, 다국어, 다크모드 토글, 사용자 프리셋 저장, 얼굴 자동 인식, 배경 제거, 인화용 배치 출력, 홈 화면 도해 갤러리.
- UI 문구는 한국어.
- Node 22 LTS (22.12 이상). 로컬은 nvm-windows로 22.14.0 사용.

## File Structure

```
next.config.ts                     정적 내보내기 설정
vitest.config.mts / vitest.setup.ts 테스트 설정
scripts/build-samples.ts           예시 사진을 기관별로 인코딩해 용량을 JSON에 기록 (prebuild)
public/samples/sample-original.svg 예시 인물 자리표시 실루엣 (AI 사진으로 교체 예정)
src/config/site.ts                 사이트 이름·설명·URL
src/lib/presets/types.ts           PhotoPreset 타입
src/lib/presets/data.ts            기관 6개 규격 데이터
src/lib/presets/index.ts           조회·검증·요약 함수
src/lib/photo/target.ts            TargetSpec, 용량 한계, 결과 판정, 바이트 표시
src/lib/photo/crop-math.ts         가이드선 위치, 얼굴 좌표 → 크롭 박스, 이미지 경계 보정
src/lib/photo/fit-size.ts          JPEG 품질 이진 탐색으로 용량 맞춤
src/lib/photo/jfif-dpi.ts          JPEG 바이트에 DPI 기록
src/lib/photo/canvas.ts            canvas → Blob 헬퍼
src/lib/photo/export-photo.ts      크롭 → 목표 픽셀 → 용량 맞춤 → DPI → 결과
src/lib/photo/load-image.ts        파일 → 정규화된 캔버스 (HEIC, EXIF 회전, 대형 축소)
src/lib/photo/custom-target.ts     직접 입력 값 검증 → TargetSpec
src/lib/analytics.ts               GA4 이벤트 헬퍼
src/data/sample-photo.ts           예시 사진 경로·크기·얼굴 좌표
src/data/sample-results.json       (생성됨) 원본/기관별 결과 용량
src/components/GuideOverlay.tsx    크롭 박스 위 가이드선 SVG
src/components/PhotoTool.tsx       업로드 → 크롭 → 결과 UI
src/components/CustomPhotoTool.tsx 직접 입력 폼 + PhotoTool
src/components/SpecDiagram.tsx     Before → After 규격 도해 SVG
src/components/AdSlot.tsx          AdSense 자리 (설정 없으면 렌더링 안 함)
src/components/Analytics.tsx       GA4·AdSense 스크립트 로더
src/app/layout.tsx                 공통 레이아웃
src/app/page.tsx                   홈
src/app/photo/page.tsx             기관 목록 + 직접 입력
src/app/photo/[preset]/page.tsx    기관별 페이지
src/app/privacy/page.tsx           개인정보처리방침
src/app/sitemap.ts / robots.ts     SEO
```

---

### Task 1: 프로젝트 뼈대와 테스트 환경

**Files:**
- Create: Next.js 기본 파일 일체 (create-next-app), `vitest.config.mts`, `vitest.setup.ts`, `src/config/site.ts`, `src/config/site.test.ts`
- Modify: `next.config.ts`, `package.json` (scripts)

**Interfaces:**
- Produces: `siteConfig: { name: string; description: string; url: string }` (`src/config/site.ts`), `npm test` / `npm run build` 명령

- [ ] **Step 1: git 저장소 초기화**

`D:\MyProject\WebTools`에서:

```bash
git init
git add docs
git commit -m "docs: add market research, id-photo spec and plan"
```

- [ ] **Step 2: Next.js 생성**

`docs/`는 create-next-app이 허용하는 기존 폴더라 현재 폴더에 바로 생성할 수 있다.

```bash
npx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
```

Expected: `src/app/page.tsx`, `package.json`, `next.config.ts` 생성.

- [ ] **Step 3: 의존성 설치**

```bash
npm i react-easy-crop heic2any
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom sharp tsx
```

- [ ] **Step 4: 정적 내보내기 설정** — `next.config.ts` 전체를 교체:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 5: Vitest 설정** — `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: package.json scripts** — `"scripts"`를 다음으로 교체 (`samples`와 `prebuild`는 Task 7에서 추가):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "npx serve out",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: 실패하는 테스트 작성** — `src/config/site.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { siteConfig } from './site';

describe('siteConfig', () => {
  it('has a name and an absolute url without trailing slash', () => {
    expect(siteConfig.name.length).toBeGreaterThan(0);
    expect(siteConfig.url).toMatch(/^https:\/\/[^/]+$/);
  });
});
```

- [ ] **Step 8: 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './site'`

- [ ] **Step 9: 구현** — `src/config/site.ts`:

```ts
// 사이트 이름이 확정되면 이 파일만 고친다.
export const siteConfig = {
  name: '증명사진 규격 맞춤기',
  description:
    '여권·주민등록증·운전면허·Q-net·공무원 시험·토익 사진 규격(픽셀, 용량, 머리 비율)을 브라우저에서 바로 맞춥니다. 사진은 서버로 전송되지 않습니다.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, ''),
};
```

- [ ] **Step 10: 통과 확인**

Run: `npm test`
Expected: PASS (1 test)

Run: `npm run build`
Expected: 성공, `out/index.html` 생성

- [ ] **Step 11: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Next.js static site with Vitest"
```

---

### Task 2: 기관 규격 데이터와 검증

**Files:**
- Create: `src/lib/presets/types.ts`, `src/lib/presets/data.ts`, `src/lib/presets/index.ts`
- Test: `src/lib/presets/presets.test.ts`

**Interfaces:**
- Produces:
  - `type PhotoPreset` (아래 정의)
  - `PHOTO_PRESETS: PhotoPreset[]`
  - `publishedPresets(): PhotoPreset[]` — `verifiedAt !== null`인 것만
  - `getPreset(slug: string): PhotoPreset | undefined` — 공개된 것 중에서만
  - `validatePreset(p: PhotoPreset): string[]` — 오류 메시지 목록 (빈 배열이면 정상)
  - `presetSummary(p: PhotoPreset): string` — 예: `"3.5×4.5cm · 413×531px · 500KB 이하"`
  - `downloadFileName(p: PhotoPreset, widthPx: number, heightPx: number): string` — 예: `"여권사진_413x531.jpg"`

- [ ] **Step 1: 타입 작성** — `src/lib/presets/types.ts`:

```ts
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
```

- [ ] **Step 2: 실패하는 테스트 작성** — `src/lib/presets/presets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PHOTO_PRESETS,
  publishedPresets,
  getPreset,
  validatePreset,
  presetSummary,
  downloadFileName,
} from './index';
import type { PhotoPreset } from './types';

const base: PhotoPreset = {
  slug: 'test',
  name: '테스트',
  org: '기관',
  physicalCm: { w: 3.5, h: 4.5 },
  pixels: { mode: 'exact', w: 413, h: 531 },
  format: 'jpg',
  fileSizeKB: { max: 500 },
  head: { minCm: 3.2, maxCm: 3.6 },
  checklist: ['a'],
  faq: [{ q: 'q', a: 'a' }],
  sources: [{ label: 's', url: 'https://example.go.kr' }],
  verifiedAt: '2026-10-02',
};

describe('validatePreset', () => {
  it('accepts a valid preset', () => {
    expect(validatePreset(base)).toEqual([]);
  });

  it('rejects a published preset without sources', () => {
    expect(validatePreset({ ...base, sources: [] })).toContain('sources: 공식 출처가 없습니다');
  });

  it('rejects pixel aspect that differs from physical aspect by more than 3%', () => {
    const errors = validatePreset({ ...base, pixels: { mode: 'exact', w: 413, h: 413 } });
    expect(errors.some((e) => e.startsWith('pixels:'))).toBe(true);
  });

  it('rejects head range taller than the photo', () => {
    const errors = validatePreset({ ...base, head: { minCm: 3.2, maxCm: 5 } });
    expect(errors.some((e) => e.startsWith('head:'))).toBe(true);
  });

  it('rejects min file size above max', () => {
    const errors = validatePreset({ ...base, fileSizeKB: { min: 600, max: 500 } });
    expect(errors.some((e) => e.startsWith('fileSizeKB:'))).toBe(true);
  });
});

describe('PHOTO_PRESETS data', () => {
  it('has unique slugs', () => {
    const slugs = PHOTO_PRESETS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(PHOTO_PRESETS.map((p) => [p.slug, p] as const))('%s is valid', (_slug, preset) => {
    expect(validatePreset(preset)).toEqual([]);
  });

  it('publishes only verified presets', () => {
    for (const p of publishedPresets()) expect(p.verifiedAt).not.toBeNull();
  });
});

describe('helpers', () => {
  it('summarizes a preset', () => {
    expect(presetSummary(base)).toBe('3.5×4.5cm · 413×531px · 500KB 이하');
    expect(
      presetSummary({ ...base, fileSizeKB: { min: 20, max: 240 } }),
    ).toBe('3.5×4.5cm · 413×531px · 20~240KB');
    expect(
      presetSummary({
        ...base,
        pixels: { mode: 'range', recommended: { w: 350, h: 450 }, min: { w: 200, h: 200 } },
      }),
    ).toBe('3.5×4.5cm · 350×450px 권장 · 500KB 이하');
  });

  it('builds a download file name', () => {
    expect(downloadFileName(base, 413, 531)).toBe('테스트사진_413x531.jpg');
  });

  it('getPreset hides unpublished presets', () => {
    const unpublished = PHOTO_PRESETS.find((p) => p.verifiedAt === null);
    if (unpublished) expect(getPreset(unpublished.slug)).toBeUndefined();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test -- src/lib/presets`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 4: 데이터 작성** — `src/lib/presets/data.ts`. 처음에는 **모든 `verifiedAt`을 `null`로** 둔다. Step 7에서 공식 출처를 확인한 것만 날짜를 넣는다.

```ts
import type { PhotoPreset } from './types';

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    slug: 'passport',
    name: '여권',
    org: '외교부',
    physicalCm: { w: 3.5, h: 4.5 },
    pixels: { mode: 'exact', w: 413, h: 531 },
    format: 'jpg',
    fileSizeKB: { max: 500 },
    head: { minCm: 3.2, maxCm: 3.6 },
    background: 'white',
    checklist: [
      '최근 6개월 이내에 촬영한 컬러 사진',
      '흰색 배경, 테두리·그림자 없음',
      '정면 응시, 눈썹과 눈이 가려지지 않음 (앞머리·안경 반사 주의)',
      '모자·색안경 착용 불가, 보정·합성 금지',
    ],
    faq: [
      {
        q: '여권사진 머리 길이는 어떻게 재나요?',
        a: '정수리(머리카락 포함)부터 턱 끝까지의 세로 길이입니다. 사진 높이 4.5cm 중 3.2~3.6cm여야 합니다. 도구의 파란 띠 안에 정수리와 턱을 맞추면 됩니다.',
      },
      {
        q: '온라인 재발급에 올리는 파일은 어떤 규격인가요?',
        a: '413×531픽셀, 500KB 이하 JPG입니다. 이 도구는 이 조건에 맞춰 자동으로 저장합니다.',
      },
      {
        q: '양쪽 귀가 보여야 하나요?',
        a: '양쪽 귀 노출 의무 조항은 삭제되었습니다. 다만 얼굴 윤곽이 가려지지 않아야 합니다.',
      },
    ],
    sources: [
      {
        label: '외교부 신규 여권사진 표준규격 안내',
        url: 'https://www.mofa.go.kr/cn-xian-ko/brd/m_753/view.do?seq=1035220&page=1',
      },
      {
        label: '파주시 여권사진 규격 안내 (PDF)',
        url: 'https://www.paju.go.kr/resources/download/%EC%97%AC%EA%B6%8C%EB%AF%BC%EC%9B%90_%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84%EA%B7%9C%EA%B2%A9%EC%95%88%EB%82%B4.pdf',
      },
      {
        label: '정책브리핑: 여권사진 규정 완화',
        url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148847383',
      },
    ],
    verifiedAt: null,
  },
  {
    slug: 'id-card',
    name: '주민등록증',
    org: '행정안전부 · 정부24',
    physicalCm: { w: 3.5, h: 4.5 },
    pixels: { mode: 'exact', w: 413, h: 531 },
    format: 'jpg',
    fileSizeKB: { max: 500 },
    background: 'white',
    checklist: [
      '최근 6개월 이내에 촬영한 컬러 상반신 정면 사진',
      '모자를 쓰지 않은 사진',
      '얼굴이 사진에서 너무 작거나 크지 않게 (자동 판독 반려 사유)',
    ],
    faq: [
      {
        q: '주민등록증 사진은 여권사진과 같은 크기인가요?',
        a: '실물 크기는 3.5×4.5cm로 같습니다. 정부24 온라인 신청은 얼굴 비중이 너무 작거나 크면 자동 판독에서 반려될 수 있으니 얼굴이 가운데에 크게 오도록 맞춰 주세요.',
      },
      {
        q: '정부24에 올릴 파일 용량은 얼마인가요?',
        a: '500KB 이하 JPG로 저장됩니다.',
      },
    ],
    sources: [
      {
        label: '행정안전부 주민등록증 안내',
        url: 'https://www.mois.go.kr/frt/sub/a06/b06/IDCard_5/screen.do',
      },
      {
        label: '정부24 주민등록증 재발급 사진 안내',
        url: 'https://www.gov.kr/mw/EgovPageLink.do?link=popup%2Fhow_to_editPic',
      },
    ],
    verifiedAt: null,
  },
  {
    slug: 'driver-license',
    name: '운전면허',
    org: '도로교통공단 · 안전운전 통합민원',
    physicalCm: { w: 3.5, h: 4.5 },
    pixels: {
      mode: 'range',
      recommended: { w: 350, h: 450 },
      min: { w: 200, h: 200 },
      max: { w: 500, h: 500 },
    },
    format: 'jpg',
    fileSizeKB: { max: 250 },
    checklist: [
      '최근 6개월 이내에 촬영한 상반신 정면 사진',
      '복사하거나 포토샵으로 수정하지 않은 사진',
      '얼굴이 기울어지지 않고 색안경 등으로 눈을 가리지 않은 사진',
    ],
    faq: [
      {
        q: '온라인 면허 갱신 사진 규격은 무엇인가요?',
        a: '가로·세로 200~500픽셀, 250KB 이하 JPG입니다. 적정 크기는 350×450픽셀이며 이 도구는 이 크기로 저장합니다.',
      },
      {
        q: '보정한 사진도 되나요?',
        a: '포토샵 등으로 수정한 사진은 사용할 수 없습니다. 이 도구는 자르기와 크기·용량 조정만 하고 얼굴을 보정하지 않습니다.',
      },
    ],
    sources: [
      {
        label: '도로교통공단 온라인 사진 등록 규격 안내',
        url: 'https://www.koroad.or.kr/main/board/1/787/board_view.do?cp=31&listType=list&bdOpenYn=Y&bdNoticeYn=N',
      },
    ],
    verifiedAt: null,
  },
  {
    slug: 'qnet',
    name: 'Q-net',
    org: '한국산업인력공단',
    physicalCm: { w: 3, h: 4 },
    pixels: { mode: 'range', recommended: { w: 300, h: 400 }, min: { w: 300, h: 400 } },
    format: 'jpg',
    fileSizeKB: { max: 200 },
    background: 'plain',
    checklist: [
      '이마·눈썹·눈·코·입이 잘 보이는 정면 사진',
      '배경이 복잡하지 않은 사진',
      'JPG, 200KB 이하, 300×400픽셀 이상',
    ],
    faq: [
      {
        q: '큐넷 사진 등록이 안 돼요.',
        a: '300×400픽셀 이상, 200KB 이하 JPG만 등록됩니다. 이 도구는 300×400픽셀, 200KB 이하로 저장합니다. 얼굴이 정면이 아니거나 배경이 복잡하면 등록이 거부될 수 있습니다.',
      },
      {
        q: '반명함판과 증명사진 중 무엇을 써야 하나요?',
        a: '큐넷은 증명사진(2.5×3.5cm) 또는 반명함판(3×4cm)을 안내합니다. 이 프리셋은 반명함판 비율(3:4)로 저장합니다.',
      },
    ],
    sources: [
      { label: '큐넷 길라잡이: 사진등록', url: 'https://www.q-net.or.kr/qnet/html/guideQnet/guide_02.html' },
    ],
    verifiedAt: null,
  },
  {
    slug: 'gosi',
    name: '공무원 시험',
    org: '인사혁신처 · 사이버국가고시센터',
    physicalCm: { w: 3.5, h: 4.5 },
    pixels: { mode: 'exact', w: 413, h: 531 },
    format: 'jpg',
    fileSizeKB: { min: 20, max: 240 },
    background: 'white',
    checklist: [
      '최근 6개월 이내에 촬영한 정면 사진',
      '흰색 배경, 모자·선글라스 착용 불가',
      '용량 20KB 이상 240KB 이하 (너무 작아도 반려)',
    ],
    faq: [
      {
        q: '용량이 너무 작다고 나와요.',
        a: '사이버국가고시센터는 최소 용량(20KB)도 있습니다. 이 도구는 최소·최대 용량을 모두 맞춰 저장하고, 원본 화질이 낮아 최소 용량에 못 미치면 경고를 보여줍니다.',
      },
    ],
    sources: [
      { label: '사이버국가고시센터', url: 'https://www.gosi.kr' },
    ],
    verifiedAt: null,
  },
  {
    slug: 'toeic',
    name: '토익',
    org: 'YBM 한국토익위원회',
    physicalCm: { w: 3, h: 4 },
    pixels: { mode: 'exact', w: 115, h: 150 },
    format: 'jpg',
    fileSizeKB: { max: 500 },
    checklist: [
      '최근 6개월 이내에 촬영한 컬러 상반신 정면 사진',
      '모자를 쓰지 않은 사진',
      '배경이 없는 단색 배경',
    ],
    faq: [
      {
        q: '토익 접수 사진 규격은 무엇인가요?',
        a: '3×4cm, 115×150픽셀, 500KB 이하 JPG입니다.',
      },
      {
        q: '시험 당일 사진과 얼굴이 달라도 되나요?',
        a: '신분 확인이 어려우면 응시가 제한될 수 있으니 최근 모습의 사진을 사용하세요.',
      },
    ],
    sources: [
      { label: '한국토익위원회 토익스토리: 토익 사진 규정', url: 'https://www.toeicstory.co.kr/160' },
    ],
    verifiedAt: null,
  },
];
```

- [ ] **Step 5: 조회·검증 함수 작성** — `src/lib/presets/index.ts`:

```ts
import { PHOTO_PRESETS } from './data';
import type { PhotoPreset } from './types';

export { PHOTO_PRESETS };
export type { PhotoPreset, PixelSpec } from './types';

const ASPECT_TOLERANCE = 0.03;

export function publishedPresets(): PhotoPreset[] {
  return PHOTO_PRESETS.filter((p) => p.verifiedAt !== null);
}

export function getPreset(slug: string): PhotoPreset | undefined {
  return publishedPresets().find((p) => p.slug === slug);
}

export function outputPixels(p: PhotoPreset): { w: number; h: number } {
  return p.pixels.mode === 'exact' ? { w: p.pixels.w, h: p.pixels.h } : p.pixels.recommended;
}

export function validatePreset(p: PhotoPreset): string[] {
  const errors: string[] = [];
  const px = outputPixels(p);
  const physicalAspect = p.physicalCm.w / p.physicalCm.h;
  const pixelAspect = px.w / px.h;
  if (Math.abs(pixelAspect / physicalAspect - 1) > ASPECT_TOLERANCE) {
    errors.push(`pixels: 픽셀 비율 ${pixelAspect.toFixed(3)}이 실물 비율 ${physicalAspect.toFixed(3)}과 3% 넘게 다릅니다`);
  }
  if (p.pixels.mode === 'range') {
    const { min, max, recommended: r } = p.pixels;
    if (min && (r.w < min.w || r.h < min.h)) errors.push('pixels: 권장값이 최소값보다 작습니다');
    if (max && (r.w > max.w || r.h > max.h)) errors.push('pixels: 권장값이 최대값보다 큽니다');
  }
  if (p.fileSizeKB.min !== undefined && p.fileSizeKB.min >= p.fileSizeKB.max) {
    errors.push('fileSizeKB: 최소 용량이 최대 용량 이상입니다');
  }
  if (p.head) {
    if (p.head.minCm >= p.head.maxCm) errors.push('head: 최소값이 최대값 이상입니다');
    if (p.head.maxCm >= p.physicalCm.h) errors.push('head: 머리 길이가 사진 높이 이상입니다');
  }
  if (p.verifiedAt !== null) {
    if (p.sources.length === 0) errors.push('sources: 공식 출처가 없습니다');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt)) errors.push('verifiedAt: YYYY-MM-DD 형식이 아닙니다');
  }
  if (p.checklist.length === 0) errors.push('checklist: 비어 있습니다');
  return errors;
}

export function presetSummary(p: PhotoPreset): string {
  const px = outputPixels(p);
  const pxText = `${px.w}×${px.h}px${p.pixels.mode === 'range' ? ' 권장' : ''}`;
  const { min, max } = p.fileSizeKB;
  const sizeText = min !== undefined ? `${min}~${max}KB` : `${max}KB 이하`;
  return `${p.physicalCm.w}×${p.physicalCm.h}cm · ${pxText} · ${sizeText}`;
}

export function downloadFileName(p: PhotoPreset, widthPx: number, heightPx: number): string {
  return `${p.name}사진_${widthPx}x${heightPx}.jpg`;
}
```

- [ ] **Step 6: 통과 확인**

Run: `npm test -- src/lib/presets`
Expected: PASS (모든 프리셋 valid, verifiedAt이 모두 null이라 published 테스트는 빈 배열로 통과)

- [ ] **Step 7: 공식 출처 검증 (사람이 직접, 프리셋마다)**

각 프리셋의 `sources` URL을 브라우저로 열고 아래를 하나씩 대조한다. 값이 다르면 **공식 출처 값으로 고친다**. 확인되면 `verifiedAt`에 확인 날짜(예: `'2026-10-02'`)를 넣는다.

| 프리셋 | 확인할 값 | 주의 |
|---|---|---|
| passport | 3.5×4.5cm, 머리 3.2~3.6cm, 흰 배경 / 온라인 재발급 413×531px·500KB | 413×531·500KB는 2차 출처에서 나온 값. 외교부 여권안내(passport.go.kr) 온라인 신청 안내에서 확인되지 않으면 픽셀·용량을 찾은 공식 값으로 바꾸고 출처 추가 |
| id-card | 3.5×4.5cm / 정부24 업로드 픽셀·용량 | 공식 출처에 머리 길이 규정이 있으면 `head` 추가, 없으면 그대로 둔다 |
| driver-license | 200~500px, 350×450 적정, 250KB | 공지 날짜가 2016년이므로 안전운전 통합민원(safedriving.or.kr) 현재 안내와도 대조 |
| qnet | 300×400 이상, 200KB, JPG | |
| gosi | 픽셀, 20~240KB | gosi.kr 원서접수 안내에서 픽셀과 용량을 직접 확인. **확인 못 하면 `verifiedAt: null` 유지 (출시 제외)** |
| toeic | 115×150px, 500KB | YBM 접수 사이트(exam.toeic.co.kr) 안내와 대조, 출처 추가 |

- [ ] **Step 8: 재검증 후 커밋**

Run: `npm test -- src/lib/presets`
Expected: PASS

```bash
git add src/lib/presets
git commit -m "feat: add verified photo presets for 6 institutions"
```

---

### Task 3: 목표 규격과 크롭 계산

**Files:**
- Create: `src/lib/photo/target.ts`, `src/lib/photo/crop-math.ts`
- Test: `src/lib/photo/target.test.ts`, `src/lib/photo/crop-math.test.ts`

**Interfaces:**
- Consumes: `PhotoPreset`, `outputPixels(p)` (Task 2)
- Produces:
  - `type TargetSpec = { widthPx: number; heightPx: number; minKB?: number; maxKB: number; dpi?: number }`
  - `presetToTarget(p: PhotoPreset): TargetSpec`
  - `byteLimits(t: TargetSpec): { minBytes?: number; maxBytes: number }`
  - `checkResult(t: TargetSpec, r: { widthPx: number; heightPx: number; bytes: number }): { pixels: boolean; size: boolean; belowMin: boolean }`
  - `formatBytes(bytes: number): string` — `"187KB"`, `"3.2MB"`
  - `type Rect = { x: number; y: number; width: number; height: number }`
  - `type FacePoints = { crownY: number; chinY: number; eyeY: number; centerX: number }`
  - `type GuideLines = { crownBand: [number, number]; chinBand: [number, number] }` (사진 높이 대비 비율 0~1)
  - `CROWN_MARGIN_SHARE = 0.4`
  - `headFractionRange(p: PhotoPreset): [number, number]`
  - `getGuideLines(p: PhotoPreset): GuideLines | null` — 머리 규정 없으면 null
  - `computeCropRect(face: FacePoints, aspect: number, p: PhotoPreset): Rect`
  - `clampRectToImage(r: Rect, imageW: number, imageH: number): Rect` — 정수 좌표

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/photo/target.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { presetToTarget, byteLimits, checkResult, formatBytes } from './target';
import { PHOTO_PRESETS } from '../presets';

const passport = PHOTO_PRESETS.find((p) => p.slug === 'passport')!;
const qnet = PHOTO_PRESETS.find((p) => p.slug === 'qnet')!;
const gosi = PHOTO_PRESETS.find((p) => p.slug === 'gosi')!;

describe('presetToTarget', () => {
  it('uses exact pixels and computes dpi from physical size', () => {
    expect(presetToTarget(passport)).toEqual({ widthPx: 413, heightPx: 531, maxKB: 500, minKB: undefined, dpi: 300 });
  });

  it('uses recommended pixels for range presets', () => {
    const t = presetToTarget(qnet);
    expect([t.widthPx, t.heightPx]).toEqual([300, 400]);
  });
});

describe('byteLimits', () => {
  it('uses 1000-based max minus safety margin and 1024-based min', () => {
    expect(byteLimits(presetToTarget(gosi))).toEqual({ minBytes: 20 * 1024, maxBytes: 240 * 1000 - 64 });
    expect(byteLimits(presetToTarget(passport))).toEqual({ minBytes: undefined, maxBytes: 500 * 1000 - 64 });
  });
});

describe('checkResult', () => {
  const t = presetToTarget(gosi);
  it('passes a result inside limits', () => {
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 100_000 })).toEqual({ pixels: true, size: true, belowMin: false });
  });
  it('flags wrong pixels, oversize and undersize', () => {
    expect(checkResult(t, { widthPx: 400, heightPx: 531, bytes: 100_000 }).pixels).toBe(false);
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 240_000 }).size).toBe(false);
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 10_000 })).toEqual({ pixels: true, size: false, belowMin: true });
  });
});

describe('formatBytes', () => {
  it('formats KB and MB', () => {
    expect(formatBytes(191_488)).toBe('187KB');
    expect(formatBytes(3_355_443)).toBe('3.2MB');
    expect(formatBytes(800)).toBe('1KB');
  });
});
```

`src/lib/photo/crop-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getGuideLines, headFractionRange, computeCropRect, clampRectToImage } from './crop-math';
import { PHOTO_PRESETS } from '../presets';

const passport = PHOTO_PRESETS.find((p) => p.slug === 'passport')!;
const toeic = PHOTO_PRESETS.find((p) => p.slug === 'toeic')!;
const face = { crownY: 320, chinY: 920, eyeY: 600, centerX: 600 };

describe('headFractionRange', () => {
  it('derives the range from head cm / photo height', () => {
    const [min, max] = headFractionRange(passport);
    expect(min).toBeCloseTo(3.2 / 4.5, 4);
    expect(max).toBeCloseTo(3.6 / 4.5, 4);
  });
  it('falls back to a default composition range without head rule', () => {
    expect(headFractionRange(toeic)).toEqual([0.65, 0.75]);
  });
});

describe('getGuideLines', () => {
  it('places crown and chin bands with 40% of spare height above the head', () => {
    const g = getGuideLines(passport)!;
    expect(g.crownBand[0]).toBeCloseTo(0.08, 3);   // 머리 3.6cm일 때 정수리
    expect(g.crownBand[1]).toBeCloseTo(0.1156, 3); // 머리 3.2cm일 때 정수리
    expect(g.chinBand[0]).toBeCloseTo(0.8267, 3);
    expect(g.chinBand[1]).toBeCloseTo(0.88, 3);
  });
  it('returns null without head rule', () => {
    expect(getGuideLines(toeic)).toBeNull();
  });
});

describe('computeCropRect', () => {
  it('sizes the crop so the head hits the middle of the allowed range', () => {
    const r = computeCropRect(face, 413 / 531, passport);
    expect(r.height).toBeCloseTo(794.12, 1);
    expect(r.width).toBeCloseTo(617.65, 1);
    expect(r.y).toBeCloseTo(242.35, 1);
    expect(r.x).toBeCloseTo(291.18, 1);
  });
});

describe('clampRectToImage', () => {
  it('rounds and keeps an inside rect', () => {
    expect(clampRectToImage({ x: 291.18, y: 242.35, width: 617.65, height: 794.12 }, 1200, 1600)).toEqual({ x: 291, y: 242, width: 618, height: 794 });
  });
  it('shifts a rect that overflows', () => {
    expect(clampRectToImage({ x: -50, y: 1000, width: 400, height: 800 }, 1200, 1600)).toEqual({ x: 0, y: 800, width: 400, height: 800 });
  });
  it('shrinks a rect larger than the image keeping aspect', () => {
    const r = clampRectToImage({ x: 0, y: 0, width: 1500, height: 2000 }, 1200, 1600);
    expect(r).toEqual({ x: 0, y: 0, width: 1200, height: 1600 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/photo`
Expected: FAIL — `Cannot find module './target'`, `'./crop-math'`

- [ ] **Step 3: 구현** — `src/lib/photo/target.ts`:

```ts
import { outputPixels, type PhotoPreset } from '../presets';

export type TargetSpec = {
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB: number;
  dpi?: number;
};

const MAX_SAFETY_BYTES = 64;

export function presetToTarget(p: PhotoPreset): TargetSpec {
  const px = outputPixels(p);
  return {
    widthPx: px.w,
    heightPx: px.h,
    maxKB: p.fileSizeKB.max,
    minKB: p.fileSizeKB.min,
    dpi: Math.round(px.w / (p.physicalCm.w / 2.54)),
  };
}

export function byteLimits(t: TargetSpec): { minBytes?: number; maxBytes: number } {
  return {
    minBytes: t.minKB !== undefined ? t.minKB * 1024 : undefined,
    maxBytes: t.maxKB * 1000 - MAX_SAFETY_BYTES,
  };
}

export function checkResult(
  t: TargetSpec,
  r: { widthPx: number; heightPx: number; bytes: number },
): { pixels: boolean; size: boolean; belowMin: boolean } {
  const { minBytes, maxBytes } = byteLimits(t);
  const belowMin = minBytes !== undefined && r.bytes < minBytes;
  return {
    pixels: r.widthPx === t.widthPx && r.heightPx === t.heightPx,
    size: !belowMin && r.bytes <= maxBytes,
    belowMin,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
```

`src/lib/photo/crop-math.ts`:

```ts
import type { PhotoPreset } from '../presets';

export type Rect = { x: number; y: number; width: number; height: number };
export type FacePoints = { crownY: number; chinY: number; eyeY: number; centerX: number };
export type GuideLines = { crownBand: [number, number]; chinBand: [number, number] };

/** 머리를 뺀 남는 세로 공간 중 정수리 위에 두는 비율 (공식 규정이 없어 쓰는 권장값) */
export const CROWN_MARGIN_SHARE = 0.4;
const DEFAULT_HEAD_FRACTION: [number, number] = [0.65, 0.75];

export function headFractionRange(p: PhotoPreset): [number, number] {
  if (!p.head) return DEFAULT_HEAD_FRACTION;
  return [p.head.minCm / p.physicalCm.h, p.head.maxCm / p.physicalCm.h];
}

function crownFraction(headFraction: number): number {
  return CROWN_MARGIN_SHARE * (1 - headFraction);
}

export function getGuideLines(p: PhotoPreset): GuideLines | null {
  if (!p.head) return null;
  const [min, max] = headFractionRange(p);
  return {
    crownBand: [crownFraction(max), crownFraction(min)],
    chinBand: [crownFraction(min) + min, crownFraction(max) + max],
  };
}

export function computeCropRect(face: FacePoints, aspect: number, p: PhotoPreset): Rect {
  const [min, max] = headFractionRange(p);
  const headFraction = (min + max) / 2;
  const height = (face.chinY - face.crownY) / headFraction;
  const width = height * aspect;
  return {
    x: face.centerX - width / 2,
    y: face.crownY - crownFraction(headFraction) * height,
    width,
    height,
  };
}

export function clampRectToImage(r: Rect, imageW: number, imageH: number): Rect {
  const scale = Math.min(1, imageW / r.width, imageH / r.height);
  const width = Math.round(r.width * scale);
  const height = Math.round(r.height * scale);
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const x = Math.min(Math.max(Math.round(cx - width / 2), 0), imageW - width);
  const y = Math.min(Math.max(Math.round(cy - height / 2), 0), imageH - height);
  return { x, y, width, height };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/photo`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/photo
git commit -m "feat: add target spec and crop/guide math"
```

---

### Task 4: JPEG 용량 맞춤, DPI 기록, 내보내기

**Files:**
- Create: `src/lib/photo/fit-size.ts`, `src/lib/photo/jfif-dpi.ts`, `src/lib/photo/canvas.ts`, `src/lib/photo/export-photo.ts`
- Test: `src/lib/photo/fit-size.test.ts`, `src/lib/photo/jfif-dpi.test.ts`

**Interfaces:**
- Consumes: `TargetSpec`, `byteLimits`, `checkResult`, `Rect` (Task 3)
- Produces:
  - `type FitStatus = 'ok' | 'below-min' | 'above-max'`
  - `fitJpegToSize<T extends { size: number }>(encode: (quality: number) => Promise<T>, limits: { minBytes?: number; maxBytes: number }): Promise<{ result: T; quality: number; status: FitStatus }>`
  - `setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array`
  - `canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob>`
  - `type ExportResult = { blob: Blob; widthPx: number; heightPx: number; bytes: number; quality: number; status: FitStatus; checks: ReturnType<typeof checkResult>; upscaled: boolean }`
  - `exportPhoto(source: HTMLCanvasElement, crop: Rect, target: TargetSpec): Promise<ExportResult>`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/photo/fit-size.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fitJpegToSize } from './fit-size';

// 품질 q → q × 1MB 크기를 내는 가짜 인코더
const fakeEncode = async (q: number) => ({ size: Math.round(q * 1_000_000), q });

describe('fitJpegToSize', () => {
  it('returns max quality when it already fits', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 2_000_000 });
    expect(r).toMatchObject({ quality: 1, status: 'ok' });
  });

  it('finds the highest quality under the max', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 500_000 });
    expect(r.status).toBe('ok');
    expect(r.result.size).toBeLessThanOrEqual(500_000);
    expect(r.quality).toBeGreaterThan(0.49);
  });

  it('reports below-min when even max quality is too small', async () => {
    const r = await fitJpegToSize(fakeEncode, { minBytes: 1_500_000, maxBytes: 2_000_000 });
    expect(r.status).toBe('below-min');
  });

  it('reports above-max when even the lowest quality is too big', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 100_000 });
    expect(r).toMatchObject({ quality: 0.3, status: 'above-max' });
  });
});
```

`src/lib/photo/jfif-dpi.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { setJpegDpi } from './jfif-dpi';

const jfif = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe('setJpegDpi', () => {
  it('rewrites density in an existing JFIF header', () => {
    const out = setJpegDpi(jfif, 300);
    expect(out.length).toBe(jfif.length);
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c]);
    expect(jfif[13]).toBe(0); // 원본은 변경하지 않음
  });

  it('inserts a JFIF header when missing', () => {
    const noJfif = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
    const out = setJpegDpi(noJfif, 300);
    expect(out.length).toBe(noJfif.length + 18);
    expect(Array.from(out.slice(0, 4))).toEqual([0xff, 0xd8, 0xff, 0xe0]);
    // 삽입 후: FF D8(0-1) FF E0(2-3) 길이(4-5) JFIF\0(6-10) 버전(11-12) 단위(13) X밀도(14-15) Y밀도(16-17) 썸네일(18-19) 원본 나머지(20~)
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c]);
    expect(Array.from(out.slice(20))).toEqual([0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
  });

  it('throws on non-JPEG input', () => {
    expect(() => setJpegDpi(new Uint8Array([0x89, 0x50]), 300)).toThrow('Not a JPEG');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/photo/fit-size src/lib/photo/jfif-dpi`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현** — `src/lib/photo/fit-size.ts`:

```ts
export type FitStatus = 'ok' | 'below-min' | 'above-max';

const MIN_QUALITY = 0.3;
const MAX_QUALITY = 1;
const ITERATIONS = 8;

export async function fitJpegToSize<T extends { size: number }>(
  encode: (quality: number) => Promise<T>,
  limits: { minBytes?: number; maxBytes: number },
): Promise<{ result: T; quality: number; status: FitStatus }> {
  const statusOf = (size: number): FitStatus =>
    limits.minBytes !== undefined && size < limits.minBytes ? 'below-min' : 'ok';

  const top = await encode(MAX_QUALITY);
  if (top.size <= limits.maxBytes) return { result: top, quality: MAX_QUALITY, status: statusOf(top.size) };

  const bottom = await encode(MIN_QUALITY);
  if (bottom.size > limits.maxBytes) return { result: bottom, quality: MIN_QUALITY, status: 'above-max' };

  let lo = MIN_QUALITY;
  let hi = MAX_QUALITY;
  let best = bottom;
  let bestQuality = MIN_QUALITY;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const r = await encode(mid);
    if (r.size <= limits.maxBytes) {
      best = r;
      bestQuality = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { result: best, quality: bestQuality, status: statusOf(best.size) };
}
```

`src/lib/photo/jfif-dpi.ts`:

```ts
const JFIF_ID = [0x4a, 0x46, 0x49, 0x46, 0x00]; // "JFIF\0"

function hasJfifApp0(b: Uint8Array): boolean {
  return b[2] === 0xff && b[3] === 0xe0 && JFIF_ID.every((v, i) => b[6 + i] === v);
}

/** JFIF 밀도 단위를 inch(1)로, X/Y 밀도를 dpi로 기록한 새 배열을 반환한다. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
  const hi = (dpi >> 8) & 0xff;
  const lo = dpi & 0xff;

  if (hasJfifApp0(bytes)) {
    const out = bytes.slice();
    out.set([1, hi, lo, hi, lo], 13);
    return out;
  }

  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, ...JFIF_ID, 0x01, 0x01, 1, hi, lo, hi, lo, 0x00, 0x00,
  ]);
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}
```

`src/lib/photo/canvas.ts`:

```ts
export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))), type, quality);
  });
}
```

`src/lib/photo/export-photo.ts`:

```ts
import { canvasToBlob } from './canvas';
import type { Rect } from './crop-math';
import { fitJpegToSize, type FitStatus } from './fit-size';
import { setJpegDpi } from './jfif-dpi';
import { byteLimits, checkResult, type TargetSpec } from './target';

export type ExportResult = {
  blob: Blob;
  widthPx: number;
  heightPx: number;
  bytes: number;
  quality: number;
  status: FitStatus;
  checks: ReturnType<typeof checkResult>;
  upscaled: boolean;
};

export async function exportPhoto(source: HTMLCanvasElement, crop: Rect, target: TargetSpec): Promise<ExportResult> {
  const canvas = document.createElement('canvas');
  canvas.width = target.widthPx;
  canvas.height = target.heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  const fit = await fitJpegToSize((q) => canvasToBlob(canvas, 'image/jpeg', q), byteLimits(target));
  let blob = fit.result;
  if (target.dpi) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    blob = new Blob([setJpegDpi(bytes, target.dpi)], { type: 'image/jpeg' });
  }
  const result = { widthPx: canvas.width, heightPx: canvas.height, bytes: blob.size };
  return {
    blob,
    ...result,
    quality: fit.quality,
    status: fit.status,
    checks: checkResult(target, result),
    upscaled: crop.width < target.widthPx,
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/photo`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/photo
git commit -m "feat: add JPEG size fitting, DPI writer and photo export"
```

---

### Task 5: 이미지 불러오기

**Files:**
- Create: `src/lib/photo/load-image.ts`
- Test: `src/lib/photo/load-image.test.ts`

**Interfaces:**
- Consumes: `canvasToBlob` (Task 4)
- Produces:
  - `MAX_SOURCE_PIXELS = 40_000_000`
  - `isHeic(file: { name: string; type: string }): boolean`
  - `isSupportedImage(file: { name: string; type: string }): boolean`
  - `downscaleSize(w: number, h: number, maxPixels?: number): { width: number; height: number }`
  - `class LoadImageError extends Error { code: 'unsupported' | 'heic-failed' | 'decode-failed' }`
  - `type LoadedImage = { canvas: HTMLCanvasElement; url: string; width: number; height: number; original: { name: string; bytes: number; format: string; width: number; height: number } }`
  - `loadImageFile(file: File): Promise<LoadedImage>`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/photo/load-image.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isHeic, isSupportedImage, downscaleSize, MAX_SOURCE_PIXELS } from './load-image';

describe('isHeic', () => {
  it('detects by mime type or extension', () => {
    expect(isHeic({ name: 'a.jpg', type: 'image/heic' })).toBe(true);
    expect(isHeic({ name: 'IMG_0001.HEIC', type: '' })).toBe(true);
    expect(isHeic({ name: 'a.heif', type: '' })).toBe(true);
    expect(isHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });
});

describe('isSupportedImage', () => {
  it('accepts jpg/png/webp/heic and rejects others', () => {
    expect(isSupportedImage({ name: 'a.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isSupportedImage({ name: 'a.png', type: 'image/png' })).toBe(true);
    expect(isSupportedImage({ name: 'a.webp', type: 'image/webp' })).toBe(true);
    expect(isSupportedImage({ name: 'a.HEIC', type: '' })).toBe(true);
    expect(isSupportedImage({ name: 'a.gif', type: 'image/gif' })).toBe(false);
    expect(isSupportedImage({ name: 'a.pdf', type: 'application/pdf' })).toBe(false);
  });
});

describe('downscaleSize', () => {
  it('keeps small images', () => {
    expect(downscaleSize(4000, 3000)).toEqual({ width: 4000, height: 3000 });
  });
  it('shrinks huge images under the pixel cap keeping aspect', () => {
    const r = downscaleSize(10000, 8000);
    expect(r.width * r.height).toBeLessThanOrEqual(MAX_SOURCE_PIXELS);
    expect(r.width / r.height).toBeCloseTo(1.25, 2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/photo/load-image`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현** — `src/lib/photo/load-image.ts`:

```ts
import { canvasToBlob } from './canvas';

export const MAX_SOURCE_PIXELS = 40_000_000;

type FileLike = { name: string; type: string };

export class LoadImageError extends Error {
  constructor(public code: 'unsupported' | 'heic-failed' | 'decode-failed') {
    super(code);
  }
}

export type LoadedImage = {
  canvas: HTMLCanvasElement;
  url: string;
  width: number;
  height: number;
  original: { name: string; bytes: number; format: string; width: number; height: number };
};

export function isHeic(file: FileLike): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isSupportedImage(file: FileLike): boolean {
  return isHeic(file) || /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function downscaleSize(w: number, h: number, maxPixels = MAX_SOURCE_PIXELS): { width: number; height: number } {
  if (w * h <= maxPixels) return { width: w, height: h };
  const s = Math.sqrt(maxPixels / (w * h));
  return { width: Math.floor(w * s), height: Math.floor(h * s) };
}

function formatOf(file: FileLike): string {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
  return ext === 'JPEG' ? 'JPG' : ext || file.type.replace('image/', '').toUpperCase();
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!isSupportedImage(file)) throw new LoadImageError('unsupported');

  let blob: Blob = file;
  if (isHeic(file)) {
    try {
      const { default: heic2any } = await import('heic2any');
      const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
      blob = Array.isArray(out) ? out[0] : out;
    } catch {
      throw new LoadImageError('heic-failed');
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new LoadImageError('decode-failed');
  }

  const { width, height } = downscaleSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new LoadImageError('decode-failed');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const original = { name: file.name, bytes: file.size, format: formatOf(file), width: bitmap.width, height: bitmap.height };
  bitmap.close();

  const url = URL.createObjectURL(await canvasToBlob(canvas, 'image/jpeg', 0.92));
  return { canvas, url, width, height, original };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/photo/load-image`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/photo/load-image.ts src/lib/photo/load-image.test.ts
git commit -m "feat: add image loading with HEIC and downscale support"
```

---

### Task 6: 사진 도구 UI (업로드 → 크롭 → 결과)

**Files:**
- Create: `src/components/GuideOverlay.tsx`, `src/components/PhotoTool.tsx`, `src/components/CustomPhotoTool.tsx`, `src/lib/photo/custom-target.ts`, `src/lib/analytics.ts`
- Test: `src/components/GuideOverlay.test.tsx`, `src/lib/photo/custom-target.test.ts`, `src/components/PhotoTool.test.tsx`

**Interfaces:**
- Consumes: `TargetSpec`, `formatBytes` (Task 3), `GuideLines` (Task 3), `exportPhoto`, `ExportResult` (Task 4), `loadImageFile`, `LoadImageError`, `LoadedImage` (Task 5)
- Produces:
  - `<GuideOverlay width={number} height={number} guides={GuideLines | null} />`
  - `<PhotoTool target={TargetSpec} guides={GuideLines | null} fileName={(w: number, h: number) => string} eventLabel={string} />`
  - `<CustomPhotoTool />`
  - `parseCustomTarget(input: { widthPx: string; heightPx: string; maxKB: string }): { ok: true; target: TargetSpec } | { ok: false; error: string }`
  - `trackEvent(name: string, params?: Record<string, string | number>): void`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/components/GuideOverlay.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuideOverlay } from './GuideOverlay';

describe('GuideOverlay', () => {
  it('draws crown and chin bands at fractional heights', () => {
    const { container } = render(
      <GuideOverlay width={280} height={360} guides={{ crownBand: [0.08, 0.12], chinBand: [0.82, 0.88] }} />,
    );
    const crown = container.querySelector('[data-guide="crown"]')!;
    expect(Number(crown.getAttribute('y'))).toBeCloseTo(28.8, 1);
    expect(Number(crown.getAttribute('height'))).toBeCloseTo(14.4, 1);
    expect(screen.getByText('정수리')).toBeInTheDocument();
    expect(screen.getByText('턱')).toBeInTheDocument();
  });

  it('draws only the center line without head rule', () => {
    const { container } = render(<GuideOverlay width={280} height={360} guides={null} />);
    expect(container.querySelector('[data-guide="crown"]')).toBeNull();
    expect(container.querySelector('[data-guide="center"]')).not.toBeNull();
  });
});
```

`src/lib/photo/custom-target.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCustomTarget } from './custom-target';

describe('parseCustomTarget', () => {
  it('parses valid input', () => {
    expect(parseCustomTarget({ widthPx: '300', heightPx: '400', maxKB: '200' })).toEqual({
      ok: true,
      target: { widthPx: 300, heightPx: 400, maxKB: 200 },
    });
  });
  it('rejects out-of-range or non-numeric input', () => {
    expect(parseCustomTarget({ widthPx: '10', heightPx: '400', maxKB: '200' }).ok).toBe(false);
    expect(parseCustomTarget({ widthPx: '300', heightPx: 'abc', maxKB: '200' }).ok).toBe(false);
    expect(parseCustomTarget({ widthPx: '300', heightPx: '400', maxKB: '5' }).ok).toBe(false);
  });
});
```

`src/components/PhotoTool.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhotoTool } from './PhotoTool';

describe('PhotoTool', () => {
  it('shows the upload prompt with the target spec', () => {
    render(
      <PhotoTool
        target={{ widthPx: 413, heightPx: 531, maxKB: 500 }}
        guides={null}
        fileName={(w, h) => `t_${w}x${h}.jpg`}
        eventLabel="test"
      />,
    );
    expect(screen.getByText(/사진을 끌어다 놓거나/)).toBeInTheDocument();
    expect(screen.getByText(/413×531px/)).toBeInTheDocument();
    expect(screen.getByText(/서버로 전송되지 않습니다/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components src/lib/photo/custom-target`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현** — `src/lib/analytics.ts`:

```ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

export function trackEvent(name: string, params: Record<string, string | number> = {}): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name, params);
}
```

`src/lib/photo/custom-target.ts`:

```ts
import type { TargetSpec } from './target';

const PX_RANGE = [50, 3000] as const;
const KB_RANGE = [10, 5000] as const;

function toInt(v: string): number | null {
  return /^\d+$/.test(v.trim()) ? Number(v.trim()) : null;
}

export function parseCustomTarget(input: {
  widthPx: string;
  heightPx: string;
  maxKB: string;
}): { ok: true; target: TargetSpec } | { ok: false; error: string } {
  const w = toInt(input.widthPx);
  const h = toInt(input.heightPx);
  const kb = toInt(input.maxKB);
  if (w === null || h === null || kb === null) return { ok: false, error: '숫자만 입력해 주세요.' };
  if (w < PX_RANGE[0] || w > PX_RANGE[1] || h < PX_RANGE[0] || h > PX_RANGE[1]) {
    return { ok: false, error: `가로·세로는 ${PX_RANGE[0]}~${PX_RANGE[1]}픽셀로 입력해 주세요.` };
  }
  if (kb < KB_RANGE[0] || kb > KB_RANGE[1]) {
    return { ok: false, error: `최대 용량은 ${KB_RANGE[0]}~${KB_RANGE[1]}KB로 입력해 주세요.` };
  }
  return { ok: true, target: { widthPx: w, heightPx: h, maxKB: kb } };
}
```

`src/components/GuideOverlay.tsx`:

```tsx
import type { GuideLines } from '@/lib/photo/crop-math';

type Props = { width: number; height: number; guides: GuideLines | null };

export function GuideOverlay({ width, height, guides }: Props) {
  const band = (key: 'crown' | 'chin', [a, b]: [number, number], label: string) => (
    <g>
      <rect data-guide={key} x={0} y={a * height} width={width} height={(b - a) * height} fill="rgba(37,99,235,0.25)" />
      <text x={6} y={a * height - 4} fontSize={12} fill="#1d4ed8" fontWeight={600}>
        {label}
      </text>
    </g>
  );
  return (
    <svg width={width} height={height} className="pointer-events-none absolute inset-0 m-auto" aria-hidden>
      <line data-guide="center" x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="rgba(255,255,255,0.8)" strokeDasharray="4 4" />
      {guides && band('crown', guides.crownBand, '정수리')}
      {guides && band('chin', guides.chinBand, '턱')}
      {!guides && (
        <text x={width / 2} y={16} fontSize={12} fill="#ffffff" textAnchor="middle">
          얼굴을 중앙에 맞춰 주세요
        </text>
      )}
    </svg>
  );
}
```

`src/components/PhotoTool.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { GuideOverlay } from './GuideOverlay';
import type { GuideLines } from '@/lib/photo/crop-math';
import { exportPhoto, type ExportResult } from '@/lib/photo/export-photo';
import { loadImageFile, LoadImageError, type LoadedImage } from '@/lib/photo/load-image';
import { formatBytes, type TargetSpec } from '@/lib/photo/target';
import { trackEvent } from '@/lib/analytics';

type Props = {
  target: TargetSpec;
  guides: GuideLines | null;
  fileName: (widthPx: number, heightPx: number) => string;
  eventLabel: string;
};

const CROP_HEIGHT = 360;

const ERROR_TEXT: Record<LoadImageError['code'], string> = {
  unsupported: 'JPG, PNG, WEBP, HEIC 사진만 사용할 수 있습니다.',
  'heic-failed': '아이폰 사진(HEIC)을 변환하지 못했습니다. 아이폰 설정 > 카메라 > 포맷 > "높은 호환성"으로 찍은 사진을 사용해 주세요.',
  'decode-failed': '사진을 열지 못했습니다. 다른 사진으로 시도하거나 최신 브라우저를 사용해 주세요.',
};

export function PhotoTool({ target, guides, fileName, eventLabel }: Props) {
  const aspect = target.widthPx / target.heightPx;
  const cropSize = { width: Math.round(CROP_HEIGHT * aspect), height: CROP_HEIGHT };
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(ExportResult & { url: string }) | null>(null);

  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url); }, [image]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      setImage(await loadImageFile(file));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      setError(e instanceof LoadImageError ? ERROR_TEXT[e.code] : ERROR_TEXT['decode-failed']);
    } finally {
      setBusy(false);
    }
  }, []);

  const onExport = async () => {
    if (!image || !area) return;
    setBusy(true);
    try {
      const r = await exportPhoto(image.canvas, area, target);
      setResult({ ...r, url: URL.createObjectURL(r.blob) });
    } catch {
      setError('사진을 저장하지 못했습니다. 최신 브라우저에서 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const sizeText = `${target.minKB ? `${target.minKB}~` : ''}${target.maxKB}KB${target.minKB ? '' : ' 이하'}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="mb-3 text-sm text-slate-600">
        목표: <strong>{target.widthPx}×{target.heightPx}px</strong> · {sizeText} · JPG
      </p>

      {!image && (
        <label
          className="flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-center hover:border-blue-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
        >
          <span className="font-medium">사진을 끌어다 놓거나 눌러서 선택하세요</span>
          <span className="text-xs text-slate-500">JPG · PNG · WEBP · HEIC</span>
          <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      )}

      {image && (
        <div className="space-y-3">
          <div className="relative h-[440px] overflow-hidden rounded-xl bg-slate-800">
            <Cropper
              image={image.url}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropSize={cropSize}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
            <GuideOverlay width={cropSize.width} height={cropSize.height} guides={guides} />
          </div>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full" aria-label="확대"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={onExport} disabled={busy || !area} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">
              {busy ? '처리 중…' : '규격에 맞춰 만들기'}
            </button>
            <button onClick={() => { setImage(null); setResult(null); }} className="rounded-lg border px-4 py-2">
              다른 사진
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-5 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row">
          <img src={result.url} alt="결과 사진" width={result.widthPx} height={result.heightPx} className="max-h-60 w-auto self-start border" />
          <div className="space-y-2 text-sm">
            <p>{result.widthPx}×{result.heightPx}px · {formatBytes(result.bytes)} · JPG</p>
            <ul className="space-y-1">
              <li>{result.checks.pixels ? '✓' : '✗'} 픽셀 크기</li>
              <li>{result.checks.size ? '✓' : '✗'} 용량 ({sizeText})</li>
              <li>✓ 파일 형식 (JPG)</li>
            </ul>
            {result.status === 'below-min' && (
              <p className="text-amber-700">최고 화질로도 최소 용량({target.minKB}KB)에 못 미칩니다. 더 선명한 원본 사진을 사용해 주세요.</p>
            )}
            {result.status === 'above-max' && (
              <p className="text-amber-700">최저 화질로도 최대 용량을 넘습니다. 다른 사진으로 시도해 주세요.</p>
            )}
            {result.upscaled && (
              <p className="text-amber-700">원본 해상도가 낮아 확대되었습니다. 흐릿하면 반려될 수 있습니다.</p>
            )}
            <a
              href={result.url}
              download={fileName(result.widthPx, result.heightPx)}
              onClick={() => trackEvent('photo_download', { preset: eventLabel, bytes: result.bytes })}
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
            >
              내려받기
            </a>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">🔒 사진은 이 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.</p>
    </section>
  );
}
```

`src/components/CustomPhotoTool.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { PhotoTool } from './PhotoTool';
import { parseCustomTarget } from '@/lib/photo/custom-target';
import type { TargetSpec } from '@/lib/photo/target';

export function CustomPhotoTool() {
  const [form, setForm] = useState({ widthPx: '300', heightPx: '400', maxKB: '200' });
  const [target, setTarget] = useState<TargetSpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseCustomTarget(form);
    if (r.ok) { setTarget(r.target); setError(null); } else { setError(r.error); }
  };

  const field = (key: keyof typeof form, label: string) => (
    <label className="flex flex-col text-sm">
      {label}
      <input
        inputMode="numeric" value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-28 rounded border px-2 py-1"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
        {field('widthPx', '가로(px)')}
        {field('heightPx', '세로(px)')}
        {field('maxKB', '최대 용량(KB)')}
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">적용</button>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {target && (
        <PhotoTool
          key={`${target.widthPx}x${target.heightPx}x${target.maxKB}`}
          target={target}
          guides={null}
          fileName={(w, h) => `증명사진_${w}x${h}.jpg`}
          eventLabel="custom"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS (전체)

- [ ] **Step 5: 커밋**

```bash
git add src/components src/lib/photo/custom-target.ts src/lib/photo/custom-target.test.ts src/lib/analytics.ts
git commit -m "feat: add photo tool UI with crop guides and custom size input"
```

---

### Task 7: 예시 사진과 규격 도해

**Files:**
- Create: `public/samples/sample-original.svg`, `src/data/sample-photo.ts`, `scripts/build-samples.ts`, `src/components/SpecDiagram.tsx`
- Generated: `src/data/sample-results.json`
- Modify: `package.json` (scripts)
- Test: `src/components/SpecDiagram.test.tsx`

**Interfaces:**
- Consumes: `publishedPresets`, `PhotoPreset` (Task 2), `presetToTarget`, `byteLimits`, `checkResult`, `formatBytes`, `computeCropRect`, `clampRectToImage`, `headFractionRange`, `getGuideLines`, `FacePoints` (Task 3), `fitJpegToSize` (Task 4)
- Produces:
  - `type SamplePhoto = { src: string; widthPx: number; heightPx: number; format: string; face: FacePoints; isPlaceholder: boolean }`, `SAMPLE_PHOTO: SamplePhoto`
  - `src/data/sample-results.json`: `{ "original": { "bytes": number }, "results": { [slug: string]: { "bytes": number; "widthPx": number; "heightPx": number; "quality": number } } }`
  - `<SpecDiagram preset={PhotoPreset} sample={SamplePhoto} originalBytes={number} resultBytes={number} />`

- [ ] **Step 1: 자리표시 실루엣 작성** — `public/samples/sample-original.svg` (1200×1600, 정수리 y=320, 턱 y=920, 눈 y=600, 중심 x=600):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#e8edf3"/>
  <path d="M180 1600 C 200 1180 400 1060 600 1060 C 800 1060 1000 1180 1020 1600 Z" fill="#94a3b8"/>
  <rect x="530" y="900" width="140" height="190" rx="40" fill="#cbd5e1"/>
  <ellipse cx="600" cy="620" rx="230" ry="300" fill="#cbd5e1"/>
  <path d="M370 600 C 370 380 470 320 600 320 C 730 320 830 380 830 600 C 800 470 720 430 600 430 C 480 430 400 470 370 600 Z" fill="#64748b"/>
  <ellipse cx="515" cy="600" rx="22" ry="13" fill="#475569"/>
  <ellipse cx="685" cy="600" rx="22" ry="13" fill="#475569"/>
</svg>
```

- [ ] **Step 2: 예시 사진 메타데이터** — `src/data/sample-photo.ts`:

```ts
import type { FacePoints } from '../lib/photo/crop-math';

export type SamplePhoto = {
  /** public/ 기준 경로 */
  src: string;
  widthPx: number;
  heightPx: number;
  format: string;
  /** 사람이 이미지 편집기에서 직접 읽은 픽셀 좌표 */
  face: FacePoints;
  isPlaceholder: boolean;
};

export const SAMPLE_PHOTO: SamplePhoto = {
  src: '/samples/sample-original.svg',
  widthPx: 1200,
  heightPx: 1600,
  format: 'SVG',
  face: { crownY: 320, chinY: 920, eyeY: 600, centerX: 600 },
  isPlaceholder: true,
};
```

- [ ] **Step 3: 빌드 스크립트 작성** — `scripts/build-samples.ts`:

```ts
import sharp from 'sharp';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { publishedPresets } from '../src/lib/presets';
import { SAMPLE_PHOTO } from '../src/data/sample-photo';
import { clampRectToImage, computeCropRect } from '../src/lib/photo/crop-math';
import { byteLimits, checkResult, presetToTarget } from '../src/lib/photo/target';
import { fitJpegToSize } from '../src/lib/photo/fit-size';

async function main() {
  const srcPath = path.join(process.cwd(), 'public', SAMPLE_PHOTO.src);
  const input = await readFile(srcPath);
  const originalBytes = (await stat(srcPath)).size;
  const results: Record<string, { bytes: number; widthPx: number; heightPx: number; quality: number }> = {};
  const failures: string[] = [];

  for (const preset of publishedPresets()) {
    const target = presetToTarget(preset);
    const crop = clampRectToImage(
      computeCropRect(SAMPLE_PHOTO.face, target.widthPx / target.heightPx, preset),
      SAMPLE_PHOTO.widthPx,
      SAMPLE_PHOTO.heightPx,
    );
    const base = sharp(input)
      .extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
      .resize(target.widthPx, target.heightPx)
      .flatten({ background: '#ffffff' });
    const fit = await fitJpegToSize(async (q) => {
      const buf = await base.clone().jpeg({ quality: Math.round(q * 100) }).toBuffer();
      return { size: buf.length };
    }, byteLimits(target));

    const check = checkResult(target, { widthPx: target.widthPx, heightPx: target.heightPx, bytes: fit.result.size });
    const minOnly = check.belowMin && SAMPLE_PHOTO.isPlaceholder;
    if (!check.pixels || (!check.size && !minOnly)) failures.push(`${preset.slug}: ${fit.result.size} bytes`);
    if (minOnly) console.warn(`[samples] ${preset.slug}: 자리표시 이미지라 최소 용량 미달 허용`);

    results[preset.slug] = {
      bytes: fit.result.size,
      widthPx: target.widthPx,
      heightPx: target.heightPx,
      quality: Math.round(fit.quality * 100) / 100,
    };
  }

  const out = path.join(process.cwd(), 'src/data/sample-results.json');
  await writeFile(out, JSON.stringify({ original: { bytes: originalBytes }, results }, null, 2) + '\n');
  if (failures.length) {
    console.error('[samples] 규격 불충족:', failures.join(', '));
    process.exit(1);
  }
  console.log(`[samples] ${Object.keys(results).length}개 프리셋 측정 완료`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: package.json scripts 추가** — `"scripts"`에 두 줄 추가:

```json
"samples": "tsx scripts/build-samples.ts",
"prebuild": "npm run samples"
```

- [ ] **Step 5: 스크립트 실행**

Run: `npm run samples`
Expected: `[samples] N개 프리셋 측정 완료` (N = Task 2에서 검증된 프리셋 수), `src/data/sample-results.json` 생성

- [ ] **Step 6: 실패하는 테스트 작성** — `src/components/SpecDiagram.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpecDiagram } from './SpecDiagram';
import { PHOTO_PRESETS } from '@/lib/presets';
import { SAMPLE_PHOTO } from '@/data/sample-photo';

const passport = PHOTO_PRESETS.find((p) => p.slug === 'passport')!;
const toeic = PHOTO_PRESETS.find((p) => p.slug === 'toeic')!;

describe('SpecDiagram', () => {
  it('labels output size, head length and allowed range for presets with head rule', () => {
    render(<SpecDiagram preset={passport} sample={SAMPLE_PHOTO} originalBytes={3_355_443} resultBytes={191_488} />);
    expect(screen.getByText('3.5cm · 413px')).toBeInTheDocument();
    expect(screen.getByText('4.5cm · 531px')).toBeInTheDocument();
    expect(screen.getByText(/머리 3\.\dcm/)).toBeInTheDocument();
    expect(screen.getByText('허용 3.2~3.6cm (높이의 71~80%)')).toBeInTheDocument();
    expect(screen.getByText('3.2MB → 187KB (−94%) · SVG → JPG')).toBeInTheDocument();
    expect(screen.getByText('예시 인물(가상)')).toBeInTheDocument();
  });

  it('shows a centering note instead of head lines without head rule', () => {
    render(<SpecDiagram preset={toeic} sample={SAMPLE_PHOTO} originalBytes={1000} resultBytes={20_000} />);
    expect(screen.queryByText(/머리 \d/)).toBeNull();
    expect(screen.getByText('얼굴 중앙 배치')).toBeInTheDocument();
    expect(screen.getByText('1KB → 20KB · SVG → JPG')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: 실패 확인**

Run: `npm test -- src/components/SpecDiagram`
Expected: FAIL — 모듈 없음

- [ ] **Step 8: 구현** — `src/components/SpecDiagram.tsx`:

```tsx
import type { PhotoPreset } from '@/lib/presets';
import type { SamplePhoto } from '@/data/sample-photo';
import { clampRectToImage, computeCropRect, headFractionRange } from '@/lib/photo/crop-math';
import { formatBytes, presetToTarget } from '@/lib/photo/target';

type Props = { preset: PhotoPreset; sample: SamplePhoto; originalBytes: number; resultBytes: number };

const W = 1000;
const TOP = 60;
const PANEL_H = 440;
const BEFORE_MAX_W = 330;
const ACCENT = '#2563eb';
const DIM = '#e11d48';
const INK = '#334155';

export function SpecDiagram({ preset, sample, originalBytes, resultBytes }: Props) {
  const target = presetToTarget(preset);
  const aspect = target.widthPx / target.heightPx;
  const crop = clampRectToImage(computeCropRect(sample.face, aspect, preset), sample.widthPx, sample.heightPx);

  // BEFORE
  const bs = Math.min(PANEL_H / sample.heightPx, BEFORE_MAX_W / sample.widthPx);
  const bx = 20;
  const bw = sample.widthPx * bs;
  const bh = sample.heightPx * bs;
  const c = { x: bx + crop.x * bs, y: TOP + crop.y * bs, w: crop.width * bs, h: crop.height * bs };

  // AFTER
  const aw = PANEL_H * aspect;
  const ax = W - 110 - aw;
  const toAfterY = (sy: number) => TOP + ((sy - crop.y) / crop.height) * PANEL_H;
  const crownY = toAfterY(sample.face.crownY);
  const chinY = toAfterY(sample.face.chinY);
  const eyeY = toAfterY(sample.face.eyeY);
  const headCm = ((sample.face.chinY - sample.face.crownY) / crop.height) * preset.physicalCm.h;
  const [fMin, fMax] = headFractionRange(preset);

  const reduction = Math.round((1 - resultBytes / originalBytes) * 100);
  const sizeLine = `${formatBytes(originalBytes)} → ${formatBytes(resultBytes)}${reduction > 0 ? ` (−${reduction}%)` : ''} · ${sample.format} → JPG`;
  const label = `${preset.name} 사진 규격 도해: ${target.widthPx}×${target.heightPx}px, ${preset.physicalCm.w}×${preset.physicalCm.h}cm, ${sizeLine}`;

  return (
    <svg viewBox={`0 0 ${W} 600`} role="img" aria-label={label} className="h-auto w-full" fontFamily="inherit">
      <title>{label}</title>

      {/* BEFORE */}
      <text x={bx} y={TOP - 24} fontSize={16} fontWeight={700} fill={INK}>BEFORE · 원본</text>
      <image href={sample.src} x={bx} y={TOP} width={bw} height={bh} preserveAspectRatio="none" />
      <path
        d={`M${bx} ${TOP}h${bw}v${bh}h${-bw}Z M${c.x} ${c.y}v${c.h}h${c.w}v${-c.h}Z`}
        fill="rgba(15,23,42,0.45)" fillRule="evenodd"
      />
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="6 4" />
      <text x={bx} y={TOP + bh + 24} fontSize={14} fill={INK}>{sample.widthPx}×{sample.heightPx}px · {sample.format}</text>
      <text x={bx} y={TOP + bh + 44} fontSize={12} fill="#64748b">점선 = 잘라낼 영역</text>

      {/* 화살표 */}
      <g fill={ACCENT}>
        <rect x={bx + bw + 30} y={TOP + PANEL_H / 2 - 3} width={ax - bx - bw - 80} height={6} />
        <path d={`M${ax - 40} ${TOP + PANEL_H / 2 - 14}l22 14l-22 14Z`} />
      </g>

      {/* AFTER */}
      <text x={ax} y={TOP - 34} fontSize={16} fontWeight={700} fill={INK}>AFTER · {preset.name}</text>
      <svg x={ax} y={TOP} width={aw} height={PANEL_H} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="none">
        <image href={sample.src} width={sample.widthPx} height={sample.heightPx} />
      </svg>
      <rect x={ax} y={TOP} width={aw} height={PANEL_H} fill="none" stroke={INK} />

      {/* 가로 치수 */}
      <line x1={ax} y1={TOP - 12} x2={ax + aw} y2={TOP - 12} stroke={DIM} />
      <line x1={ax} y1={TOP - 18} x2={ax} y2={TOP - 6} stroke={DIM} />
      <line x1={ax + aw} y1={TOP - 18} x2={ax + aw} y2={TOP - 6} stroke={DIM} />
      <text x={ax + aw / 2} y={TOP - 18} fontSize={13} fill={DIM} textAnchor="middle">
        {`${preset.physicalCm.w}cm · ${target.widthPx}px`}
      </text>

      {/* 세로 치수 */}
      <line x1={ax + aw + 14} y1={TOP} x2={ax + aw + 14} y2={TOP + PANEL_H} stroke={DIM} />
      <line x1={ax + aw + 8} y1={TOP} x2={ax + aw + 20} y2={TOP} stroke={DIM} />
      <line x1={ax + aw + 8} y1={TOP + PANEL_H} x2={ax + aw + 20} y2={TOP + PANEL_H} stroke={DIM} />
      <text
        x={ax + aw + 30} y={TOP + PANEL_H / 2} fontSize={13} fill={DIM} textAnchor="middle"
        transform={`rotate(90 ${ax + aw + 30} ${TOP + PANEL_H / 2})`}
      >
        {`${preset.physicalCm.h}cm · ${target.heightPx}px`}
      </text>

      {/* 중앙선 */}
      <line x1={ax + aw / 2} y1={TOP} x2={ax + aw / 2} y2={TOP + PANEL_H} stroke={ACCENT} strokeDasharray="4 4" opacity={0.7} />

      {preset.head ? (
        <g>
          <line x1={ax} y1={crownY} x2={ax + aw} y2={crownY} stroke={ACCENT} strokeDasharray="6 4" />
          <line x1={ax} y1={chinY} x2={ax + aw} y2={chinY} stroke={ACCENT} strokeDasharray="6 4" />
          <line x1={ax} y1={eyeY} x2={ax + aw} y2={eyeY} stroke={ACCENT} strokeDasharray="2 4" opacity={0.6} />
          <line x1={ax - 14} y1={crownY} x2={ax - 14} y2={chinY} stroke={ACCENT} strokeWidth={2} />
          <text
            x={ax - 24} y={(crownY + chinY) / 2} fontSize={13} fill={ACCENT} textAnchor="middle"
            transform={`rotate(-90 ${ax - 24} ${(crownY + chinY) / 2})`}
          >
            {`머리 ${headCm.toFixed(1)}cm`}
          </text>
          <text x={ax} y={TOP + PANEL_H + 24} fontSize={13} fill={ACCENT}>
            {`허용 ${preset.head.minCm}~${preset.head.maxCm}cm (높이의 ${Math.round(fMin * 100)}~${Math.round(fMax * 100)}%)`}
          </text>
        </g>
      ) : (
        <text x={ax} y={TOP + PANEL_H + 24} fontSize={13} fill={ACCENT}>얼굴 중앙 배치</text>
      )}

      {/* 용량 변화 */}
      <text x={W / 2} y={TOP + PANEL_H + 72} fontSize={18} fontWeight={700} fill={INK} textAnchor="middle">{sizeLine}</text>
      <text x={W - 20} y={590} fontSize={11} fill="#94a3b8" textAnchor="end">예시 인물(가상)</text>
    </svg>
  );
}
```

- [ ] **Step 9: 통과 확인**

Run: `npm test`
Expected: PASS (전체)

- [ ] **Step 10: 커밋**

```bash
git add public/samples src/data scripts src/components/SpecDiagram.tsx src/components/SpecDiagram.test.tsx package.json
git commit -m "feat: add data-driven before/after spec diagram with measured sample sizes"
```

---

### Task 8: 페이지, SEO, 광고 자리

**Files:**
- Create: `src/components/AdSlot.tsx`, `src/components/Analytics.tsx`, `src/app/photo/page.tsx`, `src/app/photo/[preset]/page.tsx`, `src/app/privacy/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify (전체 교체): `src/app/layout.tsx`, `src/app/page.tsx`
- Delete: `public/` 안의 create-next-app 기본 SVG (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)

**Interfaces:**
- Consumes: `siteConfig` (Task 1), `publishedPresets`, `getPreset`, `presetSummary`, `downloadFileName` (Task 2), `presetToTarget` (Task 3), `getGuideLines` (Task 3), `PhotoTool`, `CustomPhotoTool` (Task 6), `SpecDiagram`, `SAMPLE_PHOTO`, `sample-results.json` (Task 7)
- Produces: 정적 페이지 `/`, `/photo/`, `/photo/{slug}/`, `/privacy/`, `/sitemap.xml`, `/robots.txt`

- [ ] **Step 1: 광고·분석 컴포넌트** — `src/components/AdSlot.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSlot({ slot }: { slot: string | undefined }) {
  useEffect(() => {
    if (!CLIENT || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등 — 무시
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;
  return (
    <ins
      className="adsbygoogle my-6 block"
      style={{ display: 'block' }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
```

`src/components/Analytics.tsx`:

```tsx
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {ADSENSE_CLIENT && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: 레이아웃** — `src/app/layout.tsx` 전체 교체 (`globals.css`는 create-next-app 것 유지):

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Analytics } from '@/components/Analytics';
import { siteConfig } from '@/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold">{siteConfig.name}</Link>
            <Link href="/photo/" className="text-sm text-slate-600 hover:text-slate-900">증명사진</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-slate-500">
          <p>모든 사진은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.</p>
          <p className="mt-1">
            규격은 각 기관 공식 안내를 기준으로 하며, 제출 전 기관 안내를 한 번 더 확인해 주세요. ·{' '}
            <Link href="/privacy/" className="underline">개인정보처리방침</Link>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 홈과 기관 목록** — `src/app/page.tsx` 전체 교체:

```tsx
import Link from 'next/link';
import { publishedPresets } from '@/lib/presets';

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">제출 서류 사진, 규격에 딱 맞게</h1>
        <p className="mt-2 text-slate-600">기관별 픽셀·용량·머리 비율을 그대로 반영합니다. 사진은 서버로 전송되지 않습니다.</p>
      </section>
      <Link href="/photo/" className="block rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500">
        <h2 className="text-lg font-semibold">증명사진 규격 맞춤기</h2>
        <p className="mt-1 text-sm text-slate-600">{publishedPresets().map((p) => p.name).join(' · ')}</p>
      </Link>
    </div>
  );
}
```

`src/app/photo/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { CustomPhotoTool } from '@/components/CustomPhotoTool';
import { presetSummary, publishedPresets } from '@/lib/presets';

export const metadata: Metadata = {
  title: '증명사진 규격 맞추기 (기관별 크기·용량)',
  description: '여권, 주민등록증, 운전면허, Q-net, 공무원 시험, 토익 사진 규격을 골라 바로 맞추세요.',
  alternates: { canonical: '/photo/' },
};

export default function PhotoIndex() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">증명사진 규격 맞추기</h1>
        <p className="mt-2 text-slate-600">제출할 곳을 고르세요. 규격이 미리 설정된 도구가 열립니다.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {publishedPresets().map((p) => (
            <li key={p.slug}>
              <Link href={`/photo/${p.slug}/`} className="block rounded-xl border bg-white p-4 hover:border-blue-500">
                <span className="font-semibold">{p.name} 사진</span>
                <span className="mt-1 block text-sm text-slate-600">{presetSummary(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">원하는 크기로 직접 입력</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">목록에 없는 기관은 안내된 픽셀과 용량을 입력하세요.</p>
        <CustomPhotoTool />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 기관별 페이지** — `src/app/photo/[preset]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { PhotoTool } from '@/components/PhotoTool';
import { SpecDiagram } from '@/components/SpecDiagram';
import { SAMPLE_PHOTO } from '@/data/sample-photo';
import sampleResults from '@/data/sample-results.json';
import { getGuideLines } from '@/lib/photo/crop-math';
import { presetToTarget } from '@/lib/photo/target';
import { downloadFileName, getPreset, presetSummary, publishedPresets } from '@/lib/presets';

type Params = { preset: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return publishedPresets().map((p) => ({ preset: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const preset = getPreset((await params).preset);
  if (!preset) return {};
  return {
    title: `${preset.name}사진 규격 맞추기 · ${presetSummary(preset)}`,
    description: `${preset.org} ${preset.name} 사진 규격(${presetSummary(preset)})에 맞춰 브라우저에서 바로 자르고 용량을 맞춥니다. 사진은 서버로 전송되지 않습니다.`,
    alternates: { canonical: `/photo/${preset.slug}/` },
  };
}

export default async function PresetPage({ params }: { params: Promise<Params> }) {
  const preset = getPreset((await params).preset);
  if (!preset) notFound();

  const target = presetToTarget(preset);
  const results = sampleResults.results as Record<string, { bytes: number }>;
  const sample = results[preset.slug];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preset.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const rows: [string, string][] = [
    ['사진 크기', `${preset.physicalCm.w} × ${preset.physicalCm.h}cm`],
    ['픽셀', presetSummary(preset).split(' · ')[1]],
    ['용량', presetSummary(preset).split(' · ')[2]],
    ['파일 형식', 'JPG'],
    ...(preset.head ? ([['머리 길이 (정수리~턱)', `${preset.head.minCm} ~ ${preset.head.maxCm}cm`]] as [string, string][]) : []),
    ...(preset.background ? ([['배경', preset.background === 'white' ? '흰색' : '단색']] as [string, string][]) : []),
  ];

  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{preset.name}사진 규격 맞추기</h1>
        <p className="mt-2 text-slate-600">{preset.org} · {presetSummary(preset)}</p>
      </header>

      {sample && (
        <figure className="rounded-2xl border bg-white p-4">
          <SpecDiagram preset={preset} sample={SAMPLE_PHOTO} originalBytes={sampleResults.original.bytes} resultBytes={sample.bytes} />
        </figure>
      )}

      <PhotoTool
        target={target}
        guides={getGuideLines(preset)}
        fileName={(w, h) => downloadFileName(preset, w, h)}
        eventLabel={preset.slug}
      />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL} />

      <section>
        <h2 className="text-lg font-semibold">{preset.name}사진 규격</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse bg-white text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b">
                  <th className="w-40 bg-slate-50 p-2 text-left font-medium">{k}</th>
                  <td className="p-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          출처:{' '}
          {preset.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ', '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a>
            </span>
          ))}{' '}
          · 확인일 {preset.verifiedAt}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">제출 전 체크리스트</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {preset.checklist.map((c) => <li key={c}>☐ {c}</li>)}
        </ul>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} />

      <section>
        <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
        <dl className="mt-3 space-y-4 text-sm">
          {preset.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">Q. {f.q}</dt>
              <dd className="mt-1 text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </article>
  );
}
```

- [ ] **Step 5: 개인정보처리방침, sitemap, robots** — `src/app/privacy/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = { title: '개인정보처리방침', alternates: { canonical: '/privacy/' } };

export default function Privacy() {
  return (
    <article className="prose max-w-none space-y-4 text-sm">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <p>{siteConfig.name}(이하 &quot;사이트&quot;)는 이용자의 사진을 수집하거나 저장하지 않습니다. 사진 자르기, 크기 변경, 용량 조정은 모두 이용자의 브라우저 안에서 처리되며 서버로 전송되지 않습니다.</p>
      <h2 className="text-lg font-semibold">수집하는 정보</h2>
      <p>사이트는 서비스 개선을 위해 Google Analytics로 방문 페이지, 기기·브라우저 종류, 대략적인 지역 등 익명 통계를 수집합니다. 이 과정에서 쿠키가 사용될 수 있습니다.</p>
      <h2 className="text-lg font-semibold">광고</h2>
      <p>사이트는 Google AdSense 광고를 게재할 수 있습니다. Google은 쿠키를 사용해 이용자의 관심사에 맞는 광고를 표시할 수 있으며, 이용자는 Google 광고 설정(adssettings.google.com)에서 맞춤 광고를 끌 수 있습니다.</p>
      <h2 className="text-lg font-semibold">문의</h2>
      <p>개인정보 관련 문의는 사이트 운영자에게 연락해 주세요.</p>
      <p className="text-xs text-slate-500">시행일: 2026-10-01</p>
    </article>
  );
}
```

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { publishedPresets } from '@/lib/presets';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/photo/', ...publishedPresets().map((p) => `/photo/${p.slug}/`), '/privacy/'];
  return pages.map((path) => ({ url: `${siteConfig.url}${path}` }));
}
```

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${siteConfig.url}/sitemap.xml` };
}
```

- [ ] **Step 6: 기본 SVG 삭제**

```bash
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

(파일 이름이 다르면 `public/`을 열어 create-next-app 기본 이미지만 지운다. `public/samples/`는 지우지 않는다.)

- [ ] **Step 7: 빌드와 결과 확인**

Run: `npm test && npm run build`
Expected: 테스트 PASS, 빌드 성공

Run:
```bash
node -e "const fs=require('fs');const r=require('./src/data/sample-results.json');for(const s of Object.keys(r.results)){const f='out/photo/'+s+'/index.html';if(!fs.existsSync(f))throw new Error('missing '+f)}for(const f of ['out/index.html','out/photo/index.html','out/privacy/index.html','out/sitemap.xml','out/robots.txt'])if(!fs.existsSync(f))throw new Error('missing '+f);console.log('OK')"
```
Expected: `OK`

- [ ] **Step 8: 로컬 확인**

Run: `npm run start` 후 브라우저에서 `http://localhost:3000/photo/passport/` 열기
Expected: 도해(BEFORE/AFTER, 치수선, 용량 줄), 업로드 영역, 규격표, 체크리스트, FAQ가 보임. 사진 하나 올려 크롭 → "규격에 맞춰 만들기" → 413×531px, 500KB 이하, ✓ 3개 → 내려받기 동작.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat: add home, preset pages, privacy, sitemap and ad slots"
```

---

### Task 9: AI 예시 사진 교체, 배포, 출시 전 QA

이 태스크는 사용자가 직접 해야 하는 단계가 섞여 있다. 엔지니어는 각 단계에서 사용자에게 무엇을 해야 하는지 안내하고 결과를 확인한다.

**Files:**
- Create: `public/samples/sample-original.jpg` (사용자 제공)
- Modify: `src/data/sample-photo.ts`
- Regenerated: `src/data/sample-results.json`

**Interfaces:**
- Consumes: Task 7의 `SAMPLE_PHOTO` 구조, `npm run samples`

- [ ] **Step 1: AI 예시 인물 생성 (사용자)**

이미지 생성 도구에 아래 프롬프트를 넣는다:

```
Photorealistic ID photo of a fictional East Asian adult, head and shoulders, facing the camera directly,
neutral expression, mouth closed, eyes open, even soft studio lighting, no shadows on the face or background,
plain pure white background, dark plain crew-neck top, no glasses, no accessories, hair not covering the eyebrows,
portrait orientation 3:4, at least 1200×1600 pixels, head centered with generous space above the head and
below the shoulders. Not a real person.
```

조건: 세로 3:4, 1200×1600 이상, 정수리 위와 어깨 아래에 여유 공간 (크롭 박스가 이미지 밖으로 나가지 않도록). 결과를 JPG로 저장해 `public/samples/sample-original.jpg`에 둔다. 아이폰 원본처럼 보이게 하려면 원본 크기 그대로(수 MB) 두는 것이 도해의 "용량 변화" 설명에 효과적이다.

- [ ] **Step 2: 얼굴 좌표 측정 (사용자 또는 엔지니어)**

그림판(또는 아무 이미지 편집기)에서 이미지를 열고 마우스를 올려 왼쪽 아래 픽셀 좌표를 읽는다.
- `crownY`: 머리카락 맨 윗부분의 y
- `chinY`: 턱 끝의 y
- `eyeY`: 두 눈동자 중심의 y
- `centerX`: 코끝의 x

- [ ] **Step 3: 메타데이터 교체** — `src/data/sample-photo.ts`의 `SAMPLE_PHOTO`를 실제 값으로 바꾼다 (예시 숫자는 측정값으로 대체):

```ts
export const SAMPLE_PHOTO: SamplePhoto = {
  src: '/samples/sample-original.jpg',
  widthPx: 3024,   // 실제 이미지 가로
  heightPx: 4032,  // 실제 이미지 세로
  format: 'JPG',
  face: { crownY: 980, chinY: 2380, eyeY: 1700, centerX: 1512 }, // Step 2 측정값
  isPlaceholder: false,
};
```

- [ ] **Step 4: 재측정과 확인**

Run: `npm run samples && npm test && npm run build`
Expected: 모든 프리셋 측정 완료, 테스트 PASS, 빌드 성공. 실패하면 크롭 박스가 이미지 밖으로 나가 잘렸을 가능성 → 여유 공간이 더 있는 이미지로 다시 생성.

`npm run start` → `/photo/passport/`에서 도해의 After 칸에 얼굴이 정수리·턱 선 사이에 들어오는지 눈으로 확인.

`public/samples/sample-original.svg`는 더 이상 쓰지 않으면 삭제한다.

```bash
git add -A
git commit -m "feat: use AI-generated sample portrait in spec diagrams"
```

- [ ] **Step 5: GitHub 저장소와 Cloudflare Pages 배포 (사용자)**

1. GitHub에 비공개 저장소를 만들고 push (`git remote add origin <url>` → `git push -u origin main`)
2. Cloudflare 대시보드 → Workers & Pages → Pages → Connect to Git → 저장소 선택
3. Build command: `npm run build` / Output directory: `out` / 환경 변수: `NODE_VERSION=22`, `NEXT_PUBLIC_SITE_URL=https://<배포 주소>`
4. 배포 후 `https://<배포 주소>/photo/passport/` 접속 확인

사이트 이름과 도메인이 정해지면 `src/config/site.ts`의 `name`과 Cloudflare의 `NEXT_PUBLIC_SITE_URL`만 바꿔 재배포한다.

- [ ] **Step 6: 분석과 검색 등록 (사용자)**

1. GA4 속성 생성 → 측정 ID를 Cloudflare 환경 변수 `NEXT_PUBLIC_GA_ID`에 넣고 재배포
2. Google Search Console에 사이트 등록 → `sitemap.xml` 제출
3. 네이버 서치어드바이저에 사이트 등록 → 사이트맵 제출 (한국 검색 유입의 큰 몫)
4. AdSense는 출시 후 신청. 승인되면 `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_TOOL`, `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` 설정 후 재배포

- [ ] **Step 7: 출시 전 수동 QA**

| 기기·브라우저 | 사진 | 확인 |
|---|---|---|
| 아이폰 Safari | 아이폰 카메라 원본 (HEIC) | 업로드, 회전 방향 정상, 크롭, 내려받기 |
| 안드로이드 Chrome | 갤러리 JPG | 위와 동일 |
| 데스크톱 Chrome | 큰 JPG (4000px 이상) | 위와 동일, 처리 시간 수 초 이내 |

각 공개 프리셋마다 결과 파일의 픽셀(파일 속성)과 용량이 규격 안인지 확인. 공무원 시험 프리셋이 공개되었다면 작은 원본으로 최소 용량 경고가 뜨는지 확인. 가능하면 Q-net 등 실제 사이트의 사진 등록 화면에 결과 파일을 올려 통과하는지 확인 (사용자 계정 필요).

- [ ] **Step 8: 출시 기록**

출시 날짜를 기록하고 2~3주 뒤 Search Console 노출·클릭과 GA4 `photo_download` 이벤트 수를 확인해 HWP 변환기로 넘어갈지 판단한다.
