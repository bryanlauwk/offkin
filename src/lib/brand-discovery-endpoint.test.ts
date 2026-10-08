// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { BRAND_DISCOVERY_VERSION } from '../../supabase/functions/generate-concept/brand-discovery-contract';
import { brandQueryFingerprint, BRAND_RESEARCH_VERSION } from '../../supabase/functions/generate-concept/brand-discovery';
const state = vi.hoisted(() => ({ env: {} as Record<string,string>, authorized: false, rpc: vi.fn(), create: vi.fn(), research: null as unknown }));
const inviteId = '10000000-0000-4000-8000-000000000001';
const campaignId = '10000000-0000-4000-8000-000000000002';
const researchId = '10000000-0000-4000-8000-000000000003';
const candidateId = '10000000-0000-4000-8000-000000000004';
const token = 'A'.repeat(43);
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: () => {
  state.create(); return {
    from: () => ({ select: () => ({ limit: async () => ({ error: null }) }) }),
    rpc: async (name: string, parameters: Record<string, unknown>) => {
      state.rpc(name, parameters);
      if (name === 'get_pilot_invite_access') return { data: state.authorized ? { ready: true, invite_id: inviteId, campaign_id: campaignId, expires_at: '2099-01-01T00:00:00Z', remaining: { image_attempts: 5, planner_attempts: 1 } } : { ready: false } };
      if (name === 'get_pilot_brand_research') return { data: state.research ?? { status: 'not_found' } };
      throw new Error('Unexpected mutation or dispatch');
    },
  };
} }));
let handle: (request: Request) => Promise<Response>;
const input = { contractVersion: BRAND_DISCOVERY_VERSION, action: 'discover-brand', query: 'Stive Asia' };
const post = (body: unknown = input, headers: Record<string,string> = {}) => handle(new Request('https://edge.invalid/', { method: 'POST', headers, body: JSON.stringify(body) }));
function install() { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('Deno', { env: { get: (key: string) => state.env[key] }, serve: vi.fn() }); }
beforeAll(async () => { install(); const path = '../../supabase/functions/generate-concept/index.ts'; handle = (await import(path)).handleRequest; });
beforeEach(() => { install(); state.env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture' }; state.authorized = false; state.research = null; state.rpc.mockReset(); state.create.mockReset(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })); });
afterEach(() => vi.unstubAllGlobals());
describe('real discovery endpoint access/configuration boundary', () => {
  it('rejects anonymous discovery before database or provider work', async () => {
    expect((await post()).status).toBe(403); expect(state.create).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects borrowed URL/body/general authorization credentials', async () => {
    expect((await post({ ...input, invite: token }, { Authorization: `Bearer ${token}` })).status).toBe(403); expect(state.create).not.toHaveBeenCalled();
  });
  it('requires active server-validated invite even for recovery', async () => {
    expect((await post({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'recover-brand', researchId }, { 'x-offkin-invite': token })).status).toBe(403);
    expect(state.rpc.mock.calls.map(c => c[0])).toEqual(['get_pilot_invite_access']); expect(fetch).not.toHaveBeenCalled();
  });
  it('defaults disabled without reserving a lookup or consuming generation budget', async () => {
    state.authorized = true; const response = await post(input, { 'x-offkin-invite': token }); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'unavailable', reason: 'disabled' }); expect(state.rpc.mock.calls.map(c => c[0])).toEqual(['get_pilot_invite_access']); expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects invalid/mixed actions and generation recovery header before discovery', async () => {
    state.authorized = true;
    for (const body of [{ ...input, context: 'Do not transmit me' }, { ...input, contractVersion: 'wrong-version' }, { ...input, action: 'recover-brand', researchId }]) expect((await post(body, { 'x-offkin-invite': token })).status).toBe(400);
    expect((await post(input, { 'x-offkin-invite': token, 'x-offkin-recovery': '1' })).status).toBe(400); expect(fetch).not.toHaveBeenCalled();
  });
  it('recovers exact query with provider keys and generation/discovery flags absent', async () => {
    state.authorized = true;
    const response = { contractVersion: BRAND_DISCOVERY_VERSION, status: 'choose', researchId, message: 'Which brand?', evidence: [], candidates: [{ id: candidateId, url: 'https://stiveasia.com/', title: 'Stive Asia', excerpt: 'An artist-led business.' }] };
    const fingerprint = await brandQueryFingerprint({ digest: '', inviteId, campaignId, expiresAt: '2099-01-01T00:00:00Z', imagesRemaining: 5, plannersRemaining: 1 }, { kind: 'name', value: 'Stive Asia' });
    state.research = { research_id: researchId, request_fingerprint: fingerprint, query_kind: 'name', version: 2, status: 'completed', payload: { version: BRAND_RESEARCH_VERSION, queryKind: 'name', exactName: 'Stive Asia', response, candidates: response.candidates.map(c => ({ ...c, source: null })) } };
    const result = await post({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'recover-brand', query: 'Stive Asia' }, { 'x-offkin-invite': token });
    expect(result.status).toBe(200); expect(await result.json()).toEqual(response); expect(state.rpc.mock.calls.map(c => c[0])).toEqual(['get_pilot_invite_access', 'get_pilot_brand_research']); expect(fetch).not.toHaveBeenCalled();
  });
  it('GET exposes configuration-only status, never a claim of verified live search', async () => {
    const response = await handle(new Request('https://edge.invalid/')); const body = await response.json();
    expect(body.brand_discovery).toEqual({ version: BRAND_DISCOVERY_VERSION, enabled: false, configured: false, verification: 'configuration-only' });
    state.env = { ...state.env, BRICK_BRAND_DISCOVERY_ENABLED: 'true', BRICK_BRAND_SEARCH_ENABLED: 'true', BRICK_BRAND_SEARCH_PROVIDER: 'firecrawl-gateway-v2', FIRECRAWL_API_KEY: 'lovc_fixture', LOVABLE_API_KEY: 'fixture' };
    expect((await (await handle(new Request('https://edge.invalid/'))).json()).brand_discovery.configured).toBe(false);
    state.env.BRICK_BRAND_SEARCH_GATEWAY_APPROVED = 'true';
    expect((await (await handle(new Request('https://edge.invalid/'))).json()).brand_discovery).toEqual({ version: BRAND_DISCOVERY_VERSION, enabled: true, configured: true, verification: 'configuration-only' }); expect(fetch).not.toHaveBeenCalled();
  });
});
