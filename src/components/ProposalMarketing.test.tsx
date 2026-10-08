import { existsSync, readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ProposalMarketing, { MarketingArtwork } from './ProposalMarketing';

afterEach(cleanup);

describe('Illustrative marketing artwork', () => {
  it('keeps all application copy in accessible HTML', () => {
    render(<ProposalMarketing/>);
    expect(screen.getByRole('heading', { name: 'Made for moments that matter.' })).toBeInTheDocument();
    for (const name of ['Gifts worth keeping', 'Launches with a keepsake', 'Display with a story']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByText(/Illustrative concept artwork/)).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.queryByText(/From IP to|Make It LIVE|Give People Something/)).not.toBeInTheDocument();
  });

  it('uses only the four standalone marketing files with bounded native atlas viewports', () => {
    const kinds = ['hero', 'stories', 'editions', 'experiences', 'world', 'collectible', 'components', 'packaging', 'footer'] as const;
    const { container } = render(<>{kinds.map(kind => <MarketingArtwork key={kind} kind={kind}/>)}</>);
    const sources = new Set<string>();
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      const image = svg.querySelector('image')!;
      const source = image.getAttribute('href')!;
      sources.add(source);
      expect(source).toMatch(/^\/marketing\/offkin-(hero|applications|process|footer)\.webp$/);
      expect(existsSync(`public${source}`)).toBe(true);
      const bytes = readFileSync(`public${source}`);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
      const [x, y, width, height] = svg.getAttribute('viewBox')!.split(' ').map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(x + width).toBeLessThanOrEqual(Number(image.getAttribute('width')));
      expect(y + height).toBeLessThanOrEqual(Number(image.getAttribute('height')));
    }
    expect(sources.size).toBe(4);
    expect(container.querySelectorAll('svg')).toHaveLength(9);
  });
});
