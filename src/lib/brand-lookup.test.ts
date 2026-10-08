import { describe, it, expect } from 'vitest';
import { findBrandCandidates, validBrandName } from '../../supabase/functions/generate-concept/brand-lookup';
import { looksLikeBrandName } from './proposal-api';

const reply = (data: unknown) => async () => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const ok = async (u: string) => { if (u.includes('internal')) throw new Error('private'); return new URL(u); };

describe('brand lookup', () => {
  it('returns at most 3 unique, safe, non-directory candidates', async () => {
    const data = ['https://www.airbnb.com/a', 'https://airbnb.com/b', 'https://en.wikipedia.org/wiki/Airbnb', 'https://internal.example/x', 'https://news.airbnb.com', 'https://airbnb.co.uk', 'https://press.airbnb.com']
      .map(url => ({ url, title: 'T', description: 'D' }));
    const out = await findBrandCandidates('Airbnb', { apiKey: 'fc-x', fetch: reply(data) as typeof fetch }, ok);
    expect(out.map(c => c.url)).toEqual(['https://www.airbnb.com', 'https://news.airbnb.com', 'https://airbnb.co.uk']);
  });
  it('drops candidates that fail public-address checks', async () => {
    const out = await findBrandCandidates('X', { apiKey: 'fc-x', fetch: reply([{ url: 'https://internal.example' }]) as typeof fetch }, ok);
    expect(out).toEqual([]);
  });
  it('requires the Lovable key for gateway connections', async () => {
    await expect(findBrandCandidates('X', { apiKey: 'lovc_x' }, ok)).rejects.toThrow();
  });
  it('validates names and recognises plain brand names', () => {
    expect(validBrandName('A')).toBe(false);
    expect(validBrandName('Airbnb')).toBe(true);
    expect(looksLikeBrandName('Airbnb')).toBe(true);
    expect(looksLikeBrandName('We sell durian at a night market. Families love it.')).toBe(false);
  });
});
