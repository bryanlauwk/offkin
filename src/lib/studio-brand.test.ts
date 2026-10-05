import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { displayStudioName, studioBrand } from './studio-brand';

describe('OFFKIN identity', () => {
  it('uses the approved bilingual identity and unchanged headline', () => {
    expect(studioBrand.name).toBe('OFFKIN');
    expect(studioBrand.chineseName).toBe('异趣伙伴');
    expect(displayStudioName(studioBrand.name)).toBe('OFFKIN｜异趣伙伴');
    expect(studioBrand.headline).toBe('Your business DNA. Made collectible.');
  });
  it('keeps custom studio titles intact', () => {
    expect(displayStudioName('A Custom Studio')).toBe('A Custom Studio');
  });
  it('ships matching metadata and an original OFFKIN favicon', () => {
    const html = readFileSync('index.html', 'utf8');
    const favicon = readFileSync('public/offkin-favicon.svg', 'utf8');
    expect(html).toContain('<title>OFFKIN｜异趣伙伴 — Your business DNA. Made collectible.</title>');
    expect(html).toContain('content="OFFKIN｜异趣伙伴 — Your business DNA. Made collectible."');
    expect(html).toContain('href="/offkin-favicon.svg"');
    expect(html).not.toMatch(/dioramini/i);
    expect(favicon).toContain('<title>OFFKIN</title>');
  });
});
