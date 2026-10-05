import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhotoTool } from './PhotoTool';

describe('PhotoTool', () => {
  it('shows the upload prompt with the target spec', () => {
    render(
      <PhotoTool
        target={{ widthPx: 413, heightPx: 531, maxKB: 500 }}
        guides={null}
        fileName={(w, h) => `t_${w}x${h}.jpg`}
        eventLabel="test"
      />,
    );
    expect(screen.getByText(/사진을 끌어다 놓거나/)).toBeInTheDocument();
    expect(screen.getByText(/413×531px/)).toBeInTheDocument();
    expect(screen.getByText(/서버로 전송되지 않습니다/)).toBeInTheDocument();
  });
});
