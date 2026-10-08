import { pilotCredentialVersion, pilotInviteHeaders, pilotInviteTokenPresent, rememberPilotAccess } from './pilot-access';
import { CONCEPT_PREVIEW_VERSION } from '../../supabase/functions/generate-concept/concept-preview';
import { PROPOSAL_GENERATION_PAUSED, PROPOSAL_PAUSE_MESSAGE } from './proposal-availability';
import {
  PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGES, hasProposalCapabilities, isCustomerIdentity, isDetailsRefinement, isProposalConcept, canonicalProposal,
  validateProposalRequest, validateRevisionPlanRequest, type CustomerIdentity, type ProposalRequest, type ProposalConcept, type RevisionPlanRequest, type RevisionPlanResponse,
} from '../../supabase/functions/generate-concept/proposal';
export { PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGES };
export type { ProposalRequest, ProposalConcept, ProposalStage, DetailsRefinement, RevisionPlanRequest, RevisionPlanResponse } from '../../supabase/functions/generate-concept/proposal';
export class ProposalContextNeededError extends Error {}
export class ProposalConstructionNeededError extends Error {}
export class ProposalUnavailableError extends Error {
  constructor() { super(PROPOSAL_GENERATION_PAUSED ? PROPOSAL_PAUSE_MESSAGE : 'Complete proposal generation is not available on this backend yet. Your direction is saved on this device.'); }
}
const active = (signal: AbortSignal) => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
function target() {
  const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ProposalUnavailableError();
  return { url: `${url}/functions/v1/generate-concept`, key };
}
export async function supportsProposalGeneration(signal: AbortSignal): Promise<boolean> {
  if (!pilotInviteTokenPresent()) return false;
  try { active(signal); const version = pilotCredentialVersion(); const { url, key } = target(); const response = await fetch(url, { headers: { apikey: key, ...pilotInviteHeaders() }, signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); const data = await response.json(); if(signal.aborted || version !== pilotCredentialVersion()) return false; const access = rememberPilotAccess(response.ok ? data?.pilot_access : null); return response.ok && Boolean(access) && hasProposalCapabilities(data); } catch { return false; }
}
/** Recovery is negotiated separately and the server forbids new reservations/dispatch. */
export async function supportsProposalRecovery(signal: AbortSignal): Promise<boolean> {
  if (!pilotInviteTokenPresent()) return false;
  try {
    active(signal); const version=pilotCredentialVersion(); const {url,key}=target();
    const response=await fetch(url,{headers:{apikey:key,...pilotInviteHeaders()},signal,credentials:'omit',referrerPolicy:'no-referrer'});
    const data=await response.json(); if(signal.aborted||version!==pilotCredentialVersion())return false;
    const access=rememberPilotAccess(response.ok?data?.pilot_access:null);
    return Boolean(access&&access.recovery_available===true)&&hasProposalCapabilities({...data,ready:true,capabilities:{...data?.capabilities,proposal:true}});
  }catch{return false;}
}
async function post(body: unknown, signal: AbortSignal, authenticated = true, recoveryOnly = false): Promise<unknown> {
  active(signal); const { url, key } = target();
  const text = JSON.stringify(body); if (new TextEncoder().encode(text).byteLength > 48000) throw new Error('This direction is too long. Your wording has not been shortened.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, ...(authenticated ? pilotInviteHeaders() : {}), ...(recoveryOnly ? {'x-offkin-recovery':'1'} : {}) }, body: text, signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  const data = await response.json().catch(() => null); active(signal);
  if (!response.ok) throw new Error(typeof data?.error === 'string' && data.error.length <= 500 ? data.error : 'This section could not be finished. Completed sections are saved; continue when you are ready.');
  return data;
}
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
function equalContext(a: ProposalConcept['context'], b: ProposalConcept['context']) { return Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([key,value])=>b[key] === value); }
export async function requestProposalAsset(body: ProposalRequest, signal: AbortSignal, recoveryOnly = false): Promise<ProposalConcept> {
  active(signal); validateProposalRequest(body);
  if (body.stage==='world'&&!isCustomerIdentity(body.customerIdentity)) throw new Error('Enter the exact brand name before generating your proposal.');
  if (body.constructionIntent) throw new Error('Construction choices belong to a later build proposal. Start with your visual direction.');
  if (!await (recoveryOnly ? supportsProposalRecovery(signal) : supportsProposalGeneration(signal))) { active(signal); throw new ProposalUnavailableError(); }
  const data = await post(body, signal, true, recoveryOnly);
  if (record(data) && data.needsConstruction === true) throw new ProposalConstructionNeededError(typeof data.clarification === 'string' && data.clarification.trim() && data.clarification.length <= 600 ? data.clarification : 'The physical construction needs a little more detail.');
  if (record(data) && data.needsContext === true) throw new ProposalContextNeededError(typeof data.message === 'string' && data.message.length <= 1000 ? data.message : 'Tell us a little more about what this business does.');
  if (!record(data) || !isProposalConcept(data.concept)) throw new Error(record(data) && typeof data.message === 'string' ? data.message : 'The backend returned an incomplete proposal section.');
  const c = data.concept;
  if (body.customerIdentity && (c.customerIdentity?.version!==body.customerIdentity.version || c.customerIdentity?.name!==body.customerIdentity.name || c.brand!==body.customerIdentity.name)) throw new Error('The response does not match your customer brand. Your accepted version is unchanged.');
  if (c.conceptPreview?.version !== CONCEPT_PREVIEW_VERSION) throw new Error('The new image has no creative-preview metadata. Your accepted version is unchanged.');
  if (c.stage !== body.stage || !equalContext(c.context, body.context) || c.sourceWorldId !== body.sourceWorldId || c.sourcePhysicalId !== body.sourcePhysicalId) throw new Error('The response does not match the current proposal. Your accepted version is unchanged.');
  if (canonicalProposal(c.detailsRefinement) !== canonicalProposal(body.detailsRefinement)) throw new Error('The response does not match your details refinement. Your accepted version is unchanged.');
  if (body.stage === 'physical' && (JSON.stringify(c.selectedElementIds) !== JSON.stringify(body.selectedElementIds) || c.heroElementId !== body.heroElementId || JSON.stringify(c.replacements || []) !== JSON.stringify(body.replacements || []))) throw new Error('The response does not match your selected story elements.');
  return c;
}
export async function restoreProposalAsset(id: string, signal: AbortSignal, expectedIdentity?: CustomerIdentity): Promise<ProposalConcept> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid saved proposal.');
  const data = await post({ id }, signal, false);
  if (!record(data) || !isProposalConcept(data.concept) || data.concept.id !== id) throw new Error('The saved proposal section could not be opened.');
  if (expectedIdentity && (data.concept.customerIdentity?.version!==expectedIdentity.version || data.concept.customerIdentity?.name!==expectedIdentity.name || data.concept.brand!==expectedIdentity.name)) throw new Error('The saved section does not match this customer brand.');
  return data.concept;
}
export async function planProposalRevision(body: RevisionPlanRequest, signal: AbortSignal, recoveryOnly = false): Promise<RevisionPlanResponse> {
  active(signal); validateRevisionPlanRequest(body);
  if (!await (recoveryOnly ? supportsProposalRecovery(signal) : supportsProposalGeneration(signal))) { active(signal); throw new ProposalUnavailableError(); }
  const data = await post(body, signal, true, recoveryOnly);
  if (!record(data)) throw new Error('The requested change could not be understood.');
  if (typeof data.clarification === 'string' && data.clarification.trim() && data.clarification.length <= 1000) return { clarification: data.clarification };
  // Validate context through the world request validator rather than trusting model output.
  if (!record(data.plan) || !['world','physical','details','packaging'].includes(String(data.plan.scope)) || typeof data.plan.summary !== 'string' || data.plan.summary.length > 600 || !data.plan.summary.trim()) throw new Error('The requested change could not be understood safely.');
  validateProposalRequest({ contractVersion: PROPOSAL_CONTRACT_VERSION, stage:'world', brand:body.brand, context:data.plan.context });
  if (data.plan.scope === 'details') {
    if (!isDetailsRefinement(data.plan.detailsRefinement) || data.plan.detailsRefinement.instruction !== body.instruction ||
      !equalContext(data.plan.context as ProposalConcept['context'], body.context) ||
      Object.keys(data.plan).some(key => !['scope', 'context', 'summary', 'detailsRefinement'].includes(key))) {
      throw new Error('The details plan changed the accepted direction or instruction. Your accepted version is unchanged.');
    }
  } else if (data.plan.detailsRefinement !== undefined) throw new Error('Only a details revision can include a details refinement.');
  return data as unknown as RevisionPlanResponse;
}
