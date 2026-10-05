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
