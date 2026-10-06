import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft, type CreationDraft } from './creation-journey';
import {
  BRIEF_HASH_PREFIX, BRIEF_SESSION_KEY, MAX_BRIEF_HASH_CHARS, MAX_BRIEF_PAYLOAD_BYTES,
  clearBriefSession, decodeBriefHash, encodeBriefHash, loadBriefSession,
  makeDesignBrief, makeShareableBriefUrl, saveBriefSession,
} from './brief-handoff';

const draft: CreationDraft = {
  ...emptyDraft, website: 'https://example.com', business: 'We create curious worlds for 異趣 partners.',
  hiddenDetail: '每一個結都轉兩次 🪢', wording: '  OFFKIN™\n异趣伙伴 🪄  ',
  angle: 'ritual', item: 'Mechanical story object', style: 'Bold & graphic',
  scale: 'An unexpected table-top world', brandIdentifiers: 'Vermilion, ink and a little ⚡', interaction: 'Slide to discover',
};
const session = { draft, started: true, step: 2 };

function rawHash(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return BRIEF_HASH_PREFIX + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('Device-local co-creation sessions', () => {
  it('saves the full draft, started state and exact current step', () => {
    expect(saveBriefSession(session)).toBe(true);
    expect(loadBriefSession()).toEqual(session);
    expect(localStorage.length).toBe(1);
    expect(JSON.parse(localStorage.getItem(BRIEF_SESSION_KEY)!)).toEqual({ version: 1, ...session });
  });

  it('supports an unfinished start without inventing answers', () => {
    const fresh = { draft: { ...emptyDraft, website: 'brand.test' }, step: 0, started: false };
    expect(saveBriefSession(fresh)).toBe(true);
    expect(loadBriefSession()).toEqual(fresh);
  });

  it.each([0, 1, 2, 3])('can resume step %i', step => {
    saveBriefSession({ ...session, step });
    expect(loadBriefSession()?.step).toBe(step);
  });

  it.each([-1, 4, 2.5, NaN, Infinity])('rejects invalid step %s without destroying a valid session', step => {
    saveBriefSession(session);
    expect(saveBriefSession({ ...session, step })).toBe(false);
    expect(loadBriefSession()).toEqual(session);
  });

  it.each([
    'not-json', 'null', '[]', '{}',
    JSON.stringify({ ...session, version: 2 }),
    JSON.stringify({ ...session, version: 1, started: 'true' }),
    JSON.stringify({ ...session, version: 1, step: '2' }),
    JSON.stringify({ ...session, version: 1, extra: true }),
    JSON.stringify({ ...session, version: 1, draft: { ...draft, website: 4 } }),
    ' '.repeat(24001),
  ])('ignores a corrupted or unsupported stored session', stored => {
    localStorage.setItem(BRIEF_SESSION_KEY, stored);
    expect(loadBriefSession()).toBeUndefined();
  });

  it('clears only the co-creation session', () => {
    saveBriefSession(session);
    localStorage.setItem('dioramini:direction:kept', 'saved concept');
    expect(clearBriefSession()).toBe(true);
    expect(loadBriefSession()).toBeUndefined();
    expect(localStorage.getItem('dioramini:direction:kept')).toBe('saved concept');
  });

  it('handles denied or exhausted local storage safely', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    expect(saveBriefSession(session)).toBe(false);
    expect(loadBriefSession()).toBeUndefined();
    expect(clearBriefSession()).toBe(false);
  });
});

describe('Local reviewable brief links', () => {
  it('round-trips Unicode, exact wording and all draft decisions in a URL-safe fragment', () => {
    const hash = encodeBriefHash(draft);
    expect(hash).toMatch(/^#offkin-brief=[A-Za-z0-9_-]+$/);
    expect(hash.length).toBeLessThanOrEqual(MAX_BRIEF_HASH_CHARS);
    expect(decodeBriefHash(hash)).toEqual(draft);
  });

  it('supports legacy draft fields and does not force an electronic direction', () => {
    const { scale: _scale, brandIdentifiers: _brand, ...legacy } = draft;
    expect(decodeBriefHash(encodeBriefHash({ ...legacy, item: 'Small diorama', style: 'Minimal & architectural' })))
      .toEqual({ ...legacy, item: 'Small diorama', style: 'Minimal & architectural' });
    expect(decodeBriefHash(encodeBriefHash(draft))?.mode).toBe('mechanical');
  });

  it('round-trips maximum-length international text without data loss', () => {
    const rich = { ...draft, website: 'w'.repeat(300), business: '異'.repeat(500), hiddenDetail: '趣'.repeat(500), audience: '人'.repeat(100), wording: '字'.repeat(200), scale: '大'.repeat(120), brandIdentifiers: '印'.repeat(300) };
    expect(decodeBriefHash(encodeBriefHash(rich))).toEqual(rich);
  });

  it('never sends requests or persists a received brief before review', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    try {
      expect(decodeBriefHash(encodeBriefHash(draft))).toEqual(draft);
      expect(setItem).not.toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });

  it('replaces the old fragment and clears concept/tracking query parameters', () => {
    const url = new URL(makeShareableBriefUrl(draft, 'https://offkin.example/create?concept=private-id&utm_source=mail#old'));
    expect(url.origin + url.pathname).toBe('https://offkin.example/create');
    expect(url.search).toBe('');
    expect(decodeBriefHash(url.hash)).toEqual(draft);
    expect(url.toString()).not.toContain('private-id');
  });

  it.each(['javascript:alert(1)', 'data:text/plain,hello', 'https://name:secret@offkin.example/', 'not-a-url'])('rejects unsafe or invalid base URL %s', url => {
    expect(() => makeShareableBriefUrl(draft, url)).toThrow();
  });

  it.each(['', '#elsewhere', BRIEF_HASH_PREFIX, `${BRIEF_HASH_PREFIX}a`, `${BRIEF_HASH_PREFIX}%%%`, `${BRIEF_HASH_PREFIX}YWJj=`, `${BRIEF_HASH_PREFIX}${'a'.repeat(MAX_BRIEF_HASH_CHARS)}`])('rejects invalid, unrelated or oversized fragments', hash => {
    expect(decodeBriefHash(hash)).toBeUndefined();
  });

  it.each([
    null, [], 'text', {}, { version: 2, draft }, { version: 1 },
    { version: 1, draft, generated: true }, { version: 1, draft: {} },
    { version: 1, draft: { ...draft, uploadUrl: 'https://untrusted.example/asset' } },
    { version: 1, draft: { ...draft, business: 'x'.repeat(501) } },
    { version: 1, draft: { ...draft, mode: 'autogenerate' } },
    { version: 1, draft: { ...draft, brandIdentifiers: ['a', 'b'] } },
    { version: 1, draft: { ...draft, summaryOnly: 1 } },
  ])('rejects unsupported versions, invalid schemas and unknown imported fields', payload => {
    expect(decodeBriefHash(rawHash(payload))).toBeUndefined();
  });

  it('rejects malformed UTF-8 and JSON', () => {
    expect(decodeBriefHash(`${BRIEF_HASH_PREFIX}_w`)).toBeUndefined();
    expect(decodeBriefHash(`${BRIEF_HASH_PREFIX}bm90IGpzb24`)).toBeUndefined();
  });

  it('rejects noncanonical base64url encodings with changed unused bits', () => {
    // e31 decodes to the same bytes as canonical e30 ({}), but is not canonical.
    expect(decodeBriefHash(`${BRIEF_HASH_PREFIX}e31`)).toBeUndefined();
  });

  it('bounds the decoded payload before parsing even if base64 is well formed', () => {
    const binary = 'x'.repeat(MAX_BRIEF_PAYLOAD_BYTES + 1);
    expect(decodeBriefHash(BRIEF_HASH_PREFIX + btoa(binary).replace(/=+$/, ''))).toBeUndefined();
  });

  it('refuses invalid outgoing drafts rather than silently removing answers', () => {
    expect(() => encodeBriefHash({ ...draft, wording: 'x'.repeat(201) })).toThrow(/check the brief/);
    expect(() => encodeBriefHash({ ...draft, custom: 'discard me' } as CreationDraft)).toThrow(/check the brief/);
  });

  it('rejects pathological escaped payloads beyond the byte limit without changing exact wording', () => {
    const huge = { ...draft, website: '\u0001'.repeat(300), business: '\u0001'.repeat(500), hiddenDetail: '\u0001'.repeat(500), audience: '\u0001'.repeat(100), wording: '\u0001'.repeat(200), scale: '\u0001'.repeat(120), brandIdentifiers: '\u0001'.repeat(300) };
    expect(() => encodeBriefHash(huge)).toThrow(/too long/);
    expect(huge.wording).toBe('\u0001'.repeat(200));
  });
});

describe('Downloadable design review brief', () => {
  it('captures every design decision with exact lettering and realistic next steps', () => {
    const result = makeDesignBrief(draft);
    expect(result).toContain('Brand-world design brief');
    expect(result).toContain(`Scale: ${draft.scale}`);
    expect(result).toContain(`Brand identifiers: ${draft.brandIdentifiers}`);
    expect(result).toContain(`Preferred interaction: ${draft.interaction}`);
    expect(result).toContain(`Exact wording: ${JSON.stringify(draft.wording)}`);
    expect(result).toContain('one or two meaningful actions');
    expect(result).toContain('reuse internal bases, connectors and selected mechanisms');
    expect(result).toContain('a few outsourced printed samples');
    expect(result).toContain('RM100–500 as a range to investigate');
    expect(result).toContain('not a promised unit price');
    expect(result).toContain('does not submit it to the studio');
    expect(result).not.toMatch(/palm-sized|USB power|Optional AI/);
  });

  it('honours electronic choice only when selected and flags prototype review', () => {
    const result = makeDesignBrief({ ...draft, mode: 'electronic' });
    expect(result).toContain('Electronic story scene');
    expect(result).toContain('electrical safety');
    expect(result).toContain('data privacy');
    expect(result).toContain('not a validated specification');
  });

  it('does not claim to have read a website when using the customer description', () => {
    expect(makeDesignBrief({ ...draft, summaryOnly: true })).toContain('Owner-provided description; no website reading is implied.');
  });

  it('keeps unfinished facts open for review rather than inventing them', () => {
    const result = makeDesignBrief(emptyDraft);
    expect(result).toContain('Business: To confirm');
    expect(result).toContain('Hidden detail: To confirm');
    expect(result).toContain('Website: Not supplied');
    expect(result).toContain('no artwork upload or brand-asset verification is implied');
  });
});
