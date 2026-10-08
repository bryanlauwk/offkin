import { describe, expect, it } from 'vitest';
import { isConceptPreview, makeConceptPreview, parseConceptPreviewDesign } from '../../supabase/functions/generate-concept/concept-preview';

const ids = ['layered-city', 'character-neighbourhood'];
const design = { needsContext: false, brand: 'Fable Studio', title: 'A layered city', story: 'An unverified imagined collectible.',
  interaction: 'Display only', design: 'Detailed architecture, thirty characters, fifty bridges and fine landscape features.',
  worldElements: ids.map(id => ({ id, label: id, description: 'A group of many connected meaningful details.', kind: 'proposal' })) };

describe('creative concept contract', () => {
  it('keeps bounded narrative groups independent of fabrication-part counts', () => {
    expect(parseConceptPreviewDesign(design)).toEqual(design);
    expect(makeConceptPreview(ids, ids[0])).toEqual({ version: 'concept-preview-v1', status: 'unverified-visual-concept',
      storyElementIds: ids, heroElementId: ids[0], buildProposal: 'not-requested' });
    const allIds = Array.from({ length: 16 }, (_, index) => `neighbourhood-${index}`);
    expect(isConceptPreview(makeConceptPreview(allIds, allIds[12]), allIds, allIds[12])).toBe(true);
    expect(() => makeConceptPreview([...allIds, 'too-many-cards'], allIds[0])).toThrow();
  });
  it('retains valid historical story ID syntax rather than silently renaming saved selections', () => {
    const historical = ['fold--garden-'];
    expect(isConceptPreview(makeConceptPreview(historical, historical[0]), historical)).toBe(true);
  });
  it.each([
    { status: 'verified' }, { buildProposal: 'quote-approved' }, { verification: true },
    { storyElementIds: [...ids, ids[0]] }, { storyElementIds: [...ids].reverse() },
    { storyElementIds: ['new-scene'] }, { heroElementId: 'invented-hero' }, { version: 'concept-preview-v2' },
  ])('rejects forged status or changed story metadata %j', patch => {
    expect(isConceptPreview({ ...makeConceptPreview(ids, ids[0]), ...patch }, ids, ids[0])).toBe(false);
  });
  it.each(['productPlan', 'constructionOrigin', 'constructionVisual', 'conceptPreview', 'approved', 'imageUrl'])('rejects hidden model %s fields', key => {
    expect(() => parseConceptPreviewDesign({ ...design, [key]: {} })).toThrow(/unsupported creative preview/);
  });
  it.each([
    { story: 'x'.repeat(2001) }, { design: 'x'.repeat(8001) }, { interaction: 'x'.repeat(701) },
    { worldElements: [{ ...design.worldElements[0], description: 'x'.repeat(701) }] },
    { worldElements: [{ ...design.worldElements[0], kind: 'verified' }] },
  ])('preserves bounded creative validation %j', patch => {
    expect(() => parseConceptPreviewDesign({ ...design, ...patch })).toThrow();
  });
});
