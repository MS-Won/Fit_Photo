import type { PhotoPreset } from './types';

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    slug: 'passport',
    name: '여권',
    org: '외교부',
    physicalCm: { w: 3.5, h: 4.5 },
    pixels: {
      mode: 'range',
      recommended: { w: 413, h: 531 },
      min: { w: 395, h: 507 },
      max: { w: 431, h: 550 },
    },
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
        a: '가로 395~431, 세로 507~550픽셀 범위 내에서만 업로드할 수 있으며, 413×531픽셀이 권장 규격입니다. 파일 용량은 500KB 이하 JPG여야 합니다. 이 도구는 권장 규격인 413×531픽셀로 자동 저장합니다.',
      },
      {
        q: '양쪽 귀가 보여야 하나요?',
        a: '양쪽 귀 노출 의무 조항은 삭제되었습니다. 다만 얼굴 윤곽이 가려지지 않아야 합니다.',
      },
    ],
    sources: [
      {
        label: '외교부 여권안내: 여권사진 규격 안내 리플릿 (2022.10 개정)',
        url: 'https://www.passport.go.kr/resources/attach/%EC%82%AC%EC%A7%84%EA%B7%9C%EA%B2%A9%EC%95%88%EB%82%B4%EB%A6%AC%ED%94%8C%EB%A6%BF(%ED%99%8D%EB%B3%B4%EC%9E%90%EB%A3%8C,%20%EC%82%AC%EC%A7%84%EA%B2%80%EC%A6%9D%EA%B8%B0%EB%8A%A5%20%EC%95%88%EB%82%B4%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C%EC%9A%A9).pdf',
      },
      {
        label: '외교부 여권안내: 온라인 사진 검증 안내 (업로드 픽셀·용량)',
        url: 'https://www.passport.go.kr/home/kor/onlinePhotoVerify/index.do?menuPos=43',
      },
    ],
    verifiedAt: '2026-10-05',
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
    pixels: { mode: 'exact', w: 413, h: 531 },
    format: 'jpg',
    fileSizeKB: { max: 500 },
    head: { minCm: 3.2, maxCm: 3.6 },
    background: 'white',
    checklist: [
      '최근 6개월 이내에 촬영한 상반신 정면 사진, 흰색(또는 흰색에 가까운 미색) 배경',
      '머리 길이(정수리~턱) 3.2~3.6cm, 양쪽 눈썹 각 70% 이상 노출',
      '복사하거나 포토샵으로 수정하지 않은 사진',
      '얼굴이 기울어지지 않고 색안경 등으로 눈을 가리지 않은 사진',
    ],
    faq: [
      {
        q: '온라인 면허 갱신 사진 규격은 무엇인가요?',
        a: '2026년 3월 1일부터 운전면허증에 여권용 사진 규격이 그대로 적용됩니다. 3.5×4.5cm, 흰색(또는 흰색에 가까운 미색) 배경, 머리 길이 3.2~3.6cm가 기준이며, 온라인 제출 파일은 413×531픽셀, 500KB 이하 JPG입니다. 이 도구는 이 규격으로 저장합니다.',
      },
      {
        q: '보정한 사진도 되나요?',
        a: '포토샵 등으로 수정한 사진은 사용할 수 없습니다. 이 도구는 자르기와 크기·용량 조정만 하고 얼굴을 보정하지 않습니다.',
      },
    ],
    sources: [
      {
        label: '도로교통공단 공지: 2026년 3월 1일부터 여권용 사진 규격 엄격히 적용',
        url: 'https://www.koroad.or.kr/main/board/9/306204/board_view.do?cp=5&listType=list&bdOpenYn=Y&bdNoticeYn=N',
      },
      {
        label: '안전운전 통합민원 사진규격 안내',
        url: 'https://www.safedriving.or.kr/etGuide/selectEtGuide04.do',
      },
    ],
    verifiedAt: '2026-10-05',
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
      {
        label: '큐넷 자주묻는질문: 사이트 이용방법 (사진 규격 300×400 이상)',
        url: 'https://q-net.or.kr/cst002.do?id=cst00202&gSite=Q&gId=&artlSeq=1000033',
      },
    ],
    verifiedAt: '2026-10-05',
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
    verifiedAt: '2026-10-05',
  },
];
