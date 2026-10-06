# 증명사진 규격 맞춤기

기관(여권, 운전면허, Q-net, 토익)을 고르면 그 규격(픽셀, 실물 크기, 용량, 머리 비율)에 맞춰 증명사진 JPG를 브라우저에서 만들어 주는 정적 웹사이트. Next.js App Router 정적 내보내기(`output: 'export'`)로 빌드되며, 이미지 처리는 전부 브라우저 캔버스에서 일어난다 — **사진은 서버로 전송되지 않는다.**

- 기관 규격 데이터: `src/lib/presets/data.ts` (공식 출처로 검증된 것만 `verifiedAt`에 날짜가 들어가고, 그것만 사이트에 노출된다)
- 크롭/용량 맞춤 로직: `src/lib/photo/*`
- 사이트 이름/설명: `src/config/site.ts`
- 자세한 설계 배경: `docs/superpowers/specs/2026-10-01-id-photo-tool-design.md`, 구현 계획: `docs/superpowers/plans/2026-10-01-id-photo-tool.md`

## 요구 사항

Node 22 LTS (22.12 이상).

## 개발

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

## 테스트

```bash
npm test        # vitest run
npm run test:watch
```

## 빌드

```bash
npm run build
```

`prebuild` 단계에서 `scripts/build-samples.ts`가 예시 사진을 기관별로 실제 인코딩해 `src/data/sample-results.json`에 용량을 기록한다 (규격 도해에 꾸며낸 숫자를 쓰지 않기 위함). 결과는 `out/`에 정적 파일로 나온다.

## 배포

Cloudflare Pages 기준:

- Build command: `npm run build`
- Output directory: `out`
- 환경 변수: `NODE_VERSION=22`, `NEXT_PUBLIC_SITE_URL=https://<배포 주소>` (선택: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_TOOL`, `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT`)

배포 전 사용자가 직접 해야 하는 단계(AI 예시 인물 교체, Cloudflare 연결, GA/서치콘솔 등록)는 플랜의 Task 9에 정리되어 있다.
