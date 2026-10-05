import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { homepageStudies } from './homepage-studies';

describe('durable homepage artwork', () => {
  it('contains exactly the three authorized brand studies', () => {
    expect(homepageStudies.map(study => study.brand)).toEqual(['A24', 'Airbnb', 'Tesla']);
    expect(homepageStudies.map(study => study.mode)).toEqual(['mechanical', 'mechanical', 'electronic']);
  });
  it.each(homepageStudies)('serves a compact local WebP for $brand rather than an expiring signed URL', study => {
    expect(study.image).toMatch(/^\/concept-studies\/offkin-[a-z0-9-]+\.webp$/);
    const path = `public${study.image}`;
    const bytes = readFileSync(path);
    expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
    expect(statSync(path).size).toBeLessThan(150_000);
    expect(study.visualNote).toMatch(/prototype|testing|validation/);
    expect(study.visualNote).toMatch(/[.!?]$/);
  });
});
