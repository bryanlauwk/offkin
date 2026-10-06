import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CANVAS_SESSION_KEY, MAX_SESSION_CHARS, MAX_SHARE_CHARS, branchCanvasSession,
  canvasContext, decodeCanvasShare, emptyCanvasSession, encodeCanvasShare,
  loadCanvasSession, loadCanvasSnapshot, makeCanvasBrief, parseCanvasSession, physicalFingerprint,
  saveCanvasSession, saveCanvasSnapshot, worldFingerprint, type CanvasBrief, type CanvasSession,
} from './canvas-session';
import { worldReferences } from './world-references';
import { CANVAS_CONTRACT_VERSION, type CanvasConcept } from './canvas-api';

const worldId = '00000000-0000-4000-8000-000000000001';
const physicalId = '00000000-0000-4000-8000-000000000002';
const exactWording = '  OFFKIN｜异趣伙伴\nCafé 🪁 “KEEP me!”\t  ';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
function direction(): CanvasSession {
  const session = emptyCanvasSession();
  const result = {
    ...session, worldId, physicalId, selected: ['fold', 'ribbon'], hero: 'ribbon',
    brief: { ...session.brief, website: 'https://studio.example', business: 'We fold paper into gifts.', exactWording, notes: 'More paper birds 🦜', brandIdentifiers: 'Coral arch / 异趣' },
    replacements: [{ id: 'fold', label: 'Paper birds', description: 'A proposed flock of folded birds.' }],
    worldFingerprint: '', physicalFingerprint: '',
    prototype: { quantity: '100 or still exploring', budget: 'RM100–500, exploratory', purpose: 'Client thank-you / 谢谢' },
  };
  result.worldFingerprint = worldFingerprint(result); result.physicalFingerprint = physicalFingerprint(result);
  return result;
}
function encodeRaw(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return '#world=' + btoa(Array.from(bytes, n => String.fromCharCode(n)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('Canvas session schema and local persistence', () => {
  it('starts with only real Airbnb source elements, a selected hero and no generated identity', () => {
    const session = emptyCanvasSession();
    const airbnb = worldReferences.find(world => world.id === 'airbnb')!;
    expect(session.selected).toEqual(airbnb.elements.map(element => element.id));
    expect(session.selected).toContain(session.hero);
    expect(session.worldId).toBe(''); expect(session.physicalId).toBe('');
    expect(parseCanvasSession(session)).toEqual(session);
    expect(emptyCanvasSession().version).not.toBe(session.version);
  });

  it('round-trips exact Unicode, whitespace, selections, replacements and prototype planning locally', () => {
    const session = direction();
    expect(saveCanvasSession(session)).toBe(true);
    expect(loadCanvasSession()).toEqual(session);
    expect(loadCanvasSession()?.brief.exactWording).toBe(exactWording);
  });

  it.each([
    ['root', (s: CanvasSession) => ({ ...s, unexpected: 'instructions' })],
    ['brief', (s: CanvasSession) => ({ ...s, brief: { ...s.brief, uploadedLogo: 'image.png' } })],
    ['prototype', (s: CanvasSession) => ({ ...s, prototype: { ...s.prototype, payment: 'paid' } })],
    ['replacement', (s: CanvasSession) => ({ ...s, replacements: [{ ...s.replacements[0], x: 10 }] })],
    ['schema', (s: CanvasSession) => ({ ...s, schema: 2 })],
    ['missing field', (s: CanvasSession) => { const copy = clone(s) as Partial<CanvasSession>; delete copy.brief; return copy; }],
    ['array root', () => []], ['null root', () => null],
    ['empty version', (s: CanvasSession) => ({ ...s, version: '' })],
    ['unsafe version', (s: CanvasSession) => ({ ...s, version: '../version' })],
    ['long version', (s: CanvasSession) => ({ ...s, version: 'a'.repeat(81) })],
    ['unsafe parent', (s: CanvasSession) => ({ ...s, parentVersion: 'https://example.test' })],
    ['unknown reference', (s: CanvasSession) => ({ ...s, referenceId: 'untrusted' })],
    ['invalid world ID', (s: CanvasSession) => ({ ...s, worldId: 'world' })],
    ['invalid physical ID', (s: CanvasSession) => ({ ...s, physicalId: 'physical' })],
    ['duplicate selections', (s: CanvasSession) => ({ ...s, selected: ['fold', 'fold'] })],
    ['empty selection ID', (s: CanvasSession) => ({ ...s, selected: [''] })],
    ['too many selections', (s: CanvasSession) => ({ ...s, selected: Array.from({ length: 17 }, (_, i) => `e${i}`), hero: '', replacements: [] })],
    ['unselected hero', (s: CanvasSession) => ({ ...s, hero: 'absent' })],
    ['unselected replacement', (s: CanvasSession) => ({ ...s, replacements: [{ ...s.replacements[0], id: 'absent' }] })],
    ['duplicate replacement', (s: CanvasSession) => ({ ...s, replacements: [s.replacements[0], s.replacements[0]] })],
    ['blank replacement', (s: CanvasSession) => ({ ...s, replacements: [{ ...s.replacements[0], label: ' \t ' }] })],
    ['long replacement label', (s: CanvasSession) => ({ ...s, replacements: [{ ...s.replacements[0], label: 'x'.repeat(81) }] })],
    ['long replacement description', (s: CanvasSession) => ({ ...s, replacements: [{ ...s.replacements[0], description: 'x'.repeat(301) }] })],
    ['long world fingerprint', (s: CanvasSession) => ({ ...s, worldFingerprint: 'x'.repeat(6001) })],
    ['long physical fingerprint', (s: CanvasSession) => ({ ...s, physicalFingerprint: 'x'.repeat(10001) })],
    ['long planning quantity', (s: CanvasSession) => ({ ...s, prototype: { ...s.prototype, quantity: 'x'.repeat(41) } })],
    ['long budget', (s: CanvasSession) => ({ ...s, prototype: { ...s.prototype, budget: 'x'.repeat(81) } })],
    ['long purpose', (s: CanvasSession) => ({ ...s, prototype: { ...s.prototype, purpose: 'x'.repeat(301) } })],
  ])('rejects %s without replacing the previous saved direction', (_name, mutate) => {
    const prior = direction(); saveCanvasSession(prior);
    const invalid = mutate(direction());
    expect(parseCanvasSession(invalid)).toBeNull();
    expect(saveCanvasSession(invalid as CanvasSession)).toBe(false);
    expect(loadCanvasSession()).toEqual(prior);
    expect(decodeCanvasShare(encodeRaw(invalid))).toBeNull();
  });

  it.each(Object.entries({ website: 300, business: 1000, angle: 120, audience: 120, exactWording: 200, brandIdentifiers: 500, style: 120, interaction: 120, notes: 1000 }))('enforces the %s bound without truncation', (field, limit) => {
    const session = direction();
    session.brief[field as keyof CanvasBrief] = 'x'.repeat(limit);
    expect(parseCanvasSession(session)).not.toBeNull();
    session.brief[field as keyof CanvasBrief] += 'x';
    expect(parseCanvasSession(session)).toBeNull();
    expect(() => encodeCanvasShare(session)).toThrow(/check this version/i);
  });

  it('accepts no selected elements as an editable incomplete direction', () => {
    const session = { ...direction(), selected: [], hero: '', replacements: [] };
    expect(parseCanvasSession(session)).toEqual(session);
  });

  it.each(['not-json', 'null', '[]', '{"schema":99}', 'x'.repeat(MAX_SESSION_CHARS + 1)])('handles malformed or overlong storage safely (%#)', raw => {
    localStorage.setItem(CANVAS_SESSION_KEY, raw);
    expect(loadCanvasSession()).toBeNull();
  });

  it('handles blocked storage and quota errors without claiming a save', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    expect(loadCanvasSession()).toBeNull(); expect(saveCanvasSession(direction())).toBe(false);
  });
});

describe('Reviewed links and independent branches', () => {
  it('round-trips Unicode as URL-safe data and strips redundant private fingerprints only', () => {
    const original = direction();
    const hash = encodeCanvasShare(original, { includeGenerated: true });
    expect(hash).toMatch(/^#world=[A-Za-z0-9_-]+$/);
    expect(hash.length).toBeLessThanOrEqual(MAX_SHARE_CHARS);
    expect(decodeCanvasShare(hash)).toEqual({ ...original, worldFingerprint: '', physicalFingerprint: '' });
    expect(original.worldFingerprint).toBe(worldFingerprint(original));
  });

  it('excludes stored-generation access and duplicated originals by default while retaining reviewed story metadata', () => {
    const original = direction();
    const sharedWorld = { title: 'Reviewed town', story: 'A reviewed story.', worldElements: [{ id: 'fold', label: 'Paper birds', description: 'Proposed replacement.', kind: 'proposal' as const }, { id: 'ribbon', label: 'Ribbon loop', description: 'The wrapping ritual.', kind: 'fact' as const }] };
    const decoded = decodeCanvasShare(encodeCanvasShare(original, { sharedWorld }))!;
    expect(decoded.worldId).toBe(''); expect(decoded.physicalId).toBe(''); expect(decoded.worldFingerprint).toBe(''); expect(decoded.physicalFingerprint).toBe('');
    expect(decoded.sharedWorld).toEqual(sharedWorld); expect(decoded.brief).toEqual(original.brief);
    expect(JSON.stringify(decoded)).not.toContain(worldId); expect(JSON.stringify(decoded)).not.toContain(physicalId);
    expect(original.worldId).toBe(worldId);
  });

  it.each([
    ['unknown world key', { title: 'World', story: 'Story', worldElements: [], originalContext: 'not reviewed' }],
    ['unknown element key', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: 'Fold', description: 'A fold.', kind: 'fact', sourceContext: 'not reviewed' }] }],
    ['long title', { title: 'x'.repeat(101), story: 'Story', worldElements: [] }],
    ['long story', { title: 'World', story: 'x'.repeat(2001), worldElements: [] }],
    ['long label', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: 'x'.repeat(81), description: 'A fold.', kind: 'fact' }] }],
    ['long description', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: 'Fold', description: 'x'.repeat(701), kind: 'fact' }] }],
    ['empty element ID', { title: 'World', story: 'Story', worldElements: [{ id: '', label: 'Fold', description: 'A fold.', kind: 'fact' }] }],
    ['duplicate element IDs', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: 'First', description: 'A fold.', kind: 'fact' }, { id: 'fold', label: 'Second', description: 'Another fold.', kind: 'proposal' }] }],
    ['blank element label', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: '  ', description: 'A fold.', kind: 'fact' }] }],
    ['unknown element kind', { title: 'World', story: 'Story', worldElements: [{ id: 'fold', label: 'Fold', description: 'A fold.', kind: 'verified-client-work' }] }],
    ['too many elements', { title: 'World', story: 'Story', worldElements: Array.from({ length: 17 }, (_, i) => ({ id: `e${i}`, label: 'Element', description: 'A detail.', kind: 'proposal' })) }],
  ])('rejects %s in detached reviewed story metadata', (_name, sharedWorld) => {
    expect(parseCanvasSession({ ...direction(), sharedWorld })).toBeNull(); expect(decodeCanvasShare(encodeRaw({ ...direction(), sharedWorld }))).toBeNull();
  });

  it.each(['', '#world=', '#world=%%%', '#world=e30=', '#world=abc+', '#other=e30', '#world=not-json', '#world=_w', '#world=' + 'A'.repeat(MAX_SHARE_CHARS)])('rejects malformed, wrong-prefix, invalid UTF-8 or oversized links (%#)', hash => {
    expect(decodeCanvasShare(hash)).toBeNull();
  });

  it('rejects an individually valid Unicode brief that exceeds the reliable link budget', () => {
    const session = direction();
    for (const [key, limit] of Object.entries({ website: 300, business: 1000, angle: 120, audience: 120, exactWording: 200, brandIdentifiers: 500, style: 120, interaction: 120, notes: 1000 })) session.brief[key as keyof CanvasBrief] = '字'.repeat(limit);
    session.selected = Array.from({ length: 16 }, (_, index) => `element-${index}`); session.hero = session.selected[0];
    session.replacements = session.selected.map(id => ({ id, label: '字'.repeat(80), description: '字'.repeat(300) }));
    expect(parseCanvasSession(session)).not.toBeNull();
    expect(() => encodeCanvasShare(session)).toThrow(/too long.*Download the brief/i);
  });

  it('retains an opaque stale marker across sharing and branching without duplicating private story text', () => {
    const original = direction(); original.brief.website = 'https://changed.example';
    const shared = decodeCanvasShare(encodeCanvasShare(original, { includeGenerated: true }))!;
    expect(shared.worldFingerprint).toBe('stale');
    const branch = branchCanvasSession(shared); expect(branch.worldFingerprint).toBe('stale');
    expect(decodeCanvasShare(encodeCanvasShare(branch, { includeGenerated: true }))?.worldFingerprint).toBe('stale');
  });

  it('gives an imported branch a fresh identity and keeps the source untouched', () => {
    const original = direction(); const snapshot = clone(original);
    const branch = branchCanvasSession(original);
    expect(branch.version).not.toBe(original.version);
    expect(branch.parentVersion).toBe(original.version);
    expect(branch.worldFingerprint).toBe(''); expect(branch.physicalFingerprint).toBe('');
    expect(branch.brief).toEqual(original.brief); expect(branch.selected).toEqual(original.selected);
    expect(original).toEqual(snapshot);
  });
});

describe('Stage fingerprints and truthful prototype handoff', () => {
  it('maps every brief field without rewriting exact wording or notes', () => {
    const session = direction();
    expect(canvasContext(session.brief)).toMatchObject({ business: session.brief.business, exactWording, revisionNotes: session.brief.notes, interaction: session.brief.interaction, scale: 'Let the story decide', mode: 'mechanical' });
  });

  it.each(['business', 'website', 'angle', 'audience', 'exactWording', 'brandIdentifiers', 'style'] as const)('invalidates the story fingerprint for %s changes', field => {
    const original = direction(); const edited = clone(original); edited.brief[field] += ' changed';
    expect(worldFingerprint(edited)).not.toBe(worldFingerprint(original));
  });

  it.each(['interaction', 'notes'] as const)('keeps the world usable but invalidates physical output for %s changes', field => {
    const original = direction(); const edited = clone(original); edited.brief[field] += ' changed';
    expect(worldFingerprint(edited)).toBe(worldFingerprint(original));
    expect(physicalFingerprint(edited)).not.toBe(physicalFingerprint(original));
  });

  it.each([
    ['selection', (s: CanvasSession) => { s.selected = ['ribbon']; }],
    ['hero', (s: CanvasSession) => { s.hero = 'fold'; }],
    ['replacement', (s: CanvasSession) => { s.replacements[0].label = 'New idea'; }],
    ['source world', (s: CanvasSession) => { s.worldId = '00000000-0000-4000-8000-000000000003'; }],
  ])('invalidates physical output for %s changes without changing the story', (_name, edit) => {
    const original = direction(); const edited = clone(original); edit(edited);
    expect(worldFingerprint(edited)).toBe(worldFingerprint(original));
    expect(physicalFingerprint(edited)).not.toBe(physicalFingerprint(original));
  });

  it('treats equivalent typed and normalized website addresses as the same source', () => {
    const original = direction(); original.brief.website = 'company.com';
    const normalized = clone(original); normalized.brief.website = 'https://company.com/';
    expect(worldFingerprint(original)).toBe(worldFingerprint(normalized));
  });

  it('keeps quantity, budget and purpose local without invalidating artwork', () => {
    const original = direction(); const edited = clone(original); edited.prototype.quantity = '200';
    expect(worldFingerprint(edited)).toBe(worldFingerprint(original)); expect(physicalFingerprint(edited)).toBe(physicalFingerprint(original));
  });

  it('labels stale physical output as a previous version in the downloaded brief', () => {
    const session = direction(); session.brief.interaction = 'Display only';
    const brief = makeCanvasBrief(session, { title: 'Paper city', story: 'A paper world.', worldElements: [] }, 'Previous physical city');
    expect(brief).toContain('Physical concept: Previous physical city (previous version; not updated to match the current direction)');
  });

  it('exports exact wording, only selected elements, proposed replacement and honest offline scope', () => {
    const session = direction();
    const brief = makeCanvasBrief(session, { title: 'Paper city', story: 'A connected paper world.', worldElements: [
      { id: 'fold', label: 'Original fold', description: 'Old description', kind: 'fact' },
      { id: 'ribbon', label: 'Ribbon loop', description: 'A wrapping ritual', kind: 'fact' },
      { id: 'removed', label: 'DO NOT INCLUDE', description: 'Removed', kind: 'proposal' },
    ] }, 'Physical paper city');
    expect(brief).toContain(`Exact wording (verbatim JSON): ${JSON.stringify(exactWording)}`);
    expect(brief).toContain('Paper birds: A proposed flock of folded birds. (proposed replacement)');
    expect(brief).toContain('HERO · Ribbon loop'); expect(brief).not.toContain('DO NOT INCLUDE'); expect(brief).not.toContain('Old description');
    expect(brief).toContain('Planning quantity: 100 or still exploring'); expect(brief).toContain('Exploratory budget: RM100–500, exploratory');
    expect(brief).toContain('This file has not been sent.'); expect(brief).toContain('No purchase, production booking or order has been placed.');
    expect(brief).toContain('not a quote, guaranteed price or mandatory limit'); expect(brief).toContain('design engagement');
  });
});


describe('Offline generated narrative snapshots', () => {
  function concept(): CanvasConcept {
    return { id: worldId, contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'Paper studio', title: 'Paper city', story: 'A connected paper neighbourhood.', design: 'Many layers and paths.', context: canvasContext(direction().brief), worldElements: [{ id: 'fold', label: 'Paper fold', description: 'The exact source folding ritual.', kind: 'fact' }], interaction: 'Explore the world', image: 'https://private.example/world.png?secret=signed-access', sourceUrl: 'https://studio.example/', sourceTitle: 'Studio' };
  }
  const key = `offkin:canvas-image-metadata:${worldId}`;

  it('keeps source identity and complete narrative but never persists signed image access', () => {
    const source = concept(); expect(saveCanvasSnapshot(source)).toBe(true);
    const raw = localStorage.getItem(key)!;
    expect(raw).not.toContain('signed-access'); expect(raw).not.toContain('https://private.example');
    expect(loadCanvasSnapshot(worldId)).toEqual({ ...source, image: '' });
    expect(source.image).toContain('signed-access');
  });

  it.each([
    ['invalid ID', (item: CanvasConcept) => ({ ...item, id: '../unsafe' })],
    ['wrong contract', (item: CanvasConcept) => ({ ...item, contractVersion: 'old-contract' })],
    ['invalid element', (item: CanvasConcept) => ({ ...item, worldElements: [{ ...item.worldElements[0], id: 'unsafe/id' }] })],
    ['overlong metadata', (item: CanvasConcept) => ({ ...item, sourceTitle: 'x'.repeat(46000) })],
    ['unsafe image', (item: CanvasConcept) => ({ ...item, image: 'javascript:alert(1)' })],
  ])('does not save %s', (_name, mutate) => {
    expect(saveCanvasSnapshot(mutate(concept()) as CanvasConcept)).toBe(false); expect(localStorage.getItem(key)).toBeNull();
  });

  it.each([
    'not-json', 'null', '[]', 'x'.repeat(45001),
  ])('ignores malformed stored metadata (%#)', raw => {
    localStorage.setItem(key, raw); expect(loadCanvasSnapshot(worldId)).toBeNull();
  });

  it('rejects a stored identity mismatch and any persisted image URL', () => {
    const source = concept();
    localStorage.setItem(key, JSON.stringify({ ...source, id: physicalId, image: '' })); expect(loadCanvasSnapshot(worldId)).toBeNull();
    localStorage.setItem(key, JSON.stringify(source)); expect(loadCanvasSnapshot(worldId)).toBeNull();
    expect(loadCanvasSnapshot('../unsafe')).toBeNull(); expect(loadCanvasSnapshot('')).toBeNull();
  });

  it('reports blocked snapshot storage without affecting the written session', () => {
    const session = direction(); expect(saveCanvasSession(session)).toBe(true);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) { if (name.startsWith('offkin:canvas-image-metadata:')) throw new Error('Quota'); setItem.call(this, name, value); });
    expect(saveCanvasSnapshot(concept())).toBe(false); expect(loadCanvasSession()).toEqual(session);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); }); expect(loadCanvasSnapshot(worldId)).toBeNull();
  });
});
