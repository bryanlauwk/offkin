/** Versioned two-stage contract. Pure helpers are shared by the browser and edge function. */
export const CANVAS_CONTRACT_VERSION = 'offkin-canvas-v9';
export const CANVAS_CONTEXT_MAX_CHARS = 6000;
export const CANVAS_MANIFEST_MAX_CHARS = 40000;
export const CANVAS_MAX_ELEMENTS = 16;
export const CANVAS_STAGES = ['world', 'physical'] as const;
export type CanvasStage = typeof CANVAS_STAGES[number];
export type CanvasContext = Partial<Record<
  'business' | 'hiddenDetail' | 'angle' | 'audience' | 'exactWording' | 'style' |
  'brandIdentifiers' | 'avoid' | 'revisionNotes' | 'interaction' | 'scale' | 'materials', string
>> & { mode?: 'mechanical' | 'electronic' };
export type WorldElement = { id: string; label: string; description: string; kind: 'fact' | 'proposal' };
export type CanvasReplacement = { id: string; label: string; description: string };
export type CanvasRequest = {
  contractVersion: typeof CANVAS_CONTRACT_VERSION;
  stage: CanvasStage;
  brand: string;
  context: CanvasContext;
  sourceWorldId?: string;
  selectedElementIds?: string[];
  heroElementId?: string;
  replacements?: CanvasReplacement[];
};
export type CanvasManifest = {
  contractVersion: typeof CANVAS_CONTRACT_VERSION;
  stage: CanvasStage;
  story: string;
  design: string;
  context: CanvasContext;
  worldElements: WorldElement[];
  sourceWorldId?: string;
  selectedElementIds?: string[];
  heroElementId?: string;
  replacements?: CanvasReplacement[];
};
export type CanvasConcept = CanvasManifest & {
  id: string; brand: string; title: string; image: string; interaction: string;
  sourceUrl: string; sourceTitle: string;
};
export type CanvasResponse = { concept?: CanvasConcept; needsContext?: boolean; message?: string };
export type CanvasStoredRow = {
  id: string; brand: string; title: string; story: string; image_path: string;
  interaction?: string; source_url?: string; source_title?: string; prompt_version?: string;
};
export type CanvasDesign = {
  needsContext: false; brand: string; title: string; story: string;
  interaction: string; design: string; worldElements: WorldElement[];
};
export const CANVAS_CAPABILITIES = {
  canvas: true,
  canvas_contract_version: CANVAS_CONTRACT_VERSION,
  canvas_stages: [...CANVAS_STAGES],
  canvas_context_max_chars: CANVAS_CONTEXT_MAX_CHARS,
};
export class CanvasFailure extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
export const isConceptId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const elementId = (id: unknown): id is string => typeof id === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(id);
const boundedText = (value: unknown, max: number, allowEmpty = false): value is string => typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);
const contextKeys = new Set(['business', 'hiddenDetail', 'angle', 'audience', 'exactWording', 'style', 'brandIdentifiers', 'avoid', 'revisionNotes', 'interaction', 'scale', 'materials', 'mode']);
const onlyKeys = (value: Record<string, unknown>, allowed: Set<string>) => Object.keys(value).every(key => allowed.has(key));
export function isCanvasContext(value: unknown): value is CanvasContext {
  return record(value) && onlyKeys(value, contextKeys) && Object.values(value).every(field => typeof field === 'string') &&
    (value.mode === undefined || value.mode === 'mechanical' || value.mode === 'electronic') && JSON.stringify(value).length <= CANVAS_CONTEXT_MAX_CHARS;
}
const requestKeys = new Set(['contractVersion', 'stage', 'brand', 'context', 'sourceWorldId', 'selectedElementIds', 'heroElementId', 'replacements']);
function validReplacements(value: unknown): value is CanvasReplacement[] {
  return Array.isArray(value) && value.length <= CANVAS_MAX_ELEMENTS &&
    value.every(item => record(item) && onlyKeys(item, new Set(['id', 'label', 'description'])) && elementId(item.id) && boundedText(item.label, 80) && boundedText(item.description, 700)) &&
    new Set(value.map(item => item.id)).size === value.length;
}
export function validateCanvasRequest(value: unknown): CanvasRequest {
  if (!record(value) || value.contractVersion !== CANVAS_CONTRACT_VERSION) throw new CanvasFailure(400, 'This canvas contract is not supported. Your brief has not been shortened.');
  if (!onlyKeys(value, requestKeys) || !CANVAS_STAGES.includes(value.stage as CanvasStage) || !boundedText(value.brand, 300) || value.brand.trim().length < 2 || !isCanvasContext(value.context)) {
    throw new CanvasFailure(400, `Use a valid world or physical brief with a context up to ${CANVAS_CONTEXT_MAX_CHARS} characters. Your wording has not been shortened.`);
  }
  if (value.stage === 'world') {
    if (['sourceWorldId', 'selectedElementIds', 'heroElementId', 'replacements'].some(key => value[key] !== undefined)) throw new CanvasFailure(400, 'World generation cannot include a physical selection.');
  } else {
    const ids = value.selectedElementIds;
    if (!isConceptId(value.sourceWorldId) || !Array.isArray(ids) || ids.length < 1 || ids.length > CANVAS_MAX_ELEMENTS || !ids.every(elementId) || new Set(ids).size !== ids.length || !elementId(value.heroElementId) || !ids.includes(value.heroElementId)) {
      throw new CanvasFailure(400, 'Choose a saved world, its elements and one selected hero before generating a physical study.');
    }
    if (value.replacements !== undefined && (!validReplacements(value.replacements) || value.replacements.some(item => !ids.includes(item.id)))) throw new CanvasFailure(400, 'Replacements must refer to selected world elements and contain complete, bounded text.');
  }
  // Return the original text values unchanged, including whitespace and exact wording.
  return value as CanvasRequest;
}
export function isWorldElements(value: unknown): value is WorldElement[] {
  return Array.isArray(value) && value.length > 0 && value.length <= CANVAS_MAX_ELEMENTS && value.every(item =>
    record(item) && onlyKeys(item, new Set(['id', 'label', 'description', 'kind'])) && elementId(item.id) && boundedText(item.label, 80) && boundedText(item.description, 700) && (item.kind === 'fact' || item.kind === 'proposal')) && new Set(value.map(item => item.id)).size === value.length;
}
export function parseCanvasDesign(value: unknown): CanvasDesign {
  if (!record(value) || value.needsContext !== false || !boundedText(value.brand, 120) || !boundedText(value.title, 100) || !boundedText(value.story, 2000) || !boundedText(value.interaction, 700) || !boundedText(value.design, 8000) || !isWorldElements(value.worldElements)) throw new CanvasFailure(502, 'The generator returned an incomplete world. Please retry; your brief is unchanged.');
  return value as CanvasDesign;
}
const manifestPrefix = 'OFFKIN_CANVAS_V9\n';
const manifestKeys = new Set(['contractVersion', 'stage', 'story', 'design', 'context', 'worldElements', 'sourceWorldId', 'selectedElementIds', 'heroElementId', 'replacements']);
export function isCanvasManifest(value: unknown): value is CanvasManifest {
  if (!record(value) || !onlyKeys(value, manifestKeys) || !boundedText(value.story, 2000) || !boundedText(value.design, 8000) || !isWorldElements(value.worldElements)) return false;
  try {
    validateCanvasRequest({ ...Object.fromEntries(Object.entries(value).filter(([key]) => requestKeys.has(key))), brand: 'saved-world' });
    if (value.stage === 'physical') {
      const ids = value.selectedElementIds as string[];
      if (value.worldElements.length !== ids.length || value.worldElements.some(item => !ids.includes(item.id))) return false;
    }
    return JSON.stringify(value).length <= CANVAS_MANIFEST_MAX_CHARS;
  } catch { return false; }
}
export function serializeCanvasManifest(value: CanvasManifest): string {
  if (!isCanvasManifest(value)) throw new CanvasFailure(502, 'The world could not be saved safely. Please retry.');
  return manifestPrefix + JSON.stringify(value);
}
export function parseCanvasManifest(story: string): CanvasManifest | null {
  if (!story.startsWith(manifestPrefix) || story.length > CANVAS_MANIFEST_MAX_CHARS + manifestPrefix.length) return null;
  try { const value: unknown = JSON.parse(story.slice(manifestPrefix.length)); return isCanvasManifest(value) ? value : null; } catch { return null; }
}
export function restoreCanvasRow(row: CanvasStoredRow, image: string): CanvasConcept | null {
  const manifest = parseCanvasManifest(row.story);
  if (!manifest || row.prompt_version !== CANVAS_CONTRACT_VERSION) return null;
  return { ...manifest, id: row.id, brand: row.brand, title: row.title, image, interaction: row.interaction || '', sourceUrl: row.source_url || '', sourceTitle: row.source_title || '' };
}
export function selectWorldElements(request: CanvasRequest, source: CanvasManifest): WorldElement[] {
  if (request.stage !== 'physical' || source.stage !== 'world') throw new CanvasFailure(400, 'Physical generation needs a saved illustrated world.');
  const ids = request.selectedElementIds!;
  const replacements = new Map((request.replacements || []).map(item => [item.id, item]));
  const elements = ids.map(id => {
    const original = source.worldElements.find(item => item.id === id);
    if (!original) throw new CanvasFailure(400, 'This selection does not belong to the saved world. Reopen it and choose again.');
    const replacement = replacements.get(id);
    return replacement ? { ...replacement, kind: 'proposal' as const } : original;
  });
  return elements;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
/** Includes all text, stage, source identity and immutable source manifest, selections and edits. */
export function canvasCacheInput(request: CanvasRequest, websiteUrl: string, source: CanvasManifest | null): string {
  return JSON.stringify(canonical({ contractVersion: CANVAS_CONTRACT_VERSION, request, websiteUrl, sourceManifest: source }));
}
export function hasCanvasCapabilities(value: unknown): boolean {
  if (!record(value) || value.ready !== true || !record(value.capabilities)) return false;
  const capabilities = value.capabilities;
  return capabilities.canvas === true && capabilities.canvas_contract_version === CANVAS_CONTRACT_VERSION && capabilities.canvas_context_max_chars === CANVAS_CONTEXT_MAX_CHARS &&
    Array.isArray(capabilities.canvas_stages) && capabilities.canvas_stages.length === 2 && capabilities.canvas_stages[0] === 'world' && capabilities.canvas_stages[1] === 'physical';
}
export function isCanvasConcept(value: unknown): value is CanvasConcept {
  if (!record(value) || !isConceptId(value.id) || !boundedText(value.brand, 120) || !boundedText(value.title, 100) || !boundedText(value.interaction, 700, true) || typeof value.sourceUrl !== 'string' || typeof value.sourceTitle !== 'string' || typeof value.image !== 'string') return false;
  try { if (new URL(value.image).protocol !== 'https:') return false; } catch { return false; }
  return isCanvasManifest(Object.fromEntries(Object.entries(value).filter(([key]) => manifestKeys.has(key))));
}
