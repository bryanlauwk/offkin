/** Pure bounded browser/server contract. Search results are evidence, never instructions. */
export const BRAND_DISCOVERY_VERSION = 'offkin-brand-discovery-v1' as const;
export type BrandDiscoveryRequest =
  | { contractVersion: typeof BRAND_DISCOVERY_VERSION; action: 'discover-brand'; query: string }
  | { contractVersion: typeof BRAND_DISCOVERY_VERSION; action: 'select-brand'; researchId: string; candidateId: string; brandName?: string }
  | { contractVersion: typeof BRAND_DISCOVERY_VERSION; action: 'recover-brand'; researchId: string; query?: never }
  | { contractVersion: typeof BRAND_DISCOVERY_VERSION; action: 'recover-brand'; query: string; researchId?: never };
export type BrandEvidence = { url: string; title: string; excerpt: string };
export type BrandCandidate = BrandEvidence & { id: string };
export type BrandDiscoveryResponse = {
  contractVersion: typeof BRAND_DISCOVERY_VERSION;
  status: 'ready' | 'choose' | 'needs-context' | 'unavailable';
  researchId?: string;
  brand?: string;
  website?: string;
  summary?: string;
  evidence: BrandEvidence[];
  candidates: BrandCandidate[];
  message: string;
  reason?: 'name-required' | 'insufficient-evidence' | 'disabled' | 'consumed' | 'in-progress' | 'lookup-failed' | 'access-denied';
};
export const discoveryRecord = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
export const discoveryUuid = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const string = (v: unknown, max: number, min = 0): v is string => typeof v === 'string' && v.length >= min && v.length <= max;
const exactKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
const publicUrl = (v: unknown): v is string => {
  if (!string(v, 300, 1) || /[\s\\]/.test(v)) return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.search && !u.hash && u.hostname.includes('.'); } catch { return false; }
};
const evidence = (v: unknown): v is BrandEvidence => discoveryRecord(v) && exactKeys(v, ['url', 'title', 'excerpt']) && publicUrl(v.url) && string(v.title, 160) && string(v.excerpt, 1200, 1);
const candidate = (v: unknown): v is BrandCandidate => discoveryRecord(v) && discoveryUuid(v.id) && exactKeys(v, ['id', 'url', 'title', 'excerpt']) && evidence({ url: v.url, title: v.title, excerpt: v.excerpt });
export function isBrandDiscoveryRequest(v: unknown): v is BrandDiscoveryRequest {
  if (!discoveryRecord(v) || v.contractVersion !== BRAND_DISCOVERY_VERSION) return false;
  if (v.action === 'discover-brand') return exactKeys(v, ['contractVersion', 'action', 'query']) && string(v.query, 300, 2);
  if (v.action === 'select-brand') return exactKeys(v, ['contractVersion', 'action', 'researchId', 'candidateId', 'brandName']) && discoveryUuid(v.researchId) && discoveryUuid(v.candidateId) && (v.brandName === undefined || string(v.brandName, 120, 1));
  return v.action === 'recover-brand' && exactKeys(v, ['contractVersion', 'action', 'researchId', 'query']) &&
    ((discoveryUuid(v.researchId) && v.query === undefined) || (v.researchId === undefined && string(v.query, 300, 2)));
}
export function isBrandDiscoveryResponse(v: unknown): v is BrandDiscoveryResponse {
  if (!discoveryRecord(v) || !exactKeys(v, ['contractVersion', 'status', 'researchId', 'brand', 'website', 'summary', 'evidence', 'candidates', 'message', 'reason']) ||
    v.contractVersion !== BRAND_DISCOVERY_VERSION || !['ready', 'choose', 'needs-context', 'unavailable'].includes(String(v.status)) ||
    !string(v.message, 320, 1) || !Array.isArray(v.evidence) || v.evidence.length > 2 || !v.evidence.every(evidence) ||
    !Array.isArray(v.candidates) || v.candidates.length > 5 || !v.candidates.every(candidate) || new Set(v.candidates.map(c => c.id)).size !== v.candidates.length ||
    (v.researchId !== undefined && !discoveryUuid(v.researchId)) || (v.brand !== undefined && !string(v.brand, 120, 1)) ||
    (v.website !== undefined && !publicUrl(v.website)) || (v.summary !== undefined && !string(v.summary, 1600, 1)) ||
    (v.reason !== undefined && !['name-required', 'insufficient-evidence', 'disabled', 'consumed', 'in-progress', 'lookup-failed', 'access-denied'].includes(String(v.reason)))) return false;
  if (v.status === 'ready') return discoveryUuid(v.researchId) && string(v.brand, 120, 1) && publicUrl(v.website) && string(v.summary, 1600, 80) && v.evidence.length > 0 && v.evidence.some(e => e.url === v.website);
  if (v.status === 'choose') return discoveryUuid(v.researchId) && v.candidates.length > 0;
  return true;
}
