import { parseSelection } from '../../supabase/functions/generate-concept/options';
import type { CollectibleConcept } from './collectible-brief';
export type WebsiteEvidence = { url: string; title: string; excerpt: string };
export type ConceptResponse = { concept?: CollectibleConcept; needsContext?: boolean; message?: string; website?: WebsiteEvidence | null; verified?: boolean };
export class WebsiteAddressError extends Error {}
export async function supportsSummaryOnly(signal: AbortSignal): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url}/functions/v1/generate-concept`, { headers: { apikey: key }, signal });
    const data = await response.json();
    return data.capabilities?.summary_only === true;
  } catch { return false; }
}
export async function requestConcept(body: Record<string, unknown>, signal: AbortSignal): Promise<ConceptResponse> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('We can’t create a concept right now. Please try again later.');
  const response = await fetch(`${url}/functions/v1/generate-concept`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error('We’re busy right now. Please try again a little later.');
    if (body.inspectWebsite && response.status === 400) throw new WebsiteAddressError('We couldn’t use that address. Try your public HTTPS homepage.');
    if (body.inspectWebsite) throw new Error('We couldn’t read this website. You can tell us about the business instead.');
    throw new Error('We couldn’t finish your concept. Your answers are saved here. Please try again.');
  }
  if (data.concept) {
    const selection = parseSelection(data.concept);
    if (selection && body.format && (selection.format !== body.format || selection.edition !== body.edition)) throw new Error('We couldn’t create the direction you chose. Please try again.');
    if (!selection) throw new Error('We couldn’t open this concept. Please try again.');
    data.concept = { ...data.concept, ...selection };
  }
  return data;
}
