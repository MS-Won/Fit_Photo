// 사이트 이름이 확정되면 이 파일만 고친다.
export const siteConfig = {
  name: '증명사진 규격 맞춤기',
  description:
    '여권·주민등록증·운전면허·Q-net·공무원 시험·토익 사진 규격(픽셀, 용량, 머리 비율)을 브라우저에서 바로 맞춥니다. 사진은 서버로 전송되지 않습니다.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, ''),
};
