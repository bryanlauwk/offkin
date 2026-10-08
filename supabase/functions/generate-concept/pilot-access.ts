import { CanvasFailure } from './canvas.ts';
import { canonicalProposal, type ProposalRequest, type RevisionPlanRequest, type RevisionPlanResponse } from './proposal.ts';

export const PILOT_ACCESS_VERSION = 'offkin-pilot-v1';
export const PILOT_INVITE_HEADER = 'x-offkin-invite';
type Result = { data?: unknown; error?: unknown };
export type PilotDatabase = { rpc(name: string, parameters: Record<string, unknown>): PromiseLike<Result> };
export type PilotAccess = {
  digest: string; inviteId: string; campaignId: string; expiresAt: string;
  imagesRemaining: number; plannersRemaining: number; blockedAttempt?: boolean;
};
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const count = (value: unknown, max: number): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= max;
export async function pilotDigest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
/** Tokens travel only in this header. Never inspect URLs, request bodies or logs. */
export async function requestPilotDigest(request: Request): Promise<string | null> {
  const token = request.headers.get(PILOT_INVITE_HEADER);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? pilotDigest(token) : null;
}
export async function loadPilotAccess(db: PilotDatabase, digest: string): Promise<PilotAccess | null> {
  const { data, error } = await db.rpc('get_pilot_invite_access', { token_digest: digest });
  if (error || !record(data) || data.ready !== true || !uuid(data.invite_id) || !uuid(data.campaign_id) ||
    typeof data.expires_at !== 'string' || !Number.isFinite(Date.parse(data.expires_at)) || Date.parse(data.expires_at) <= Date.now() ||
    !record(data.remaining) || !count(data.remaining.image_attempts, 5) || !count(data.remaining.planner_attempts, 1)) return null;
  return { digest, inviteId: data.invite_id, campaignId: data.campaign_id, expiresAt: data.expires_at,
    imagesRemaining: data.remaining.image_attempts, plannersRemaining: data.remaining.planner_attempts,
    ...(typeof data.blocked_attempt === 'boolean'?{blockedAttempt:data.blocked_attempt}:{}) };
}
export function publicPilotAccess(access: PilotAccess) {
  return { version: PILOT_ACCESS_VERSION, authorized: true, recovery_available:true,blocked_attempt:access.blockedAttempt||false,images_remaining: access.imagesRemaining,
    planners_remaining: access.plannersRemaining, expires_at: access.expiresAt };
}

/** One endpoint request owns at most one operation; the DB owns every budget. */
export type PilotReplay = { assetId: string } | { payload: Record<string, unknown> };
export function pilotExecution(db: PilotDatabase, access: PilotAccess, recoveryOnly=false) {
  let operationId: string | null = null;
  let finished = false;
  let possibleSavedResult = false;
  const operation = async (request: ProposalRequest | RevisionPlanRequest, lookupOnly: boolean) => {
    const planner='action' in request&&request.action==='plan-revision';
    const fingerprint=await pilotDigest(canonicalProposal({invite:access.inviteId,request}));
    const {data,error}=await db.rpc(lookupOnly?'get_pilot_operation':'reserve_pilot_operation',lookupOnly
      ?{token_digest:access.digest,request_fingerprint:fingerprint}
      :{token_digest:access.digest,operation_key:fingerprint,request_fingerprint:fingerprint,operation_kind:planner?'planner':'asset',
        stage:planner?null:(request as ProposalRequest).stage,source_world_id:request.sourceWorldId||null,
        source_physical_id:request.sourcePhysicalId||null,previous_asset_id:planner?null:(request as ProposalRequest).previousAssetId||null});
    if(error||!record(data))throw new CanvasFailure(503,'Pilot usage could not be checked safely. No provider request was sent.');
    return {data,planner};
  };
  const complete = async (resultId:string|null,payload:RevisionPlanResponse|null) => {
    if(!operationId||finished)return;
    possibleSavedResult=true;
    const {data,error}=await db.rpc('finish_pilot_operation',{operation_id:operationId,result_id:resultId,failure_code:null,response_payload:payload});
    if(error||!record(data)||data.ok!==true)throw new CanvasFailure(503,'Pilot accounting could not be confirmed. Use saved-result recovery; no provider request will be repeated.');
    finished=true;
  };
  return {
    assertSource(row: { pilot_invite_id?: unknown }) {
      if (row.pilot_invite_id !== access.inviteId) throw new CanvasFailure(403, 'This saved image is not part of this private pilot invitation.');
    },
    async reserve(request: ProposalRequest | RevisionPlanRequest):Promise<PilotReplay|void> {
      if (operationId) throw new CanvasFailure(409, 'This pilot operation has already been reserved.');
      const {data,planner}=await operation(request,recoveryOnly);
      if(data.status==='completed'&&uuid(data.operation_id)){
        if(planner&&record(data.response_payload)&&new TextEncoder().encode(JSON.stringify(data.response_payload)).length<=48000&&
          ((record(data.response_payload.plan)&&['details','packaging'].includes(String(data.response_payload.plan.scope)))||
            (typeof data.response_payload.clarification==='string'&&data.response_payload.clarification.length<=1000))){
          operationId=data.operation_id;finished=true;return {payload:data.response_payload};
        }
        if(!planner&&uuid(data.result_id)){operationId=data.operation_id;finished=true;return {assetId:data.result_id};}
      }
      if(recoveryOnly)throw new CanvasFailure(409,'No completed result is available for that exact attempt yet. Its allowance remains counted; no provider request was sent.');
      if (data.status !== 'reserved' || data.allowed !== true || !uuid(data.operation_id)) {
        const repeat = ['in_progress', 'completed', 'failed', 'consumed'].includes(String(data.status));
        throw new CanvasFailure(repeat ? 409 : 429, repeat
          ? 'This attempt is already running or has been used. It will not be generated again automatically. Your saved sections are unchanged.'
          : 'This invitation cannot start that generation. Its allowance, expiry or permitted revision scope has been reached. Your saved sections are unchanged.');
      }
      operationId = data.operation_id;
    },
    /** Cache rows were saved only after a claimed image operation. Reconcile that
     * exact operation without allocating or dispatching anything new. */
    async recoverAsset(request:ProposalRequest,resultId:string){
      const {data}=await operation(request,true);
      if(!uuid(data.operation_id)||!['in_progress','completed'].includes(String(data.status))||
        (data.status==='completed'&&data.result_id!==resultId))throw new CanvasFailure(409,'This saved image needs its pilot accounting checked. No provider request was sent.');
      operationId=data.operation_id;
      if(data.status==='completed'){finished=true;return;}
      await complete(resultId,null);
    },
    beforeAssetSave(){possibleSavedResult=true;},
    completeAsset:(resultId:string)=>complete(resultId,null),
    completePlanner:(payload:RevisionPlanResponse)=>complete(null,payload),
    async claim(path: string) {
      if(recoveryOnly)throw new CanvasFailure(503,'Saved-result recovery cannot start a provider request.');
      if (!operationId || finished) throw new CanvasFailure(503, 'No active pilot reservation exists. No provider request was sent.');
      const kind = path === 'chat/completions' ? 'text' : ['images/generations', 'images/edits'].includes(path) ? 'image' : null;
      if (!kind) throw new CanvasFailure(503, 'This provider operation is not permitted in the private pilot.');
      const { data, error } = await db.rpc('claim_pilot_dispatch', { operation_id: operationId, dispatch_kind: kind });
      if (error || !record(data) || data.allowed !== true) throw new CanvasFailure(409, 'This provider attempt cannot be started safely. It may already have been used, or the invitation may have expired or been revoked.');
    },
    async finish(response: Response) {
      if (!operationId || finished) return;
      const body: unknown = await response.clone().json().catch(() => null);
      const resultId = record(body) && record(body.concept) && uuid(body.concept.id) ? body.concept.id : null;
      const completed = response.ok && (resultId || (record(body) && ('plan' in body || 'clarification' in body)));
      if(completed){await complete(resultId,resultId?null:body as RevisionPlanResponse);return;}
      const { data, error } = await db.rpc('finish_pilot_operation', {
        operation_id: operationId, result_id: null, failure_code: 'incomplete_response',response_payload:null,
      });
      if (error || !record(data) || data.ok !== true) throw new CanvasFailure(503, 'Pilot accounting could not be confirmed. Completed images remain saved; do not start another attempt until this has been checked.');
      finished = true;
    },
    async fail() {
      if (!operationId || finished) return false;
      // A save/finalization acknowledgement may have been lost. Leave the full
      // liability reserved so a later owned cache hit can reconcile its result.
      if(possibleSavedResult)return true;
      // No refund and no retry. A failed network response can still incur usage.
      await Promise.resolve(db.rpc('finish_pilot_operation', { operation_id: operationId, result_id: null, failure_code: 'provider_or_processing_failure',response_payload:null })).catch(() => undefined);
      finished = true;
      return true;
    },
  };
}
