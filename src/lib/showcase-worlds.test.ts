import { describe, expect, it } from 'vitest';
import { showcaseWorlds, SHOWCASE_DISCLAIMER, SHOWCASE_IMAGE_NOTE, SHOWCASE_PREVIEW_NOTE } from './showcase-worlds';

describe('showcase visual-study contract', () => {
  it('keeps each study separate and points to a distinct complete concept board', () => {
    expect(showcaseWorlds.map(world => world.brand)).toEqual(['Airbnb', 'A24', 'Tesla']);
    expect(new Set(showcaseWorlds.map(world => world.board)).size).toBe(3);
    for (const world of showcaseWorlds) {
      expect(world.board).toContain(`${world.id}-world-board-v3`);
      expect(world.boardAlt).toContain('unofficial');
      expect(world.illustration).toContain(`${world.id}-ink-world-v3`);
      expect(world.illustrationAlt).toContain('unofficial');
      expect(world.elements).toHaveLength(4);
      expect(world.steps).toHaveLength(3);
      expect(JSON.stringify(world)).not.toMatch(/sourceWorldId|selectedElementIds|physicalId/);
    }
  });
  it('does not present concepts as client work, verified parts or working mechanisms', () => {
    expect(SHOWCASE_DISCLAIMER).toContain('No affiliation, commission or endorsement');
    expect(SHOWCASE_IMAGE_NOTE).toBe('Conceptual views. AI-generated art; final geometry and functionality need validation.');
    expect(SHOWCASE_PREVIEW_NOTE).toBe('Concept preview. Final design, functionality and pricing confirmed during the build proposal.');
    expect(showcaseWorlds.every(world => world.steps.some(step => /proposed/i.test(step.copy)))).toBe(true);
  });
  it('keeps the Tesla study grounded in clean energy, cars, homes and charging', () => {
    const tesla = JSON.stringify(showcaseWorlds.find(world => world.id === 'tesla'));
    expect(tesla).not.toMatch(/SpaceX|rocket|Mars|Beyond Earth/i);
    for (const term of ['solar', 'storage', 'car', 'charging']) expect(tesla.toLowerCase()).toContain(term);
  });
});
