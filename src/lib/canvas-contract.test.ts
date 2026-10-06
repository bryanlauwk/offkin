import { describe, expect, it } from 'vitest';
import {
  CANVAS_CONTRACT_VERSION, CANVAS_CONTEXT_MAX_CHARS, CANVAS_MANIFEST_MAX_CHARS,
  CanvasFailure, canvasCacheInput, isCanvasConcept, isCanvasContext,
  parseCanvasDesign, parseCanvasManifest, restoreCanvasRow, selectWorldElements,
  serializeCanvasManifest, validateCanvasRequest, type CanvasManifest, type CanvasRequest,
} from '../../supabase/functions/generate-concept/canvas';
import { CANVAS_WORLD_PROMPT, CANVAS_PHYSICAL_PROMPT, canvasImagePrompt } from '../../supabase/functions/generate-concept/prompt';
const id = '00000000-0000-4000-8000-000000000001';
const world: CanvasRequest = { contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'no-website', context: { business: 'Origami studio', exactWording: '  Fold for YOU!\n异趣伙伴  ' } };
const manifest: CanvasManifest = {
  contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', context: world.context, story: 'A proposed connected world', design: 'A layered scene of connected paper landscapes',
  worldElements: [{ id: 'fold', label: 'The fold', description: 'The supplied folding ritual', kind: 'fact' }, { id: 'river', label: 'Paper river', description: 'A proposed flowing paper river', kind: 'proposal' }],
};
const physical: CanvasRequest = { ...world, stage: 'physical', sourceWorldId: id, selectedElementIds: ['fold', 'river'], heroElementId: 'river', replacements: [] };
describe('bounded lossless canvas v9 data contract', () => {
  it('accepts exactly 6000 serialized context characters and rejects overflow without truncation', () => {
    const context = { business: 'x'.repeat(CANVAS_CONTEXT_MAX_CHARS - JSON.stringify({ business: '' }).length) };
    expect(JSON.stringify(context)).toHaveLength(6000);
    expect(isCanvasContext(context)).toBe(true);
    expect(validateCanvasRequest({ ...world, context }).context).toBe(context);
    expect(isCanvasContext({ business: context.business + 'x' })).toBe(false);
    expect(() => validateCanvasRequest({ ...world, context: { business: context.business + 'x' } })).toThrow(CanvasFailure);
    expect(validateCanvasRequest(world).context.exactWording).toBe(world.context.exactWording);
  });
  it.each([null, [], 'text', { unknown: 'x' }, { business: null }, { business: {} }, { mode: 'Electronic' }, JSON.parse('{"__proto__":"x"}')])('rejects malformed context %j', value => {
    expect(isCanvasContext(value)).toBe(false);
  });
  it('keeps explicit electronics optional and defaults an omitted mode through the caller', () => {
    expect(isCanvasContext({ mode: 'mechanical' })).toBe(true);
    expect(isCanvasContext({ mode: 'electronic' })).toBe(true);
    expect(isCanvasContext({})).toBe(true);
  });
  it('rejects duplicate IDs, missing/foreign heroes and replacements that do not belong to selection', () => {
    for (const request of [
      { ...physical, selectedElementIds: ['fold', 'fold'], heroElementId: 'fold' },
      { ...physical, heroElementId: 'other' },
      { ...physical, heroElementId: undefined },
      { ...physical, sourceWorldId: '../world' },
      { ...physical, replacements: [{ id: 'other', label: 'Other', description: 'Not selected' }] },
      { ...physical, replacements: [{ id: 'river', label: '', description: 'Empty label' }] },
      { ...physical, replacements: [{ id: 'river', label: 'River', description: 'x'.repeat(701) }] },
    ]) expect(() => validateCanvasRequest(request)).toThrow(CanvasFailure);
  });
  it('retains every selected source element, removes all others and labels user replacements as proposals', () => {
    expect(selectWorldElements({ ...physical, selectedElementIds: ['fold'], heroElementId: 'fold' }, manifest)).toEqual([manifest.worldElements[0]]);
    const replacement = { id: 'fold', label: '  Another Fold  ', description: 'A proposed scene\nwith exact spacing.  ' };
    expect(selectWorldElements({ ...physical, replacements: [replacement] }, manifest)).toEqual([{ ...replacement, kind: 'proposal' }, manifest.worldElements[1]]);
    expect(manifest.worldElements[0].kind).toBe('fact');
    expect(() => selectWorldElements({ ...physical, selectedElementIds: ['foreign'] }, manifest)).toThrow(CanvasFailure);
    expect(() => selectWorldElements(physical, { ...manifest, stage: 'physical' })).toThrow(CanvasFailure);
  });
  it('round-trips a bounded private manifest without losing wording, ordering or factual/proposed status', () => {
    const stored = serializeCanvasManifest(manifest);
    expect(stored.length).toBeLessThan(CANVAS_MANIFEST_MAX_CHARS);
    expect(parseCanvasManifest(stored)).toEqual(manifest);
    const row = { id, brand: 'Origami', title: 'Paper world', story: stored, image_path: 'private.png', prompt_version: CANVAS_CONTRACT_VERSION };
    const restored = restoreCanvasRow(row, 'https://private.invalid/private.png?token=signed');
    expect(restored).toMatchObject({ ...manifest, id, story: manifest.story });
    expect(isCanvasConcept(restored)).toBe(true);
    expect(restoreCanvasRow({ ...row, prompt_version: 'offkin-canvas-v10' }, 'https://private.invalid')).toBeNull();
    expect(isCanvasConcept({ ...restored, image: 'javascript:alert(1)' })).toBe(false);
    expect(isCanvasConcept({ ...restored, contractVersion: 'offkin-canvas-v10' })).toBe(false);
  });
  it.each(['ordinary legacy story', 'OFFKIN_CANVAS_V9\n{', 'OFFKIN_CANVAS_V9\nnull', 'OFFKIN_CANVAS_V9\n' + 'x'.repeat(CANVAS_MANIFEST_MAX_CHARS + 1)])('does not expose malformed or legacy text as a canvas manifest', value => {
    expect(parseCanvasManifest(value)).toBeNull();
  });
  it('rejects unsupported coordinates, oversized metadata, duplicate generated IDs and broken physical manifests', () => {
    const design = { ...manifest, brand: 'Studio', title: 'World', interaction: 'Explore', needsContext: false };
    expect(parseCanvasDesign(design).worldElements).toEqual(manifest.worldElements);
    for (const worldElements of [[], [...manifest.worldElements, manifest.worldElements[0]], [{ ...manifest.worldElements[0], x: 0.5 }], [{ ...manifest.worldElements[0], description: 'x'.repeat(701) }]]) expect(() => parseCanvasDesign({ ...design, worldElements })).toThrow();
    expect(() => serializeCanvasManifest({ ...manifest, stage: 'physical', sourceWorldId: id, selectedElementIds: ['fold'], heroElementId: 'fold' })).toThrow();
  });
  it('keys source identity/manifest, stage, selections, hero, wording, edits and every story choice', () => {
    const base = canvasCacheInput(physical, '', manifest);
    for (const request of [
      { ...physical, sourceWorldId: '00000000-0000-4000-8000-000000000002' },
      { ...physical, stage: 'world' as const },
      { ...physical, selectedElementIds: ['river'] },
      { ...physical, heroElementId: 'fold' },
      { ...physical, replacements: [{ id: 'river', label: 'River', description: 'New river' }] },
      { ...physical, context: { ...physical.context, exactWording: 'Changed wording' } },
      { ...physical, context: { ...physical.context, angle: 'Changed angle' } },
      { ...physical, context: { ...physical.context, style: 'Changed style' } },
    ]) expect(canvasCacheInput(request, '', manifest)).not.toBe(base);
    expect(canvasCacheInput(physical, 'https://another.example.com', manifest)).not.toBe(base);
    expect(canvasCacheInput(physical, '', { ...manifest, design: 'Changed world narrative' })).not.toBe(base);
    expect(canvasCacheInput({ ...physical, context: { exactWording: physical.context.exactWording, business: physical.context.business } }, '', manifest)).toBe(base);
  });
});
describe('independent canvas art direction', () => {
  it('makes a rich illustration first and preserves connected richness in the separate physical stage', () => {
    expect(CANVAS_WORLD_PROMPT).toContain('rich, layered, connected illustrated brand WORLD');
    expect(CANVAS_WORLD_PROMPT).toContain('Richness takes precedence over manufacturing simplicity');
    expect(CANVAS_WORLD_PROMPT).toContain('not automatic image segmentation');
    expect(CANVAS_WORLD_PROMPT).toContain('Do not return coordinates');
    expect(CANVAS_PHYSICAL_PROMPT).toContain('Keep EVERY selected element');
    expect(CANVAS_PHYSICAL_PROMPT).toContain('exclude removed elements');
    expect(CANVAS_PHYSICAL_PROMPT).toContain('later paid design/prototype stage');
    expect(canvasImagePrompt('world', 'mechanical')).toContain('STAGE WORLD');
    expect(canvasImagePrompt('physical', 'mechanical')).toContain('STAGE PHYSICAL');
  });
  it('uses supplied official brand direction without inventing uploads, rights or facts', () => {
    expect(CANVAS_WORLD_PROMPT).toContain('Official logos, wordmarks and colours explicitly supplied');
    expect(CANVAS_WORLD_PROMPT).toContain('no uploaded artwork');
    expect(CANVAS_WORLD_PROMPT).toContain('kind to fact ONLY');
    for (const prompt of [CANVAS_WORLD_PROMPT, CANVAS_PHYSICAL_PROMPT]) {
      expect(prompt).toContain('untrusted data');
      expect(prompt).toContain('spelling, case, punctuation and whitespace');
      expect(prompt).toContain('proofing');
    }
  });
  it('keeps at most two motions optional and never silently enables electronics', () => {
    expect(CANVAS_PHYSICAL_PROMPT).toContain('at most one or two optional mechanical motions');
    expect(CANVAS_PHYSICAL_PROMPT).toContain('Electronic mode is allowed only when explicitly selected');
    expect(canvasImagePrompt('physical', 'mechanical')).toContain('No powered electronics');
    expect(canvasImagePrompt('physical', 'electronic')).toContain('Only the explicitly requested electronic response');
  });
});
