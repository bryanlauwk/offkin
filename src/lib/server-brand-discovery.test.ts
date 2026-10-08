// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { BRAND_DISCOVERY_VERSION, isBrandDiscoveryRequest, isBrandDiscoveryResponse } from '../../supabase/functions/generate-concept/brand-discovery-contract';
import { brandQueryFingerprint, handleBrandDiscovery, parseBrandQuery, resolveBrandResearch, type BrandDiscoveryRuntime, type BrandResearch } from '../../supabase/functions/generate-concept/brand-discovery';
import { brandSearchConfigFromEnv, searchBrand } from '../../supabase/functions/generate-concept/brand-search';
import { validatePublicWebsiteUrl } from '../../supabase/functions/generate-concept/website';
import type { PilotAccess } from '../../supabase/functions/generate-concept/pilot-access';
const access: PilotAccess = { digest: 'a'.repeat(64), inviteId: '10000000-0000-4000-8000-000000000001', campaignId: '10000000-0000-4000-8000-000000000002', expiresAt: '2099-01-01T00:00:00Z', imagesRemaining: 5, plannersRemaining: 1 };
const id = '10000000-0000-4000-8000-000000000003';
const excerpt = 'Stive Asia creates art licensing projects, original illustrations and creative collaborations for businesses. Its public site describes artist-led exhibitions and visual storytelling.';
const source = { url: 'https://stiveasia.com/', title: 'Stive Asia | Creative collaborations', excerpt };
const hit = { ...source };
const request = () => new Request('https://edge.invalid/', { method: 'POST' });
const discover = (query = 'Stive Asia') => ({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'discover-brand', query });
const select = (researchId: string, candidateId: string, brandName?: string) => ({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'select-brand', researchId, candidateId, ...(brandName ? { brandName } : {}) });
const recover = (query = 'Stive Asia') => ({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'recover-brand', query });
function fixture() {
  type Row = { research_id: string; request_fingerprint: string; query_kind: string; version: number; status: string; payload: BrandResearch | null };
  const state = { row: null as Row | null, active: true, searchClaimed: false, claimed: [] as string[], ackLost: false, claimLost: false, saveReject: false, calls: [] as string[] };
  const db = { rpc: vi.fn(async (name: string, p: Record<string, unknown>): Promise<{data?:unknown;error?:unknown}> => {
    state.calls.push(name);
    if (!state.active || p.token_digest !== access.digest) return { data: { allowed: false, status: 'denied' } };
    if (name === 'reserve_pilot_brand_research') {
      if (state.row) return { data: state.row.request_fingerprint === p.request_fingerprint ? { ...structuredClone(state.row), allowed: false } : { allowed: false, status: 'denied' } };
      state.row = { research_id: id, request_fingerprint: String(p.request_fingerprint), query_kind: String(p.query_kind), version: 0, status: 'reserved', payload: null };
      return { data: { ...state.row, allowed: true } };
    }
    const row = state.row;
    if (name === 'get_pilot_brand_research') return { data: row && (p.research_id === row.research_id || p.request_fingerprint === row.request_fingerprint) ? structuredClone(row) : { status: 'not_found' } };
    if (!row || p.research_id !== row.research_id || p.expected_version !== row.version) return { data: { allowed: false, ok: false } };
    if (name === 'claim_pilot_brand_dispatch') {
      if (p.dispatch_kind === 'search') {
        if (state.searchClaimed || row.status !== 'reserved' || row.query_kind !== 'name') return { data: { allowed: false } };
        state.searchClaimed = true;
      } else {
        if (row.status !== 'completed' || row.payload?.response.status === 'ready' || state.claimed.length >= 2 || state.claimed.includes(String(p.candidate_id)) || !row.payload?.candidates.some(c => c.id === p.candidate_id && c.source === null)) return { data: { allowed: false } };
        state.claimed.push(String(p.candidate_id)); row.status = 'reading';
      }
      row.version++;
      return state.claimLost ? { error: new Error('Lost claim acknowledgement') } : { data: { allowed: true, version: row.version } };
    }
    if (name === 'save_pilot_brand_research') {
      if (state.saveReject) return { data: { ok: false } };
      row.payload = structuredClone(p.payload as BrandResearch); row.status = 'completed'; row.version++;
      return state.ackLost ? { error: new Error('Lost save acknowledgement') } : { data: { ok: true, version: row.version } };
    }
    throw new Error(`Unexpected RPC ${name}`);
  }) };
  const search = vi.fn(async (_name: string, _signal: AbortSignal) => [hit]);
  const read = vi.fn(async () => source);
  const guardUrl = vi.fn(async (url: string) => { const safe = validatePublicWebsiteUrl(url); if (safe.hostname === 'private.company.com') throw new Error('Private DNS'); return safe.href; });
  const runtime: BrandDiscoveryRuntime = { db, access, enabled: true, search, read, guardUrl };
  return { state, db, search, read, guardUrl, runtime, run: (body: unknown, req = request()) => handleBrandDiscovery(body, req, runtime) };
}
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Real network is forbidden'); })); });
afterEach(() => vi.unstubAllGlobals());
describe('bounded server brand discovery, entirely mocked', () => {
  it('grounds one exact-name lookup and exposes bounded evidence', async () => {
    const f = fixture(); const response = await f.run(discover());
    expect(response).toMatchObject({ status: 'ready', brand: 'Stive Asia', website: source.url, summary: excerpt, evidence: [source], researchId: id });
    expect(isBrandDiscoveryResponse(response)).toBe(true); expect(f.search).toHaveBeenCalledOnce(); expect(f.search.mock.calls[0][0]).toBe('Stive Asia'); expect(f.read).toHaveBeenCalledOnce();
    expect(f.state.calls).toEqual(['reserve_pilot_brand_research', 'claim_pilot_brand_dispatch', 'save_pilot_brand_research', 'claim_pilot_brand_dispatch', 'save_pilot_brand_research']);
    expect(fetch).not.toHaveBeenCalled(); expect(JSON.stringify(response)).not.toContain(access.digest);
  });
  it('replays completed duplicate submission and exact-query recovery without dispatch', async () => {
    const f = fixture(); const first = await f.run(discover());
    expect(await f.run(discover())).toEqual(first); expect(await f.run(recover())).toEqual(first);
    expect(await f.run({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'recover-brand', researchId: id })).toEqual(first);
    expect(f.search).toHaveBeenCalledOnce(); expect(f.read).toHaveBeenCalledOnce();
  });
  it('does not allocate on disabled or unconfigured name lookup', async () => {
    const f = fixture(); f.runtime.enabled = false; expect(await f.run(discover())).toMatchObject({ status: 'unavailable', reason: 'disabled' });
    f.runtime.enabled = true; delete f.runtime.search; expect(await f.run(discover())).toMatchObject({ status: 'unavailable' }); expect(f.db.rpc).not.toHaveBeenCalled();
  });
  it('has lookup-only recovery even while all provider flags are disabled', async () => {
    const f = fixture(); const first = await f.run(discover()); f.runtime.enabled = false; delete f.runtime.search;
    expect(await f.run(recover())).toEqual(first); expect(f.read).toHaveBeenCalledOnce();
    const before = f.db.rpc.mock.calls.length; await expect(f.run(recover('Another Brand'))).rejects.toThrow(/No owned/);
    expect(f.db.rpc.mock.calls.slice(before).map(c => c[0])).toEqual(['get_pilot_brand_research']);
  });
  it('binds fingerprint to exact name, invite, query kind and normalized source URL', async () => {
    const name = parseBrandQuery(' Stive Asia '); expect(name).toEqual({ kind: 'name', value: 'Stive Asia' });
    expect(parseBrandQuery('http://stiveasia.com/?tracking=discard#fragment')).toEqual({ kind: 'url', value: source.url });
    const a = await brandQueryFingerprint(access, name); expect(a).not.toBe(await brandQueryFingerprint({ ...access, inviteId: id }, name));
    expect(a).not.toBe(await brandQueryFingerprint(access, parseBrandQuery('STIVE Asia')));
  });
  it.each(['A'.repeat(121), 'name@example.com', 'Brand\nprivate story', 'A'.repeat(43), 'https://user:secret@stiveasia.com/', 'http://127.0.0.1/', 'file:///etc/passwd', 'http://localhost/'])('rejects unsafe or private-ish query before budget: %s', async query => {
    const f = fixture(); await expect(f.run(discover(query))).rejects.toThrow(); expect(f.db.rpc).not.toHaveBeenCalled(); expect(f.search).not.toHaveBeenCalled();
  });
  it('caps five returned candidates, deduplicates URLs and drops unsafe/private DNS entries', async () => {
    const f = fixture(); f.search.mockResolvedValue([{ ...hit, url: 'http://127.0.0.1/' }, { ...hit, url: 'https://private.company.com/' }, hit, hit, { ...hit, url: 'https://anotherbrand.com/', title: 'Stive Asia regional studio' }, { ...hit, url: 'https://sixthbrand.com/' }]);
    const response = await f.run(discover()); expect(response.candidates).toHaveLength(2); expect(response.status).toBe('choose'); expect(f.read).not.toHaveBeenCalled();
  });
  it('does not spend direct reads on ambiguous results, then reads only explicitly selected cached URL', async () => {
    const f = fixture(); f.search.mockResolvedValue([hit, { ...hit, url: 'https://stiveasia.org/', title: 'Stive Asia arts foundation' }]);
    const chosen = await f.run(discover()); expect(chosen.status).toBe('choose'); expect(f.read).not.toHaveBeenCalled();
    const response = await f.run(select(id, chosen.candidates[1].id)); expect(response.status).toBe('ready'); expect(f.read).toHaveBeenCalledWith('https://stiveasia.org/'); expect(f.search).toHaveBeenCalledOnce();
  });
  it('asks a URL-only user for exact identity instead of inventing it from a domain/title', async () => {
    const f = fixture(); const response = await f.run(discover(source.url));
    expect(response).toMatchObject({ status: 'needs-context', reason: 'name-required', website: source.url }); expect(response.brand).toBeUndefined(); expect(f.search).not.toHaveBeenCalled();
    const clarified = await f.run(select(id, response.candidates[0].id, 'STIVE Asia'));
    expect(clarified).toMatchObject({ status: 'ready', brand: 'STIVE Asia' }); expect(f.read).toHaveBeenCalledOnce();
  });
  it('never silently renames a typed identity through selection', async () => {
    const f = fixture(); f.search.mockResolvedValue([{ ...hit, url: 'https://ambiguousbrand.com/' }]);
    const response = await f.run(discover()); await expect(f.run(select(id, response.candidates[0].id, 'Some Other Brand'))).rejects.toThrow(/exact name/); expect(f.read).not.toHaveBeenCalled();
  });
  it('requires page identity agreement for automatic selection', async () => {
    const f = fixture(); f.read.mockResolvedValue({ ...source, title: 'Unrelated organization', excerpt: 'An unrelated organization makes organic ceramic vessels and hand-crafted tableware for international customers and local hospitality clients.' });
    const response = await f.run(discover()); expect(response.status).toBe('choose'); expect(response.brand).toBeUndefined();
    expect((await f.run(select(id, response.candidates[0].id))).status).toBe('ready'); expect(f.read).toHaveBeenCalledOnce();
  });
  it('preserves factual fallback when a page is empty or blocked, with no paid scrape or AI', async () => {
    const f = fixture(); f.read.mockResolvedValue({ ...source, excerpt: 'Cookie policy' });
    expect(await f.run(discover())).toMatchObject({ status: 'needs-context', reason: 'insufficient-evidence' }); expect(fetch).not.toHaveBeenCalled();
  });
  it('allows a different cached candidate after one failed read, never retries the failed candidate, max2 reads', async () => {
    const f = fixture(); f.search.mockResolvedValue([hit, { ...hit, url: 'https://stiveasia.org/' }, { ...hit, url: 'https://stiveasia.net/' }]);
    f.read.mockRejectedValue(new Error('Blocked'));
    const response = await f.run(discover()); await f.run(select(id, response.candidates[0].id));
    await expect(f.run(select(id, response.candidates[0].id))).rejects.toThrow(/already used/);
    await f.run(select(id, response.candidates[1].id)); await expect(f.run(select(id, response.candidates[2].id))).rejects.toThrow(/already used/);
    expect(f.read).toHaveBeenCalledTimes(2); expect(f.search).toHaveBeenCalledOnce();
  });
  it('counts failed search without retry, and prevents fresh query from obtaining a new allowance', async () => {
    const f = fixture(); f.search.mockRejectedValue(new Error('Lost provider response'));
    const response = await f.run(discover()); expect(response).toMatchObject({ status: 'unavailable', reason: 'lookup-failed' });
    expect(await f.run(discover())).toEqual(response); expect(await f.run(discover('Another Brand'))).toMatchObject({ status: 'unavailable', reason: 'consumed' }); expect(f.search).toHaveBeenCalledOnce();
  });
  it('lost claim acknowledgement never dispatches or reclaims', async () => {
    const f = fixture(); f.state.claimLost = true;
    await expect(f.run(discover())).rejects.toThrow(/accounting/); expect(f.search).not.toHaveBeenCalled();
    expect(await f.run(recover())).toMatchObject({ status: 'unavailable', reason: 'in-progress' });
    expect(await f.run(discover())).toMatchObject({ status: 'unavailable', reason: 'in-progress' }); expect(f.search).not.toHaveBeenCalled();
  });
  it('lost persisted response acknowledgement can recover exact saved candidate payload without new work', async () => {
    const f = fixture(); f.state.ackLost = true;
    await expect(f.run(discover())).rejects.toThrow(/accounting/); expect(f.read).not.toHaveBeenCalled();
    const recovered = await f.run(recover()); expect(recovered.status).toBe('choose'); expect(f.search).toHaveBeenCalledOnce(); expect(f.read).not.toHaveBeenCalled();
  });
  it('persist failure after page dispatch leaves unresolved state, recovery cannot read again', async () => {
    const f = fixture(); f.read.mockImplementation(async () => { f.state.saveReject = true; return source; });
    await expect(f.run(discover())).rejects.toThrow(/safely saved/);
    expect(await f.run(recover())).toMatchObject({ status: 'unavailable', reason: 'in-progress' }); expect(f.read).toHaveBeenCalledOnce();
  });
  it('revocation or expiry between search and read blocks subsequent dispatch', async () => {
    const f = fixture(); f.search.mockImplementation(async () => { f.state.active = false; return [hit]; });
    await expect(f.run(discover())).rejects.toThrow(); expect(f.search).toHaveBeenCalledOnce(); expect(f.read).not.toHaveBeenCalled();
  });
  it('denies cross-invite recovery and generation research access', async () => {
    const f = fixture(); await f.run(discover()); f.runtime.access = { ...access, digest: 'b'.repeat(64) };
    await expect(f.run(recover())).rejects.toThrow(/No owned/); await expect(resolveBrandResearch(f.runtime, id, 'Stive Asia', source.url)).rejects.toThrow(/No owned/);
  });
  it('binds model evidence to exact owned ready identity and source without re-reading', async () => {
    const f = fixture(); await f.run(discover());
    const resolved = await resolveBrandResearch(f.runtime, id, 'Stive Asia', source.url); expect(resolved.evidence).toEqual(source); expect(resolved.digest).toMatch(/^[0-9a-f]{64}$/);
    await expect(resolveBrandResearch(f.runtime, id, 'Different brand', source.url)).rejects.toThrow(/does not match/);
    await expect(resolveBrandResearch(f.runtime, id, 'Stive Asia', 'https://other.com/')).rejects.toThrow(/does not match/);
    expect(f.search).toHaveBeenCalledOnce(); expect(f.read).toHaveBeenCalledOnce();
  });
  it('cancels before reservation, and refuses arbitrary client context/source injection', async () => {
    const f = fixture(); const controller = new AbortController(); controller.abort();
    await expect(f.run(discover(), new Request('https://edge.invalid/', { signal: controller.signal }))).rejects.toThrow(/cancelled/);
    for (const extra of [{ context: 'Private info' }, { evidence: [source] }, { enabled: true }, { id: access.inviteId }]) await expect(f.run({ ...discover(), ...extra })).rejects.toThrow(/supported/);
    expect(f.db.rpc).not.toHaveBeenCalled();
  });
  it('concurrent duplicate requests spend one search/read sequence', async () => {
    const f = fixture(); const responses = await Promise.all([f.run(discover()), f.run(discover())]);
    expect(responses.some(r => r.status === 'ready')).toBe(true); expect(responses.every(r => ['ready','unavailable'].includes(r.status))).toBe(true); expect(f.search).toHaveBeenCalledOnce(); expect(f.read).toHaveBeenCalledOnce();
  });
});
describe('search transport and client contracts', () => {
  it('has no configured paid search unless explicitly enabled and routed', () => {
    const env: Record<string, string> = { FIRECRAWL_API_KEY: 'test-direct' };
    vi.stubGlobal('Deno', { env: { get: (key: string) => env[key] } });
    expect(brandSearchConfigFromEnv()).toBeNull(); env.BRICK_BRAND_SEARCH_ENABLED = 'true'; expect(brandSearchConfigFromEnv()).toBeNull();
    env.BRICK_BRAND_SEARCH_PROVIDER = 'firecrawl-direct-v2'; expect(brandSearchConfigFromEnv()?.provider).toBe('firecrawl-direct-v2');
    env.FIRECRAWL_API_KEY = 'lovc_test'; env.BRICK_BRAND_SEARCH_PROVIDER = 'firecrawl-gateway-v2'; env.LOVABLE_API_KEY = 'test-gateway';
    expect(brandSearchConfigFromEnv()).toBeNull(); env.BRICK_BRAND_SEARCH_GATEWAY_APPROVED = 'true'; expect(brandSearchConfigFromEnv()?.provider).toBe('firecrawl-gateway-v2');
  });
  it('uses one documented search-only request with no scraping or private fields', async () => {
    const transport = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ success: true, data: { web: [{ url: source.url, title: '<b>Stive Asia</b>', description: excerpt }] } })));
    const hits = await searchBrand('Stive Asia', { provider: 'firecrawl-direct-v2', apiKey: 'fixture-only', fetch: transport }, new AbortController().signal);
    expect(hits[0].title).toBe('Stive Asia'); expect(transport).toHaveBeenCalledOnce();
    const [url, init] = transport.mock.calls[0]; expect(url).toBe('https://api.firecrawl.dev/v2/search');
    expect(JSON.parse(String(init.body))).toEqual({ query: '"Stive Asia" official website', limit: 5, sources: ['web'], timeout: 10000 }); expect(init.redirect).toBe('error');
  });
  it('does not infer an unverified gateway or retry non-200/malformed/oversized search', async () => {
    const transport = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response('blocked', { status: 429 }));
    await expect(searchBrand('Stive Asia', { provider: 'firecrawl-gateway-v2', apiKey: 'lovc_fixture', lovableApiKey: 'fixture', fetch: transport }, new AbortController().signal)).rejects.toThrow(); expect(transport).not.toHaveBeenCalled();
    for (const response of [new Response('blocked', { status: 429 }), new Response('{}'), new Response('x'.repeat(256001))]) {
      transport.mockResolvedValueOnce(response); await expect(searchBrand('Stive Asia', { provider: 'firecrawl-direct-v2', apiKey: 'fixture', fetch: transport }, new AbortController().signal)).rejects.toThrow();
    }
    expect(transport).toHaveBeenCalledTimes(3);
  });
  it('rejects overbroad response/request shapes and ambiguous recovery selectors', async () => {
    const f = fixture(); const response = await f.run(discover()); expect(isBrandDiscoveryResponse(response)).toBe(true);
    for (const bad of [{ ...response, summary: 'x'.repeat(1601) }, { ...response, evidence: [source, source, source] }, { ...response, website: 'javascript:bad' }, { ...response, secret: 'must not expose' }, { ...response, brand: undefined }]) expect(isBrandDiscoveryResponse(bad)).toBe(false);
    expect(isBrandDiscoveryRequest({ ...recover(), researchId: id })).toBe(false);
  });
});
