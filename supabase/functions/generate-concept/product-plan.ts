import { CanvasFailure } from './canvas.ts';

/** A bounded design proposal, never evidence that a collectible can be manufactured. */
export const PRODUCT_PLAN_VERSION = 'product-plan-v1';
export const PRODUCT_PLAN_MAX_CHARS = 10000;
export type ProductProcess = 'fdm' | 'resin' | 'hybrid' | 'undecided';
export type ProductValidation = { status: 'unverified'; check: string };
export type ProductVerificationGate =
  | 'cad-review' | 'slicer-review' | 'fit-test' | 'physical-prototype'
  | 'finish-assembly-review' | 'interaction-test';
export type ProductPlan = {
  version: typeof PRODUCT_PLAN_VERSION;
  status: 'unverified-prototype-plan';
  productIntent: string;
  silhouette: string;
  /** The distinctive printed hero; a purchased component cannot be the hero. */
  heroPartId: string;
  scale: { status: 'unresolved' | 'proposed'; direction: string };
  /** Proposed process only; printer, material and suitability remain unverified. */
  process: ProductProcess;
  parts: {
    id: string; name: string; storyElementIds: string[]; form: string;
    process: ProductProcess; printStrategy: string; finish: string;
  }[];
  purchasedParts?: {
    id: string; name: string; purpose: string; specificationStatus: 'unselected';
  }[];
  joins: {
    id: string; partIds: [string, string]; method: string;
    rationale: string; validation: ProductValidation;
  }[];
  assembly: { step: number; partIds: string[]; instruction: string }[];
  actions: {
    action: string; response: string; partIds: string[]; validation: ProductValidation;
  }[];
  risks: string[];
  manufacturingUnknowns: string[];
  verificationGates: { id: ProductVerificationGate; status: 'unverified' }[];
};

/** Shared model instructions for the exact validated contract, before any image is requested. */
export const PRODUCT_PLAN_PROMPT = `
Resolve a manufacturability-led physical corporate gift or collectible as a ProductPlan before creating images.
The plan is an unverified proposal, never printable CAD, a tested sample, supplier certification, a production approval or a price quote.
Design a distinctive printed hero and a finite connected assembly. Preserve the brand story through designed physical parts, not an unbuildable scene or decorative illustration.
Keep scale story-led: there is no universal palm-size requirement. Do not add electronics, purchased components or motion unless the brief calls for them and their proposed role is coherent.
Use conservative proposed print strategies, joins, assembly and finishing; explicitly record unresolved material, equipment, geometry, fit, cost and sample questions. Do not invent numerical fabrication standards or certification claims.
Any proposed dimension must state its units and remain provisional. If proposing a fit or clearance, explain which mating features it concerns, whether the number is diametral, radial or per side, and whether it means a gap or interference; retain the fit-test gate. Prefer explicit unknowns over unsupported numbers.

Nested productPlan schema (the productPlan property of the requested response, NOT the whole stage response):
Use exactly the following object for productPlan. All properties are required except purchasedParts. No additional keys are allowed inside productPlan at any nesting level; never return comments, markdown or undefined. Keep the outer response schema specified by the stage or correction request.
{
  "version": "product-plan-v1",
  "status": "unverified-prototype-plan",
  "productIntent": string,
  "silhouette": string,
  "heroPartId": partId,
  "scale": { "status": "unresolved" | "proposed", "direction": string },
  "process": process,
  "parts": [{ "id": partId, "name": string, "storyElementIds": [storyId], "form": string, "process": process, "printStrategy": string, "finish": string }],
  "purchasedParts": [{ "id": partId, "name": string, "purpose": string, "specificationStatus": "unselected" }],
  "joins": [{ "id": partId, "partIds": [partId, partId], "method": string, "rationale": string, "validation": { "status": "unverified", "check": string } }],
  "assembly": [{ "step": integer, "partIds": [partId], "instruction": string }],
  "actions": [{ "action": string, "response": string, "partIds": [partId], "validation": { "status": "unverified", "check": string } }],
  "risks": [string],
  "manufacturingUnknowns": [string],
  "verificationGates": [{ "id": gateId, "status": "unverified" }]
}
Bounds and references:
- process is exactly "fdm", "resin", "hybrid" or "undecided"; it is a proposed process only.
- partId has 1–48 characters and matches ^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$. Printed and purchased part IDs are unique across both lists. Join IDs are unique within joins.
- storyId preserves the supplied authoritative story element IDs exactly; its format is ^[a-z][a-z0-9-]{0,47}$. Map every supplied selected story ID onto at least one printed part, with no invented or unselected story IDs. Each part has 0–16 unique story IDs; at most 16 distinct story IDs occur in the complete plan. Supporting parts may have an empty storyElementIds list.
- heroPartId must equal the id of one printed part in parts, never a purchased component.
- parts contains 2–16 printed parts. purchasedParts may be omitted or contain 0–8 components; every specificationStatus remains "unselected".
- joins contains 1–32 joins; each references exactly 2 distinct existing printed or purchased part IDs. Every part belongs to one connected join graph, including all purchased parts.
- assembly contains 1–32 steps numbered consecutively from 1. Each references 1–24 unique existing part IDs that form a connected subset of the join graph. The sequence covers every part, and every join has both its parts together in at least one assembly step. Separate subassemblies are permitted.
- actions contains 0–2 proposed actions. Each references 1–24 unique existing part IDs. Use [] when no physical interaction is justified.
- risks and manufacturingUnknowns each contain 2–8 nonempty strings.
- Every validation.status and every verificationGates status is exactly "unverified". Never claim supplier-certified, physically-tested, passed, approved or completed validation.
- verificationGates contains exactly one each of "cad-review", "slicer-review", "fit-test", "physical-prototype", "finish-assembly-review". If actions is nonempty, also include exactly one "interaction-test"; otherwise omit that gate. No other gate IDs are allowed.
- All strings are nonempty after trimming, except that arrays expressly allowing zero entries may be empty. Maximum string lengths: productIntent 480; silhouette 480; scale.direction 320; part.name 80; part.form 320; part.printStrategy 320; part.finish 240; purchasedPart.name 80; purchasedPart.purpose 240; join.method 120; join.rationale 240; validation.check 240; assembly.instruction 320; action.action 160; action.response 240; each risk 280; each manufacturingUnknown 240.
- The complete compact productPlan JSON serialization must be at most 10000 characters. Aim for 6000–8500 characters total, using brief concrete phrases, not prose paragraphs or repetitive disclaimers. These per-field maxima are ceilings, not targets. Group related story meanings into coherent parts without dropping any selected story IDs. Do not truncate the brief or drop selected story elements to meet the bound; keep the plan concise.
`.trim();

const processes: readonly string[] = ['fdm', 'resin', 'hybrid', 'undecided'];
const requiredGates: readonly ProductVerificationGate[] = [
  'cad-review', 'slicer-review', 'fit-test', 'physical-prototype', 'finish-assembly-review',
];
const planKeys = [
  'version', 'status', 'productIntent', 'silhouette', 'heroPartId', 'scale', 'process', 'parts',
  'joins', 'assembly', 'actions', 'risks', 'manufacturingUnknowns', 'verificationGates',
];
const failureMessage = 'The printable collectible plan is incomplete or inconsistent. Please retry; your brief and existing images are unchanged.';

export type ProductPlanIssueCode =
  | 'invalid-object' | 'invalid-value' | 'invalid-text' | 'invalid-id' | 'invalid-array'
  | 'invalid-reference' | 'duplicate-id' | 'missing-story-mapping' | 'disconnected-parts'
  | 'disconnected-assembly' | 'incomplete-assembly' | 'invalid-gates' | 'plan-too-large'
  | 'hero-story-mismatch' | 'display-only-action';
/** Only static schema paths and numeric indexes, never model values or property names. */
export type ProductPlanIssue = { path: string; code: ProductPlanIssueCode };
export type ProductPlanRequirements = { heroElementId?: string; displayOnly?: boolean };
export const PRODUCT_PLAN_MAX_ISSUES = 12;
/** Trusted callers may inspect safe diagnostics; HTTP handlers expose only the message. */
export class ProductPlanFailure extends CanvasFailure {
  readonly issues: readonly ProductPlanIssue[];
  constructor(message: string, issues: readonly ProductPlanIssue[]) {
    super(502, message);
    this.name = 'ProductPlanFailure';
    this.issues = issues.slice(0, PRODUCT_PLAN_MAX_ISSUES).map(issue => ({ ...issue }));
  }
}

/** Exact JSON objects only: no hidden fields, inherited data, accessors or custom serializers. */
function record(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  return required.every(key => Object.prototype.hasOwnProperty.call(value, key)) && keys.every(key => {
    if (typeof key !== 'string' || (!required.includes(key) && !optional.includes(key))) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(descriptor?.enumerable && Object.prototype.hasOwnProperty.call(descriptor, 'value'));
  });
}
function array(value: unknown, min: number, max: number): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
    value.length < min || value.length > max || Reflect.ownKeys(value).length !== value.length + 1) return false;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return false;
  }
  return true;
}
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max && value.trim().length > 0;
const id = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 48 && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
// Story IDs retain the existing world's ID contract rather than renaming saved elements.
const storyId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(value);
const process = (value: unknown): value is ProductProcess =>
  typeof value === 'string' && processes.includes(value);
function ids(value: unknown, min: number, max: number, allowed?: ReadonlySet<string>, story = false): value is string[] {
  return array(value, min, max) && value.every(story ? storyId : id) &&
    new Set(value).size === value.length && (!allowed || value.every(item => allowed.has(item as string)));
}
function connected(partIds: readonly string[], joins: ProductPlan['joins']): boolean {
  const allowed = new Set(partIds);
  const visited = new Set([partIds[0]]);
  const pending = [partIds[0]];
  while (pending.length) {
    const current = pending.pop();
    for (const { partIds: [a, b] } of joins) {
      const next = a === current ? b : b === current ? a : undefined;
      if (next && allowed.has(next) && !visited.has(next)) { visited.add(next); pending.push(next); }
    }
  }
  return visited.size === allowed.size;
}

/** A single strict validator powers acceptance and bounded, value-free diagnostics. */
export function productPlanIssues(value: unknown, storyElementIds?: readonly string[], requirements: ProductPlanRequirements = {}): ProductPlanIssue[] {
  const issues: ProductPlanIssue[] = [];
  const check = (valid: boolean, path: string, code: ProductPlanIssueCode): boolean => {
    if (!valid && issues.length < PRODUCT_PLAN_MAX_ISSUES) issues.push({ path, code });
    return valid;
  };
  const fields = (item: Record<string, unknown>, path: string, bounds: Record<string, number>) => {
    for (const [key, max] of Object.entries(bounds)) check(text(item[key], max), `${path}.${key}`, 'invalid-text');
  };
  const checkValidation = (item: unknown, path: string) => {
    if (!check(record(item, ['status', 'check']), path, 'invalid-object')) return;
    const validation = item as Record<string, unknown>;
    check(validation.status === 'unverified', `${path}.status`, 'invalid-value');
    check(text(validation.check, 240), `${path}.check`, 'invalid-text');
  };
  try {
    if (!check(record(value, planKeys, ['purchasedParts']), 'productPlan', 'invalid-object')) return issues;
    const plan = value as Record<string, unknown>;
    check(plan.version === PRODUCT_PLAN_VERSION, 'productPlan.version', 'invalid-value');
    check(plan.status === 'unverified-prototype-plan', 'productPlan.status', 'invalid-value');
    fields(plan, 'productPlan', { productIntent: 480, silhouette: 480 });
    check(process(plan.process), 'productPlan.process', 'invalid-value');
    if (check(record(plan.scale, ['status', 'direction']), 'productPlan.scale', 'invalid-object')) {
      const scale = plan.scale as Record<string, unknown>;
      check(['unresolved', 'proposed'].includes(scale.status as string), 'productPlan.scale.status', 'invalid-value');
      check(text(scale.direction, 320), 'productPlan.scale.direction', 'invalid-text');
    }
    if (!check(storyElementIds === undefined || ids(storyElementIds, 0, 16, undefined, true), 'selectedElementIds', 'invalid-reference')) return issues;
    const expectedStoryIds = storyElementIds === undefined ? undefined : new Set(storyElementIds);
    if (!check(array(plan.parts, 2, 16), 'productPlan.parts', 'invalid-array')) return issues;
    for (const [index, item] of (plan.parts as unknown[]).entries()) {
      const path = `productPlan.parts[${index}]`;
      if (!check(record(item, ['id', 'name', 'storyElementIds', 'form', 'process', 'printStrategy', 'finish']), path, 'invalid-object')) continue;
      const part = item as Record<string, unknown>;
      check(id(part.id), `${path}.id`, 'invalid-id');
      fields(part, path, { name: 80, form: 320, printStrategy: 320, finish: 240 });
      check(ids(part.storyElementIds, 0, 16, expectedStoryIds, true), `${path}.storyElementIds`, 'invalid-reference');
      check(process(part.process), `${path}.process`, 'invalid-value');
    }
    // Dependent graph checks only inspect fully validated structure. Never invoke getters or serializers.
    if (issues.length) return issues;
    const parts = plan.parts as ProductPlan['parts'];
    check(id(plan.heroPartId) && parts.some(part => part.id === plan.heroPartId), 'productPlan.heroPartId', 'invalid-reference');
    const mappedStoryIds = new Set(parts.flatMap(part => part.storyElementIds));
    check(mappedStoryIds.size <= 16 && (!expectedStoryIds || [...expectedStoryIds].every(item => mappedStoryIds.has(item))), 'productPlan.parts', 'missing-story-mapping');
    if (requirements.heroElementId !== undefined) {
      check(Boolean(parts.find(part => part.id === plan.heroPartId)?.storyElementIds.includes(requirements.heroElementId)), 'productPlan.heroPartId', 'hero-story-mismatch');
    }
    let purchasedParts: NonNullable<ProductPlan['purchasedParts']> = [];
    if (Object.prototype.hasOwnProperty.call(plan, 'purchasedParts')) {
      if (!check(array(plan.purchasedParts, 0, 8), 'productPlan.purchasedParts', 'invalid-array')) return issues;
      for (const [index, item] of (plan.purchasedParts as unknown[]).entries()) {
        const path = `productPlan.purchasedParts[${index}]`;
        if (!check(record(item, ['id', 'name', 'purpose', 'specificationStatus']), path, 'invalid-object')) continue;
        const part = item as Record<string, unknown>;
        check(id(part.id), `${path}.id`, 'invalid-id');
        fields(part, path, { name: 80, purpose: 240 });
        check(part.specificationStatus === 'unselected', `${path}.specificationStatus`, 'invalid-value');
      }
      purchasedParts = plan.purchasedParts as NonNullable<ProductPlan['purchasedParts']>;
    }
    if (issues.length) return issues;
    const allIds = [...parts, ...purchasedParts].map(part => part.id);
    const partIds = new Set(allIds);
    check(partIds.size === allIds.length, 'productPlan.parts', 'duplicate-id');
    if (!check(array(plan.joins, 1, 32), 'productPlan.joins', 'invalid-array')) return issues;
    for (const [index, item] of (plan.joins as unknown[]).entries()) {
      const path = `productPlan.joins[${index}]`;
      if (!check(record(item, ['id', 'partIds', 'method', 'rationale', 'validation']), path, 'invalid-object')) continue;
      const join = item as Record<string, unknown>;
      check(id(join.id), `${path}.id`, 'invalid-id');
      check(ids(join.partIds, 2, 2, partIds), `${path}.partIds`, 'invalid-reference');
      fields(join, path, { method: 120, rationale: 240 });
      checkValidation(join.validation, `${path}.validation`);
    }
    if (issues.length) return issues;
    const joins = plan.joins as ProductPlan['joins'];
    check(new Set(joins.map(join => join.id)).size === joins.length, 'productPlan.joins', 'duplicate-id');
    check(connected(allIds, joins), 'productPlan.joins', 'disconnected-parts');
    if (!check(array(plan.assembly, 1, 32), 'productPlan.assembly', 'invalid-array')) return issues;
    for (const [index, item] of (plan.assembly as unknown[]).entries()) {
      const path = `productPlan.assembly[${index}]`;
      if (!check(record(item, ['step', 'partIds', 'instruction']), path, 'invalid-object')) continue;
      const step = item as Record<string, unknown>;
      check(step.step === index + 1, `${path}.step`, 'invalid-value');
      if (check(ids(step.partIds, 1, 24, partIds), `${path}.partIds`, 'invalid-reference')) {
        check(connected(step.partIds as string[], joins), `${path}.partIds`, 'disconnected-assembly');
      }
      check(text(step.instruction, 320), `${path}.instruction`, 'invalid-text');
    }
    if (issues.length) return issues;
    const assembly = plan.assembly as ProductPlan['assembly'];
    const assembled = new Set(assembly.flatMap(step => step.partIds));
    check(assembled.size === partIds.size && joins.every(join => assembly.some(step => join.partIds.every(item => step.partIds.includes(item)))), 'productPlan.assembly', 'incomplete-assembly');
    if (!check(array(plan.actions, 0, 2), 'productPlan.actions', 'invalid-array')) return issues;
    const actions = plan.actions as unknown[];
    check(!requirements.displayOnly || actions.length === 0, 'productPlan.actions', 'display-only-action');
    for (const [index, item] of actions.entries()) {
      const path = `productPlan.actions[${index}]`;
      if (!check(record(item, ['action', 'response', 'partIds', 'validation']), path, 'invalid-object')) continue;
      const action = item as Record<string, unknown>;
      fields(action, path, { action: 160, response: 240 });
      check(ids(action.partIds, 1, 24, partIds), `${path}.partIds`, 'invalid-reference');
      checkValidation(action.validation, `${path}.validation`);
    }
    for (const [key, max] of [['risks', 280], ['manufacturingUnknowns', 240]] as const) {
      if (check(array(plan[key], 2, 8), `productPlan.${key}`, 'invalid-array')) {
        (plan[key] as unknown[]).forEach((item, index) => check(text(item, max), `productPlan.${key}[${index}]`, 'invalid-text'));
      }
    }
    const gates = actions.length ? [...requiredGates, 'interaction-test'] : requiredGates;
    if (check(array(plan.verificationGates, gates.length, gates.length), 'productPlan.verificationGates', 'invalid-gates')) {
      const gateValues = plan.verificationGates as unknown[];
      let validGates = true;
      for (const [index, item] of gateValues.entries()) {
        const path = `productPlan.verificationGates[${index}]`;
        if (!check(record(item, ['id', 'status']), path, 'invalid-object')) { validGates = false; continue; }
        const gate = item as Record<string, unknown>;
        if (!check(typeof gate.id === 'string' && gates.includes(gate.id as ProductVerificationGate), `${path}.id`, 'invalid-gates')) validGates = false;
        check(gate.status === 'unverified', `${path}.status`, 'invalid-value');
      }
      if (validGates) check(new Set((gateValues as ProductPlan['verificationGates']).map(gate => gate.id)).size === gates.length, 'productPlan.verificationGates', 'invalid-gates');
    }
    if (!issues.length) check(JSON.stringify(value).length <= PRODUCT_PLAN_MAX_CHARS, 'productPlan', 'plan-too-large');
  } catch {
    check(false, 'productPlan', 'invalid-object');
  }
  return issues;
}

/** Pass authoritative selected story IDs before images. Never repairs, strips or truncates. */
export function isProductPlan(value: unknown, storyElementIds?: readonly string[], requirements: ProductPlanRequirements = {}): value is ProductPlan {
  return productPlanIssues(value, storyElementIds, requirements).length === 0;
}

/** Fail closed with a safe provider error before spending on an image for an invalid plan. */
export function parseProductPlan(value: unknown, storyElementIds?: readonly string[], requirements: ProductPlanRequirements = {}): ProductPlan {
  const issues = productPlanIssues(value, storyElementIds, requirements);
  if (issues.length) throw new ProductPlanFailure(failureMessage, issues);
  return value as ProductPlan;
}

/** Safe user-facing reason; never include a model value, selected ID or private reference. */
export function productPlanRepairFailure(issues: readonly ProductPlanIssue[]): ProductPlanFailure {
  const codes = new Set(issues.map(issue => issue.code));
  const reason = codes.has('display-only-action') ? 'The construction plan still adds movement to your display-only idea.'
    : codes.has('missing-story-mapping') || codes.has('hero-story-mismatch') ? 'The construction plan could not keep all your selected story elements and hero together.'
    : codes.has('disconnected-parts') || codes.has('disconnected-assembly') || codes.has('incomplete-assembly') ? 'The proposed parts could not be arranged into a complete connected assembly.'
    : codes.has('plan-too-large') || codes.has('invalid-text') ? 'The construction plan could not fit the required detail into a concise proposal.'
    : "We couldn't finish a complete construction plan for this idea.";
  return new ProductPlanFailure(`${reason} Please try Generate again; your brief and existing images are unchanged. No image was generated.`, issues);
}

/** Complete, lossless planning brief. Text fields are proposals, never manufacturing evidence. */
export function productPlanText(plan: ProductPlan): string {
  parseProductPlan(plan);
  const names = new Map([...plan.parts, ...(plan.purchasedParts || [])].map(part => [part.id, `${part.name} [${part.id}]`]));
  const references = (partIds: readonly string[]) => partIds.map(partId => names.get(partId)).join(' + ');
  return [
    'Printable collectible prototype plan — unverified',
    'This is a design proposal, not a CAD model, manufacturing approval, tested prototype or cost quote.',
    `Product intent: ${plan.productIntent}`,
    `Silhouette: ${plan.silhouette}`,
    `Printed hero: ${names.get(plan.heroPartId)}`,
    `Scale (${plan.scale.status}): ${plan.scale.direction}`,
    `Proposed process: ${plan.process.toUpperCase()}`,
    'Printed parts:',
    ...plan.parts.map(part => `${part.name} [${part.id}]\nStory elements: ${part.storyElementIds.length ? part.storyElementIds.join(', ') : 'supporting part'}\nForm proposal: ${part.form}\nProposed process: ${part.process.toUpperCase()}\nPrint strategy proposal: ${part.printStrategy}\nFinish proposal: ${part.finish}`),
    ...(plan.purchasedParts?.length ? ['Purchased components to select (specifications unselected):', ...plan.purchasedParts.map(part => `${part.name} [${part.id}]: ${part.purpose}`)] : []),
    'Proposed joins (unverified):',
    ...plan.joins.map(join => `${join.id}: ${references(join.partIds)}\nProposed method: ${join.method}\nRationale: ${join.rationale}\nPending validation: ${join.validation.check}`),
    'Proposed assembly order:',
    ...plan.assembly.map(step => `${step.step}. ${references(step.partIds)}: ${step.instruction}`),
    ...(plan.actions.length ? ['Proposed actions (unverified):', ...plan.actions.map(action => `${action.action} → ${action.response}\nParts: ${references(action.partIds)}\nPending validation: ${action.validation.check}`)] : ['Proposed actions: none']),
    'Risks to investigate:', ...plan.risks.map(risk => `- ${risk}`),
    'Manufacturing unknowns:', ...plan.manufacturingUnknowns.map(unknown => `- ${unknown}`),
    'Required verification (all unverified; no checks claimed complete):',
    ...plan.verificationGates.map(gate => `- ${gate.id}: ${gate.status}`),
  ].join('\n\n');
}

/** Bounded public summary; complete responses/checks remain in productPlanText. */
export function productPlanInteraction(plan: ProductPlan): string {
  return plan.actions.length
    ? `Proposed actions: ${plan.actions.map(action => action.action).join('; ')}. Intended responses and required prototype checks are in the construction plan.`
    : 'Static display. No mechanical or electronic response is proposed.';
}
