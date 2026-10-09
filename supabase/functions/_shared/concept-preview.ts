import { CANVAS_MAX_ELEMENTS, CanvasFailure, parseCanvasDesign, type CanvasDesign } from './canvas.ts';

/** Creative scope, deliberately independent of the legacy manufacturing ProductPlan. */
export const CONCEPT_PREVIEW_VERSION = 'concept-preview-v1';
export type ConceptPreview = {
  version: typeof CONCEPT_PREVIEW_VERSION;
  status: 'unverified-visual-concept';
  heroElementId: string;
  storyElementIds: string[];
  buildProposal: 'not-requested';
};
const elementId = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v);
export function isConceptPreview(value: unknown, storyElementIds: string[], heroElementId?: string): value is ConceptPreview {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 5 && v.version === CONCEPT_PREVIEW_VERSION && v.status === 'unverified-visual-concept' &&
    v.buildProposal === 'not-requested' && elementId(v.heroElementId) && Array.isArray(v.storyElementIds) &&
    v.storyElementIds.length > 0 && v.storyElementIds.length <= CANVAS_MAX_ELEMENTS && v.storyElementIds.every(elementId) &&
    new Set(v.storyElementIds).size === v.storyElementIds.length && v.storyElementIds.includes(v.heroElementId) &&
    JSON.stringify(v.storyElementIds) === JSON.stringify(storyElementIds) && (!heroElementId || v.heroElementId === heroElementId);
}
/** Strict output keys stop a model-authored plan or forged verification becoming image authority. */
export function parseConceptPreviewDesign(value: unknown): CanvasDesign {
  const keys = ['needsContext', 'brand', 'title', 'story', 'interaction', 'design', 'worldElements'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) {
    throw new CanvasFailure(502, 'The generator returned an unsupported creative preview. Your accepted concept is unchanged.');
  }
  return parseCanvasDesign(value);
}
export function makeConceptPreview(storyElementIds: string[], heroElementId: string): ConceptPreview {
  const value: ConceptPreview = { version: CONCEPT_PREVIEW_VERSION, status: 'unverified-visual-concept', heroElementId,
    storyElementIds: [...storyElementIds], buildProposal: 'not-requested' };
  if (!isConceptPreview(value, storyElementIds, heroElementId)) throw new CanvasFailure(502, 'The preview did not preserve its story elements. No image was generated.');
  return value;
}
