import { validateRevisionPlanRequest, type RevisionPlanRequest } from '../../supabase/functions/generate-concept/proposal';
/** Exact interrupted planner request only; never invite tokens or public-share data. */
export type PlannerRecovery = { acceptedId: string; request: RevisionPlanRequest };
const key = (acceptedId: string) => `offkin:pilot-planner-recovery:v1:${acceptedId.slice(0, 80)}`;
export function savePlannerRecovery(value: PlannerRecovery): boolean {
  try { validateRevisionPlanRequest(value.request); const raw=JSON.stringify({ version: 1, ...value }); if(raw.length>20000)return false; localStorage.setItem(key(value.acceptedId), raw); return true; } catch { return false; }
}
export function loadPlannerRecovery(acceptedId: string): PlannerRecovery | null {
  try {
    const raw = localStorage.getItem(key(acceptedId)); if (!raw || raw.length > 20000) return null;
    const value = JSON.parse(raw);
    if (value?.version !== 1 || value.acceptedId !== acceptedId || Object.keys(value).some(field => !['version', 'acceptedId', 'request'].includes(field))) return null;
    validateRevisionPlanRequest(value.request); return { acceptedId, request: value.request };
  } catch { return null; }
}
export function clearPlannerRecovery(acceptedId: string) { try { localStorage.removeItem(key(acceptedId)); } catch { /* A stale record can only make a read-only recovery request. */ } }
