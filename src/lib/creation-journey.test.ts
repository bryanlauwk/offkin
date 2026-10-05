import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft, loadCreationDraft, makeCreationContext, makeElectronicBrief, saveCreationDraft, type CreationDraft } from './creation-journey';
import { angleEvidence, getStoryAngle, storyAngles } from './story-angles';

const draft: CreationDraft = {
  ...emptyDraft, website: 'https://company.com', business: 'We personalise and pack gift orders by hand.',
  angle: 'ritual', hiddenDetail: 'Each ribbon is turned twice.', audience: 'Customers & fans',
  wording: '  MY brand™\nSame. Words!  ', placement: 'On the base',
};

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('Customer creation context', () => {
  it('preserves exact supplied wording, including whitespace, punctuation and line breaks', () => {
    expect(JSON.parse(makeCreationContext(draft)).exactWording).toBe(draft.wording);
  });

  it('carries the specific chosen story and hidden detail with all design decisions', () => {
    expect(JSON.parse(makeCreationContext(draft))).toEqual({
      business: draft.business, angle: 'The unseen ritual', hiddenDetail: draft.hiddenDetail,
      item: draft.item, audience: draft.audience, exactWording: draft.wording,
      placement: draft.placement, style: draft.style, interaction: draft.interaction,
    });
  });

  it('preserves the customer’s supplied hidden detail rather than replacing it with a generic prompt', () => {
    const hiddenDetail = '  We fold EVERY card by hand!\nTwice.  ';
    expect(JSON.parse(makeCreationContext({ ...draft, hiddenDetail })).hiddenDetail).toBe(hiddenDetail);
  });

  it('explicitly marks electronic contexts without changing any customer-supplied wording', () => {
    const mechanical = JSON.parse(makeCreationContext(draft));
    const electronic = JSON.parse(makeCreationContext({ ...draft, mode: 'electronic' }));
    expect(mechanical).not.toHaveProperty('mode');
    expect(electronic).toEqual({ ...mechanical, mode: 'electronic', interaction: 'One button, display and LED' });
    expect(electronic.exactWording).toBe(draft.wording);
  });

  it('keeps optional new fields absent for a legacy direction', () => {
    const result = JSON.parse(makeCreationContext({ ...draft, angle: '', hiddenDetail: '' }));
    expect(result).not.toHaveProperty('angle');
    expect(result).not.toHaveProperty('hiddenDetail');
    expect(result.exactWording).toBe(draft.wording);
  });

  it('accepts the deployed 600-character limit and rejects overflow without changing lettering', () => {
    const base = { ...draft, business: 'A', hiddenDetail: '' };
    const spare = 600 - makeCreationContext(base).length;
    const exactLimit = { ...base, business: `A${'x'.repeat(spare)}` };
    expect(makeCreationContext(exactLimit)).toHaveLength(600);
    const tooLong = { ...exactLimit, business: `${exactLimit.business}x` };
    expect(() => makeCreationContext(tooLong)).toThrow(/shorten/);
    expect(tooLong.wording).toBe(draft.wording);
  });

  it('never silently truncates a long direction', () => {
    expect(() => makeCreationContext({ ...draft, business: 'x'.repeat(601) })).toThrow(/shorten/);
  });

  it.each(['', '  \n\t  '])('requires a customer-confirmed business story for %j', business => {
    expect(() => makeCreationContext({ ...draft, business })).toThrow(/known for/);
  });
});

describe('Exploratory electronic brief', () => {
  it('preserves all customer answers, including exact whitespace, punctuation and line breaks', () => {
    const electronic = { ...draft, mode: 'electronic' as const };
    const brief = makeElectronicBrief(electronic);
    expect(brief).toContain(`Business: ${electronic.business}`);
    expect(brief).toContain(`Website: ${electronic.website}`);
    expect(brief).toContain('Story lens: The unseen ritual');
    expect(brief).toContain(`Hidden detail: ${electronic.hiddenDetail}`);
    expect(brief).toContain(`Object: ${electronic.item}`);
    expect(brief).toContain(`Audience: ${electronic.audience}`);
    expect(brief).toContain(`Style: ${electronic.style}`);
    expect(brief).toContain(`Wording placement: ${electronic.placement}`);
    const wording = brief.split('\n\n').find(line => line.startsWith('Exact wording: '))!;
    expect(JSON.parse(wording.slice('Exact wording: '.length))).toBe(electronic.wording);
  });

  it('bounds the proposed hardware, optional AI and validation without making availability or price promises', () => {
    const brief = makeElectronicBrief({ ...draft, mode: 'electronic' });
    expect(brief).toContain('Not a tested product, quotation or order');
    expect(brief).toMatch(/USB power.*ESP32-class controller.*one button.*small display.*LED/);
    expect(brief).toContain('not a validated specification');
    expect(brief).toMatch(/Optional AI: a short response grounded in approved brand material/);
    expect(brief).toContain('No Muse integration is assumed');
    expect(brief).toContain('No camera, microphone or motor is required');
    expect(brief).toMatch(/Prototype review:.*electrical safety.*firmware.*network failure.*content boundaries.*data privacy/);
    expect(brief).toContain('Confirm provider terms and running costs');
    expect(brief).toContain('separate scoping and quotations');
    expect(brief).toContain('RM100–500 as a range to investigate');
    expect(brief).toContain('not a promised unit price');
    expect(brief).toContain('Outsourced samples and supplier quotes');
  });
});

describe('Device-local direction storage', () => {
  it('defaults new directions to the existing mechanical flow', () => {
    expect(emptyDraft.mode).toBe('mechanical');
  });

  it('round-trips every answer without trimming exact wording or hidden detail', () => {
    saveCreationDraft('saved', draft);
    expect(loadCreationDraft('saved')).toEqual(draft);
    expect(JSON.parse(localStorage.getItem('dioramini:direction:saved')!)).toEqual(draft);
  });

  it('keeps different concepts’ directions separate', () => {
    saveCreationDraft('first', draft);
    saveCreationDraft('second', { ...draft, wording: 'A different object', angle: 'human' });
    expect(loadCreationDraft('first')?.wording).toBe(draft.wording);
    expect(loadCreationDraft('second')?.angle).toBe('human');
  });

  it('loads older saved directions with empty new fields while retaining all existing answers', () => {
    const { angle: _angle, hiddenDetail: _hiddenDetail, mode: _mode, ...legacy } = draft;
    localStorage.setItem('dioramini:direction:old', JSON.stringify(legacy));
    expect(loadCreationDraft('old')).toEqual({ ...legacy, angle: '', hiddenDetail: '', mode: 'mechanical' });
  });

  it('loads a saved story direction without mode as mechanical without losing any answers', () => {
    const { mode: _mode, ...legacy } = draft;
    localStorage.setItem('dioramini:direction:old-story', JSON.stringify(legacy));
    expect(loadCreationDraft('old-story')).toEqual({ ...legacy, mode: 'mechanical' });
  });

  it('round-trips an electronic concept-study direction with exact wording intact', () => {
    const electronic: CreationDraft = { ...draft, mode: 'electronic' };
    saveCreationDraft('electronic', electronic);
    expect(loadCreationDraft('electronic')).toEqual(electronic);
  });

  it('does not persist a generated context as if it were the complete source draft', () => {
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

  it.each([
    ['website', 'x'.repeat(121)], ['business', 'x'.repeat(151)], ['wording', 'x'.repeat(101)],
    ['audience', 'x'.repeat(41)], ['hiddenDetail', 'x'.repeat(121)], ['hiddenDetail', 42],
    ['angle', 'invented-angle'], ['angle', null], ['item', 'Full-size statue'],
    ['placement', 'Somewhere'], ['style', 'Invented style'], ['interaction', 'Unknown mechanism'],
    ['summaryOnly', 'false'], ['business', null],
    ['mode', 'unknown'], ['mode', null], ['mode', true],
  ])('rejects an invalid saved %s field', (key, value) => {
    localStorage.setItem('dioramini:direction:bad', JSON.stringify({ ...draft, [key]: value }));
    expect(loadCreationDraft('bad')).toBeUndefined();
  });

  it('accepts the previous supported business length so old answers are not silently dropped', () => {
    saveCreationDraft('legacy-length', { ...draft, business: 'x'.repeat(150) });
    expect(loadCreationDraft('legacy-length')?.business).toHaveLength(150);
  });

  it('ignores extra persisted properties rather than passing them into the direction', () => {
    localStorage.setItem('dioramini:direction:extra', JSON.stringify({ ...draft, unsupported: 'ignored' }));
    expect(loadCreationDraft('extra')).toEqual(draft);
  });

  it('allows creation to continue when the browser cannot write local storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    expect(() => saveCreationDraft('saved', draft)).not.toThrow();
  });

  it('handles unavailable local storage while loading a shared concept', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    expect(loadCreationDraft('saved')).toBeUndefined();
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
