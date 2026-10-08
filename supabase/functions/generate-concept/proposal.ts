import { CONCEPT_PREVIEW_VERSION, isConceptPreview, type ConceptPreview } from './concept-preview.ts';
import { isConstructionIntent, type ConstructionIntent } from './construction-intent.ts';
import { isConstructionOrigin, type ConstructionOrigin } from './construction.ts';
import { isProductPlan, type ProductPlan } from './product-plan.ts';
import {
  CANVAS_CONTEXT_MAX_CHARS, CANVAS_MAX_ELEMENTS, CanvasFailure, isCanvasContext,
  isConceptId, isWorldElements, validateCanvasRequest,
  type CanvasContext, type CanvasReplacement, type CanvasStoredRow, type WorldElement,
} from './canvas.ts';

/** Separate contract: old v9 clients still negotiate their unchanged two-stage API. */
export const PROPOSAL_CONTRACT_VERSION = 'offkin-proposal-v10';
export const PROPOSAL_STAGE_VERSION = 'proposal-assets-v1';
/** Presentation-only refinement, separate from the immutable physical direction. */
export const DETAILS_REFINEMENT_VERSION = 'details-refinement-v1';
export const DETAILS_REFINEMENT_MAX_CHARS = 2000;
export type DetailsRefinement = { version: typeof DETAILS_REFINEMENT_VERSION; instruction: string };
export function isDetailsRefinement(value: unknown): value is DetailsRefinement {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 2 && v.version === DETAILS_REFINEMENT_VERSION &&
    typeof v.instruction === 'string' && Boolean(v.instruction.trim()) && v.instruction.length <= DETAILS_REFINEMENT_MAX_CHARS;
}
/** Explicit customer text, never inferred from model prose or a website address. */
export const CUSTOMER_IDENTITY_VERSION = 'customer-brand-v1';
export type CustomerIdentity = { version: typeof CUSTOMER_IDENTITY_VERSION; name: string };
export function isCustomerIdentity(value: unknown): value is CustomerIdentity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 2 && v.version === CUSTOMER_IDENTITY_VERSION && typeof v.name === 'string' &&
    v.name.trim().length > 0 && v.name.length <= 120 && Array.from(v.name).every(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127);
}
export const PROPOSAL_STAGES = ['world', 'physical', 'details', 'packaging'] as const;
export const PROPOSAL_CONTEXT_MAX_CHARS = CANVAS_CONTEXT_MAX_CHARS;
export type ProposalStage = typeof PROPOSAL_STAGES[number];
export type ProposalRequest = {
  contractVersion: typeof PROPOSAL_CONTRACT_VERSION;
  stage: ProposalStage;
  brand: string;
  customerIdentity?: CustomerIdentity;
  context: CanvasContext;
  constructionIntent?: ConstructionIntent;
  sourceWorldId?: string;
  sourcePhysicalId?: string;
  previousAssetId?: string;
  detailsRefinement?: DetailsRefinement;
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
  /** Required on new creative previews; absent on restorable legacy assets. */
  conceptPreview?: ConceptPreview;
  /** Legacy engineering metadata remains strictly validated, never a preview prerequisite. */
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
export type RevisionScope = 'world' | 'physical' | 'details' | 'packaging';
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
export type RevisionPlan = { scope: RevisionScope; context: CanvasContext; summary: string; detailsRefinement?: DetailsRefinement;
  selectedElementIds?: string[]; heroElementId?: string; replacements?: CanvasReplacement[] };
export type RevisionPlanResponse = { plan?: RevisionPlan; clarification?: string };
export const PROPOSAL_CAPABILITIES = {
  proposal: true,
  proposal_contract_version: PROPOSAL_CONTRACT_VERSION,
  proposal_stages: [...PROPOSAL_STAGES],
  proposal_context_max_chars: PROPOSAL_CONTEXT_MAX_CHARS,
  proposal_reference_images: true,
  proposal_concept_preview_version: CONCEPT_PREVIEW_VERSION,
  proposal_customer_identity_version: CUSTOMER_IDENTITY_VERSION,
  proposal_generation_phase: 'creative-preview',
  proposal_details_refinement_version: DETAILS_REFINEMENT_VERSION,
};
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const text = (v: unknown, max: number, empty = false): v is string => typeof v === 'string' && v.length <= max && (empty || Boolean(v.trim()));
const onlyKeys = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k));
const requestKeys = ['contractVersion', 'stage', 'brand', 'customerIdentity', 'context', 'constructionIntent', 'sourceWorldId', 'sourcePhysicalId', 'previousAssetId', 'detailsRefinement', 'selectedElementIds', 'heroElementId', 'replacements'];
const selectionKeys = ['selectedElementIds', 'heroElementId', 'replacements'];
export function validateProposalRequest(value: unknown): ProposalRequest {
  if (!record(value) || !onlyKeys(value, requestKeys) || value.contractVersion !== PROPOSAL_CONTRACT_VERSION ||
    !PROPOSAL_STAGES.includes(value.stage as ProposalStage) || !text(value.brand, 300) || value.brand.trim().length < 2 || !isCanvasContext(value.context)) {
    throw new CanvasFailure(400, 'Use a complete, supported proposal brief. Your wording has not been shortened.');
  }
  if (value.customerIdentity !== undefined && !isCustomerIdentity(value.customerIdentity)) throw new CanvasFailure(400, 'Supply an exact customer brand name of 1–120 characters.');
  if (value.constructionIntent !== undefined && (!isConstructionIntent(value.constructionIntent) || (value.stage !== 'world' && value.stage !== 'physical'))) throw new CanvasFailure(400, 'Choose a supported construction action for the new world or physical concept.');
  if (value.previousAssetId !== undefined && !isConceptId(value.previousAssetId)) throw new CanvasFailure(400, 'Choose a valid previous proposal image.');
  if (value.detailsRefinement !== undefined && (value.stage !== 'details' || !isDetailsRefinement(value.detailsRefinement))) {
    throw new CanvasFailure(400, 'Use a supported details-only refinement of 1–2,000 characters. Your wording has not been shortened.');
  }
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
const manifestKeys = [...requestKeys.filter(k => k !== 'brand'), 'stageVersion', 'story', 'design', 'worldElements', 'sourceImageIds', 'conceptPreview', 'productPlan', 'constructionOrigin'];
const prefix = 'OFFKIN_PROPOSAL_V10\n';
export function isProposalManifest(value: unknown): value is ProposalManifest {
  if (!record(value) || !onlyKeys(value, manifestKeys) || value.stageVersion !== PROPOSAL_STAGE_VERSION ||
    !text(value.story, 2000) || !text(value.design, 8000) || !isWorldElements(value.worldElements) ||
    !Array.isArray(value.sourceImageIds) || value.sourceImageIds.length > 3 || !value.sourceImageIds.every(isConceptId) ||
    new Set(value.sourceImageIds).size !== value.sourceImageIds.length || JSON.stringify(value).length > 44000) return false;
  if (value.conceptPreview !== undefined && (!isConceptPreview(value.conceptPreview, value.worldElements.map(e => e.id), value.stage === 'world' ? value.worldElements[0]?.id : value.heroElementId as string) ||
    value.productPlan !== undefined || value.constructionOrigin !== undefined || value.constructionIntent !== undefined)) return false;
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
/** Details refinements anchor the accepted physical first; legacy reference order remains restorable. */
export function proposalSourceImageIds(request: ProposalRequest): string[] {
  if (request.stage === 'details' && request.detailsRefinement) {
    return Array.from(new Set([request.sourcePhysicalId, request.previousAssetId].filter((id): id is string => Boolean(id))));
  }
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
  if (!manifest || row.prompt_version !== PROPOSAL_CONTRACT_VERSION || (manifest.customerIdentity && row.brand !== manifest.customerIdentity.name)) return null;
  const { previousAssetId: _privateAncestor, ...current } = manifest;
  return { ...current, sourceImageIds: proposalSourceImageIds({ ...current, brand: row.brand }),
    id: row.id, brand: row.brand, title: row.title, image, interaction: row.interaction || '', sourceUrl: row.source_url || '', sourceTitle: row.source_title || '' };
}
export function isProposalConcept(value: unknown): value is ProposalConcept {
  if (!record(value) || Object.prototype.hasOwnProperty.call(value, 'previousAssetId') || !isConceptId(value.id) || !text(value.brand, 120) || !text(value.title, 100) ||
    !text(value.interaction, 700, true) || typeof value.sourceUrl !== 'string' || typeof value.sourceTitle !== 'string' || typeof value.image !== 'string') return false;
  try { if (new URL(value.image).protocol !== 'https:') return false; } catch { return false; }
  if (value.customerIdentity !== undefined && (!isCustomerIdentity(value.customerIdentity) || value.brand !== value.customerIdentity.name)) return false;
  return isProposalManifest(Object.fromEntries(Object.entries(value).filter(([k]) => manifestKeys.includes(k))));
}
export function hasProposalCapabilities(value: unknown): boolean {
  if (!record(value) || value.ready !== true || !record(value.capabilities)) return false;
  const c = value.capabilities;
  return c.proposal === true && c.proposal_contract_version === PROPOSAL_CONTRACT_VERSION && c.proposal_reference_images === true && c.proposal_customer_identity_version === CUSTOMER_IDENTITY_VERSION && c.proposal_concept_preview_version === CONCEPT_PREVIEW_VERSION && c.proposal_generation_phase === 'creative-preview' &&
    c.proposal_details_refinement_version === DETAILS_REFINEMENT_VERSION &&
    c.proposal_context_max_chars === PROPOSAL_CONTEXT_MAX_CHARS && JSON.stringify(c.proposal_stages) === JSON.stringify(PROPOSAL_STAGES);
}
export function canonicalProposal(value: unknown): string {
  const ordered = (v: unknown): unknown => Array.isArray(v) ? v.map(ordered) : record(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordered(v[k])])) : v;
  return JSON.stringify(ordered(value));
}
export function sameProposalContext(a: CanvasContext, b: CanvasContext): boolean { return canonicalProposal(a) === canonicalProposal(b); }
/** These changes require a new illustrated world; product and packaging direction may differ. */
export function sameWorldDirection(a: CanvasContext, b: CanvasContext): boolean {
  const keys = ['business', 'hiddenDetail', 'angle', 'audience', 'exactWording', 'style', 'brandIdentifiers', 'avoid'] as const;
  return keys.every(k => (a[k] ?? '') === (b[k] ?? ''));
}
export function parseRevisionPlan(value: unknown, request: RevisionPlanRequest, selection?: {
  worldElements: WorldElement[]; selectedElementIds: string[]; heroElementId: string; replacements: CanvasReplacement[];
}): RevisionPlanResponse {
  if (record(value) && onlyKeys(value, ['clarification']) && text(value.clarification, 600)) return { clarification: value.clarification };
  if (!record(value) || !onlyKeys(value, ['scope', 'context', 'summary', 'exactWordingEvidence', ...selectionKeys]) ||
    !['world', 'physical', 'details', 'packaging'].includes(value.scope as string) || !isCanvasContext(value.context) || !text(value.summary, 600)) {
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
  if (scope === 'details') {
    // No context smuggling: the planner classifies scope but cannot rewrite the reviewed instruction.
    if (Object.keys(value.context).length || value.exactWordingEvidence !== undefined || selectionKeys.some(k => value[k] !== undefined)) {
      throw new CanvasFailure(502, 'A details refinement must preserve the accepted context and story elements. Your proposal is unchanged.');
    }
    const detailsRefinement: DetailsRefinement = { version: DETAILS_REFINEMENT_VERSION, instruction: request.instruction };
    if (!isDetailsRefinement(detailsRefinement)) throw new CanvasFailure(502, 'The details refinement is too long or empty. Your wording has not been shortened.');
    return { plan: { scope, context: { ...request.context }, summary: value.summary, detailsRefinement } };
  }
  // Never turn a narrow model plan into a silently broader, more expensive generation.
  if (scope !== 'world' && !sameWorldDirection(request.context, context)) {
    throw new CanvasFailure(502, 'The revision changed the brand world outside its chosen scope. Your proposal is unchanged.');
  }
  if (scope === 'packaging' && (['mode', 'interaction', 'scale', 'materials'] as const).some(k => (request.context[k] ?? '') !== (context[k] ?? ''))) {
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
