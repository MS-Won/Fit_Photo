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
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image is not applicable in a static export */}
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
