// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  PROPOSAL_CONTRACT_VERSION, PROPOSAL_CAPABILITIES, PROPOSAL_STAGE_VERSION,
  hasProposalCapabilities, isProposalConcept, parseProposalManifest, parseRevisionPlan, serializeProposalManifest,
  type ProposalConcept, type ProposalRequest, type RevisionPlanRequest,
} from '../../supabase/functions/generate-concept/proposal';
import { serializeCanvasManifest } from '../../supabase/functions/generate-concept/canvas';

const state = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>, rows: [] as Record<string, unknown>[],
  blobs: new Map<string, Uint8Array>(), allowed: true, dbError: false, uploadError: false, saveError: false,
  downloadError: false, fakeDownloadSize: 0, output: null as unknown, imageOutput: null as unknown,
  textCalls: 0, imageCalls: 0, rpc: vi.fn(), upload: vi.fn(), download: vi.fn(), remove: vi.fn(), sign: vi.fn(), readWebsite: vi.fn(),
}));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: () => ({
  from: () => ({
    select: () => ({ limit: async () => ({ error: state.dbError ? new Error('schema') : null }),
      eq: (field: string, value: unknown) => ({ maybeSingle: async () => ({ data: state.rows.find(row => row[field] === value) || null, error: state.dbError ? new Error('database') : null }) }) }),
    insert: async (row: Record<string, unknown>) => {
      if (state.saveError || state.rows.some(existing => existing.cache_key === row.cache_key)) return { error: new Error('save') };
      state.rows.push(row); return { error: null };
    },
  }),
  rpc: (...args: unknown[]) => { state.rpc(...args); return Promise.resolve({ data: state.allowed, error: null }); },
  storage: { from: (bucket: string) => ({
    upload: (path: string, bytes: Uint8Array, options: unknown) => {
      state.upload(bucket, path, bytes, options);
      if (!state.uploadError) state.blobs.set(path, bytes);
      return Promise.resolve({ error: state.uploadError ? new Error('upload') : null });
    },
    download: async (path: string) => {
      state.download(bucket, path);
      const bytes = state.blobs.get(path);
      return { data: bytes ? { size: state.fakeDownloadSize || bytes.length, type: 'image/png', arrayBuffer: async () => Uint8Array.from(bytes).buffer } : null,
        error: state.downloadError || !bytes ? new Error('download') : null };
    },
    remove: async (paths: string[]) => { state.remove(bucket, paths); paths.forEach(path => state.blobs.delete(path)); return { error: null }; },
    createSignedUrl: async (path: string, seconds: number) => { state.sign(bucket, path, seconds); return { data: { signedUrl: `https://private.invalid/${path}?token=temporary` }, error: null }; },
  }) },
}) }));
vi.mock('../../supabase/functions/generate-concept/website', async importOriginal => {
  const original = await importOriginal<typeof import('../../supabase/functions/generate-concept/website')>();
  return { ...original, readCompanyWebsite: (...args: unknown[]) => state.readWebsite(...args) };
});

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=';
const elements = Array.from({ length: 6 }, (_, i) => ({ id: `element-${i}`, label: `Paper place ${i}`, description: `Connected paper form ${i}`, kind: 'proposal' as const }));
const design = { needsContext: false, brand: 'Paper Studio', title: 'The folding garden', story: 'A proposed connected paper garden.', interaction: 'Display only.', design: 'A rich layered paper world.', worldElements: elements };
const worldRequest: ProposalRequest = { contractVersion: PROPOSAL_CONTRACT_VERSION, stage: 'world', brand: 'no-website', context: {
  business: 'We make origami stationery.', style: 'Rich illustrated world', exactWording: '  Fold for YOU!\n异趣伙伴  ', mode: 'mechanical', interaction: 'Display only',
} };
let handleRequest: (request: Request) => Promise<Response>;
const post = (body: unknown, signal?: AbortSignal) => handleRequest(new Request('https://edge.invalid/generate-concept', { method: 'POST', body: JSON.stringify(body), signal }));
const response = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
function globals() {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('Deno', { env: { get: (key: string) => state.env[key] }, serve: vi.fn() });
}
beforeAll(async () => { globals(); const path = '../../supabase/functions/generate-concept/index.ts'; handleRequest = (await import(path)).handleRequest; });
beforeEach(() => {
  globals();
  state.env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-server-only', LOVABLE_API_KEY: 'test-not-real', BRICK_GENERATION_ENABLED: 'true', BRICK_PROPOSAL_ENABLED: 'true' };
  state.rows = []; state.blobs.clear(); state.allowed = true; state.dbError = false; state.uploadError = false; state.saveError = false;
  state.downloadError = false; state.fakeDownloadSize = 0; state.output = null; state.imageOutput = null; state.textCalls = 0; state.imageCalls = 0;
  for (const fn of [state.rpc, state.upload, state.download, state.remove, state.sign, state.readWebsite]) fn.mockReset();
  state.readWebsite.mockResolvedValue({ url: 'https://studio.example/', title: 'Paper Studio', excerpt: 'We make stationery.' });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/chat/completions')) { state.textCalls++; return response({ choices: [{ message: { content: JSON.stringify(state.output || design) } }] }); }
    if (url.endsWith('/images/generations') || url.endsWith('/images/edits')) { state.imageCalls++; return response(state.imageOutput || { data: [{ b64_json: png }] }); }
    throw new Error(`Unexpected network target: ${url}`);
  }));
});
afterEach(() => vi.unstubAllGlobals());
async function generate(request: ProposalRequest): Promise<ProposalConcept> {
  const result = await post(request);
  const body = await result.json();
  expect(result.status, JSON.stringify(body)).toBe(200);
  expect(isProposalConcept(body.concept)).toBe(true);
  return body.concept;
}
const physicalRequest = (world: ProposalConcept): ProposalRequest => ({ ...worldRequest, stage: 'physical', sourceWorldId: world.id,
  selectedElementIds: elements.map(e => e.id), heroElementId: elements[0].id, replacements: [] });
async function pair() {
  const world = await generate(worldRequest); const physical = await generate(physicalRequest(world)); return { world, physical };
}
const supplement = (stage: 'details' | 'packaging', world: ProposalConcept, physical: ProposalConcept): ProposalRequest => ({ ...worldRequest, stage, sourceWorldId: world.id, sourcePhysicalId: physical.id });
const planRequest = (world: ProposalConcept, physical: ProposalConcept): RevisionPlanRequest => ({ contractVersion: PROPOSAL_CONTRACT_VERSION, action: 'plan-revision', instruction: 'Make the packaging dark blue. Keep the object.', brand: 'no-website', context: worldRequest.context, sourceWorldId: world.id, sourcePhysicalId: physical.id });
const imageCalls = () => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/images/'));

describe('complete proposal backend with mocked providers only', () => {
  it('advertises the separate capability only with explicit enablement, keeping v9 intact', async () => {
    const enabled = await (await handleRequest(new Request('https://edge.invalid/'))).json();
    expect(enabled.capabilities).toMatchObject({ ...PROPOSAL_CAPABILITIES, canvas_contract_version: 'offkin-canvas-v9', canvas_stages: ['world', 'physical'] });
    expect(hasProposalCapabilities(enabled)).toBe(true);
    delete state.env.BRICK_PROPOSAL_ENABLED;
    const disabled = await (await handleRequest(new Request('https://edge.invalid/'))).json();
    expect(disabled.ready).toBe(true); expect(hasProposalCapabilities(disabled)).toBe(false);
    expect((await post(worldRequest)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it('creates all four actual images with the correct byte references and private lineage', async () => {
    const { world, physical } = await pair();
    const details = await generate(supplement('details', world, physical));
    const packaging = await generate(supplement('packaging', world, physical));
    expect(state.textCalls).toBe(4); expect(state.imageCalls).toBe(4); expect(state.rows).toHaveLength(4);
    expect(world.sourceImageIds).toEqual([]);
    expect(physical.sourceImageIds).toEqual([world.id]);
    expect(details.sourceImageIds).toEqual([physical.id]);
    expect(packaging.sourceImageIds).toEqual([physical.id, world.id]);
    const calls = imageCalls();
    expect(calls.map(([url]) => String(url).split('/').at(-1))).toEqual(['generations', 'edits', 'edits', 'edits']);
    expect(JSON.parse(String(calls[0][1]?.body))).not.toHaveProperty('images');
    for (const [i, count] of [[1, 1], [2, 1], [3, 2]]) {
      const body = JSON.parse(String(calls[i][1]?.body));
      expect(body).toMatchObject({ model: 'openai/gpt-image-2', n: 1, size: '1536x1024', quality: 'medium' });
      expect(body.images).toEqual(Array.from({ length: count }, () => ({ image_url: `data:image/png;base64,${png}` })));
      expect(body).not.toHaveProperty('input_fidelity');
      expect(body.prompt).toContain(JSON.stringify(worldRequest.context.exactWording).slice(1, -1));
    }
    expect(state.download).toHaveBeenCalledWith('brick-concepts', expect.stringMatching(/\.png$/));
    for (const row of state.rows) expect(parseProposalManifest(String(row.story))?.stageVersion).toBe(PROPOSAL_STAGE_VERSION);
  });
  it('conditions revisions on the actual previous image as well as current upstream images', async () => {
    const { world, physical } = await pair();
    const packaging = await generate(supplement('packaging', world, physical));
    const updated = await generate({ ...supplement('packaging', world, physical), previousAssetId: packaging.id, context: { ...worldRequest.context, revisionNotes: 'Dark blue packaging only.' } });
    expect(updated.sourceImageIds).toEqual([physical.id, world.id]);
    expect(updated).not.toHaveProperty('previousAssetId');
    const privateManifest = parseProposalManifest(String(state.rows.find(row => row.id === updated.id)!.story))!;
    expect(privateManifest.previousAssetId).toBe(packaging.id);
    expect(privateManifest.sourceImageIds).toEqual([packaging.id, physical.id, world.id]);
    expect(updated.sourcePhysicalId).toBe(physical.id); expect(updated.sourceWorldId).toBe(world.id);
    expect(JSON.parse(String(imageCalls().at(-1)![1]?.body)).images).toHaveLength(3);
    const revisedWorld = await generate({ ...worldRequest, previousAssetId: world.id, context: { ...worldRequest.context, style: 'Bold expressive ink' } });
    expect(revisedWorld.sourceImageIds).toEqual([]);
    expect(revisedWorld).not.toHaveProperty('previousAssetId');
    expect(String(imageCalls().at(-1)![0])).toContain('/images/edits');
    const restored = await (await post({ id: updated.id })).json();
    expect(restored.concept).toEqual(updated);
    expect(JSON.stringify(restored)).not.toContain(packaging.id);
    expect(isProposalConcept({ ...updated, previousAssetId: packaging.id })).toBe(false);
  });
  it('rejects unrelated previous assets but permits a coherent complete-version revision', async () => {
    const { world, physical } = await pair();
    const details = await generate(supplement('details', world, physical));
    const packaging = await generate(supplement('packaging', world, physical));
    const unrelatedContext = { ...worldRequest.context, revisionNotes: 'An unrelated new conversation' };
    const otherWorld = await generate({ ...worldRequest, context: unrelatedContext });
    const otherPhysical = await generate({ ...physicalRequest(otherWorld), context: unrelatedContext });
    const otherDetails = await generate({ ...supplement('details', otherWorld, otherPhysical), context: unrelatedContext });
    vi.mocked(fetch).mockClear();
    expect((await post({ ...physicalRequest(world), previousAssetId: otherPhysical.id })).status).toBe(400);
    expect((await post({ ...supplement('details', world, physical), previousAssetId: otherDetails.id })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    const nextContext = { ...worldRequest.context, style: 'Blue architectural illustration' };
    const nextWorld = await generate({ ...worldRequest, context: nextContext, previousAssetId: world.id });
    const nextPhysical = await generate({ ...physicalRequest(nextWorld), context: nextContext, previousAssetId: physical.id });
    const nextDetails = await generate({ ...supplement('details', nextWorld, nextPhysical), context: nextContext, previousAssetId: details.id });
    const nextPackaging = await generate({ ...supplement('packaging', nextWorld, nextPhysical), context: nextContext, previousAssetId: packaging.id });
    expect(nextDetails.sourcePhysicalId).toBe(nextPhysical.id); expect(nextPackaging.sourceWorldId).toBe(nextWorld.id);
  });
  it('keeps all multi-hop capability IDs out of model prompts and public restores', async () => {
    const { world, physical } = await pair();
    const first = await generate(supplement('packaging', world, physical));
    const firstRow = state.rows.find(row => row.id === first.id)!;
    const hiddenOlderId = crypto.randomUUID();
    firstRow.story = serializeProposalManifest({ ...parseProposalManifest(String(firstRow.story))!, design: `Old narrative accidentally included ${hiddenOlderId}.` });
    vi.mocked(fetch).mockClear();
    const second = await generate({ ...supplement('packaging', world, physical), previousAssetId: first.id, context: { ...worldRequest.context, revisionNotes: 'Blue box only' } });
    const third = await generate({ ...supplement('packaging', world, physical), previousAssetId: second.id, context: { ...worldRequest.context, revisionNotes: 'Green box only' } });
    state.output = { scope: 'packaging', context: { ...third.context, revisionNotes: 'Red box only' }, summary: 'Change only the package colour.' };
    const planned = await post({ ...planRequest(world, physical), context: third.context, packagingId: third.id });
    expect(planned.status).toBe(200);
    for (const [, init] of vi.mocked(fetch).mock.calls) {
      const body = String(init?.body);
      expect(body).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      expect(body).not.toContain('previousAssetId'); expect(body).not.toContain('sourceImageIds');
    }
    const restored = await (await post({ id: third.id })).json();
    for (const id of [first.id, second.id, hiddenOlderId]) expect(JSON.stringify(restored)).not.toContain(id);
    const privateManifest = parseProposalManifest(String(state.rows.find(row => row.id === third.id)!.story))!;
    expect(privateManifest.previousAssetId).toBe(second.id);
  });
  it('rejects capability echoes in narrative and revision responses before they become public', async () => {
    const { world, physical } = await pair();
    const packaging = await generate(supplement('packaging', world, physical));
    const next = await generate({ ...supplement('packaging', world, physical), previousAssetId: packaging.id, context: { ...worldRequest.context, revisionNotes: 'Blue box only' } });
    const before = state.imageCalls;
    state.output = { ...design, story: `Previous package reference: ${packaging.id}` };
    const failedImage = await post({ ...supplement('packaging', world, physical), previousAssetId: next.id, context: { ...worldRequest.context, revisionNotes: 'Green box only' } });
    expect(failedImage.status).toBe(502); expect(await failedImage.text()).not.toContain(packaging.id);
    state.output = { scope: 'packaging', context: next.context, summary: `Open ${packaging.id}` };
    const failedPlan = await post({ ...planRequest(world, physical), context: next.context, packagingId: next.id });
    expect(failedPlan.status).toBe(502); expect(await failedPlan.text()).not.toContain(packaging.id);
    expect(state.imageCalls).toBe(before);
  });
  it('preserves an explicitly supplied non-capability identifier in exact wording', async () => {
    const customerReference = crypto.randomUUID();
    const context = { ...worldRequest.context, exactWording: `Reference ${customerReference}` };
    state.output = { ...design, story: `A concept for reference ${customerReference}.` };
    const result = await generate({ ...worldRequest, context });
    expect(result.context.exactWording).toBe(context.exactWording);
    expect(String(imageCalls().at(-1)![1]?.body)).toContain(customerReference);
  });
  it('caches exact completed assets while changed notes, roles and source identities cannot collide', async () => {
    const { world, physical } = await pair();
    const first = await generate(supplement('packaging', world, physical));
    const again = await generate(supplement('packaging', world, physical));
    expect(again.id).toBe(first.id); expect(state.imageCalls).toBe(3);
    await generate({ ...supplement('packaging', world, physical), context: { ...worldRequest.context, revisionNotes: 'Blue box' } });
    await generate(supplement('details', world, physical));
    expect(state.imageCalls).toBe(5);
  });
  it('includes actual reference bytes in cache identity rather than signed URLs', async () => {
    const { world, physical } = await pair();
    const first = await generate(supplement('details', world, physical));
    const row = state.rows.find(row => row.id === physical.id)!;
    state.blobs.set(String(row.image_path), Uint8Array.from([...Buffer.from(png, 'base64'), 10]));
    const second = await generate(supplement('details', world, physical));
    expect(second.id).not.toBe(first.id);
    expect(JSON.parse(String(imageCalls().at(-1)![1]?.body)).images[0].image_url).not.toBe(`data:image/png;base64,${png}`);
  });
  it('restores all roles with generation disabled and no paid calls', async () => {
    const { world, physical } = await pair(); const details = await generate(supplement('details', world, physical));
    vi.mocked(fetch).mockClear(); state.env.BRICK_GENERATION_ENABLED = 'false'; delete state.env.LOVABLE_API_KEY; delete state.env.BRICK_PROPOSAL_ENABLED;
    const result = await (await post({ id: details.id })).json();
    expect(result.concept).toEqual(details); expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps successful sections when a later provider/save fails and a repeat restores earlier cache', async () => {
    const { world, physical } = await pair(); const details = await generate(supplement('details', world, physical));
    state.saveError = true;
    expect((await post(supplement('packaging', world, physical))).status).toBe(503);
    expect(state.rows).toHaveLength(3); expect(state.remove).toHaveBeenCalledOnce();
    state.saveError = false;
    const before = state.imageCalls;
    expect((await generate(supplement('details', world, physical))).id).toBe(details.id);
    expect(state.imageCalls).toBe(before);
    await generate(supplement('packaging', world, physical)); expect(state.imageCalls).toBe(before + 1);
  });
  it.each([
    { ...worldRequest, images: [{ image_url: 'http://127.0.0.1/secret' }] },
    { ...worldRequest, sourceWorldId: 'https://evil.invalid/image.png' },
    { ...worldRequest, previousAssetId: 'https://evil.invalid/image.png' },
    { ...worldRequest, stage: 'exploded' },
    { ...worldRequest, stage: 'packaging' },
    { ...worldRequest, context: { ...worldRequest.context, unknown: 'value' } },
    { ...worldRequest, context: { business: 'x'.repeat(6001) } },
  ])('rejects malformed requests before providers: %j', async request => {
    expect((await post(request)).status).toBe(400); expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects wrong stage, physical lineage, current context and untrusted stored paths before providers', async () => {
    const { world, physical } = await pair(); vi.mocked(fetch).mockClear();
    expect((await post({ ...supplement('details', world, physical), sourceWorldId: physical.id })).status).toBe(400);
    expect((await post({ ...supplement('details', world, physical), context: { ...worldRequest.context, revisionNotes: 'Other product' } })).status).toBe(400);
    expect((await post({ ...supplement('packaging', world, physical), context: { ...worldRequest.context, interaction: 'Click' } })).status).toBe(400);
    expect((await post({ ...physicalRequest(world), selectedElementIds: ['missing'], heroElementId: 'missing' })).status).toBe(400);
    state.rows.find(row => row.id === world.id)!.image_path = 'https://127.0.0.1/private.png';
    expect((await post(physicalRequest(world))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed when source downloads fail or exceed the private bucket limit', async () => {
    const { world, physical } = await pair(); vi.mocked(fetch).mockClear();
    state.downloadError = true; expect((await post(supplement('details', world, physical))).status).toBe(503);
    state.downloadError = false; state.fakeDownloadSize = 10 * 1024 * 1024 + 1;
    expect((await post(supplement('details', world, physical))).status).toBe(400); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['http://127.0.0.1/', 'https://localhost/', 'https://169.254.169.254/', 'https://user:pass@studio.example/'])('retains website SSRF rejection for %s', async brand => {
    expect((await post({ ...worldRequest, brand })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled(); expect(state.readWebsite).not.toHaveBeenCalled();
  });
  it('preserves generation, quota and model gates without a text-only fallback', async () => {
    state.env.BRICK_ENFORCE_DAILY_LIMITS = 'true'; state.allowed = false;
    expect((await post(worldRequest)).status).toBe(429); expect(fetch).not.toHaveBeenCalled();
    state.allowed = true; state.env.BRICK_PROPOSAL_IMAGE_MODEL = 'unknown/image-model';
    expect((await post(worldRequest)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
    delete state.env.BRICK_PROPOSAL_IMAGE_MODEL; state.env.BRICK_GENERATION_ENABLED = 'false';
    expect((await post(worldRequest)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it('stops before the image provider if cancelled after design generation', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { controller.abort(); return response({ choices: [{ message: { content: JSON.stringify(design) } }] }); }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499); expect(fetch).toHaveBeenCalledOnce(); expect(state.upload).not.toHaveBeenCalled();
  });
  it.each([{ data: [] }, { data: [{ b64_json: 'not-an-image' }] }, { data: [{ b64_json: Buffer.from('<svg/>').toString('base64') }] }])('rejects invalid generated image data', async imageOutput => {
    state.imageOutput = imageOutput; expect((await post(worldRequest)).status).toBe(502); expect(state.upload).not.toHaveBeenCalled();
  });
  it('permits existing private v9 world and physical references without changing v9 rows', async () => {
    const worldId = crypto.randomUUID(); const physicalId = crypto.randomUUID();
    const common = { contractVersion: 'offkin-canvas-v9' as const, context: worldRequest.context, story: design.story, design: design.design, worldElements: elements };
    state.rows.push({ id: worldId, brand: design.brand, title: design.title, story: serializeCanvasManifest({ ...common, stage: 'world' }), image_path: `${worldId}.png`, prompt_version: 'offkin-canvas-v9' });
    state.rows.push({ id: physicalId, brand: design.brand, title: design.title, story: serializeCanvasManifest({ ...common, stage: 'physical', sourceWorldId: worldId, selectedElementIds: elements.map(e => e.id), heroElementId: elements[0].id, replacements: [] }), image_path: `${physicalId}.png`, prompt_version: 'offkin-canvas-v9' });
    state.blobs.set(`${worldId}.png`, Buffer.from(png, 'base64')); state.blobs.set(`${physicalId}.png`, Buffer.from(png, 'base64'));
    const result = await generate({ ...worldRequest, stage: 'packaging', sourceWorldId: worldId, sourcePhysicalId: physicalId });
    expect(result.sourceImageIds).toEqual([physicalId, worldId]); expect(state.rows[0].prompt_version).toBe('offkin-canvas-v9');
  });
});

describe('bounded conversational revision planning', () => {
  it('plans packaging-only changes without image calls or changing the approved object', async () => {
    const { world, physical } = await pair(); const before = state.imageCalls;
    state.output = { scope: 'packaging', context: { ...worldRequest.context, revisionNotes: 'Dark blue box; preserve the object.' }, summary: 'Update only the packaging.' };
    const result = await (await post(planRequest(world, physical))).json();
    expect(result.plan.scope).toBe('packaging'); expect(result.plan.context.exactWording).toBe(worldRequest.context.exactWording);
    expect(state.imageCalls).toBe(before); expect(state.rows).toHaveLength(2);
  });
  it('returns genuine element replacements for a physical revision and uses them downstream', async () => {
    const { world, physical } = await pair();
    const request = { ...planRequest(world, physical), instruction: 'Replace the house with a café.' };
    const replacement = { id: 'element-0', label: 'Neighbourhood café', description: 'A proposed warm café replacing the paper house.' };
    state.output = { scope: 'physical', context: { ...worldRequest.context, revisionNotes: request.instruction }, summary: 'Replace the house with a café.', selectedElementIds: elements.map(e => e.id), heroElementId: 'element-0', replacements: [replacement] };
    const result = await (await post(request)).json();
    expect(result.plan).toMatchObject({ scope: 'physical', replacements: [replacement] });
    state.output = null;
    const updated = await generate({ ...physicalRequest(world), context: result.plan.context, previousAssetId: physical.id, replacements: result.plan.replacements });
    expect(updated.worldElements[0]).toEqual({ ...replacement, kind: 'proposal' });
  });
  it('rejects unknown replacement IDs and packaging selection changes', async () => {
    const { world, physical } = await pair();
    for (const output of [
      { scope: 'physical', context: worldRequest.context, summary: 'Change an element.', selectedElementIds: ['missing'], heroElementId: 'missing', replacements: [] },
      { scope: 'packaging', context: worldRequest.context, summary: 'Change packaging.', selectedElementIds: ['element-0'] },
    ]) {
      state.output = output; expect((await post(planRequest(world, physical))).status).toBe(502);
    }
  });
  it('rejects contradictory narrow plans rather than silently broadening paid generation', async () => {
    const { world, physical } = await pair();
    state.output = { scope: 'packaging', context: { ...worldRequest.context, style: 'Vivid purple ink' }, summary: 'Change the visual style.' };
    expect((await post(planRequest(world, physical))).status).toBe(502);
    state.output = { scope: 'packaging', context: { ...worldRequest.context, interaction: 'Slide to discover' }, summary: 'Change the action.' };
    expect((await post(planRequest(world, physical))).status).toBe(502);
    state.output = { scope: 'physical', context: { ...worldRequest.context, brandIdentifiers: 'New global purple palette' }, summary: 'Change the brand colours.' };
    expect((await post(planRequest(world, physical))).status).toBe(502);
    expect(state.imageCalls).toBe(2);
  });
  it('preserves exact wording unless explicitly evidenced, and returns clarification without images', async () => {
    const { world, physical } = await pair(); const before = state.imageCalls;
    state.output = { scope: 'world', context: { ...worldRequest.context, exactWording: 'Invented slogan' }, summary: 'Fresh slogan.' };
    const result = await (await post(planRequest(world, physical))).json();
    expect(result.clarification).toContain('exact wording'); expect(result).not.toHaveProperty('plan'); expect(state.imageCalls).toBe(before);
    const request = { ...planRequest(world, physical), instruction: 'Change the text to Hello 世界.' };
    state.output = { scope: 'world', context: { ...worldRequest.context, exactWording: 'Hello 世界' }, summary: 'Use the requested words.', exactWordingEvidence: request.instruction };
    expect((await (await post(request)).json()).plan.context.exactWording).toBe('Hello 世界');
  });
  it('supports one bounded clarification and rejects malformed or oversized revision outputs', async () => {
    const { world, physical } = await pair();
    state.output = { clarification: 'Should the café replace the house or stand beside it?' };
    expect((await (await post(planRequest(world, physical))).json()).clarification).toContain('café');
    state.output = { scope: 'invented', context: {}, summary: 'No' };
    expect((await post(planRequest(world, physical))).status).toBe(502);
    expect(() => parseRevisionPlan({ scope: 'world', context: { business: 'x'.repeat(6001) }, summary: 'Too long.' }, planRequest(world, physical))).toThrow();
  });
});
