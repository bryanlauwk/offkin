import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CREATION_SCALE, MAX_CREATION_CONTEXT_CHARS, draftFieldLimits, emptyDraft,
  loadCreationDraft, makeCreationContext, makeElectronicBrief, normalizeCreationDraft,
  parseCreationDraft, saveCreationDraft, type CreationDraft,
} from './creation-journey';
import { angleEvidence, getStoryAngle, storyAngles } from './story-angles';

const draft: CreationDraft = {
  ...emptyDraft, website: 'https://company.com', business: 'We personalise and pack gift orders by hand.',
  angle: 'ritual', hiddenDetail: 'Each ribbon is turned twice.', audience: 'Customers & fans',
  wording: '  MY brand™\nSame. Words!  ', placement: 'On the base',
  brandIdentifiers: 'Ultramarine, the circle mark, the folded ribbon.', scale: 'A shelf-sized world',
};

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('Customer creation context', () => {
  it('preserves exact supplied wording, including whitespace, punctuation and line breaks', () => {
    expect(JSON.parse(makeCreationContext(draft)).exactWording).toBe(draft.wording);
  });

  it('carries the specific story, scale, brand identifiers and all design decisions', () => {
    expect(JSON.parse(makeCreationContext(draft))).toEqual({
      mode: draft.mode, business: draft.business, angle: 'The unseen ritual', hiddenDetail: draft.hiddenDetail,
      item: draft.item, audience: draft.audience, exactWording: draft.wording,
      placement: draft.placement, style: draft.style, interaction: draft.interaction,
      scale: draft.scale, brandIdentifiers: draft.brandIdentifiers,
    });
  });

  it('preserves the customer’s detail rather than replacing it with a generic prompt', () => {
    const hiddenDetail = '  We fold EVERY card by hand!\nTwice.  ';
    expect(JSON.parse(makeCreationContext({ ...draft, hiddenDetail })).hiddenDetail).toBe(hiddenDetail);
  });

  it('marks electronic direction without forcing new hardware or replacing chosen interaction', () => {
    const mechanical = JSON.parse(makeCreationContext({ ...draft, interaction: 'Turn to reveal' }));
    const electronic = JSON.parse(makeCreationContext({ ...draft, mode: 'electronic', interaction: 'Turn to reveal' }));
    expect(mechanical.mode).toBe('mechanical');
    expect(electronic).toEqual({ ...mechanical, mode: 'electronic' });
    expect(electronic.exactWording).toBe(draft.wording);
  });

  it('does not invent missing story facts or brand references for legacy directions', () => {
    const { scale: _scale, brandIdentifiers: _brand, ...legacy } = draft;
    const result = JSON.parse(makeCreationContext({ ...legacy, angle: '', hiddenDetail: '' }));
    expect(result).not.toHaveProperty('angle');
    expect(result).not.toHaveProperty('hiddenDetail');
    expect(result).not.toHaveProperty('brandIdentifiers');
    expect(result.scale).toBe(DEFAULT_CREATION_SCALE);
    expect(result.exactWording).toBe(draft.wording);
  });

  it('accepts rich directions above the old 600-character limit without truncation', () => {
    const rich = { ...draft, business: 'b'.repeat(500), hiddenDetail: 'h'.repeat(500), wording: 'w'.repeat(200), brandIdentifiers: 'i'.repeat(300) };
    const result = makeCreationContext(rich);
    expect(result.length).toBeGreaterThan(600);
    expect(result.length).toBeLessThanOrEqual(6000);
    expect(JSON.parse(result)).toMatchObject({ business: rich.business, hiddenDetail: rich.hiddenDetail, exactWording: rich.wording, brandIdentifiers: rich.brandIdentifiers });
  });

  it('bounds the serialized context at exactly 6000 characters, including escaped text', () => {
    const base = { ...draft, business: '\u0001'.repeat(500), hiddenDetail: 'x'.repeat(500), wording: '' };
    const gap = MAX_CREATION_CONTEXT_CHARS - makeCreationContext(base).length;
    const escapes = Math.floor(gap / 5);
    expect(escapes).toBeLessThanOrEqual(500);
    const exact = { ...base, hiddenDetail: '\u0001'.repeat(escapes) + 'x'.repeat(500 - escapes), wording: 'x'.repeat(gap % 5) };
    expect(makeCreationContext(exact)).toHaveLength(6000);
    expect(() => makeCreationContext({ ...exact, wording: `${exact.wording}x` })).toThrow(/shorten/);
  });

  it('never silently truncates fields that exceed their individual limits', () => {
    const tooLong = { ...draft, business: 'x'.repeat(501) };
    expect(() => makeCreationContext(tooLong)).toThrow(/character limits/);
    expect(tooLong.wording).toBe(draft.wording);
  });

  it.each(['', '  \n\t  '])('requires a customer-confirmed business story for %j', business => {
    expect(() => makeCreationContext({ ...draft, business })).toThrow(/known for/);
  });

  it('normalizes optional UI defaults without changing exact wording or the source draft', () => {
    const { scale: _scale, brandIdentifiers: _brand, ...legacy } = draft;
    expect(normalizeCreationDraft(legacy)).toEqual({ ...legacy, scale: DEFAULT_CREATION_SCALE, brandIdentifiers: '' });
    expect(legacy).not.toHaveProperty('scale');
  });
});

describe('Exploratory electronic brief', () => {
  it('preserves review facts and exact whitespace, punctuation and line breaks', () => {
    const electronic = { ...draft, mode: 'electronic' as const };
    const brief = makeElectronicBrief(electronic);
    for (const [label, answer] of [['Business', draft.business], ['Website', draft.website], ['Hidden detail', draft.hiddenDetail], ['Object', draft.item], ['Audience', draft.audience], ['Style', draft.style], ['Scale', draft.scale], ['Brand identifiers', draft.brandIdentifiers], ['Wording placement', draft.placement]]) {
      expect(brief).toContain(`${label}: ${answer}`);
    }
    expect(brief).toContain('Story lens: The unseen ritual');
    const wording = brief.split('\n\n').find(line => line.startsWith('Exact wording: '))!;
    expect(JSON.parse(wording.slice('Exact wording: '.length))).toBe(electronic.wording);
  });

  it('bounds proposed hardware, optional AI and validation without availability or price promises', () => {
    const brief = makeElectronicBrief({ ...draft, mode: 'electronic' });
    expect(brief).toContain('Not a tested product, quotation or order');
    expect(brief).toMatch(/USB power.*ESP32-class controller.*one button.*small display.*LED/);
    expect(brief).toContain('not a validated specification');
    expect(brief).toContain('Optional AI: a short response grounded in approved brand material');
    expect(brief).toContain('No Muse integration is assumed');
    expect(brief).toContain('No camera, microphone or motor is required');
    expect(brief).toMatch(/Prototype review:.*electrical safety.*firmware.*network failure.*content boundaries.*data privacy/);
    expect(brief).toContain('Confirm provider terms and running costs');
    expect(brief).toContain('separate scoping and quotations');
    expect(brief).toContain('RM100–500 as a range to investigate');
    expect(brief).toContain('not a promised unit price');
    expect(brief).toContain('Outsourced samples and supplier quotes');
    expect(brief).not.toMatch(/palm-sized|palm size/i);
  });
});

describe('Device-local direction storage', () => {
  it('defaults to a mechanical, illustrative story world without a size restriction', () => {
    expect(emptyDraft).toMatchObject({ mode: 'mechanical', item: 'Sculptural story world', style: 'Illustrated & surreal', scale: DEFAULT_CREATION_SCALE });
  });

  it('round-trips every answer without trimming exact wording or hidden detail', () => {
    expect(saveCreationDraft('saved', draft)).toBe(true);
    expect(loadCreationDraft('saved')).toEqual(draft);
    expect(JSON.parse(localStorage.getItem('dioramini:direction:saved')!)).toEqual(draft);
  });

  it('keeps different concepts’ directions separate', () => {
    saveCreationDraft('first', draft);
    saveCreationDraft('second', { ...draft, wording: 'A different object', angle: 'human' });
    expect(loadCreationDraft('first')?.wording).toBe(draft.wording);
    expect(loadCreationDraft('second')?.angle).toBe('human');
  });

  it('loads oldest saved directions with legacy fields and values intact', () => {
    const { angle: _angle, hiddenDetail: _hidden, mode: _mode, scale: _scale, brandIdentifiers: _brand, ...rest } = draft;
    const legacy = { ...rest, item: 'Small diorama', style: 'Minimal & architectural' };
    localStorage.setItem('dioramini:direction:old', JSON.stringify(legacy));
    expect(loadCreationDraft('old')).toEqual({ ...legacy, angle: '', hiddenDetail: '', mode: 'mechanical' });
  });

  it('loads a saved story direction without mode without losing answers', () => {
    const { mode: _mode, ...legacy } = draft;
    localStorage.setItem('dioramini:direction:old-story', JSON.stringify(legacy));
    expect(loadCreationDraft('old-story')).toEqual({ ...legacy, mode: 'mechanical' });
  });

  it('round-trips an electronic concept-study direction with exact wording intact', () => {
    const electronic: CreationDraft = { ...draft, mode: 'electronic' };
    saveCreationDraft('electronic', electronic);
    expect(loadCreationDraft('electronic')).toEqual(electronic);
  });

  it('does not persist generated context as the complete source draft', () => {
    localStorage.setItem('dioramini:direction:context', makeCreationContext(draft));
    expect(loadCreationDraft('context')).toBeUndefined();
  });

  it.each(['not-json', 'null', '[]', '"a string"', '{}'])('ignores malformed or incomplete saved data: %s', value => {
    localStorage.setItem('dioramini:direction:bad', value);
    expect(loadCreationDraft('bad')).toBeUndefined();
  });

  it('returns no direction for an unknown concept', () => {
    expect(loadCreationDraft('missing')).toBeUndefined();
  });

  it.each(Object.entries(draftFieldLimits))('accepts the %s limit and rejects overflow', (key, limit) => {
    expect(parseCreationDraft({ ...draft, [key]: 'x'.repeat(limit) })).toBeDefined();
    expect(parseCreationDraft({ ...draft, [key]: 'x'.repeat(limit + 1) })).toBeUndefined();
  });

  it.each([
    ['hiddenDetail', 42], ['angle', 'invented-angle'], ['angle', null], ['item', 'Full-size statue'],
    ['placement', 'Somewhere'], ['style', 'Invented style'], ['interaction', 'Unknown mechanism'],
    ['summaryOnly', 'false'], ['business', null], ['mode', 'unknown'], ['mode', null], ['mode', true],
    ['scale', null], ['scale', ['Large']], ['brandIdentifiers', { logo: 'mark' }], ['wording', false],
  ])('rejects an invalid saved %s field', (key, value) => {
    localStorage.setItem('dioramini:direction:bad', JSON.stringify({ ...draft, [key]: value }));
    expect(loadCreationDraft('bad')).toBeUndefined();
  });

  it.each(['Sculptural story world', 'Mechanical story object', 'Scene in a frame', 'Miniature workstation', 'Small diorama'])('accepts new and legacy format %s', item => {
    expect(parseCreationDraft({ ...draft, item })?.item).toBe(item);
  });

  it('ignores extra legacy properties but rejects unknown imported fields', () => {
    const extra = { ...draft, unsupported: 'ignored' };
    localStorage.setItem('dioramini:direction:extra', JSON.stringify(extra));
    expect(loadCreationDraft('extra')).toEqual(draft);
    expect(parseCreationDraft(extra, { strict: true })).toBeUndefined();
  });

  it('refuses invalid writes without replacing an existing valid draft', () => {
    saveCreationDraft('saved', draft);
    expect(saveCreationDraft('saved', { ...draft, business: 'x'.repeat(501) })).toBe(false);
    expect(loadCreationDraft('saved')).toEqual(draft);
  });

  it('allows creation to continue when the browser cannot write local storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    expect(saveCreationDraft('saved', draft)).toBe(false);
  });

  it('handles unavailable local storage while loading a shared concept', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    expect(loadCreationDraft('saved')).toBeUndefined();
  });

  it('rejects oversized stored payloads before parsing them', () => {
    localStorage.setItem('dioramini:direction:huge', ' '.repeat(24001));
    expect(loadCreationDraft('huge')).toBeUndefined();
  });
});

describe('Specific editorial story evidence', () => {
  it('offers distinct questions and physical story proposals for all three lenses', () => {
    expect(storyAngles.map(angle => angle.id)).toEqual(['ritual', 'change', 'human']);
    expect(new Set(storyAngles.map(angle => angle.question)).size).toBe(3);
    expect(new Set(storyAngles.map(angle => angle.object)).size).toBe(3);
    expect(getStoryAngle('human')?.title).toBe('The human trace');
    expect(getStoryAngle('unknown')).toBeUndefined();
  });

  it('matches each lens to a separate relevant sentence from the public evidence', () => {
    const sentences = [
      'We pack each gift by hand.',
      'We transform a simple idea into a keepsake.',
      'Our customers share stories with family.',
    ];
    expect(angleEvidence({ url: 'https://company.com', title: 'Company', excerpt: sentences.join(' ') }, 'Different customer input.')).toEqual(sentences);
  });

  it('uses the customer description when there is no website evidence', () => {
    const business = 'We pack every order by hand.';
    expect(angleEvidence(null, business)).toEqual([business, '', '']);
  });

  it('does not reuse one matching source sentence across all three angles', () => {
    const business = 'Our team hand-packs gifts that transform the customer experience.';
    const result = angleEvidence(null, business);
    expect(result.filter(Boolean)).toEqual([business]);
  });

  it('leaves unsupported angles empty instead of inventing company-specific claims', () => {
    expect(angleEvidence({ url: 'https://company.com', title: 'Company', excerpt: 'Open Monday through Friday.' }, '')).toEqual(['', '', '']);
    expect(angleEvidence(null, '')).toEqual(['', '', '']);
  });

  it('bounds source snippets without changing their wording', () => {
    const excerpt = `We pack ${'a'.repeat(250)}.`;
    expect(angleEvidence({ url: 'https://company.com', title: 'Company', excerpt }, '')[0]).toBe(excerpt.slice(0, 210));
  });
});

