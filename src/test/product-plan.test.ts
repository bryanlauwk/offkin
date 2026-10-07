import { describe, expect, it, vi } from 'vitest';
import { CanvasFailure } from '../../supabase/functions/generate-concept/canvas';
import {
  isProductPlan, parseProductPlan, productPlanText, PRODUCT_PLAN_MAX_CHARS,
  PRODUCT_PLAN_PROMPT, type ProductPlan,
} from '../../supabase/functions/generate-concept/product-plan';
import { makeProductPlan } from './product-plan-fixture';

function withPurchasedPart(): ProductPlan {
  const plan = makeProductPlan();
  plan.purchasedParts = [{ id: 'alignment-rod', name: 'Alignment rod', purpose: 'Proposed alignment aid; material and dimensions remain unresolved.', specificationStatus: 'unselected' }];
  plan.joins.push({ ...plan.joins[0], id: 'rod-seat', partIds: ['display-base', 'alignment-rod'] });
  plan.assembly[0].partIds.push('alignment-rod');
  return plan;
}

function withAction(): ProductPlan {
  const plan = makeProductPlan();
  plan.actions = [{ action: 'Lift the crest', response: 'Reveal a story detail inside the base seat.', partIds: ['story-hero', 'display-base'], validation: { status: 'unverified', check: 'Test safe removal, repeatable seating and access with a physical sample.' } }];
  plan.verificationGates.push({ id: 'interaction-test', status: 'unverified' });
  return plan;
}

describe('ProductPlan physical proposal contract', () => {
  it('accepts the fixture, preserving all selected story IDs and the original complete object', () => {
    const plan = makeProductPlan(['brand-story', 'brand-mark', 'origin-']);
    expect(isProductPlan(plan, ['brand-story', 'brand-mark', 'origin-'])).toBe(true);
    expect(parseProductPlan(plan)).toBe(plan);
    expect(plan.parts.find(part => part.id === plan.heroPartId)?.storyElementIds).toEqual(['brand-story', 'brand-mark', 'origin-']);
    expect(isProductPlan(makeProductPlan([]), [])).toBe(true);
  });

  it('supports connected subassemblies when the sequence covers each join and part', () => {
    const plan = withPurchasedPart();
    plan.assembly = [
      { step: 1, partIds: ['display-base', 'alignment-rod'], instruction: 'Check the proposed rod seat.' },
      { step: 2, partIds: ['story-hero', 'display-base'], instruction: 'Trial-fit the crest onto the base subassembly.' },
    ];
    expect(isProductPlan(plan)).toBe(true);
  });

  it.each([
    ['missing printed part', (plan: ProductPlan) => { plan.parts.pop(); }],
    ['disconnected part', (plan: ProductPlan) => { plan.parts.push({ ...plan.parts[1], id: 'loose-piece' }); }],
    ['self join', (plan: ProductPlan) => { plan.joins[0].partIds = ['story-hero', 'story-hero']; }],
    ['unknown join reference', (plan: ProductPlan) => { plan.joins[0].partIds[1] = 'imaginary-base'; }],
    ['duplicate part ID', (plan: ProductPlan) => { plan.parts[1].id = plan.parts[0].id; }],
    ['duplicate join ID', (plan: ProductPlan) => { plan.joins.push({ ...plan.joins[0] }); }],
    ['unknown assembly reference', (plan: ProductPlan) => { plan.assembly[0].partIds.push('imaginary-base'); }],
    ['duplicate assembly reference', (plan: ProductPlan) => { plan.assembly[0].partIds.push('story-hero'); }],
    ['omitted assembly part', (plan: ProductPlan) => { plan.assembly[0].partIds = ['story-hero']; }],
    ['nonconsecutive assembly sequence', (plan: ProductPlan) => { plan.assembly[0].step = 2; }],
    ['unknown hero', (plan: ProductPlan) => { plan.heroPartId = 'imaginary-hero'; }],
    ['malformed hero', (plan: ProductPlan) => { plan.heroPartId = 'Story Hero'; }],
  ] as const)('rejects %s', (_label, change) => {
    const plan = makeProductPlan();
    change(plan);
    expect(isProductPlan(plan)).toBe(false);
  });

  it('rejects assembly steps that skip a join even when every part is listed', () => {
    const plan = makeProductPlan();
    plan.assembly = plan.parts.map((part, index) => ({ step: index + 1, partIds: [part.id], instruction: 'Inspect the loose part.' }));
    expect(isProductPlan(plan)).toBe(false);
  });

  it('rejects an assembly step whose referenced subset is disconnected', () => {
    const plan = withPurchasedPart();
    plan.assembly.push({ step: 2, partIds: ['story-hero', 'alignment-rod'], instruction: 'Propose an impossible direct connection.' });
    expect(isProductPlan(plan)).toBe(false);
  });

  it('rejects omitted, invented and duplicated story references against authoritative input', () => {
    expect(isProductPlan(makeProductPlan(), ['brand-story', 'missing-story'])).toBe(false);
    expect(isProductPlan(makeProductPlan(['invented-story']), ['brand-story'])).toBe(false);
    expect(isProductPlan(makeProductPlan(['brand-story', 'brand-story']), ['brand-story'])).toBe(false);
    expect(isProductPlan(makeProductPlan(), ['brand-story', 'brand-story'])).toBe(false);
    expect(isProductPlan(makeProductPlan(), ['Invalid ID'])).toBe(false);
    expect(isProductPlan(makeProductPlan(), [])).toBe(false);
  });

  it('allows shared story references across printed parts but bounds their total', () => {
    const plan = makeProductPlan();
    plan.parts[1].storyElementIds = ['brand-story'];
    expect(isProductPlan(plan, ['brand-story'])).toBe(true);
    plan.parts[0].storyElementIds = Array.from({ length: 16 }, (_, index) => `story-${index}`);
    plan.parts[1].storyElementIds = ['seventeenth-story'];
    expect(isProductPlan(plan)).toBe(false);
  });

  it('requires a printed hero and prevents purchased parts from replacing the story mapping', () => {
    const plan = withPurchasedPart();
    expect(isProductPlan(plan, ['brand-story'])).toBe(true);
    plan.heroPartId = 'alignment-rod';
    expect(isProductPlan(plan)).toBe(false);
    plan.heroPartId = 'story-hero';
    plan.parts[0].storyElementIds = [];
    expect(isProductPlan(plan, ['brand-story'])).toBe(false);
  });

  it('accepts omitted or empty purchased parts but rejects collisions, disconnection and selected specifications', () => {
    const plan = makeProductPlan();
    plan.purchasedParts = [];
    expect(isProductPlan(plan)).toBe(true);
    plan.purchasedParts = withPurchasedPart().purchasedParts;
    expect(isProductPlan(plan)).toBe(false);
    const connected = withPurchasedPart();
    connected.purchasedParts![0].id = 'story-hero';
    expect(isProductPlan(connected)).toBe(false);
    const selected = withPurchasedPart();
    Object.assign(selected.purchasedParts![0], { specificationStatus: 'supplier-certified' });
    expect(isProductPlan(selected)).toBe(false);
  });

  it('requires exactly the conditional interaction gate for proposed actions', () => {
    const plan = withAction();
    expect(isProductPlan(plan)).toBe(true);
    plan.verificationGates.pop();
    expect(isProductPlan(plan)).toBe(false);
    const staticPlan = makeProductPlan();
    staticPlan.verificationGates.push({ id: 'interaction-test', status: 'unverified' });
    expect(isProductPlan(staticPlan)).toBe(false);
  });

  it('rejects unknown and repeated action references or more than two actions', () => {
    const plan = withAction();
    plan.actions[0].partIds = ['missing-part'];
    expect(isProductPlan(plan)).toBe(false);
    plan.actions[0].partIds = ['story-hero', 'story-hero'];
    expect(isProductPlan(plan)).toBe(false);
    plan.actions = Array.from({ length: 3 }, () => withAction().actions[0]);
    expect(isProductPlan(plan)).toBe(false);
  });

  it.each(['verified', 'physically-tested', 'supplier-certified', 'passed'])('rejects fabricated %s evidence anywhere status is structured', status => {
    const plan = makeProductPlan();
    Object.assign(plan, { status });
    expect(isProductPlan(plan)).toBe(false);
    const join = makeProductPlan();
    Object.assign(join.joins[0].validation, { status });
    expect(isProductPlan(join)).toBe(false);
    const gate = makeProductPlan();
    Object.assign(gate.verificationGates[0], { status });
    expect(isProductPlan(gate)).toBe(false);
    const action = withAction();
    Object.assign(action.actions[0].validation, { status });
    expect(isProductPlan(action)).toBe(false);
  });

  it('rejects missing, duplicate and invented verification gates', () => {
    const plan = makeProductPlan();
    plan.verificationGates.pop();
    expect(isProductPlan(plan)).toBe(false);
    const duplicate = makeProductPlan();
    duplicate.verificationGates[0] = duplicate.verificationGates[1];
    expect(isProductPlan(duplicate)).toBe(false);
    const invented = makeProductPlan();
    Object.assign(invented.verificationGates[0], { id: 'supplier-certification' });
    expect(isProductPlan(invented)).toBe(false);
  });

  it.each(['version', 'status', 'productIntent', 'silhouette', 'heroPartId', 'scale', 'process', 'parts', 'joins', 'assembly', 'actions', 'risks', 'manufacturingUnknowns', 'verificationGates'])('requires %s', key => {
    const plan = makeProductPlan() as unknown as Record<string, unknown>;
    delete plan[key];
    expect(isProductPlan(plan)).toBe(false);
  });

  it('rejects unexpected fields at the root and nested objects without silently stripping them', () => {
    expect(isProductPlan({ ...makeProductPlan(), approved: true })).toBe(false);
    const plan = makeProductPlan();
    Object.assign(plan.parts[0], { certified: true });
    expect(isProductPlan(plan)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(plan.parts[0], 'certified')).toBe(true);
  });

  it('enforces text, array and ID bounds without truncation', () => {
    const plan = makeProductPlan();
    plan.productIntent = 'x'.repeat(480);
    expect(isProductPlan(plan)).toBe(true);
    plan.productIntent += 'x';
    expect(isProductPlan(plan)).toBe(false);
    plan.productIntent = '  ';
    expect(isProductPlan(plan)).toBe(false);
    const short = makeProductPlan();
    short.risks = ['Only one risk'];
    expect(isProductPlan(short)).toBe(false);
    const tooMany = makeProductPlan();
    tooMany.manufacturingUnknowns = Array.from({ length: 9 }, () => 'Unknown');
    expect(isProductPlan(tooMany)).toBe(false);
    const invalidId = makeProductPlan();
    invalidId.joins[0].id = 'bad--join';
    expect(isProductPlan(invalidId)).toBe(false);
    const tooManyParts = makeProductPlan();
    tooManyParts.parts = Array.from({ length: 17 }, () => tooManyParts.parts[0]);
    expect(isProductPlan(tooManyParts)).toBe(false);
    const tooManyPurchased = makeProductPlan();
    tooManyPurchased.purchasedParts = Array.from({ length: 9 }, () => withPurchasedPart().purchasedParts![0]);
    expect(isProductPlan(tooManyPurchased)).toBe(false);
  });

  it('rejects an otherwise coherent plan exceeding the complete compact JSON bound', () => {
    const plan = makeProductPlan();
    plan.parts = Array.from({ length: 16 }, (_, index) => ({
      ...plan.parts[0], id: index === 0 ? 'story-hero' : `piece-${index}`,
      storyElementIds: index === 0 ? ['brand-story'] : [],
      form: 'x'.repeat(320), printStrategy: 'x'.repeat(320), finish: 'x'.repeat(240),
    }));
    plan.joins = plan.parts.slice(1).map((part, index) => ({ ...plan.joins[0], id: `join-${index}`, partIds: ['story-hero', part.id] }));
    plan.assembly[0].partIds = plan.parts.map(part => part.id);
    expect(JSON.stringify(plan).length).toBeGreaterThan(PRODUCT_PLAN_MAX_CHARS);
    expect(isProductPlan(plan)).toBe(false);
    plan.parts.forEach(part => { part.form = 'Shape'; part.printStrategy = 'Review'; part.finish = 'Sample'; });
    expect(JSON.stringify(plan).length).toBeLessThan(PRODUCT_PLAN_MAX_CHARS);
    expect(isProductPlan(plan)).toBe(true);
  });

  it.each([undefined, null, true, 1, 'plan', [], new Date(), Number.NaN])('rejects malformed root values: %s', value => {
    expect(isProductPlan(value)).toBe(false);
    expect(() => parseProductPlan(value)).toThrow(CanvasFailure);
  });

  it('rejects sparse arrays, custom serializers, accessors, symbols, cycles and inherited records', () => {
    const sparse = makeProductPlan();
    delete sparse.parts[0];
    expect(isProductPlan(sparse)).toBe(false);
    const serialized = makeProductPlan();
    const toJSON = vi.fn(() => ({}));
    Object.assign(serialized, { toJSON });
    expect(isProductPlan(serialized)).toBe(false);
    expect(toJSON).not.toHaveBeenCalled();
    const accessor = makeProductPlan();
    const get = vi.fn(() => 'story-hero');
    Object.defineProperty(accessor, 'heroPartId', { enumerable: true, get });
    expect(isProductPlan(accessor)).toBe(false);
    expect(get).not.toHaveBeenCalled();
    const symbolic = makeProductPlan();
    Object.assign(symbolic, { [Symbol('hidden')]: true });
    expect(isProductPlan(symbolic)).toBe(false);
    const cyclic = makeProductPlan();
    Object.assign(cyclic.parts[0], { form: cyclic });
    expect(isProductPlan(cyclic)).toBe(false);
    const inherited = Object.create(makeProductPlan());
    expect(isProductPlan(inherited)).toBe(false);
  });

  it('does not execute custom array prototypes or array accessors', () => {
    const plan = makeProductPlan();
    const toJSON = vi.fn(() => []);
    Object.setPrototypeOf(plan.parts, Object.assign(Object.create(Array.prototype), { toJSON }));
    expect(isProductPlan(plan)).toBe(false);
    expect(toJSON).not.toHaveBeenCalled();
    const accessor = makeProductPlan();
    const get = vi.fn(() => accessor.parts[1]);
    Object.defineProperty(accessor.parts, '0', { enumerable: true, get });
    expect(isProductPlan(accessor)).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('fails closed for values that throw during inspection and returns a safe provider failure', () => {
    const broken = new Proxy({}, { getPrototypeOf() { throw new Error('internal provider detail'); } });
    expect(isProductPlan(broken)).toBe(false);
    try {
      parseProductPlan(broken);
      throw new Error('Expected an invalid plan to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(CanvasFailure);
      expect((error as CanvasFailure).status).toBe(502);
      expect((error as Error).message).toContain('brief and existing images are unchanged');
      expect((error as Error).message).not.toContain('internal provider detail');
    }
  });

  it('renders the complete hero, purchased parts, graph, actions, risks and pending checks', () => {
    const plan = withPurchasedPart();
    plan.actions = withAction().actions;
    plan.verificationGates.push({ id: 'interaction-test', status: 'unverified' });
    const rendered = productPlanText(plan);
    expect(rendered).toContain('Printed hero: Story crest [story-hero]');
    expect(rendered).toContain('Alignment rod [alignment-rod]');
    expect(rendered).toContain(plan.joins[0].validation.check);
    expect(rendered).toContain(plan.assembly[0].instruction);
    expect(rendered).toContain(plan.actions[0].response);
    for (const risk of plan.risks) expect(rendered).toContain(risk);
    for (const unknown of plan.manufacturingUnknowns) expect(rendered).toContain(unknown);
    expect(rendered).toContain('interaction-test: unverified');
    expect(rendered).toContain('not a CAD model');
    expect(productPlanText(makeProductPlan())).toContain('Proposed actions: none');
    plan.heroPartId = 'unknown';
    expect(() => productPlanText(plan)).toThrow(CanvasFailure);
  });

  it('supplies model instructions for hero, bounds, honest validation and conditional motion', () => {
    expect(PRODUCT_PLAN_PROMPT).toContain('"heroPartId": partId');
    expect(PRODUCT_PLAN_PROMPT).toContain('2–16 printed parts');
    expect(PRODUCT_PLAN_PROMPT).toContain('10000 characters');
    expect(PRODUCT_PLAN_PROMPT).toContain('"interaction-test"');
    expect(PRODUCT_PLAN_PROMPT).toContain('diametral, radial or per side');
    expect(PRODUCT_PLAN_PROMPT).toContain('no universal palm-size requirement');
    expect(PRODUCT_PLAN_PROMPT).toContain('exactly "unverified"');
  });
});
