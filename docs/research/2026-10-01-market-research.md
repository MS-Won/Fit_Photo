# WebTools 시장 조사 및 의사결정 기록

- 작성일: 2026-10-01
- 목적: 사람들이 필요로 하는 간단한 웹 도구를 만들어 수익화. 경쟁력 있는(가능하면 경쟁 없는) 아이템 선정.
- 방법: 학습 데이터 기반 지식 + 웹 검색으로 경쟁 사이트 실측. 검색량 수치는 확정하지 못했으므로 네이버 키워드 도구 / Google Trends로 별도 검증 권장.

---

## 1. 확정된 기본 방향

| 항목 | 결정 | 이유 |
|---|---|---|
| 타깃 시장 | 한국(한국어) 먼저 → 반응 좋은 도구만 글로벌(영어) 확장 | 한국 특화 틈새가 경쟁이 적음 |
| 수익 모델 | 광고(AdSense) + 업무용 도구에 유료 기능 혼합 | 한국 광고 단가가 낮아 광고 단독은 어려움 |
| 기술 범위 | 브라우저 내 처리만 (서버 비용 ≈ 0) | 비용 0, "파일이 서버로 안 감"이 마케팅 포인트 |
| 진행 원칙 | 빠른 MVP → 실제 시장 반응 확인 → 이후 확장 | 사용자가 완벽주의 성향으로 출시가 늦어지고 흥미를 잃는 패턴이 있음 |
| 진행 방식 | 작은 도구를 하나씩 3~5일 단위로 연속 출시 | 한 도구에 오래 매달리지 않는 구조 |

## 2. 핵심 발견: "경쟁 없는 간단한 도구"는 사실상 없음

2025~2026년 AI로 빠르게 만든 한국어 도구 사이트(toolog, 세금도구함, demoday 등)가 급증해서, 웬만한 틈새에 이미 경쟁자가 있음. 그중 상당수가 "브라우저에서만 처리"도 이미 내세우고 있음.

**수정된 경쟁 전략: 롱테일 SEO**
- 경쟁자 대부분은 도구 페이지 1개짜리 작은 사이트
- 같은 도구라도 구체적 사례별 랜딩 페이지를 여러 개 생성 (예: 기관별 증명사진 규격 페이지)
- 큰 키워드 1개 대신 작은 키워드 수십 개에서 상위 노출
- 페이지는 같은 도구에 설정값만 달라 개발 부담이 거의 없음
- 주의: [monkos.ai](https://monkos.ai/specs/passport/kr)가 국가·서류별 규격 페이지 전략을 이미 사용 중 → "한국 기관 규격을 가장 정확하고 깊게" 다루는 것이 차별점

## 3. 후보 아이템 경쟁 검토 결과

### 3.1 1차 후보

| 아이템 | 확인된 경쟁자 | 경쟁 강도 | 판정 |
|---|---|---|---|
| 증명사진 규격 맞춤기 | [인크루트 사진 리사이저](https://lab.incruit.com/editor/photo/) (브라우저 처리), [PicSize](https://picsize.app/) (프리셋 보유), [이미지프레소](https://imgpresso.co.kr/) | 중간~높음 | ✅ 채택 (기관별 프리셋 + 롱테일 페이지로 차별화) |
| 영수증 A4 배치 PDF | [세금도구함](https://taxdogu.com/receipt-pdf/) (거의 동일 기능, 브라우저 처리) | 낮음 | ✅ 채택 (자동 크롭, HEIC, 합계표로 차별화) |
| 개인정보 자동 마스킹 | [Toolog](https://toolog.sooyadev.com/tools/privacy-masker/), [에이픽 API](https://apick.app/dev_guide/hide_rrn) | 중간 | 보류 (이미지 속 주민번호 처리는 OCR이 무거움) |
| 오픈마켓 마진 계산기 | [Demoday](https://demoday.co.kr/tools/smartstore-margin), [장사왕](https://www.sellerking.io/), [셀러들의 아지트](https://sellerazit.com/), [온채널](https://www.onch3.co.kr/margin_calculater.php) | 높음 | ❌ 포화 |
| 카톡 대화 분석기 | [TalkStat](https://play.google.com/store/apps/details?id=com.talkstat.chat.analysis&hl=ko), [어바웃톡](https://about-talk.vercel.app/), 카톡 정밀 분석기, 텍스트앳 등 | 높음 | ❌ 제외 (사용자 결정) |

### 3.2 추가 아이디어

| 아이템 | 확인된 경쟁자 | 경쟁 강도 | 판정 |
|---|---|---|---|
| 신분증 사본 워터마크 | [Watermark Image](https://watermarkimage.com/ko) 등 범용 도구 | 낮음~중간 | 후보 (신분증 전용 한국어 도구는 못 찾음) |
| CSV 한글 깨짐 복구 | [GitHub 맥 전용 도구](https://github.com/mebaser/euckr-utf8-trans), 블로그 해결법 | 낮음 | 후보 (수익화 약함) |
| 맥 파일명 자소 분리 복구 | [자모야 모여라](https://github.com/hyunbinseo/jamoya.one) | 중간 | ❌ |
| 상세페이지 이미지 분할 | [DocSmall](https://docsmall.com/en/image-divide) | 낮음~중간 | 보류 |
| 명단으로 명찰 만들기 | [Luna Whale](https://lunawhale.com/pages/main/nametag.html) | 중간 | ❌ |
| 축의금·용돈 봉투 인쇄 | moonbangoo.com 용돈봉투 출력기 | 낮음~중간 | 보류 (계절성) |
| 주문 엑셀 → 택배 송장 변환 | [송장.com](https://www.songjang.com/), [헬로안녕](https://helloannyeong.com/) | 높음 | ❌ |

### 3.3 HWP → DOCX 변환기 (별도 조사)

**수요: 높고 지속적**
- 공공·교육 문서는 여전히 HWP 표준. Word 사용 회사, 맥 사용자, 외국인은 반복적으로 변환 필요
- 2021-04부터 한컴 기본 저장 형식이 HWPX로 변경 → HWP/HWPX 혼재
- 변환 시 표·서식 깨짐 불만이 반복적으로 나타남
- 업무용이라 유료 전환 가능성이 가장 높고, 글로벌 확장에도 가장 유리

**경쟁: 많지만 품질이 약함**
- 해외 범용: [CloudConvert](https://cloudconvert.com/hwp-to-docx), [CoolUtils](https://www.coolutils.com/online/HWP-to-DOCX), [AnyConv](https://anyconv.com/hwp-to-docx-converter/), [Vertopal](https://www.vertopal.com/en/convert/hwpx-to-docx), [MiConv](https://miconv.com/hwp-to-docx/), [Convertman](https://convertman.com/hwp-to-docx), [online-convert](https://document.online-convert.com/convert/hwp-to-docx), [FreeFileConvert](https://freefileconvert.com/hwp-docx)
- 한국어: [KSConv](https://ksconv.com/hwpx-to-docx), [LETPANG](https://tools.letpang.com/), [hwp2pdf (Gmail)](https://workspace.google.com/marketplace/app/hwp2pdf/763548523426?hl=ko)
- 한컴 자체 "다른 이름으로 저장" (한글 프로그램 필요)
- 범용 변환기들도 복잡한 서식(다단, 글상자) 보존 불가를 인정. 대부분 서버 업로드 방식

**사용자가 겪은 문제 3가지의 해결 가능성**

| 문제 | 해결 가능성 | 비고 |
|---|---|---|
| ① 줄바꿈·표 찌그러짐 | 개선은 가능, 완벽한 재현은 불가능 | 용지·여백·표 열 너비 절대값·셀 여백·장평/자간 매핑으로 기존보다 확실히 나은 수준 가능. **가장 어렵고 끝없는 작업, 완벽주의 함정 위험 매우 높음** |
| ② 암호 문서 | HWPX ✅ / 배포용 HWP ✅ / HWP 5.0 열기 암호 ❓ | HWPX는 ODF 패키지 암호화(AES-256-CBC, PBKDF2) → 브라우저에서 사용자 입력 암호로 해제 가능 ([한컴 기술 블로그](https://tech.hancom.com/hwpxformat/), [python-hwpx](https://github.com/airmang/python-hwpx/pull/104)). 배포용 HWP는 AES-128 ECB로 방법 공개됨 ([hwp-foss](https://groups.google.com/g/hwp-foss/c/d2KL2ypR89Q)). HWP 5.0 열기 암호는 공개 스펙에서 확인 못 함 → 기술 검증 필요. 암호 해킹 기능은 넣지 않음 |
| ③ HWPX 및 다양한 형식 | ✅ | HWPX는 XML 기반이라 오히려 쉬움. 출력: DOCX/PDF/ODT/TXT/HTML/MD. PDF 렌더링에 [rhwp](https://github.com/edwardkim/rhwp) 활용 여지 |

- 브라우저 내 처리 가능 → "공문서를 서버에 올리지 않는 HWP 변환기"가 강력한 차별점
- 한컴 HWP 공개 스펙은 출처 표기 조건으로 사용 가능
- **착수 전 1~2일 검증**: 사용자가 실제 겪은 문제 파일을 경쟁 변환기 3~4곳에 돌려 품질 차이 측정 → 차이가 크면 진행

### 3.4 종합 비교

| 항목 | HWP 변환기 | 증명사진 | 영수증 |
|---|---|---|---|
| 수요 | ★★★ | ★★ | ★★ |
| 유료화 가능성 | ★★★ | ★ | ★★ |
| 글로벌 확장 | ★★★ | ★ | ★ |
| 경쟁 강도 | 높음 (품질 약함) | 중간 | 낮음 |
| MVP 기간 | 2~4주 이상 | 3~5일 | 3~5일 |
| 완벽주의 함정 위험 | 매우 높음 | 낮음 | 낮음 |

## 4. 확정 로드맵

1. **증명사진 규격 맞춤기**: 첫 출시. 출시·배포·광고 설정 한 바퀴 경험 확보
2. **HWP/HWPX → DOCX 변환기**: 메인 사업. 경쟁 품질 검증 후, 좁힌 MVP(HWP·HWPX → DOCX, 본문+표, HWPX 암호)로 기한을 정해 진행
3. **영수증 A4 PDF**

## 5. 증명사진 기관 규격 조사 (초안, 공식 출처 재검증 필요)

| 기관 | 사진 크기 | 픽셀 | 용량 | 얼굴·기타 조건 | 출처 신뢰도 |
|---|---|---|---|---|---|
| 여권 (외교부) | 3.5×4.5cm | 온라인 413×531 권장 | 500KB 이하 | 머리 길이(정수리~턱) 3.2~3.6cm, 흰 배경, 정면 | ◎ [파주시 PDF](https://www.paju.go.kr/resources/download/%EC%97%AC%EA%B6%8C%EB%AF%BC%EC%9B%90_%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84%EA%B7%9C%EA%B2%A9%EC%95%88%EB%82%B4.pdf), [외교부](https://www.mofa.go.kr/cn-xian-ko/brd/m_753/view.do?seq=1035220&page=1) |
| 주민등록증 (정부24) | 3.5×4.5cm | 413×531 권장 | 500KB 이하 | 얼굴 비중이 너무 작거나 크면 자동 판독 실패 | ○ [행안부](https://www.mois.go.kr/frt/sub/a06/b06/IDCard_5/screen.do), [정부24](https://www.gov.kr/mw/EgovPageLink.do?link=popup%2Fhow_to_editPic) |
| 운전면허 (온라인 갱신) | 3.5×4.5cm | 350×450 적정 (가로·세로 200~500px) | 250KB 이하 | 보정 금지, 정면 | ◎ [도로교통공단](https://www.koroad.or.kr/main/board/1/787/board_view.do?cp=31&listType=list&bdOpenYn=Y&bdNoticeYn=N) |
| Q-net | 3×4 또는 2.5×3.5cm | 300×400 이상 | 200KB 이하 | 이마·눈썹·눈·코·입이 보여야 함 | ◎ [큐넷 길라잡이](https://www.q-net.or.kr/qnet/html/guideQnet/guide_02.html) |
| 공무원 시험 (사이버국가고시센터) | 3.5×4.5cm | 413×531 (추정) | 20~240KB (최소 용량 있음) | 흰 배경 | △ 2차 출처, 공식 확인 필요 |
| 토익 (YBM) | 3×4cm | 115×150 | 500KB 이하 | 배경 없이 정면 | ○ [토익스토리](https://www.toeicstory.co.kr/160) |

## 6. 의사결정 이력 (질문 → 답)

1. 타깃 시장 → 한국 먼저, 반응 좋으면 글로벌
2. 수익 모델 → 광고 + 유료 혼합
3. 기술 범위 → 브라우저 내 처리만 (완벽주의 성향 고려해 빠른 MVP 최우선)
4. 진행 방식 → 작은 도구 연속 출시
5. 카톡 분석기 제외, 추가 아이디어 요청
6. HWP 변환기 수요 조사 요청
7. 순서 확정 → 증명사진 → HWP → 영수증
8. 증명사진 MVP 범위 → 수동 크롭 + 자동 용량 맞춤 (얼굴 자동 인식은 다음 업데이트, 배경 제거는 유료 후보)
9. 출시 프리셋 수 → 6개 (공식 출처 검증 후)
10. 기술 스택 → Next.js 정적 내보내기
11. 기관별 요구사항(사진 외곽, 얼굴 비율 등)의 정확한 반영이 가장 중요
12. 도구 페이지에 Before/After 규격 도해 이미지 추가, 홈에도 대표 도해 (홈은 추후)
