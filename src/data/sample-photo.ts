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
