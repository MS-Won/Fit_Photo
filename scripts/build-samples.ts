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
