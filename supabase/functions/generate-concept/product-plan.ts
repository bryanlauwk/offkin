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

Return one JSON object with exactly the following schema. All properties are required except purchasedParts. No additional keys are allowed at any nesting level; never return comments, markdown or undefined.
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
- The complete compact JSON serialization must be at most 10000 characters. Do not truncate the brief or drop selected story elements to meet the bound; keep the plan concise.
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
function validation(value: unknown): value is ProductValidation {
  return record(value, ['status', 'check']) && value.status === 'unverified' && text(value.check, 240);
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

function validPlan(value: unknown, storyElementIds?: readonly string[]): value is ProductPlan {
  if (!record(value, planKeys, ['purchasedParts']) || value.version !== PRODUCT_PLAN_VERSION || value.status !== 'unverified-prototype-plan' ||
    !text(value.productIntent, 480) || !text(value.silhouette, 480) || !process(value.process) ||
    !record(value.scale, ['status', 'direction']) || !['unresolved', 'proposed'].includes(value.scale.status as string) || !text(value.scale.direction, 320)) return false;

  if (storyElementIds !== undefined && !ids(storyElementIds, 0, 16, undefined, true)) return false;
  const expectedStoryIds = storyElementIds === undefined ? undefined : new Set(storyElementIds);
  if (!array(value.parts, 2, 16) || !value.parts.every(part =>
    record(part, ['id', 'name', 'storyElementIds', 'form', 'process', 'printStrategy', 'finish']) &&
    id(part.id) && text(part.name, 80) && ids(part.storyElementIds, 0, 16, expectedStoryIds, true) &&
    text(part.form, 320) && process(part.process) && text(part.printStrategy, 320) && text(part.finish, 240))) return false;
  const parts = value.parts as ProductPlan['parts'];
  if (!id(value.heroPartId) || !parts.some(part => part.id === value.heroPartId)) return false;
  const mappedStoryIds = new Set(parts.flatMap(part => part.storyElementIds));
  if (mappedStoryIds.size > 16 || (expectedStoryIds && [...expectedStoryIds].some(item => !mappedStoryIds.has(item)))) return false;

  let purchasedParts: NonNullable<ProductPlan['purchasedParts']> = [];
  if (Object.prototype.hasOwnProperty.call(value, 'purchasedParts')) {
    if (!array(value.purchasedParts, 0, 8) || !value.purchasedParts.every(part =>
      record(part, ['id', 'name', 'purpose', 'specificationStatus']) && id(part.id) && text(part.name, 80) &&
      text(part.purpose, 240) && part.specificationStatus === 'unselected')) return false;
    purchasedParts = value.purchasedParts as NonNullable<ProductPlan['purchasedParts']>;
  }
  const allIds = [...parts, ...purchasedParts].map(part => part.id);
  const partIds = new Set(allIds);
  if (partIds.size !== allIds.length) return false;

  if (!array(value.joins, 1, 32) || !value.joins.every(join =>
    record(join, ['id', 'partIds', 'method', 'rationale', 'validation']) && id(join.id) && ids(join.partIds, 2, 2, partIds) &&
    text(join.method, 120) && text(join.rationale, 240) && validation(join.validation))) return false;
  const joins = value.joins as ProductPlan['joins'];
  if (new Set(joins.map(join => join.id)).size !== joins.length || !connected(allIds, joins)) return false;

  if (!array(value.assembly, 1, 32) || !value.assembly.every((step, index) =>
    record(step, ['step', 'partIds', 'instruction']) && step.step === index + 1 && ids(step.partIds, 1, 24, partIds) &&
    text(step.instruction, 320) && connected(step.partIds, joins))) return false;
  const assembly = value.assembly as ProductPlan['assembly'];
  // Separate subassemblies are allowed. The final sequence must cover every part and proposed join.
  const assembled = new Set(assembly.flatMap(step => step.partIds));
  if (assembled.size !== partIds.size || joins.some(join => !assembly.some(step => join.partIds.every(item => step.partIds.includes(item))))) return false;

  if (!array(value.actions, 0, 2) || !value.actions.every(action =>
    record(action, ['action', 'response', 'partIds', 'validation']) && text(action.action, 160) && text(action.response, 240) &&
    ids(action.partIds, 1, 24, partIds) && validation(action.validation))) return false;
  if (!array(value.risks, 2, 8) || !value.risks.every(risk => text(risk, 280)) ||
    !array(value.manufacturingUnknowns, 2, 8) || !value.manufacturingUnknowns.every(unknown => text(unknown, 240))) return false;

  const gates = value.actions.length ? [...requiredGates, 'interaction-test'] : requiredGates;
  if (!array(value.verificationGates, gates.length, gates.length) || !value.verificationGates.every(gate =>
    record(gate, ['id', 'status']) && typeof gate.id === 'string' && gates.includes(gate.id as ProductVerificationGate) && gate.status === 'unverified') ||
    new Set(value.verificationGates.map(gate => (gate as ProductPlan['verificationGates'][number]).id)).size !== gates.length) return false;
  return JSON.stringify(value).length <= PRODUCT_PLAN_MAX_CHARS;
}

/** Pass the authoritative selected story IDs before generating any image. Never repairs or truncates. */
export function isProductPlan(value: unknown, storyElementIds?: readonly string[]): value is ProductPlan {
  try { return validPlan(value, storyElementIds); } catch { return false; }
}

/** Fail closed with a safe provider error before spending on an image for an invalid plan. */
export function parseProductPlan(value: unknown, storyElementIds?: readonly string[]): ProductPlan {
  if (!isProductPlan(value, storyElementIds)) throw new CanvasFailure(502, failureMessage);
  return value;
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
