import { CONSTRUCTION_INTENT_VERSION, isConstructionIntent, type ConstructionIntent } from './construction-intent.ts';
import { isConstructionOrigin, type ConstructionOrigin } from './construction.ts';
import { PRODUCT_PLAN_VERSION, isProductPlan, type ProductPlan } from './product-plan.ts';
import {
  CANVAS_CONTEXT_MAX_CHARS, CANVAS_MAX_ELEMENTS, CanvasFailure, isCanvasContext,
  isConceptId, isWorldElements, validateCanvasRequest,
  type CanvasContext, type CanvasReplacement, type CanvasStoredRow, type WorldElement,
} from './canvas.ts';

/** Separate contract: old v9 clients still negotiate their unchanged two-stage API. */
export const PROPOSAL_CONTRACT_VERSION = 'offkin-proposal-v10';
export const PROPOSAL_STAGE_VERSION = 'proposal-assets-v1';
export const PROPOSAL_STAGES = ['world', 'physical', 'details', 'packaging'] as const;
export const PROPOSAL_CONTEXT_MAX_CHARS = CANVAS_CONTEXT_MAX_CHARS;
export type ProposalStage = typeof PROPOSAL_STAGES[number];
export type ProposalRequest = {
  contractVersion: typeof PROPOSAL_CONTRACT_VERSION;
  stage: ProposalStage;
  brand: string;
  context: CanvasContext;
  constructionIntent?: ConstructionIntent;
  sourceWorldId?: string;
  sourcePhysicalId?: string;
  previousAssetId?: string;
  selectedElementIds?: string[];
  heroElementId?: string;
  replacements?: CanvasReplacement[];
};
export type ProposalManifest = Omit<ProposalRequest, 'brand'> & {
  stageVersion: typeof PROPOSAL_STAGE_VERSION;
  story: string;
  design: string;
  worldElements: WorldElement[];
  sourceImageIds: string[];
  /** Optional only for restoring or continuing legacy visual-only assets. */
  productPlan?: ProductPlan;
  /** Optional on legacy assets; immutable server-authored origin, never manufacturing approval. */
  constructionOrigin?: ConstructionOrigin;
};
/** Public metadata exposes only this version's current sources, never revision ancestors. */
export type ProposalConcept = Omit<ProposalManifest, 'previousAssetId'> & {
  id: string; brand: string; title: string; image: string; interaction: string;
  sourceUrl: string; sourceTitle: string;
};
export type ProposalResponse = { concept?: ProposalConcept; needsContext?: boolean; message?: string; needsConstruction?: boolean; clarification?: string };
export type RevisionScope = 'world' | 'physical' | 'packaging';
export type RevisionPlanRequest = {
  contractVersion: typeof PROPOSAL_CONTRACT_VERSION;
  action: 'plan-revision';
  instruction: string;
  brand: string;
  context: CanvasContext;
  sourceWorldId: string;
  sourcePhysicalId: string;
  detailsId?: string;
  packagingId?: string;
};
export type RevisionPlan = { scope: RevisionScope; context: CanvasContext; summary: string;
  selectedElementIds?: string[]; heroElementId?: string; replacements?: CanvasReplacement[] };
export type RevisionPlanResponse = { plan?: RevisionPlan; clarification?: string };
export const PROPOSAL_CAPABILITIES = {
  proposal: true,
  proposal_contract_version: PROPOSAL_CONTRACT_VERSION,
  proposal_stages: [...PROPOSAL_STAGES],
  proposal_context_max_chars: PROPOSAL_CONTEXT_MAX_CHARS,
  proposal_reference_images: true,
  proposal_product_plan_version: PRODUCT_PLAN_VERSION,
  proposal_construction_intent_version: CONSTRUCTION_INTENT_VERSION,
};
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const text = (v: unknown, max: number, empty = false): v is string => typeof v === 'string' && v.length <= max && (empty || Boolean(v.trim()));
const onlyKeys = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k));
const requestKeys = ['contractVersion', 'stage', 'brand', 'context', 'constructionIntent', 'sourceWorldId', 'sourcePhysicalId', 'previousAssetId', 'selectedElementIds', 'heroElementId', 'replacements'];
const selectionKeys = ['selectedElementIds', 'heroElementId', 'replacements'];
export function validateProposalRequest(value: unknown): ProposalRequest {
  if (!record(value) || !onlyKeys(value, requestKeys) || value.contractVersion !== PROPOSAL_CONTRACT_VERSION ||
    !PROPOSAL_STAGES.includes(value.stage as ProposalStage) || !text(value.brand, 300) || value.brand.trim().length < 2 || !isCanvasContext(value.context)) {
    throw new CanvasFailure(400, 'Use a complete, supported proposal brief. Your wording has not been shortened.');
  }
  if (value.constructionIntent !== undefined && (!isConstructionIntent(value.constructionIntent) || (value.stage !== 'world' && value.stage !== 'physical'))) throw new CanvasFailure(400, 'Choose a supported construction action for the new world or physical concept.');
  if (value.previousAssetId !== undefined && !isConceptId(value.previousAssetId)) throw new CanvasFailure(400, 'Choose a valid previous proposal image.');
  if (value.stage === 'world') {
    if (['sourceWorldId', 'sourcePhysicalId', ...selectionKeys].some(k => value[k] !== undefined)) throw new CanvasFailure(400, 'A new world cannot include another stage’s selection.');
  } else if (value.stage === 'physical') {
    if (value.sourcePhysicalId !== undefined) throw new CanvasFailure(400, 'Physical generation requires its saved world.');
    validateCanvasRequest({ contractVersion: 'offkin-canvas-v9', stage: 'physical', brand: value.brand, context: value.context,
      sourceWorldId: value.sourceWorldId, selectedElementIds: value.selectedElementIds, heroElementId: value.heroElementId,
      ...(value.replacements !== undefined ? { replacements: value.replacements } : {}) });
  } else if (!isConceptId(value.sourceWorldId) || !isConceptId(value.sourcePhysicalId) || selectionKeys.some(k => value[k] !== undefined)) {
    throw new CanvasFailure(400, 'Proposal details and packaging require the matching saved world and physical concept.');
  }
  return value as ProposalRequest;
}
export function validateRevisionPlanRequest(value: unknown): RevisionPlanRequest {
  const keys = ['contractVersion', 'action', 'instruction', 'brand', 'context', 'sourceWorldId', 'sourcePhysicalId', 'detailsId', 'packagingId'];
  if (!record(value) || !onlyKeys(value, keys) || value.contractVersion !== PROPOSAL_CONTRACT_VERSION || value.action !== 'plan-revision' ||
    !text(value.instruction, 2000) || !text(value.brand, 300) || value.brand.trim().length < 2 || !isCanvasContext(value.context) ||
    !isConceptId(value.sourceWorldId) || !isConceptId(value.sourcePhysicalId) ||
    (value.detailsId !== undefined && !isConceptId(value.detailsId)) || (value.packagingId !== undefined && !isConceptId(value.packagingId))) {
    throw new CanvasFailure(400, 'Describe the change and include your saved proposal. Your instruction has not been shortened.');
  }
  return value as RevisionPlanRequest;
}
const manifestKeys = [...requestKeys.filter(k => k !== 'brand'), 'stageVersion', 'story', 'design', 'worldElements', 'sourceImageIds', 'productPlan', 'constructionOrigin'];
const prefix = 'OFFKIN_PROPOSAL_V10\n';
export function isProposalManifest(value: unknown): value is ProposalManifest {
  if (!record(value) || !onlyKeys(value, manifestKeys) || value.stageVersion !== PROPOSAL_STAGE_VERSION ||
    !text(value.story, 2000) || !text(value.design, 8000) || !isWorldElements(value.worldElements) ||
    !Array.isArray(value.sourceImageIds) || value.sourceImageIds.length > 3 || !value.sourceImageIds.every(isConceptId) ||
    new Set(value.sourceImageIds).size !== value.sourceImageIds.length || JSON.stringify(value).length > 44000) return false;
  if (value.productPlan !== undefined && !isProductPlan(value.productPlan, value.worldElements.map(e => e.id))) return false;
  if (value.constructionOrigin !== undefined && (!value.productPlan || !isConstructionOrigin(value.constructionOrigin))) return false;
  if (value.constructionIntent !== undefined && !isConstructionIntent(value.constructionIntent)) return false;
  const origin=value.constructionOrigin as ConstructionOrigin | undefined;
  if (origin?.version === 'construction-origin-v2' && (!value.constructionIntent || canonicalProposal(value.constructionIntent)!==canonicalProposal(origin.intent))) return false;
  try {
    const request = Object.fromEntries(Object.entries(value).filter(([k]) => requestKeys.includes(k)));
    // Details carry inherited selection in saved metadata, but never accept it from the client.
    if (value.stage === 'details' || value.stage === 'packaging') { for (const k of selectionKeys) delete request[k]; delete request.constructionIntent; }
    validateProposalRequest({ ...request, brand: 'saved-proposal' });
    if (value.stage !== 'world') {
      validateCanvasRequest({ contractVersion: 'offkin-canvas-v9', stage: 'physical', brand: 'saved-proposal', context: value.context,
        sourceWorldId: value.sourceWorldId, selectedElementIds: value.selectedElementIds, heroElementId: value.heroElementId, replacements: value.replacements });
      const ids = value.selectedElementIds as string[];
      if (value.worldElements.length !== ids.length || value.worldElements.some(e => !ids.includes(e.id))) return false;
    }
    const expected = proposalSourceImageIds(value as unknown as ProposalRequest);
    return JSON.stringify(expected) === JSON.stringify(value.sourceImageIds);
  } catch { return false; }
}
/** Ordered references: the approved same-role image first during revisions. */
export function proposalSourceImageIds(request: ProposalRequest): string[] {
  const ids = [request.previousAssetId,
    ...(request.stage === 'physical' ? [request.sourceWorldId] : request.stage === 'details' ? [request.sourcePhysicalId] : request.stage === 'packaging' ? [request.sourcePhysicalId, request.sourceWorldId] : [])];
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}
export function serializeProposalManifest(value: ProposalManifest): string {
  if (!isProposalManifest(value)) throw new CanvasFailure(502, 'The proposal image could not be saved safely.');
  return prefix + JSON.stringify(value);
}
export function parseProposalManifest(value: string): ProposalManifest | null {
  if (!value.startsWith(prefix) || value.length > 44000 + prefix.length) return null;
  try { const parsed: unknown = JSON.parse(value.slice(prefix.length)); return isProposalManifest(parsed) ? parsed : null; } catch { return null; }
}
export function restoreProposalRow(row: CanvasStoredRow, image: string): ProposalConcept | null {
  const manifest = parseProposalManifest(row.story);
  if (!manifest || row.prompt_version !== PROPOSAL_CONTRACT_VERSION) return null;
  const { previousAssetId: _privateAncestor, ...current } = manifest;
  return { ...current, sourceImageIds: proposalSourceImageIds({ ...current, brand: row.brand }),
    id: row.id, brand: row.brand, title: row.title, image, interaction: row.interaction || '', sourceUrl: row.source_url || '', sourceTitle: row.source_title || '' };
}
export function isProposalConcept(value: unknown): value is ProposalConcept {
  if (!record(value) || Object.prototype.hasOwnProperty.call(value, 'previousAssetId') || !isConceptId(value.id) || !text(value.brand, 120) || !text(value.title, 100) ||
    !text(value.interaction, 700, true) || typeof value.sourceUrl !== 'string' || typeof value.sourceTitle !== 'string' || typeof value.image !== 'string') return false;
  try { if (new URL(value.image).protocol !== 'https:') return false; } catch { return false; }
  return isProposalManifest(Object.fromEntries(Object.entries(value).filter(([k]) => manifestKeys.includes(k))));
}
export function hasProposalCapabilities(value: unknown): boolean {
  if (!record(value) || value.ready !== true || !record(value.capabilities)) return false;
  const c = value.capabilities;
  return c.proposal === true && c.proposal_contract_version === PROPOSAL_CONTRACT_VERSION && c.proposal_reference_images === true && c.proposal_product_plan_version === PRODUCT_PLAN_VERSION && c.proposal_construction_intent_version === CONSTRUCTION_INTENT_VERSION &&
    c.proposal_context_max_chars === PROPOSAL_CONTEXT_MAX_CHARS && JSON.stringify(c.proposal_stages) === JSON.stringify(PROPOSAL_STAGES);
}
export function canonicalProposal(value: unknown): string {
  const ordered = (v: unknown): unknown => Array.isArray(v) ? v.map(ordered) : record(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordered(v[k])])) : v;
  return JSON.stringify(ordered(value));
}
export function sameProposalContext(a: CanvasContext, b: CanvasContext): boolean { return canonicalProposal(a) === canonicalProposal(b); }
/** These changes require a new illustrated world; product and packaging direction may differ. */
export function sameWorldDirection(a: CanvasContext, b: CanvasContext): boolean {
  const keys = ['business', 'hiddenDetail', 'angle', 'audience', 'exactWording', 'style', 'brandIdentifiers', 'avoid'];
  return keys.every(k => (a[k] ?? '') === (b[k] ?? ''));
}
export function parseRevisionPlan(value: unknown, request: RevisionPlanRequest, selection?: {
  worldElements: WorldElement[]; selectedElementIds: string[]; heroElementId: string; replacements: CanvasReplacement[];
}): RevisionPlanResponse {
  if (record(value) && onlyKeys(value, ['clarification']) && text(value.clarification, 600)) return { clarification: value.clarification };
  if (!record(value) || !onlyKeys(value, ['scope', 'context', 'summary', 'exactWordingEvidence', ...selectionKeys]) ||
    !['world', 'physical', 'packaging'].includes(value.scope as string) || !isCanvasContext(value.context) || !text(value.summary, 600)) {
    throw new CanvasFailure(502, 'The revision could not be planned safely. Your existing proposal is unchanged.');
  }
  const context = { ...request.context, ...value.context };
  if (!isCanvasContext(context)) throw new CanvasFailure(502, 'The revised brief is too long. Your wording has not been shortened.');
  if ((context.exactWording ?? '') !== (request.context.exactWording ?? '')) {
    // No inferred slogans: a change needs verbatim evidence, and replacement words must be present in it.
    const evidence = value.exactWordingEvidence;
    const explicit = text(evidence, 2000) && request.instruction.includes(evidence) && /wording|text|lettering|inscription|slogan|文字|文案|字样|字樣|标语|標語/i.test(evidence) &&
      (context.exactWording ? evidence.includes(context.exactWording) : /remove|clear|delete|no text|without text|去掉|移除|删除|刪除|不要文字/i.test(evidence));
    if (!explicit) return { clarification: 'What exact wording should appear? Your existing wording has been kept unchanged.' };
  }
  const scope = value.scope as RevisionScope;
  // Never turn a narrow model plan into a silently broader, more expensive generation.
  if (scope !== 'world' && !sameWorldDirection(request.context, context)) {
    throw new CanvasFailure(502, 'The revision changed the brand world outside its chosen scope. Your proposal is unchanged.');
  }
  if (scope === 'packaging' && ['mode', 'interaction', 'scale', 'materials'].some(k => (request.context[k] ?? '') !== (context[k] ?? ''))) {
    throw new CanvasFailure(502, 'The packaging revision also changed the physical concept. Your proposal is unchanged.');
  }
  let nextSelection: Pick<RevisionPlan, 'selectedElementIds' | 'heroElementId' | 'replacements'> = {};
  if (selectionKeys.some(k => value[k] !== undefined)) {
    if (!selection || scope !== 'physical') throw new CanvasFailure(502, 'Only a physical revision can change the saved story elements.');
    const candidate = { selectedElementIds: value.selectedElementIds ?? selection.selectedElementIds,
      heroElementId: value.heroElementId ?? selection.heroElementId, replacements: value.replacements ?? selection.replacements };
    try {
      const checked = validateCanvasRequest({ contractVersion: 'offkin-canvas-v9', stage: 'physical', brand: request.brand,
        context, sourceWorldId: request.sourceWorldId, ...candidate });
      if (checked.selectedElementIds!.some(id => !selection.worldElements.some(element => element.id === id))) throw new Error();
      nextSelection = { selectedElementIds: checked.selectedElementIds, heroElementId: checked.heroElementId, replacements: checked.replacements || [] };
    } catch { throw new CanvasFailure(502, 'The revision selected an unknown or incomplete story element. Your proposal is unchanged.'); }
  }
  return { plan: { scope, context, summary: value.summary, ...nextSelection } };
}

export { CANVAS_MAX_ELEMENTS };
export type { CanvasContext, CanvasReplacement, WorldElement };
