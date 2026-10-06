import {
  CANVAS_CONTRACT_VERSION, CANVAS_CONTEXT_MAX_CHARS, CANVAS_MAX_ELEMENTS,
  hasCanvasCapabilities, isCanvasConcept, isConceptId, validateCanvasRequest,
  type CanvasRequest, type CanvasResponse,
} from '../../supabase/functions/generate-concept/canvas';
export { CANVAS_CONTRACT_VERSION, CANVAS_CONTEXT_MAX_CHARS, CANVAS_MAX_ELEMENTS };
export type { CanvasRequest, CanvasResponse, CanvasConcept, CanvasContext, CanvasStage, CanvasReplacement, WorldElement } from '../../supabase/functions/generate-concept/canvas';

export class CanvasUnavailableError extends Error {
  constructor() { super('World generation isn’t available on this backend yet. Your brief is still saved here and hasn’t been sent for generation.'); }
}
const cancelled = (signal: AbortSignal) => { if (signal.aborted) throw new DOMException('The request was cancelled.', 'AbortError'); };
function endpoint() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url: `${url}/functions/v1/generate-concept`, key } : null;
}
async function readReadiness(signal: AbortSignal): Promise<unknown> {
  const target = endpoint();
  if (!target || signal.aborted) return null;
  try {
    const response = await fetch(target.url, { headers: { apikey: target.key }, signal });
    const data: unknown = await response.json();
    return response.ok && !signal.aborted ? data : null;
  } catch { return null; }
}
/** Read-only and uncached. A screen can call this without sending the customer's brief. */
export async function supportsCanvasGeneration(signal: AbortSignal): Promise<boolean> {
  return hasCanvasCapabilities(await readReadiness(signal));
}
async function post(body: CanvasRequest | { id: string }, signal: AbortSignal): Promise<CanvasResponse> {
  cancelled(signal);
  const target = endpoint();
  if (!target) throw new CanvasUnavailableError();
  const response = await fetch(target.url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: target.key }, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => null);
  cancelled(signal);
  if (!response.ok) {
    if (response.status === 429) throw new Error('Today’s generation limit has been reached. Your selections are still saved here.');
    if (response.status === 404) throw new Error('This saved world could not be found. Reopen a world before generating its physical study.');
    throw new Error(typeof data?.error === 'string' && data.error.length <= 500 ? data.error : 'We couldn’t finish this study. Your brief and selections are still saved here.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('We couldn’t open this world. Please try again.');
  if (data.needsContext === true && typeof data.message === 'string' && data.message.length <= 1000 && !data.concept) return { needsContext: true, message: data.message };
  if (!isCanvasConcept(data.concept)) throw new Error('The backend returned an incompatible world. Your brief is unchanged.');
  const concept = data.concept;
  if ('id' in body) {
    if (concept.id !== body.id) throw new Error('This response does not match the saved world.');
  } else {
    if (concept.stage !== body.stage || Object.entries(body.context).some(([key, value]) => concept.context[key] !== value)) throw new Error('This response does not match your current world direction.');
    if (body.stage === 'physical' && (concept.sourceWorldId !== body.sourceWorldId || concept.heroElementId !== body.heroElementId || JSON.stringify(concept.selectedElementIds) !== JSON.stringify(body.selectedElementIds) || JSON.stringify(concept.replacements || []) !== JSON.stringify(body.replacements || []))) throw new Error('This response does not match the elements you selected.');
  }
  return { concept };
}
/** Call only from an explicit Generate action. Readiness is rechecked immediately before every send. */
export async function requestCanvasConcept(body: CanvasRequest, signal: AbortSignal): Promise<CanvasResponse> {
  cancelled(signal);
  validateCanvasRequest(body);
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 48000) throw new Error('Please shorten this brief. Your wording has not been truncated.');
  if (!hasCanvasCapabilities(await readReadiness(signal))) {
    cancelled(signal);
    throw new CanvasUnavailableError();
  }
  return post(body, signal);
}
/** UUID is the existing private read capability. Restore never checks generation readiness or runs AI. */
export async function restoreCanvasConcept(id: string, signal: AbortSignal): Promise<CanvasResponse> {
  if (!isConceptId(id)) throw new Error('This saved world link is invalid.');
  return post({ id }, signal);
}
