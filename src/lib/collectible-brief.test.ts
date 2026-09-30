import { describe, expect, it } from 'vitest';
import { makeBrief, type CollectibleConcept } from './collectible-brief';
import { parseSelection } from '../../supabase/functions/generate-concept/options';
const concept: CollectibleConcept = { id: 'sample', brand: 'Rimba', title: 'First stall', story: 'A proposed origin scene.', interaction: 'Build a stall.', edition: 'hero', format: 'bricks' };
const details = { agency: 'Creative Agency', quantity: '100', budget: '87', date: '', occasion: 'Client appreciation', clientReady: true };
describe('agency briefs', () => {
  it('keeps the client export free of internal pricing and supplier branding', () => {
    const brief = makeBrief(concept, details);
    expect(brief).toContain('Prepared by: Creative Agency');
    expect(brief).toContain('Edition: Hero\nFormat: Brick build');
    expect(brief).not.toContain('RM87');
    expect(brief).not.toContain('INTERNAL PLANNING');
    expect(brief).not.toContain('Brandkin');
    expect(brief).toContain('does not place an order');
  });
  it('labels internal budget as a target rather than a quote', () => {
    expect(makeBrief(concept, { ...details, clientReady: false })).toContain('Target unit budget: RM87 (not a quote; design and sample fees excluded)');
  });
  it('does not invent an agency identity or delivery commitment', () => {
    const brief = makeBrief(concept, { ...details, agency: ' ' });
    expect(brief).not.toContain('Prepared by:');
    expect(brief).toContain('Requested delivery: To be confirmed');
  });
});
describe('collectible choices', () => {
  it('keeps old clicker requests compatible', () => { expect(parseSelection({})).toEqual({ edition: 'everyday', format: 'clicker' }); });
  it('rejects a functional clicker for the nonfunctional Icon edition', () => { expect(parseSelection({ edition: 'icon', format: 'clicker' })).toBeNull(); });
  it('accepts all other edition and format combinations', () => {
    for (const edition of ['icon', 'hero', 'inside', 'everyday']) for (const format of ['bricks', 'miniature', 'clicker']) {
      if (edition === 'icon' && format === 'clicker') continue;
      expect(parseSelection({ edition, format })).toEqual({ edition, format });
    }
  });
  it('rejects unknown and prototype names', () => {
    expect(parseSelection({ edition: 'constructor', format: 'bricks' })).toBeNull();
    expect(parseSelection({ edition: 'hero', format: 'unknown' })).toBeNull();
    expect(parseSelection({ edition: null })).toBeNull();
  });
});
