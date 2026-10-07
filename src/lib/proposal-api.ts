import {
  PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGES, hasProposalCapabilities, isProposalConcept,
  validateProposalRequest, type ProposalRequest, type ProposalConcept, type RevisionPlanRequest, type RevisionPlanResponse,
} from '../../supabase/functions/generate-concept/proposal';
export { PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGES };
export type { ProposalRequest, ProposalConcept, ProposalStage, RevisionPlanRequest, RevisionPlanResponse } from '../../supabase/functions/generate-concept/proposal';
export class ProposalContextNeededError extends Error {}
export class ProposalUnavailableError extends Error {
  constructor() { super('Complete proposal generation is not available on this backend yet. Your direction is saved on this device.'); }
}
const active = (signal: AbortSignal) => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
function target() {
  const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ProposalUnavailableError();
  return { url: `${url}/functions/v1/generate-concept`, key };
}
export async function supportsProposalGeneration(signal: AbortSignal): Promise<boolean> {
  try { active(signal); const { url, key } = target(); const response = await fetch(url, { headers: { apikey: key }, signal }); const data = await response.json(); return response.ok && !signal.aborted && hasProposalCapabilities(data); } catch { return false; }
}
async function post(body: unknown, signal: AbortSignal): Promise<unknown> {
  active(signal); const { url, key } = target();
  const text = JSON.stringify(body); if (new TextEncoder().encode(text).byteLength > 48000) throw new Error('This direction is too long. Your wording has not been shortened.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: text, signal });
  const data = await response.json().catch(() => null); active(signal);
  if (!response.ok) throw new Error(typeof data?.error === 'string' && data.error.length <= 500 ? data.error : 'This section could not be finished. Completed sections are saved; continue when you are ready.');
  return data;
}
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
function equalContext(a: ProposalConcept['context'], b: ProposalConcept['context']) { return Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([key,value])=>b[key] === value); }
export async function requestProposalAsset(body: ProposalRequest, signal: AbortSignal): Promise<ProposalConcept> {
  active(signal); validateProposalRequest(body);
  if (!await supportsProposalGeneration(signal)) { active(signal); throw new ProposalUnavailableError(); }
  const data = await post(body, signal);
  if (record(data) && data.needsContext === true) throw new ProposalContextNeededError(typeof data.message === 'string' && data.message.length <= 1000 ? data.message : 'Tell us a little more about what this business does.');
  if (!record(data) || !isProposalConcept(data.concept)) throw new Error(record(data) && typeof data.message === 'string' ? data.message : 'The backend returned an incomplete proposal section.');
  const c = data.concept;
  if ((body.stage === 'world' || body.stage === 'physical') && !c.productPlan) throw new Error('The new product response has no construction plan. Your accepted version is unchanged.');
  if (c.stage !== body.stage || !equalContext(c.context, body.context) || c.sourceWorldId !== body.sourceWorldId || c.sourcePhysicalId !== body.sourcePhysicalId) throw new Error('The response does not match the current proposal. Your accepted version is unchanged.');
  if (body.stage === 'physical' && (JSON.stringify(c.selectedElementIds) !== JSON.stringify(body.selectedElementIds) || c.heroElementId !== body.heroElementId || JSON.stringify(c.replacements || []) !== JSON.stringify(body.replacements || []))) throw new Error('The response does not match your selected story elements.');
  return c;
}
export async function restoreProposalAsset(id: string, signal: AbortSignal): Promise<ProposalConcept> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid saved proposal.');
  const data = await post({ id }, signal);
  if (!record(data) || !isProposalConcept(data.concept) || data.concept.id !== id) throw new Error('The saved proposal section could not be opened.');
  return data.concept;
}
export async function planProposalRevision(body: RevisionPlanRequest, signal: AbortSignal): Promise<RevisionPlanResponse> {
  if (!await supportsProposalGeneration(signal)) { active(signal); throw new ProposalUnavailableError(); }
  const data = await post(body, signal);
  if (!record(data)) throw new Error('The requested change could not be understood.');
  if (typeof data.clarification === 'string' && data.clarification.trim() && data.clarification.length <= 1000) return { clarification: data.clarification };
  // Validate context through the world request validator rather than trusting model output.
  if (!record(data.plan) || !['world','physical','packaging'].includes(String(data.plan.scope)) || typeof data.plan.summary !== 'string' || data.plan.summary.length > 1000 || !data.plan.summary.trim()) throw new Error('The requested change could not be understood safely.');
  validateProposalRequest({ contractVersion: PROPOSAL_CONTRACT_VERSION, stage:'world', brand:body.brand, context:data.plan.context });
  return data as unknown as RevisionPlanResponse;
}
