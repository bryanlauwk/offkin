import { parseSelection } from '../../supabase/functions/generate-concept/options';
import { CO_CREATION_CONTRACT_VERSION, MAX_CONTEXT_CHARS, LEGACY_MAX_CONTEXT_CHARS, isCoCreationContext } from '../../supabase/functions/generate-concept/prompt';
import type { CollectibleConcept } from './collectible-brief';
export { CO_CREATION_CONTRACT_VERSION, MAX_CONTEXT_CHARS };
export type WebsiteEvidence = { url: string; title: string; excerpt: string };
export type ConceptResponse = { concept?: CollectibleConcept; needsContext?: boolean; message?: string; website?: WebsiteEvidence | null; verified?: boolean };
export class WebsiteAddressError extends Error {}
export class CoCreationUnavailableError extends Error {
  constructor() { super('Co-creation image generation isn’t available yet. Keep or download your brief; your answers haven’t been sent for generation.'); }
}

type GenerationReadiness = {
  ready?: unknown;
  prompt_version?: unknown;
  capabilities?: { summary_only?: unknown; electronic_story_scene?: unknown; cocreation?: unknown; context_max_chars?: unknown };
};
async function readGenerationReadiness(signal: AbortSignal): Promise<GenerationReadiness | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || signal.aborted) return null;
  try {
    const response = await fetch(`${url}/functions/v1/generate-concept`, { headers: { apikey: key }, signal });
    const data: unknown = await response.json();
    if (signal.aborted || !response.ok || !data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as GenerationReadiness;
  } catch { return null; }
}
function hasCoCreationContract(data: GenerationReadiness | null): boolean {
  return data?.ready === true && data.prompt_version === CO_CREATION_CONTRACT_VERSION && data.capabilities?.cocreation === true && data.capabilities.context_max_chars === MAX_CONTEXT_CHARS;
}
export async function supportsCoCreation(signal: AbortSignal): Promise<boolean> {
  return hasCoCreationContract(await readGenerationReadiness(signal));
}
export async function supportsSummaryOnly(signal: AbortSignal): Promise<boolean> {
  return (await readGenerationReadiness(signal))?.capabilities?.summary_only === true;
}
export async function supportsElectronicStoryScenes(signal: AbortSignal): Promise<boolean> {
  const data = await readGenerationReadiness(signal);
  return hasCoCreationContract(data) && data?.capabilities?.electronic_story_scene === true;
}

export async function requestConcept(body: Record<string, unknown>, signal: AbortSignal): Promise<ConceptResponse> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('We can’t create a concept right now. Please try again later.');
  if (body.contractVersion !== undefined && body.contractVersion !== CO_CREATION_CONTRACT_VERSION) throw new CoCreationUnavailableError();
  if (body.contractVersion === CO_CREATION_CONTRACT_VERSION) {
    if (typeof body.context !== 'string' || !isCoCreationContext(body.context)) throw new Error(`Use a complete co-creation brief up to ${MAX_CONTEXT_CHARS} characters. Your wording has not been shortened.`);
    // Recheck immediately before sending, even if a screen checked earlier. Never send a v8
    // generation request to the live v7 endpoint or silently downgrade/truncate its context.
    const data = await readGenerationReadiness(signal);
    if (!hasCoCreationContract(data)) throw new CoCreationUnavailableError();
    let context: Record<string, string>;
    try { context = JSON.parse(body.context); } catch { throw new CoCreationUnavailableError(); }
    if (context.mode === 'electronic' && data?.capabilities?.electronic_story_scene !== true) throw new CoCreationUnavailableError();
  } else if (typeof body.context === 'string') {
    let richContext = false;
    try {
      const context: unknown = JSON.parse(body.context);
      richContext = Boolean(context && typeof context === 'object' && ['scale', 'brandIdentifiers', 'materials', 'avoid', 'revisionNotes'].some(field => field in context));
    } catch { /* Legacy plain-text briefs are supported within their original limit. */ }
    if (body.context.length > LEGACY_MAX_CONTEXT_CHARS || richContext) throw new CoCreationUnavailableError();
  }
  if (signal.aborted) throw new DOMException('The request was cancelled.', 'AbortError');
  const response = await fetch(`${url}/functions/v1/generate-concept`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error('We’re busy right now. Please try again a little later.');
    if (body.inspectWebsite && response.status === 400) throw new WebsiteAddressError('We couldn’t use that address. Try your public HTTPS homepage.');
    if (body.inspectWebsite) throw new Error('We couldn’t read this website. You can tell us about the business instead.');
    throw new Error('We couldn’t finish your concept. Your answers are saved here. Please try again.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('We couldn’t open this concept. Please try again.');
  if (data.concept) {
    const selection = parseSelection(data.concept);
    if (selection && body.format && (selection.format !== body.format || selection.edition !== body.edition)) throw new Error('We couldn’t create the direction you chose. Please try again.');
    if (!selection) throw new Error('We couldn’t open this concept. Please try again.');
    data.concept = { ...data.concept, ...selection };
  }
  return data;
}
