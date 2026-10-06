'use client';

import { PhotoTool } from './PhotoTool';
import { getGuideLines } from '@/lib/photo/crop-math';
import { presetToTarget } from '@/lib/photo/target';
import { downloadFileName, type PhotoPreset } from '@/lib/presets';

/**
 * PhotoTool은 클라이언트 컴포넌트라 서버 컴포넌트(기관별 페이지)에서
 * 함수(fileName)를 prop으로 직접 넘길 수 없다. preset(직렬화 가능한 데이터)만
 * 받아서 이 안에서 클로저를 만든다.
 */
export function PresetPhotoTool({ preset }: { preset: PhotoPreset }) {
  return (
    <PhotoTool
      target={presetToTarget(preset)}
      guides={getGuideLines(preset)}
      fileName={(w, h) => downloadFileName(preset, w, h)}
      eventLabel={preset.slug}
    />
  );
}
