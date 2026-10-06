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
