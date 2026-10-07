import { describe, expect, it, vi } from 'vitest';
import { PRODUCT_PLAN_MAX_ISSUES, isProductPlan, productPlanIssues, type ProductPlan } from '../../supabase/functions/generate-concept/product-plan';
import { makeProductPlan } from './product-plan-fixture';

/** Synthetic relationships only: no customer brief, live output or capability IDs. */
function graphPlan(size: number, edges: [number, number][]): ProductPlan {
  const plan = makeProductPlan();
  plan.parts = Array.from({ length: size }, (_, index) => ({
    ...plan.parts[index ? 1 : 0], id: `part-${index}`, storyElementIds: index ? [] : ['brand-story'],
  }));
  plan.heroPartId = 'part-0';
  plan.joins = edges.map(([a, b], index) => ({ ...plan.joins[0], id: `join-${index}`, partIds: [`part-${a}`, `part-${b}`] }));
  plan.assembly = [{ step: 1, partIds: plan.parts.map(part => part.id), instruction: 'Trial-fit the explicitly proposed relationships; validation remains unresolved.' }];
  return plan;
}

/** Independent union-find oracle, rather than the production traversal. */
function connectedSubset(nodes: number[], edges: [number, number][]): boolean {
  const parents = new Map(nodes.map(node => [node, node]));
  const root = (node: number): number => {
    let result = node;
    while (parents.get(result) !== result) result = parents.get(result)!;
    return result;
  };
  for (const [a, b] of edges) if (parents.has(a) && parents.has(b)) parents.set(root(a), root(b));
  return new Set(nodes.map(root)).size === 1;
}

describe('bounded assembly feedback without changing acceptance', () => {
  it('reports hidden coverage in the same pass as disconnected graph and first-step failures', () => {
    const initial = graphPlan(4, [[0, 1], [2, 3]]);
    initial.assembly = [
      { step: 1, partIds: ['part-0', 'part-2'], instruction: 'Trial-fit the proposed subassembly.' },
      { step: 2, partIds: ['part-1'], instruction: 'Inspect this component.' },
    ];
    const before = structuredClone(initial);
    expect(productPlanIssues(initial)).toEqual([
      { path: 'productPlan.joins', code: 'disconnected-parts' },
      { path: 'productPlan.assembly[0].partIds', code: 'disconnected-assembly' },
      { path: 'productPlan.assembly', code: 'incomplete-assembly' },
      { path: 'productPlan.parts[3]', code: 'incomplete-assembly' },
      { path: 'productPlan.joins[0].partIds', code: 'incomplete-assembly' },
      { path: 'productPlan.joins[1].partIds', code: 'incomplete-assembly' },
    ]);
    expect(initial).toEqual(before);
    expect(isProductPlan(initial)).toBe(false);

    // A proposed correction can fix connectivity while still omitting one join.
    const incomplete = graphPlan(4, [[0, 1], [2, 3], [1, 2]]);
    incomplete.assembly = [
      { step: 1, partIds: ['part-0', 'part-1'], instruction: 'Trial-fit the first declared join.' },
      { step: 2, partIds: ['part-2', 'part-3'], instruction: 'Trial-fit the second declared join.' },
    ];
    expect(productPlanIssues(incomplete)).toEqual([
      { path: 'productPlan.assembly', code: 'incomplete-assembly' },
      { path: 'productPlan.joins[2].partIds', code: 'incomplete-assembly' },
    ]);
    expect(isProductPlan(incomplete)).toBe(false);
    incomplete.assembly.push({ step: 3, partIds: ['part-1', 'part-2'], instruction: 'Trial-fit the declared connection between the two subassemblies.' });
    expect(productPlanIssues(incomplete)).toEqual([]);
  });

  it('identifies an omitted purchased part by index without exposing its ID', () => {
    const plan = makeProductPlan();
    plan.purchasedParts = [{ id: 'private-component', name: 'Private name', purpose: 'Proposed connection.', specificationStatus: 'unselected' }];
    plan.joins.push({ ...plan.joins[0], id: 'private-join', partIds: ['display-base', 'private-component'] });
    const issues = productPlanIssues(plan);
    expect(issues).toContainEqual({ path: 'productPlan.purchasedParts[0]', code: 'incomplete-assembly' });
    expect(issues).toContainEqual({ path: 'productPlan.joins[1].partIds', code: 'incomplete-assembly' });
    expect(JSON.stringify(issues)).not.toContain('private');
  });

  it('caps coverage feedback at the existing limit and emits only schema paths and codes', () => {
    const plan = graphPlan(16, Array.from({ length: 15 }, (_, index) => [0, index + 1]));
    plan.parts.forEach(part => { part.name = 'Private customer text'; });
    plan.assembly = plan.parts.map((part, index) => ({ step: index + 1, partIds: [part.id], instruction: 'Inspect.' }));
    const issues = productPlanIssues(plan);
    expect(issues).toHaveLength(PRODUCT_PLAN_MAX_ISSUES);
    expect(issues[0]).toEqual({ path: 'productPlan.assembly', code: 'incomplete-assembly' });
    for (const issue of issues) {
      expect(Object.keys(issue).sort()).toEqual(['code', 'path']);
      expect(issue.path).toMatch(/^productPlan\.(assembly|joins\[\d+\]\.partIds)$/);
      expect(issue.code).toBe('incomplete-assembly');
    }
    expect(JSON.stringify(issues)).not.toMatch(/Private|part-|join-/);
  });

  it.each([
    ['missing step', (plan: ProductPlan) => { delete (plan.assembly[0] as unknown as Record<string, unknown>).step; }],
    ['text step number', (plan: ProductPlan) => { Object.assign(plan.assembly[0], { step: '1' }); }],
    ['nonconsecutive step', (plan: ProductPlan) => { plan.assembly[0].step = 2; }],
    ['blank instruction', (plan: ProductPlan) => { plan.assembly[0].instruction = ''; }],
    ['unknown endpoint', (plan: ProductPlan) => { plan.assembly[0].partIds = ['missing-part']; }],
    ['duplicate endpoint', (plan: ProductPlan) => { plan.assembly[0].partIds = ['part-0', 'part-0']; }],
    ['reference object', (plan: ProductPlan) => { Object.assign(plan.assembly[0], { partIds: [{ id: 'part-0' }] }); }],
    ['null step', (plan: ProductPlan) => { Object.assign(plan.assembly, { 0: null }); }],
    ['extra property', (plan: ProductPlan) => { Object.assign(plan.assembly[0], { privateProperty: 'private value' }); }],
    ['sparse references', (plan: ProductPlan) => { plan.assembly[0].partIds = Array(1); }],
    ['non-array references', (plan: ProductPlan) => { Object.assign(plan.assembly[0], { partIds: { 0: 'part-0', length: 1 } }); }],
  ] as const)('does not compute coverage through unsafe assembly structure: %s', (_label, mutate) => {
    const plan = graphPlan(3, [[0, 1]]);
    mutate(plan);
    expect(isProductPlan(plan)).toBe(false);
    expect(productPlanIssues(plan).some(issue => issue.code === 'incomplete-assembly')).toBe(false);
    expect(JSON.stringify(productPlanIssues(plan))).not.toContain('private');
  });

  it('never invokes accessors while checking coverage', () => {
    for (const field of ['step', 'partIds', 'instruction']) {
      const plan = graphPlan(3, [[0, 1]]);
      const getter = vi.fn(() => { throw new Error('Do not read customer accessors'); });
      Object.defineProperty(plan.assembly[0], field, { enumerable: true, get: getter });
      expect(productPlanIssues(plan)).toContainEqual({ path: 'productPlan.assembly[0]', code: 'invalid-object' });
      expect(getter).not.toHaveBeenCalled();
    }
    const plan = graphPlan(3, [[0, 1]]);
    const getter = vi.fn(() => 'part-0');
    Object.defineProperty(plan.assembly[0].partIds, '0', { enumerable: true, get: getter });
    expect(productPlanIssues(plan)).toContainEqual({ path: 'productPlan.assembly[0].partIds', code: 'invalid-reference' });
    expect(getter).not.toHaveBeenCalled();
  });

  it('does not traverse invalid join references or shape for coverage', () => {
    for (const partIds of [['part-0', 'missing'], ['part-0', 'part-0'], [{ id: 'part-0' }, 'part-1']]) {
      const plan = graphPlan(3, [[0, 1]]);
      Object.assign(plan.joins[0], { partIds });
      expect(isProductPlan(plan)).toBe(false);
      expect(productPlanIssues(plan).some(issue => issue.code === 'incomplete-assembly')).toBe(false);
    }
    const plan = graphPlan(3, [[0, 1]]);
    const getter = vi.fn(() => ['part-0', 'part-1']);
    Object.defineProperty(plan.joins[0], 'partIds', { enumerable: true, get: getter });
    expect(productPlanIssues(plan)).toEqual([{ path: 'productPlan.joins[0]', code: 'invalid-object' }]);
    expect(getter).not.toHaveBeenCalled();
  });

  it('preserves exhaustive small-graph and connected-step acceptance against an independent oracle', () => {
    let graphCases = 0;
    let subsetCases = 0;
    for (let size = 2; size <= 5; size++) {
      const nodes = Array.from({ length: size }, (_, index) => index);
      const possible: [number, number][] = [];
      for (let a = 0; a < size; a++) for (let b = a + 1; b < size; b++) possible.push([a, b]);
      for (let mask = 0; mask < 2 ** possible.length; mask++) {
        const edges = possible.filter((_edge, index) => mask & 2 ** index);
        const plan = graphPlan(size, edges);
        const isConnected = connectedSubset(nodes, edges);
        expect(isProductPlan(plan)).toBe(isConnected);
        graphCases++;
        if (!isConnected) continue;
        for (let selected = 1; selected < 2 ** size; selected++) {
          const subset = nodes.filter(node => selected & 2 ** node);
          plan.assembly[1] = { step: 2, partIds: subset.map(node => `part-${node}`), instruction: 'Inspect this proposed connected subassembly.' };
          expect(isProductPlan(plan)).toBe(connectedSubset(subset, edges));
          subsetCases++;
        }
      }
    }
    expect(graphCases).toBe(1098);
    expect(subsetCases).toBe(23169);
  }, 30000);
});
