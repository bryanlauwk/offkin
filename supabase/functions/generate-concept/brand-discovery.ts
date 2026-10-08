import { CanvasFailure } from './canvas.ts';
import { pilotDigest, type PilotAccess, type PilotDatabase } from './pilot-access.ts';
import { BRAND_DISCOVERY_VERSION, discoveryRecord as record, discoveryUuid as uuid, isBrandDiscoveryRequest, isBrandDiscoveryResponse,
  type BrandDiscoveryRequest, type BrandDiscoveryResponse, type BrandCandidate, type BrandEvidence } from './brand-discovery-contract.ts';
import { boundedDiscoveryText, brandSearchConfigFromEnv, searchBrand, type SearchHit } from './brand-search.ts';
import { readCompanyWebsiteDirect, validatePublicWebsiteUrl, validateDns, type WebsiteDnsResolver } from './website.ts';
export const BRAND_RESEARCH_VERSION = 'offkin-brand-research-v1';
type Candidate = BrandCandidate & { source: BrandEvidence | null };
export type BrandResearch = { version: typeof BRAND_RESEARCH_VERSION; queryKind: 'name' | 'url'; exactName: string | null; candidates: Candidate[]; response: BrandDiscoveryResponse };
type ResearchRow = { research_id: string; status: 'reserved' | 'reading' | 'completed'; version: number; request_fingerprint: string; query_kind: 'name' | 'url'; payload: BrandResearch | null };
export type BrandDiscoveryRuntime = {
  db: PilotDatabase; access: PilotAccess; enabled: boolean;
  search?: (name: string, signal: AbortSignal) => Promise<SearchHit[]>;
  /** Default direct reader pins public DNS/TLS and has no paid fallback. */
  read?: (url: string) => Promise<BrandEvidence>;
  guardUrl?: (url: string) => Promise<string>;
};
const exactName = (value: string, min = 1) => {
  // A public brand name is not a general-purpose search prompt or private brief.
  const name = value.trim();
  if (name.length < min || name.length > 120 || /[\r\n]/.test(value) || !/^[\p{L}\p{N}][\p{L}\p{N}\p{M} &.'’(),+®™-]*$/u.test(name) || /^[A-Za-z0-9_-]{40,}$/.test(name)) throw new CanvasFailure(400, 'Use a short public brand name or public website. Keep private details in your local brief.');
  return name;
};
export function parseBrandQuery(query: string): { kind: 'name' | 'url'; value: string } {
  if (query.length > 300) throw new CanvasFailure(400, 'Use a public website of 300 characters or fewer.');
  const value = query.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|www\.)/i.test(value) || /^[^\s/]+\.[a-z]{2,}(?:\/|$)/i.test(value)) {
    try { const url = validatePublicWebsiteUrl(value).href; if (url.length > 300) throw new Error(); return { kind: 'url', value: url }; }
    catch { throw new CanvasFailure(400, 'Use a public HTTPS company website without credentials or a custom port.'); }
  }
  return { kind: 'name', value: exactName(value, 2) };
}
export async function brandQueryFingerprint(access: PilotAccess, query: { kind: 'name' | 'url'; value: string }) {
  return pilotDigest(JSON.stringify({ contractVersion: BRAND_DISCOVERY_VERSION, invite: access.inviteId, kind: query.kind, query: query.value }));
}
const result = (status: BrandDiscoveryResponse['status'], message: string, fields: Partial<BrandDiscoveryResponse> = {}): BrandDiscoveryResponse => ({ contractVersion: BRAND_DISCOVERY_VERSION, status, message, evidence: [], candidates: [], ...fields });
export const unavailableBrandDiscovery = (reason: BrandDiscoveryResponse['reason'] = 'disabled', researchId?: string) => result('unavailable', reason === 'in-progress'
  ? 'That lookup is still unresolved. Recover saved research later; no search or page read will be repeated.'
  : reason === 'consumed' ? 'This invitation’s lookup has already been used. Recover its saved research or continue with a factual story.'
  : 'Online brand discovery is unavailable. You can continue with a short factual brand story.', { reason, ...(researchId ? { researchId } : {}) });
export function brandDiscoveryRuntimeFromEnv(db: PilotDatabase, access: PilotAccess): BrandDiscoveryRuntime {
  const env = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  const config = brandSearchConfigFromEnv();
  return { db, access, enabled: env?.get('BRICK_BRAND_DISCOVERY_ENABLED') === 'true', ...(config ? { search: (name, signal) => searchBrand(name, config, signal) } : {}) };
}
export function brandDiscoveryStatus() {
  const env = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  return { version: BRAND_DISCOVERY_VERSION, enabled: env?.get('BRICK_BRAND_DISCOVERY_ENABLED') === 'true', configured: Boolean(brandSearchConfigFromEnv()), verification: 'configuration-only' as const };
}
export function brandDiscoveryCapabilities() {
  const env = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  return { brand_discovery_version: BRAND_DISCOVERY_VERSION, brand_discovery: env?.get('BRICK_BRAND_DISCOVERY_ENABLED') === 'true' && Boolean(brandSearchConfigFromEnv()) };
}
async function publicUrl(input: string): Promise<string> {
  const url = validatePublicWebsiteUrl(input);
  if (url.href.length > 300) throw new Error('Website address too long');
  const resolveDns = (globalThis as { Deno?: { resolveDns?: WebsiteDnsResolver } }).Deno?.resolveDns;
  if (!resolveDns) throw new Error('Public DNS verification unavailable');
  let timer: ReturnType<typeof setTimeout>;
  try { await Promise.race([validateDns(url, resolveDns), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('DNS deadline')), 10_000); })]); }
  finally { clearTimeout(timer!); }
  return url.href;
}
function safeEvidence(source: BrandEvidence): BrandEvidence {
  const url = validatePublicWebsiteUrl(source.url).href;
  if (url.length > 300) throw new Error('Website address too long');
  return { url, title: boundedDiscoveryText(source.title, 160), excerpt: boundedDiscoveryText(source.excerpt, 1200) };
}
function validResearch(value: unknown, id: string, kind: string): value is BrandResearch {
  if (!record(value) || value.version !== BRAND_RESEARCH_VERSION || value.queryKind !== kind ||
    !(value.exactName === null || (typeof value.exactName === 'string' && value.exactName.length > 0 && value.exactName.length <= 120)) ||
    !Array.isArray(value.candidates) || value.candidates.length > 5 || !isBrandDiscoveryResponse(value.response) || value.response.researchId !== id ||
    new TextEncoder().encode(JSON.stringify(value)).length > 32000) return false;
  if (kind === 'name' && !value.exactName) return false;
  if (new Set(value.candidates.map(c => record(c) ? c.id : '')).size !== value.candidates.length) return false;
  const response = value.response;
  if (response.status === 'ready' && (response.brand !== value.exactName || !value.candidates.some(c => record(c) && record(c.source) && c.source.url === response.website && response.evidence.some(e => JSON.stringify(e) === JSON.stringify(c.source))))) return false;
  return value.candidates.every(c => record(c) && uuid(c.id) && isBrandDiscoveryResponse(result('choose', 'Choose a source.', { researchId: id, candidates: [{ id: c.id, url: c.url, title: c.title, excerpt: c.excerpt } as BrandCandidate] })) &&
    (c.source === null || (record(c.source) && isBrandDiscoveryResponse(result('needs-context', 'Add context.', { evidence: [c.source as BrandEvidence] })))));
}
function decodeRow(data: unknown): ResearchRow | null {
  if (!record(data) || !uuid(data.research_id) || !['reserved', 'reading', 'completed'].includes(String(data.status)) ||
    !Number.isSafeInteger(data.version) || Number(data.version) < 0 || typeof data.request_fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(data.request_fingerprint) || !['name', 'url'].includes(String(data.query_kind))) return null;
  if (data.payload !== null && data.payload !== undefined && !validResearch(data.payload, data.research_id, String(data.query_kind))) return null;
  if (data.status === 'completed' && !data.payload) return null;
  return data as ResearchRow;
}
async function rpc(runtime: BrandDiscoveryRuntime, name: string, parameters: Record<string, unknown>) {
  const { data, error } = await runtime.db.rpc(name, { token_digest: runtime.access.digest, ...parameters });
  if (error || !record(data)) throw new CanvasFailure(503, 'Research accounting could not be confirmed. Use saved lookup recovery; no provider work will be repeated.');
  return data;
}
async function getRow(runtime: BrandDiscoveryRuntime, selector: { research_id: string } | { request_fingerprint: string }) {
  const data = await rpc(runtime, 'get_pilot_brand_research', selector);
  const row = decodeRow(data);
  if (!row) throw new CanvasFailure(409, 'No owned, active saved research is available for that lookup. No provider request was sent.');
  if ('research_id' in selector ? row.research_id !== selector.research_id : row.request_fingerprint !== selector.request_fingerprint) throw new CanvasFailure(503, 'The saved research binding could not be verified.');
  return row;
}
async function save(runtime: BrandDiscoveryRuntime, row: ResearchRow, payload: BrandResearch) {
  if (!validResearch(payload, row.research_id, row.query_kind)) throw new CanvasFailure(503, 'Research could not be safely saved.');
  const data = await rpc(runtime, 'save_pilot_brand_research', { research_id: row.research_id, expected_version: row.version, payload });
  if (data.ok !== true || !Number.isSafeInteger(data.version) || Number(data.version) <= row.version) throw new CanvasFailure(503, 'Research could not be safely saved. Recover the saved lookup; do not repeat it.');
  row.version = Number(data.version); row.payload = payload; row.status = 'completed';
  return payload.response;
}
async function claim(runtime: BrandDiscoveryRuntime, row: ResearchRow, kind: 'search' | 'read', candidateId?: string) {
  const data = await rpc(runtime, 'claim_pilot_brand_dispatch', { research_id: row.research_id, expected_version: row.version, dispatch_kind: kind, candidate_id: candidateId ?? null });
  if (data.allowed !== true || !Number.isSafeInteger(data.version) || Number(data.version) <= row.version) throw new CanvasFailure(409, 'This lookup step is already used, running, expired or revoked. No request will be repeated.');
  row.version = Number(data.version); if (kind === 'read') row.status = 'reading';
}
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const containsName = (text: string, name: string) => ` ${normalize(text)} `.includes(` ${normalize(name)} `);
const social = /(?:^|\.)(?:facebook|instagram|linkedin|youtube|tiktok|wikipedia|x|twitter)\.(?:com|org)$/;
const domainMatches = (url: string, name: string) => {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const key = normalize(name).replace(/ /g, '');
  const labels = hostname.split('.');
  return !social.test(hostname) && (labels[0].replace(/-/g, '') === key || labels.slice(0, -1).join('').replace(/-/g, '') === key || hostname.replace(/\./g, '') === key);
};
const factual = (source: BrandEvidence) => source.excerpt.length >= 80 && source.excerpt.split(/\s+/).length >= 12 &&
  !/^(?:access denied|just a moment|sign in|log in|404|page not found|verify you are human)/i.test(source.title) &&
  source.excerpt.replace(/\b(?:cookie|cookies|privacy|policy|accept|consent|javascript|browser|enable)\b/gi, '').trim().length >= 70;
const outwardCandidates = (candidates: Candidate[]) => candidates.map(({ id, url, title, excerpt }) => ({ id, url, title, excerpt }));
const sources = (payload: BrandResearch) => payload.candidates.flatMap(c => c.source ? [c.source] : []).slice(0, 2);
function resolvedResponse(row: ResearchRow, payload: BrandResearch, candidate: Candidate, name?: string): BrandDiscoveryResponse {
  const source = candidate.source;
  const base = { researchId: row.research_id, evidence: sources(payload), candidates: outwardCandidates(payload.candidates) };
  if (!source || !factual(source)) return result('needs-context', 'There is not enough readable business evidence here. Choose another listed source or continue with a short factual story.', { ...base, reason: 'insufficient-evidence' });
  if (!name) return result('needs-context', 'What exact brand name should appear on your concept?', { ...base, reason: 'name-required', website: source.url });
  return result('ready', 'Here is the source-backed brand context for your concept. Creative details will be proposed separately.', { ...base, brand: name, website: source.url, summary: source.excerpt.slice(0, 1600) });
}
async function selectCandidate(runtime: BrandDiscoveryRuntime, row: ResearchRow, candidateId: string, signal: AbortSignal, brandName?: string, auto = false) {
  if (row.status !== 'completed' || !row.payload) return unavailableBrandDiscovery('in-progress', row.research_id);
  const payload = structuredClone(row.payload);
  if (payload.response.status === 'ready') return payload.response;
  const candidate = payload.candidates.find(c => c.id === candidateId);
  if (!candidate) throw new CanvasFailure(400, 'Choose a source from this lookup’s saved candidate list.');
  if (brandName !== undefined && payload.queryKind !== 'url') throw new CanvasFailure(400, 'A name lookup keeps the exact name originally entered.');
  const name = payload.queryKind === 'name' ? payload.exactName! : brandName === undefined ? undefined : exactName(brandName);
  if (!candidate.source) {
    if (!runtime.enabled) return unavailableBrandDiscovery('disabled', row.research_id);
    if (signal.aborted) throw new CanvasFailure(499, 'The lookup was cancelled.');
    // Validate and resolve before claiming, then direct reader independently revalidates and pins.
    await (runtime.guardUrl ?? publicUrl)(candidate.url);
    await claim(runtime, row, 'read', candidateId);
    try {
      if (signal.aborted) throw new Error('Cancelled before page dispatch');
      const source = safeEvidence(await (runtime.read ?? readCompanyWebsiteDirect)(candidate.url));
      await (runtime.guardUrl ?? publicUrl)(source.url);
      candidate.source = source;
    } catch {
      payload.response = resolvedResponse(row, payload, candidate, name);
      return save(runtime, row, payload);
    }
  }
  if (auto && name && factual(candidate.source) && (!containsName(candidate.source.title, name) || !containsName(candidate.source.excerpt, name) || !domainMatches(candidate.source.url, name))) {
    payload.response = result('choose', 'Please choose which source represents your brand.', { researchId: row.research_id, evidence: sources(payload), candidates: outwardCandidates(payload.candidates) });
  } else payload.response = resolvedResponse(row, payload, candidate, name);
  if (payload.queryKind === 'url' && name) payload.exactName = name;
  return save(runtime, row, payload);
}
export async function handleBrandDiscovery(input: unknown, request: Request, runtime: BrandDiscoveryRuntime): Promise<BrandDiscoveryResponse> {
  if (!isBrandDiscoveryRequest(input)) throw new CanvasFailure(400, 'Use the supported brand discovery request.');
  const parsed = input as BrandDiscoveryRequest;
  if (parsed.action === 'recover-brand') {
    const row = await getRow(runtime, parsed.researchId ? { research_id: parsed.researchId } : { request_fingerprint: await brandQueryFingerprint(runtime.access, parseBrandQuery(parsed.query!)) });
    return row.status === 'completed' ? row.payload!.response : unavailableBrandDiscovery('in-progress', row.research_id);
  }
  if (parsed.action === 'select-brand') return selectCandidate(runtime, await getRow(runtime, { research_id: parsed.researchId }), parsed.candidateId, request.signal, parsed.brandName);
  const query = parseBrandQuery(parsed.query);
  if (!runtime.enabled || (query.kind === 'name' && !runtime.search)) return unavailableBrandDiscovery('disabled');
  if (request.signal.aborted) throw new CanvasFailure(499, 'The lookup was cancelled.');
  if (query.kind === 'url') await (runtime.guardUrl ?? publicUrl)(query.value);
  const fingerprint = await brandQueryFingerprint(runtime.access, query);
  const admission = await rpc(runtime, 'reserve_pilot_brand_research', { request_fingerprint: fingerprint, query_kind: query.kind });
  const row = decodeRow(admission);
  if (!row) return unavailableBrandDiscovery('consumed');
  if (row.request_fingerprint !== fingerprint || row.query_kind !== query.kind) throw new CanvasFailure(503, 'The lookup binding could not be verified.');
  if (admission.allowed !== true || row.status !== 'reserved') return row.status === 'completed' ? row.payload!.response : unavailableBrandDiscovery('in-progress', row.research_id);
  let hits: SearchHit[] = [];
  const payload: BrandResearch = { version: BRAND_RESEARCH_VERSION, queryKind: query.kind, exactName: query.kind === 'name' ? query.value : null, candidates: [], response: unavailableBrandDiscovery('lookup-failed', row.research_id) };
  if (query.kind === 'name') {
    await claim(runtime, row, 'search');
    try { if (request.signal.aborted) throw new Error('Cancelled'); hits = await runtime.search!(query.value, request.signal); }
    catch { return save(runtime, row, payload); }
  } else hits = [{ url: query.value, title: 'Your public website', excerpt: 'Read the public website supplied for this brand.' }];
  const seen = new Set<string>();
  for (const hit of hits.slice(0, 5)) {
    try {
      if (request.signal.aborted) break;
      const url = await (runtime.guardUrl ?? publicUrl)(validatePublicWebsiteUrl(hit.url).href);
      if (url.length > 300 || seen.has(url)) continue;
      const source = safeEvidence({ ...hit, url });
      if (!source.excerpt) continue;
      seen.add(url); payload.candidates.push({ ...source, id: crypto.randomUUID(), source: null });
    } catch { /* Unsafe/unverifiable URLs are never stored, shown or read. */ }
  }
  if (!payload.candidates.length) {
    payload.response = result('needs-context', 'No usable public brand source was found. Continue with a short factual brand story.', { researchId: row.research_id, reason: 'insufficient-evidence' });
    return save(runtime, row, payload);
  }
  payload.response = result('choose', 'Which source represents your brand?', { researchId: row.research_id, candidates: outwardCandidates(payload.candidates) });
  await save(runtime, row, payload);
  if (query.kind === 'url') return selectCandidate(runtime, row, payload.candidates[0].id, request.signal);
  const plausible = payload.candidates.filter(c => !social.test(new URL(c.url).hostname) && (containsName(c.title, query.value) || domainMatches(c.url, query.value)));
  if (plausible.length === 1 && containsName(plausible[0].title, query.value) && domainMatches(plausible[0].url, query.value)) return selectCandidate(runtime, row, plausible[0].id, request.signal, undefined, true);
  return payload.response;
}
/** Generation trusts only this active, owned, completed research. No read/search dispatch. */
export async function resolveBrandResearch(runtime: BrandDiscoveryRuntime, id: string, brandName: string, website: string): Promise<{ evidence: BrandEvidence; digest: string }> {
  const row = await getRow(runtime, { research_id: id });
  const response = row.payload?.response;
  if (row.status !== 'completed' || !response || response.status !== 'ready' || response.brand !== brandName || response.website !== website) throw new CanvasFailure(409, 'The saved brand research does not match this exact brand and source. Recover it or use your factual story.');
  const evidence = response.evidence.find(e => e.url === response.website);
  if (!evidence || !factual(evidence)) throw new CanvasFailure(409, 'This brand needs more factual context before generation.');
  return { evidence, digest: await pilotDigest(JSON.stringify({ version: BRAND_RESEARCH_VERSION, researchId: id, brand: response.brand, website: response.website, evidence })) };
}
