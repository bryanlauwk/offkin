// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { handleProposal, type ProposalRuntime } from '../../supabase/functions/generate-concept/proposal-handler';
import { validateProposalRequest, type ProposalRequest } from '../../supabase/functions/generate-concept/proposal';
import { pilotDigest } from '../../supabase/functions/generate-concept/pilot-access';
const researchId = '10000000-0000-4000-8000-000000000003';
const evidence = { url: 'https://stiveasia.com/', title: 'Stive Asia', excerpt: 'Stive Asia creates art licensing projects, original illustrations and creative collaborations for businesses. Its public site describes artist-led exhibitions and visual storytelling.' };
const world: ProposalRequest = { contractVersion: 'offkin-proposal-v10', stage: 'world', brand: evidence.url, customerIdentity: { version: 'customer-brand-v1', name: 'Stive Asia' }, brandResearchId: researchId, context: {} };
function fixture() {
  const rows: Record<string, unknown>[] = [];
  const readWebsite = vi.fn(async () => { throw new Error('Discovery already supplied evidence'); });
  const resolve = vi.fn(async () => ({ evidence, digest: 'a'.repeat(64) }));
  const reserve = vi.fn(async () => undefined);
  const ai = vi.fn(async (path: string, _body: unknown) => path === 'chat/completions' ? { choices: [{ message: { content: JSON.stringify({ needsContext: false, brand: 'Stive Asia', title: 'The collaborative atelier', story: 'A proposed artist-led collectible world.', interaction: 'Display only', design: 'A richly layered illustrated collectible with expressive sculptural silhouettes.', worldElements: [ { id: 'painted-gate', label: 'Painted gate', description: 'A proposed layered hand-painted arch.', kind: 'proposal' }, { id: 'ink-path', label: 'Ink path', description: 'A playful proposed route connecting studio scenes.', kind: 'proposal' } ] }) } }] } : { data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=' }] });
  const runtime: ProposalRuntime = { db: {
    from: () => ({ select: () => ({ eq: (field, value) => ({ maybeSingle: async () => ({ data: rows.find(r => r[field] === value) as never ?? null }) }) }), insert: async row => { rows.push(row); return {}; } }),
    storage: { from: () => ({ download: async () => ({}), upload: async () => ({}), remove: async () => ({}) }) },
  }, enabled: true, textModel: 'fixture-text', imageModel: 'openai/gpt-image-2', ai, hash: pilotDigest, reserve, readWebsite, resolveBrandResearch: resolve,
    respond: (body, status = 200) => new Response(JSON.stringify(body), { status }), deliver: async row => new Response(JSON.stringify({ concept: row })) };
  return { runtime, rows, ai, reserve, resolve, readWebsite, run: (body: unknown = world) => handleProposal(body, new Request('https://edge.invalid/'), runtime) };
}
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })); });
afterEach(() => vi.unstubAllGlobals());
describe('owned research → world generation bridge', () => {
  it('uses only resolved cached evidence and keeps opaque research ID out of prompts/public manifest', async () => {
    const f = fixture(); const response = await f.run(); expect(response.status).toBe(200);
    expect(f.resolve).toHaveBeenCalledWith(researchId, 'Stive Asia', evidence.url); expect(f.readWebsite).not.toHaveBeenCalled(); expect(f.ai).toHaveBeenCalledTimes(2);
    const body = f.ai.mock.calls[0][1] as { messages: { content: string }[] }; expect(JSON.parse(body.messages[1].content).websiteEvidence).toEqual(evidence);
    expect(JSON.stringify(f.ai.mock.calls)).not.toContain(researchId); expect(f.rows[0].story).not.toContain(researchId); expect(f.rows[0].source_url).toBe(evidence.url);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('resolves owned evidence before model reservation/cache access and denies stale/mismatched research without providers', async () => {
    const f = fixture(); f.resolve.mockRejectedValue(new Error('Revoked or mismatched research'));
    await expect(f.run()).rejects.toThrow(/Revoked/); expect(f.ai).not.toHaveBeenCalled(); expect(f.reserve).not.toHaveBeenCalled(); expect(f.readWebsite).not.toHaveBeenCalled();
    delete f.runtime.resolveBrandResearch; await expect(f.run()).rejects.toThrow(/active private invitation/);
  });
  it('binds immutable evidence digest into generation cache identity', async () => {
    const f = fixture(); await f.run(); await f.run(); expect(f.rows).toHaveLength(1); expect(f.ai).toHaveBeenCalledTimes(2);
    f.resolve.mockResolvedValue({ evidence: { ...evidence, excerpt: evidence.excerpt + ' Updated source.' }, digest: 'b'.repeat(64) });
    await f.run(); expect(f.rows).toHaveLength(2); expect(f.rows[0].cache_key).not.toBe(f.rows[1].cache_key);
  });
  it('requires owned research for every website-backed private world before reads or reservation', async () => {
    const f = fixture(); f.runtime.requireBrandResearch = true; const {brandResearchId:_id,...withoutResearch}=world;
    for (const request of [withoutResearch,{...withoutResearch,context:{business:'Manual text does not authorize an extra website read.'}},{...withoutResearch,brand:'https://other.com/'}]) await expect(f.run(request)).rejects.toThrow(/saved brand research/);
    expect(f.readWebsite).not.toHaveBeenCalled(); expect(f.reserve).not.toHaveBeenCalled(); expect(f.resolve).not.toHaveBeenCalled(); expect(f.ai).not.toHaveBeenCalled();
  });
  it('preserves the independent exact-name/manual story path', async () => {
    const f = fixture(); const { brandResearchId: _id, ...manual } = world;
    await f.run({ ...manual, brand: 'no-website', context: { business: evidence.excerpt } });
    expect(f.resolve).not.toHaveBeenCalled(); expect(f.readWebsite).not.toHaveBeenCalled(); expect(f.ai).toHaveBeenCalledTimes(2);
  });
  it('does not accept research IDs on downstream stages or without exact identity', () => {
    expect(() => validateProposalRequest({ ...world, customerIdentity: undefined })).toThrow(/exact initial/);
    expect(() => validateProposalRequest({ ...world, stage: 'physical' })).toThrow(/exact initial/);
    expect(() => validateProposalRequest({ ...world, brandResearchId: 'attacker' })).toThrow(/exact initial/);
  });
});
