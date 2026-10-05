import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuideOverlay } from './GuideOverlay';

describe('GuideOverlay', () => {
  it('draws crown and chin bands at fractional heights', () => {
    const { container } = render(
      <GuideOverlay width={280} height={360} guides={{ crownBand: [0.08, 0.12], chinBand: [0.82, 0.88] }} />,
    );
    const crown = container.querySelector('[data-guide="crown"]')!;
    expect(Number(crown.getAttribute('y'))).toBeCloseTo(28.8, 1);
    expect(Number(crown.getAttribute('height'))).toBeCloseTo(14.4, 1);
    expect(screen.getByText('정수리')).toBeInTheDocument();
    expect(screen.getByText('턱')).toBeInTheDocument();
  });

  it('draws only the center line without head rule', () => {
    const { container } = render(<GuideOverlay width={280} height={360} guides={null} />);
    expect(container.querySelector('[data-guide="crown"]')).toBeNull();
    expect(container.querySelector('[data-guide="center"]')).not.toBeNull();
  });
});
