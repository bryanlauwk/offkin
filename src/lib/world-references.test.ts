import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getWorldReference, worldReferences, WORLD_REFERENCE_FACT_LABEL } from './world-references';

describe('preauthored world references', () => {
  it('keeps three distinct rich concept boards with bounded, stable elements', () => {
    expect(worldReferences.map(reference => reference.id)).toEqual(['airbnb', 'a24', 'tesla']);
    const allIds: string[] = [];
    for (const reference of worldReferences) {
      expect(reference.elements.length).toBeGreaterThan(0);
      expect(reference.elements.length).toBeLessThanOrEqual(6);
      expect(reference.facts.length).toBeGreaterThan(0);
      expect(reference.narrative).toMatch(/^Proposed interpretation:/);
      expect(reference.disclosure).toContain('not been independently verified');
      expect(reference.worldWidth).toBeGreaterThan(1000);
      expect(reference.worldHeight).toBeGreaterThan(400);
      for (const element of reference.elements) {
        expect(element.id.length).toBeLessThanOrEqual(40);
        expect(element.label.length).toBeLessThanOrEqual(80);
        expect(element.description.length).toBeLessThanOrEqual(300);
        expect(['fact', 'proposal']).toContain(element.kind);
        expect(element.x).toBeGreaterThan(0);
        expect(element.x).toBeLessThan(100);
        expect(element.y).toBeGreaterThan(0);
        expect(element.y).toBeLessThan(100);
        allIds.push(element.id);
      }
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('only links authored image assets that exist, including full original PNG boards', () => {
    for (const reference of worldReferences) {
      const assets = [reference.worldImage, reference.physicalImage, reference.boardImage,
        ...reference.elements.map(element => element.thumbnailImage)];
      for (const asset of assets) {
        expect(asset).toMatch(/^\/canvas-worlds\/[a-z0-9-]+\.(webp|png)$/);
        expect(existsSync(resolve('public', asset.slice(1)))).toBe(true);
      }
      const original = readFileSync(resolve('public', reference.boardImage.slice(1)));
      expect(original.subarray(1, 4).toString()).toBe('PNG');
      // Original boards are the supplied 1536×1024 images, not cropped previews.
      expect(original.readUInt32BE(16)).toBe(1536);
      expect(original.readUInt32BE(20)).toBe(1024);
    }
  });

  it('keeps fact provenance and speculative or unlicensed content explicit', () => {
    expect(WORLD_REFERENCE_FACT_LABEL).toBe('From the supplied board');
    const tesla = getWorldReference('tesla');
    const rocket = tesla?.elements.find(element => element.id === 'tesla-horizon');
    expect(rocket?.kind).toBe('proposal');
    expect(rocket?.description).toContain('do not represent an official Tesla business');
    expect(tesla?.disclosure).toContain('SpaceX fact');
    expect(getWorldReference('a24')?.disclosure).toContain('unlicensed concept artwork');
    expect(getWorldReference('a24')?.disclosure).toContain('no official partnership');
    expect(getWorldReference('unknown')).toBeUndefined();
  });
});
