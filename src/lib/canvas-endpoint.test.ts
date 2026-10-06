// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  CANVAS_CAPABILITIES, CANVAS_CONTRACT_VERSION, CANVAS_CONTEXT_MAX_CHARS,
  parseCanvasManifest, type CanvasRequest,
} from '../../supabase/functions/generate-concept/canvas';
import { WebsiteReadError } from '../../supabase/functions/generate-concept/website';

const state = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>, rows: [] as Record<string, unknown>[],
  allowed: true, dbError: false, uploadError: false, saveError: false, signError: false,
  readWebsite: vi.fn(), queries: [] as string[], rpc: vi.fn(), upload: vi.fn(), remove: vi.fn(), sign: vi.fn(),
}));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: () => ({
    from: (table: string) => {
      state.queries.push(table);
      return {
        select: () => ({
          limit: async () => ({ error: state.dbError ? new Error('schema') : null }),
          eq: (field: string, value: unknown) => ({ maybeSingle: async () => ({ data: state.rows.find(row => row[field] === value) || null, error: state.dbError ? new Error('database') : null }) }),
        }),
        insert: async (row: Record<string, unknown>) => {
          if (state.saveError || state.rows.some(existing => existing.cache_key === row.cache_key)) return { error: new Error('save') };
          state.rows.push(row); return { error: null };
        },
      };
    },
    rpc: (...args: unknown[]) => { state.rpc(...args); return Promise.resolve({ data: state.allowed, error: null }); },
    storage: { from: (bucket: string) => ({
      upload: (...args: unknown[]) => { state.upload(bucket, ...args); return Promise.resolve({ error: state.uploadError ? new Error('upload') : null }); },
      remove: (...args: unknown[]) => { state.remove(bucket, ...args); return Promise.resolve({ error: null }); },
      createSignedUrl: (path: string, seconds: number) => {
        state.sign(bucket, path, seconds);
        return Promise.resolve({ data: { signedUrl: `https://private.invalid/${path}?token=test` }, error: state.signError ? new Error('sign') : null });
      },
    }) },
  }),
}));
vi.mock('../../supabase/functions/generate-concept/website', async importOriginal => {
  const actual = await importOriginal<typeof import('../../supabase/functions/generate-concept/website')>();
  return { ...actual, readCompanyWebsite: (...args: unknown[]) => state.readWebsite(...args) };
});
let handleRequest: (request: Request) => Promise<Response>;
const worldRequest: CanvasRequest = {
  contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'no-website',
  context: { business: 'We make origami stationery.', angle: 'A connected paper garden', exactWording: '  Fold for YOU!\n异趣伙伴  ', style: 'Illustrated & surreal' },
};
const elements = Array.from({ length: 6 }, (_, i) => ({ id: `element-${i}`, label: `Paper place ${i}`, description: `Connected paper form ${i}`, kind: i === 0 ? 'fact' as const : 'proposal' as const }));
const design = { needsContext: false, brand: 'Paper Studio', title: 'The folding garden', story: 'Supplied paper-making facts inspire a proposed layered garden.', interaction: 'Explore and select the proposed elements.', design: 'An expansive paper world with winding connected paths and six layered scenes.', worldElements: elements };
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64');
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const post = (body: unknown, signal?: AbortSignal) => handleRequest(new Request('https://edge.invalid/generate-concept', { method: 'POST', body: JSON.stringify(body), signal }));
const physicalRequest = (id: string): CanvasRequest => ({ ...worldRequest, stage: 'physical', context: { interaction: 'Display only' }, sourceWorldId: id, selectedElementIds: ['element-0', 'element-3'], heroElementId: 'element-3', replacements: [{ id: 'element-3', label: 'A paper river', description: 'A flowing proposed scene linked to the folding ritual.' }] });
function installGlobals() {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('Deno', { env: { get: (key: string) => state.env[key] }, serve: vi.fn() });
}
beforeAll(async () => {
  installGlobals();
  // Dynamic path keeps Deno-only runtime types out of the frontend TypeScript project.
  const modulePath = '../../supabase/functions/generate-concept/index.ts';
  handleRequest = (await import(modulePath)).handleRequest;
});
beforeEach(() => {
  installGlobals();
  state.env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'server-test-only', LOVABLE_API_KEY: 'mock-never-sent', BRICK_GENERATION_ENABLED: 'true' };
  state.rows = []; state.allowed = true; state.dbError = false; state.uploadError = false; state.saveError = false; state.signError = false; state.queries = [];
  state.readWebsite.mockReset().mockResolvedValue({ url: 'https://studio-example.com/', title: 'Studio', excerpt: 'The studio makes stationery.' });
  for (const mock of [state.rpc, state.upload, state.remove, state.sign]) mock.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/chat/completions')) return reply({ choices: [{ message: { content: JSON.stringify(design) } }] });
    if (url.endsWith('/images/generations')) return reply({ data: [{ b64_json: png }] });
    throw new Error(`Unexpected network target: ${url}`);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('v9 mocked edge endpoint, without live provider calls', () => {
  it('advertises the exact canvas contract alongside untouched v8 readiness without generation', async () => {
    const response = await handleRequest(new Request('https://edge.invalid/'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ready: true, prompt_version: 'offkin-cocreation-v8', capabilities: { ...CANVAS_CAPABILITIES, cocreation: true, context_max_chars: 6000 } });
    expect(fetch).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it('generates an illustrated world, saves a bounded private manifest and restores clean metadata', async () => {
    const response = await post(worldRequest);
    expect(response.status).toBe(200);
    const { concept } = await response.json();
    expect(concept).toMatchObject({ stage: 'world', contractVersion: CANVAS_CONTRACT_VERSION, story: design.story, worldElements: elements, context: worldRequest.context });
    expect(concept.image).toContain('token=test'); expect(concept.story).not.toContain('OFFKIN_CANVAS');
    expect(state.upload).toHaveBeenCalledWith('brick-concepts', expect.stringMatching(/\.png$/), expect.any(Uint8Array), { contentType: 'image/png', upsert: false });
    expect(state.sign).toHaveBeenCalledWith('brick-concepts', expect.any(String), 3600);
    expect(state.rows).toHaveLength(1);
    expect(parseCanvasManifest(String(state.rows[0].story))?.context.exactWording).toBe(worldRequest.context.exactWording);
    expect(state.rpc).not.toHaveBeenCalled(); // Configured owner waiver remains the default.
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls).toHaveLength(2);
    expect(String(calls[0][1]?.body)).toContain('rich, layered, connected illustrated brand WORLD');
    expect(String(calls[1][1]?.body)).toContain('STAGE WORLD');
    expect(JSON.parse(JSON.parse(String(calls[0][1]?.body)).messages[1].content).context).toEqual(worldRequest.context);
  });
  it('uses a separate physical image call with source narrative, retained/replaced elements and chosen hero', async () => {
    const { concept: world } = await (await post(worldRequest)).json();
    const request = physicalRequest(world.id);
    const response = await post(request);
    expect(response.status).toBe(200);
    const { concept } = await response.json();
    expect(concept.id).not.toBe(world.id); expect(concept.image).not.toBe(world.image);
    expect(concept).toMatchObject({ stage: 'physical', sourceWorldId: world.id, selectedElementIds: request.selectedElementIds, heroElementId: 'element-3', replacements: request.replacements, context: { ...worldRequest.context, interaction: 'Display only' } });
    expect(concept.worldElements).toEqual([elements[0], { ...request.replacements![0], kind: 'proposal' }]);
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls).toHaveLength(4);
    const physicalText = JSON.parse(String(calls[2][1]?.body));
    const direction = JSON.parse(physicalText.messages[1].content);
    expect(direction.sourceWorld.id).toBe(world.id);
    expect(direction.sourceWorld.design).toBe(world.design);
    expect(direction.selectedElements).toEqual(concept.worldElements);
    expect(direction.heroElementId).toBe('element-3');
    const physicalImage = JSON.parse(String(calls[3][1]?.body));
    expect(physicalImage.prompt).toContain('STAGE PHYSICAL');
    expect(physicalImage.prompt).toContain('No powered electronics');
    expect(physicalImage.prompt).toContain(JSON.stringify(worldRequest.context.exactWording).slice(1, -1));
  });
  it('restores an existing UUID without generation readiness, paid calls, quotas or public access', async () => {
    const { concept: world } = await (await post(worldRequest)).json();
    vi.mocked(fetch).mockClear(); state.env.BRICK_GENERATION_ENABLED = 'false'; state.env.LOVABLE_API_KEY = undefined; state.env.BRICK_ENFORCE_DAILY_LIMITS = 'true';
    const restored = await post({ id: world.id });
    expect(restored.status).toBe(200); expect((await restored.json()).concept).toEqual(world);
    expect(fetch).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
    expect(new Set(state.queries)).toEqual(new Set(['brick_concepts']));
  });
  it('serves repeated worlds from cache, but changed stage, choices, hero, removal and replacement cannot collide', async () => {
    const { concept: world } = await (await post(worldRequest)).json();
    await post(worldRequest); expect(fetch).toHaveBeenCalledTimes(2);
    const request = physicalRequest(world.id);
    await post(request); await post(request); expect(fetch).toHaveBeenCalledTimes(4);
    await post({ ...request, heroElementId: 'element-0' });
    await post({ ...request, selectedElementIds: ['element-3'] });
    await post({ ...request, replacements: [{ ...request.replacements![0], description: 'Another proposed river.' }] });
    await post({ ...worldRequest, context: { ...worldRequest.context, angle: 'Another angle' } });
    expect(fetch).toHaveBeenCalledTimes(12);
    expect(new Set(state.rows.map(row => row.cache_key)).size).toBe(6);
  });
  it.each([
    { ...worldRequest, contractVersion: 'offkin-canvas-v8' },
    { ...worldRequest, contractVersion: undefined },
    { ...worldRequest, stage: 'object' },
    { ...worldRequest, context: JSON.stringify(worldRequest.context) },
    { ...worldRequest, context: { business: 'x'.repeat(CANVAS_CONTEXT_MAX_CHARS) } },
    { ...worldRequest, context: { business: 'A studio', uploadedLogo: 'logo.png' } },
    { ...worldRequest, context: { mode: 'Electronic' } },
    { ...worldRequest, selectedElementIds: ['element-0'] },
    { ...physicalRequest('00000000-0000-4000-8000-000000000001'), selectedElementIds: [] },
    { ...physicalRequest('00000000-0000-4000-8000-000000000001'), heroElementId: 'element-4' },
  ])('rejects stale, unversioned, malformed or oversized contracts before paid calls', async input => {
    const response = await post(input); expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled(); expect(state.upload).not.toHaveBeenCalled();
  });
  it('rejects oversized bodies rather than silently truncating them', async () => {
    const response = await post({ ...worldRequest, context: { business: 'x'.repeat(48000) } });
    expect(response.status).toBe(413); expect(fetch).not.toHaveBeenCalled();
  });
  it('requires factual context and handles inaccessible websites without inventing evidence', async () => {
    expect((await post({ ...worldRequest, context: {} })).status).toBe(200);
    expect(await (await post({ ...worldRequest, context: {} })).json()).toMatchObject({ needsContext: true });
    state.readWebsite.mockRejectedValue(new Error('network unavailable'));
    expect(await (await post({ ...worldRequest, brand: 'https://studio-example.com', context: {} })).json()).toMatchObject({ needsContext: true });
    expect(fetch).not.toHaveBeenCalled();
    const response = await post({ ...worldRequest, brand: 'https://studio-example.com' });
    expect(response.status).toBe(200);
    const direction = JSON.parse(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).messages[1].content);
    expect(direction.websiteEvidence).toBeNull();
  });
  it.each(['http://127.0.0.1/', 'https://localhost/', 'https://169.254.169.254/', 'https://user:password@studio.example/'])('preserves public-URL SSRF validation for %s', async brand => {
    expect((await post({ ...worldRequest, brand })).status).toBe(400);
    expect(state.readWebsite).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('preserves runtime DNS/redirect safety failures even if business text is provided', async () => {
    state.readWebsite.mockRejectedValue(new WebsiteReadError(400, 'Private website destination is blocked.'));
    expect((await post({ ...worldRequest, brand: 'https://studio-example.com' })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects foreign selection IDs, non-world sources and malformed stored manifests', async () => {
    const { concept: world } = await (await post(worldRequest)).json();
    vi.mocked(fetch).mockClear();
    expect((await post({ ...physicalRequest(world.id), selectedElementIds: ['foreign'], heroElementId: 'foreign', replacements: [] })).status).toBe(400);
    state.rows[0].story = 'broken';
    expect((await post(physicalRequest(world.id))).status).toBe(400);
    expect((await post({ id: world.id })).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed on the kill switch and configured quotas, preserving the explicit false owner waiver', async () => {
    state.env.BRICK_GENERATION_ENABLED = 'false';
    expect((await post(worldRequest)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
    state.env.BRICK_GENERATION_ENABLED = 'true'; state.env.BRICK_ENFORCE_DAILY_LIMITS = 'true'; state.allowed = false;
    expect((await post(worldRequest)).status).toBe(429); expect(state.rpc).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
    state.env.BRICK_ENFORCE_DAILY_LIMITS = 'unexpected';
    expect((await post(worldRequest)).status).toBe(429); expect(fetch).not.toHaveBeenCalled();
    state.env.BRICK_ENFORCE_DAILY_LIMITS = 'false';
    expect((await post(worldRequest)).status).toBe(200);
  });
  it('stops before the second provider when cancelled after text generation', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { controller.abort(); return reply({ choices: [{ message: { content: JSON.stringify(design) } }] }); }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499);
    expect(fetch).toHaveBeenCalledOnce(); expect(state.upload).not.toHaveBeenCalled();
  });
  it('cleans up an image when saving fails, and never returns a fabricated saved concept', async () => {
    state.saveError = true;
    expect((await post(worldRequest)).status).toBe(503);
    expect(state.remove).toHaveBeenCalledWith('brick-concepts', [expect.stringMatching(/\.png$/)]);
    expect(state.rows).toHaveLength(0);
  });

  it('accepts legacy v8 generation with its original response, prompt version and cache rules', async () => {
    const legacy = { contractVersion: 'offkin-cocreation-v8', brand: 'no-website', summaryOnly: true, edition: 'inside', format: 'miniature', context: JSON.stringify({ business: 'Origami stationery', exactWording: '  Fold for YOU!\n异趣伙伴  ' }) };
    const response = await post(legacy);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.concept).toMatchObject({ story: design.story, edition: 'inside', format: 'miniature' });
    expect(result.concept.stage).toBeUndefined();
    expect(state.rows[0].prompt_version).toBe('offkin-cocreation-v8');
    expect(state.rows[0].story).toBe(design.story);
    await post(legacy); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('does not create an image when the model requests facts, returns malformed output or exceeds bounds', async () => {
    for (const output of [{ needsContext: true }, { ...design, design: 'x'.repeat(8001) }, { ...design, worldElements: [{ ...elements[0], x: 0.1 }] }, 'broken']) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ choices: [{ message: { content: typeof output === 'string' ? output : JSON.stringify(output) } }] })));
      const response = await post(worldRequest);
      expect(response.status).toBe(typeof output === 'object' && output.needsContext === true ? 200 : 502);
      expect(fetch).toHaveBeenCalledOnce(); expect(state.upload).not.toHaveBeenCalled();
    }
  });
  it('requires explicit electronic mode and honors that mode in physical generation', async () => {
    const { concept: world } = await (await post({ ...worldRequest, context: { ...worldRequest.context, mode: 'electronic' } })).json();
    const physical = { ...physicalRequest(world.id), context: { mode: 'electronic', interaction: 'Turn to reveal a requested light response' } };
    expect((await post(physical)).status).toBe(200);
    const image = JSON.parse(String(vi.mocked(fetch).mock.calls[3][1]?.body));
    expect(image.prompt).toContain('Validated mode: electronic');
    expect(image.prompt).toContain('Only the explicitly requested electronic response');
  });
  it('never truncates inherited wording when the combined physical context is too large', async () => {
    const context = { business: 'x'.repeat(5500), exactWording: '  Preserve this exactly  ' };
    const { concept: world } = await (await post({ ...worldRequest, context })).json();
    vi.mocked(fetch).mockClear();
    const response = await post({ ...physicalRequest(world.id), context: { revisionNotes: 'x'.repeat(1000) } });
    expect(response.status).toBe(400); expect(fetch).not.toHaveBeenCalled();
    expect(parseCanvasManifest(String(state.rows[0].story))?.context.exactWording).toBe(context.exactWording);
  });
  it('rejects a physical study as another physical source and returns 404 for unknown worlds', async () => {
    const { concept: world } = await (await post(worldRequest)).json();
    const { concept: physical } = await (await post(physicalRequest(world.id))).json();
    vi.mocked(fetch).mockClear();
    expect((await post(physicalRequest(physical.id))).status).toBe(400);
    expect((await post(physicalRequest('00000000-0000-4000-8000-000000000099'))).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('handles provider errors, invalid images and upload failures without saving a broken capability', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ error: 'busy' }, 429)));
    expect((await post(worldRequest)).status).toBe(429);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply({ choices: [{ message: { content: JSON.stringify(design) } }] })).mockResolvedValueOnce(reply({ data: [{ b64_json: Buffer.from('not an image').toString('base64') }] })));
    expect((await post(worldRequest)).status).toBe(502); expect(state.upload).not.toHaveBeenCalled();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply({ choices: [{ message: { content: JSON.stringify(design) } }] })).mockResolvedValueOnce(reply({ data: [{ b64_json: png }] })));
    state.uploadError = true;
    expect((await post(worldRequest)).status).toBe(503);
    expect(state.rows).toHaveLength(0); expect(state.sign).not.toHaveBeenCalled();
  });
  it('maps an aborted provider to cancellation instead of retryable generation failure', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { controller.abort(); throw new DOMException('Cancelled', 'AbortError'); }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499);
    expect(state.upload).not.toHaveBeenCalled();
  });
  it('keeps the legacy UUID restore shape working', async () => {
    state.rows.push({ id: '00000000-0000-4000-8000-000000000001', brand: 'Legacy', title: 'Existing', story: 'Original story', image_path: 'legacy.png', prompt_version: 'offkin-cocreation-v8', edition: 'inside', format: 'miniature' });
    const result = await (await post({ id: state.rows[0].id })).json();
    expect(result.concept).toMatchObject({ story: 'Original story', edition: 'inside', format: 'miniature' });
    expect(result.concept.stage).toBeUndefined(); expect(fetch).not.toHaveBeenCalled();
  });
});
