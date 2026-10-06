import { describe, expect, it } from 'vitest';
import { appendDirectionNote, interpretConversationEntry } from './conversation-input';

describe('Guided conversation input', () => {
  it('accepts a brand or full story verbatim without pretending to extract facts', () => {
    for (const value of ['A24', '  我们把故事变成礼物 🪁\nCafé, joy & people!  ', 'We are an architecture studio. Make this for our partners.']) expect(interpretConversationEntry(value)).toEqual({ kind: 'business', value });
  });
  it('routes a complete public URL separately, without fetching it', () => {
    expect(interpretConversationEntry(' offkin.lovable.app ')).toEqual({ kind: 'website', value: 'https://offkin.lovable.app' });
    expect(interpretConversationEntry('Our website is example.com and we make gifts.').kind).toBe('business');
  });
  it('rejects malformed explicit websites and overlong entries instead of truncating', () => {
    expect(interpretConversationEntry('https://not-a-domain').kind).toBe('error');
    expect(interpretConversationEntry(' '.repeat(5)).kind).toBe('error');
    expect(interpretConversationEntry('a'.repeat(1001)).kind).toBe('error');
  });
  it('keeps all refinement turns, exact Unicode and whitespace within the contract bound', () => {
    expect(appendDirectionNote('Keep the sun', '  加一间咖啡馆 ☀️  ')).toBe('Keep the sun\n  加一间咖啡馆 ☀️  ');
    expect(appendDirectionNote('x'.repeat(999), 'y')).toBeNull();
    expect(appendDirectionNote('Old note','   ')).toBe('Old note');
  });
});
