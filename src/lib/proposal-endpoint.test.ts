// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  PROPOSAL_CONTRACT_VERSION, PROPOSAL_CAPABILITIES, PROPOSAL_STAGE_VERSION,
  hasProposalCapabilities, isProposalConcept, parseProposalManifest, parseRevisionPlan, serializeProposalManifest,
  type ProposalConcept, type ProposalRequest, type RevisionPlanRequest,
} from '../../supabase/functions/generate-concept/proposal';
import { makeProductPlan } from '../test/product-plan-fixture';
import { legacyRockerRequest } from '../test/legacy-rocker-request';
import { serializeCanvasManifest } from '../../supabase/functions/generate-concept/canvas';

const state = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>, rows: [] as Record<string, unknown>[],
  blobs: new Map<string, Uint8Array>(), allowed: true, dbError: false, uploadError: false, saveError: false,
  downloadError: false, fakeDownloadSize: 0, output: null as unknown, repairOutput: undefined as unknown, imageOutput: null as unknown,
  promptRevision: 'test-prompt-v1', requireConstructionIntent: false,
  proposalRuntime: vi.fn(), reserve: vi.fn(),
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
// These historical provider/repair tests deliberately opt into the legacy ProductPlan path.
// They do not represent the public preview gate, tested separately without a handler adapter.
vi.mock('../../supabase/functions/generate-concept/proposal-handler', async importOriginal => {
  const original = await importOriginal<typeof import('../../supabase/functions/generate-concept/proposal-handler')>();
  return { ...original, handleProposal: (...[input, request, runtime]: Parameters<typeof original.handleProposal>) => {
    state.proposalRuntime(runtime);
    return original.handleProposal(input, request, { ...runtime, generationMode:'legacy-engineering', requireCustomerIdentity:false,
      requireConstructionIntent: state.requireConstructionIntent,
      reserve: async () => { state.reserve(); await runtime.reserve(); },
    });
  } };
});
vi.mock('../../supabase/functions/generate-concept/proposal-prompt', async importOriginal => {
  const original = await importOriginal<typeof import('../../supabase/functions/generate-concept/proposal-prompt')>();
  return { ...original, get PROPOSAL_PROMPT_REVISION() { return state.promptRevision; } };
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
  state.downloadError = false; state.fakeDownloadSize = 0; state.output = null; state.repairOutput = undefined; state.imageOutput = null; state.textCalls = 0; state.imageCalls = 0;
  state.promptRevision = 'test-prompt-v1'; state.requireConstructionIntent = false;
  for (const fn of [state.proposalRuntime, state.reserve, state.rpc, state.upload, state.download, state.remove, state.sign, state.readWebsite]) fn.mockReset();
  state.readWebsite.mockResolvedValue({ url: 'https://studio.example/', title: 'Paper Studio', excerpt: 'We make stationery.' });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/chat/completions')) {
      state.textCalls++;
      const sent = JSON.parse(String(init?.body)); const direction = JSON.parse(sent.messages[1].content);
      const plan = direction.sourcePhysical ? {} : { productPlan: makeProductPlan((direction.selectedElements || elements).map((e: {id:string}) => e.id)) };
      const output = Object.prototype.hasOwnProperty.call(direction, 'invalidProductPlan')
        ? state.repairOutput !== undefined ? state.repairOutput : { productPlan: direction.invalidProductPlan }
        : state.output || { ...design, ...plan };
      return response({ choices: [{ message: { content: JSON.stringify(output) } }] });
    }
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
function multipartBody(value: unknown): FormData {
  expect(value).toBeInstanceOf(FormData);
  return value as FormData;
}
function modelPayloadText(value: unknown): string {
  return value instanceof FormData ? JSON.stringify(Array.from(value.entries()).map(([key, part]) =>
    [key, typeof part === 'string' ? part : { name: part.name, type: part.type, size: part.size }])) : String(value);
}

describe('offline historical construction-intent gate with mocked providers only', () => {
  beforeEach(() => {
    state.requireConstructionIntent = true;
    state.env.BRICK_ENFORCE_DAILY_LIMITS = 'true';
  });
  const expectNoGeneration = () => {
    expect(state.proposalRuntime).toHaveBeenCalledWith(expect.objectContaining({ generationMode: 'creative-preview' }));
    expect(state.textCalls).toBe(0); expect(state.imageCalls).toBe(0);
    expect(state.reserve).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled(); expect(state.readWebsite).not.toHaveBeenCalled();
    expect(state.upload).not.toHaveBeenCalled(); expect(state.download).not.toHaveBeenCalled();
  };
  const expectConstructionClarification = async (request: unknown) => {
    const result = await post(request);
    const body = await result.json();
    expect(result.status).toBe(200);
    expect(body).toEqual({ needsConstruction: true, clarification: expect.any(String) });
    expect(body.clarification.trim()).not.toBe('');
    expectNoGeneration();
  };

  it('advertises current preview capability while old tests exercise engineering', async () => {
    const readiness = await (await handleRequest(new Request('https://edge.invalid/'))).json();
    expect(PROPOSAL_CAPABILITIES).toHaveProperty('proposal_concept_preview_version', 'concept-preview-v1');
    expect(readiness.capabilities).toMatchObject(PROPOSAL_CAPABILITIES);
    expect(hasProposalCapabilities(readiness)).toBe(true);
    expect(fetch).not.toHaveBeenCalled(); expect(state.reserve).not.toHaveBeenCalled();
  });

  it('clarifies a world request with missing intent before text, images or quota reservation', async () => {
    const before = structuredClone(worldRequest);
    await expectConstructionClarification(worldRequest);
    expect(worldRequest).toEqual(before); expect(state.rows).toHaveLength(0);
  });

  it('clarifies a physical request with missing intent without modifying its legacy source', async () => {
    const worldId = '57e6f841-f55f-49b3-96d7-595ec2132c4f';
    state.rows.push({ id: worldId, brand: design.brand, title: design.title,
      story: serializeProposalManifest({ contractVersion: PROPOSAL_CONTRACT_VERSION, stageVersion: PROPOSAL_STAGE_VERSION,
        stage: 'world', context: worldRequest.context, story: design.story, design: design.design,
        worldElements: elements, sourceImageIds: [] }),
      image_path: `${worldId}.png`, prompt_version: PROPOSAL_CONTRACT_VERSION,
    });
    const saved = structuredClone(state.rows);
    const request = { ...worldRequest, stage: 'physical', sourceWorldId: worldId,
      selectedElementIds: elements.map(element => element.id), heroElementId: elements[0].id, replacements: [] };
    const before = structuredClone(request);
    await expectConstructionClarification(request);
    expect(request).toEqual(before); expect(state.rows).toEqual(saved);
  });

  it('clarifies a synthetic unsupported rocker/gravity brief without rewriting it or generating', async () => {
    const before = structuredClone(legacyRockerRequest);
    expect(legacyRockerRequest.context.interaction).toBe('Press the moth to drive a rocker lever that raises an archive marker. Release for a proposed gravity reset.');
    await expectConstructionClarification(legacyRockerRequest);
    expect(state.proposalRuntime).toHaveBeenCalledOnce();
    expect(legacyRockerRequest).toEqual(before); expect(state.rows).toHaveLength(0);
  });

  it.each([
    ['reviewed', true],
    ['construction', { reviewed: true, binding: {} }],
    ['constructionBinding', { reviewed: true }],
    ['requireConstructionIntent', false],
    ['constructionIntent', { version: 'construction-intent-v1', reviewed: true, binding: {} }],
  ])('rejects client %s authority before any provider or quota reservation', async (field, value) => {
    const result = await post({ ...worldRequest, [String(field)]: value });
    expect(result.status).toBe(400);
    expect(await result.json()).toHaveProperty('error');
    expectNoGeneration(); expect(state.rows).toHaveLength(0);
  });
});

describe('legacy ProductPlan compatibility: complete proposal backend with mocked providers only', () => {
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
    expect(new Headers(calls[0][1]?.headers).get('content-type')).toBe('application/json');
    for (const [i, count] of [[1, 1], [2, 1], [3, 2]]) {
      const body = multipartBody(calls[i][1]?.body);
      expect(body.get('model')).toBe('openai/gpt-image-2'); expect(body.get('n')).toBe('1');
      expect(body.get('size')).toBe('1536x1024'); expect(body.get('quality')).toBe('medium');
      expect(body.has('input_fidelity')).toBe(false); expect(body.has('images')).toBe(false);
      expect(new Headers(calls[i][1]?.headers).has('content-type')).toBe(false);
      const parts = body.getAll('image[]'); expect(parts).toHaveLength(count);
      for (const [index, part] of parts.entries()) {
        expect(part).toBeInstanceOf(Blob);
        const file = part as File;
        expect(file.name).toBe(`reference-${index + 1}.png`); expect(file.type).toBe('image/png');
        expect(Buffer.from(await file.arrayBuffer()).toString('base64')).toBe(png);
      }
      expect(body.get('prompt')).toContain(JSON.stringify(worldRequest.context.exactWording).slice(1, -1));
    }
    expect(state.download).toHaveBeenCalledWith('brick-concepts', expect.stringMatching(/\.png$/));
    for (const row of state.rows) expect(parseProposalManifest(String(row.story))?.stageVersion).toBe(PROPOSAL_STAGE_VERSION);
  });
  it('validates a product plan before image generation and carries it unchanged through supplements', async () => {
    const {world, physical} = await pair();
    const details = await generate(supplement('details', world, physical));
    const packaging = await generate(supplement('packaging', world, physical));
    expect(world.productPlan?.status).toBe('unverified-prototype-plan');
    expect(details.productPlan).toEqual(physical.productPlan);
    expect(packaging.productPlan).toEqual(physical.productPlan);
    const prompt = multipartBody(imageCalls()[2][1]?.body).get('prompt');
    expect(prompt).toContain(JSON.stringify(physical.productPlan));
    const restored = await (await post({id:physical.id})).json();
    expect(restored.concept.productPlan).toEqual(physical.productPlan);
    expect(restored.concept).not.toHaveProperty('previousAssetId');
  });
  it.each(['missing', 'wrong-hero', 'unrequested-action'] as const)('rejects %s product logic before an image call', async problem => {
    const plan=makeProductPlan(elements.map(e=>e.id));
    if(problem==='wrong-hero') plan.heroPartId='display-base';
    if(problem==='unrequested-action') {
      plan.actions=[{action:'Press',response:'Reveal',partIds:['story-hero'],validation:{status:'unverified',check:'Test action'}}];
      plan.verificationGates.push({id:'interaction-test',status:'unverified'});
    }
    state.output={...design,...(problem==='missing'?{}:{productPlan:plan})};
    expect((await post(worldRequest)).status).toBe(502);
    expect(state.textCalls).toBe(2);expect(state.imageCalls).toBe(0);expect(state.rows).toHaveLength(0);
  });
  it('uses the product plan action authority despite a stray visual interaction',async()=>{
    const {world,physical}=await pair();state.output={...design,interaction:'Turn a motorized lever and flash every light.'};
    const details=await generate(supplement('details',world,physical));
    expect(details.interaction).toBe('Static display. No mechanical or electronic response is proposed.');
    const prompt=String(multipartBody(imageCalls().at(-1)![1]?.body).get('prompt'));
    expect(prompt).not.toContain('Turn a motorized lever');expect(prompt).toContain('Static display. No mechanical or electronic response is proposed.');
  });
  it('rejects a supplement that changes the accepted product plan', async () => {
    const {world,physical}=await pair(); const plan=structuredClone(physical.productPlan!);plan.silhouette='An unrelated tower';
    state.output={...design,productPlan:plan};
    expect((await post(supplement('packaging',world,physical))).status).toBe(502);
    expect(state.imageCalls).toBe(2);
  });
  it('preserves legacy v10 restores and partial supplements without inventing construction evidence',async()=>{
    const {world,physical}=await pair();
    const row=state.rows.find(r=>r.id===physical.id)!;const manifest=parseProposalManifest(String(row.story))!;delete manifest.productPlan;row.story=serializeProposalManifest(manifest);
    const restored=await(await post({id:physical.id})).json();expect(restored.concept).not.toHaveProperty('productPlan');
    const details=await generate(supplement('details',world,physical));expect(details).not.toHaveProperty('productPlan');
    expect(multipartBody(imageCalls().at(-1)![1]?.body).get('prompt')).toContain('legacy-visual-only-no-construction-plan');
    expect(multipartBody(imageCalls().at(-1)![1]?.body).get('prompt')).toContain('LEGACY VISUAL-ONLY OVERRIDE');
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
    expect(multipartBody(imageCalls().at(-1)![1]?.body).getAll('image[]')).toHaveLength(3);
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
      const body = modelPayloadText(init?.body);
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
    state.output = { ...design, productPlan: makeProductPlan(elements.map(e=>e.id)), story: `A concept for reference ${customerReference}.` };
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
  it('separates revised prompts in cache without invalidating previously saved manifests', async () => {
    const original = await generate(worldRequest);
    expect((await generate(worldRequest)).id).toBe(original.id);
    state.promptRevision = 'test-prompt-v2';
    const updated = await generate(worldRequest);
    expect(updated.id).not.toBe(original.id); expect(state.imageCalls).toBe(2);
    expect(updated.stageVersion).toBe(original.stageVersion);
    expect((await (await post({ id: original.id })).json()).concept).toEqual(original);
  });
  it('includes actual reference bytes in cache identity rather than signed URLs', async () => {
    const { world, physical } = await pair();
    const first = await generate(supplement('details', world, physical));
    const row = state.rows.find(row => row.id === physical.id)!;
    state.blobs.set(String(row.image_path), Uint8Array.from([...Buffer.from(png, 'base64'), 10]));
    const second = await generate(supplement('details', world, physical));
    expect(second.id).not.toBe(first.id);
    const part = multipartBody(imageCalls().at(-1)![1]?.body).get('image[]') as File;
    expect(Buffer.from(await part.arrayBuffer()).toString('base64')).not.toBe(png);
  });
  it('serializes repeated image[] parts in actual reference order with runtime-owned boundaries', async () => {
    const { world, physical } = await pair();
    const packaging = await generate(supplement('packaging', world, physical));
    const order = [packaging.id, physical.id, world.id];
    const expected = order.map((id, index) => {
      const bytes = Uint8Array.from([...Buffer.from(png, 'base64'), index + 1]);
      state.blobs.set(String(state.rows.find(row => row.id === id)!.image_path), bytes);
      return Buffer.from(bytes).toString('base64');
    });
    await generate({ ...supplement('packaging', world, physical), previousAssetId: packaging.id, context: { ...worldRequest.context, revisionNotes: 'Blue packaging only' } });
    const [, init] = imageCalls().at(-1)!;
    expect(new Headers(init?.headers).has('content-type')).toBe(false);
    const wire = new Request('https://gateway.invalid/images/edits', { method: 'POST', headers: init?.headers, body: multipartBody(init?.body) });
    expect(wire.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=.+/);
    const parsed = await wire.formData();
    expect(parsed.get('model')).toBe('openai/gpt-image-2');
    const files = parsed.getAll('image[]') as File[];
    expect(await Promise.all(files.map(async file => Buffer.from(await file.arrayBuffer()).toString('base64')))).toEqual(expected);
    expect(files.map(file => file.name)).toEqual(['reference-1.png', 'reference-2.png', 'reference-3.png']);
    expect(modelPayloadText(parsed)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
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

describe('legacy ProductPlan compatibility: bounded correction with mocked providers only', () => {
  const selectedIds = elements.map(element => element.id);
  const validPlan = () => makeProductPlan(selectedIds);
  const textPayloads = () => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/chat/completions')).map(([, init]) => JSON.parse(String(init?.body)));
  let warnings: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warnings = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => warnings.mockRestore());

  it('makes one correction before one image and preserves every authoritative selection and exact wording', async () => {
    const invalid = validPlan(); invalid.productIntent = 'Detailed proposed construction '.repeat(25);
    const corrected = validPlan();
    state.output = { ...design, productPlan: invalid };
    state.repairOutput = { productPlan: corrected };
    const result = await generate(worldRequest);
    expect(result.productPlan).toEqual(corrected);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
    expect(vi.mocked(fetch).mock.calls.map(([url]) => String(url).split('/').at(-1))).toEqual(['completions', 'completions', 'generations']);
    const correction = textPayloads()[1];
    expect(correction.max_tokens).toBe(5000);
    const payload = JSON.parse(correction.messages[1].content);
    expect(payload.invalidProductPlan).toEqual(invalid);
    expect(payload.issues).toEqual([{ path: 'productPlan.productIntent', code: 'invalid-text' }]);
    expect(payload.authoritative).toMatchObject({ selectedElementIds: selectedIds, selectedElements: elements, heroElementId: elements[0].id, displayOnly: true, context: worldRequest.context });
    expect(payload.authoritative.context.exactWording).toBe(worldRequest.context.exactWording);
    expect(JSON.parse(String(imageCalls()[0][1]?.body)).prompt).toContain(JSON.stringify(corrected));
    expect(JSON.parse(String(imageCalls()[0][1]?.body)).prompt).not.toContain(invalid.productIntent);
    expect(warnings).toHaveBeenCalledWith('ProductPlan validation failed', { stage: 'world', attempt: 1, issues: payload.issues });
    expect(JSON.stringify(warnings.mock.calls)).not.toContain(invalid.productIntent);
  });

  it('does not make a correction call for an already valid plan', async () => {
    const result = await generate(worldRequest);
    expect(result.productPlan).toEqual(validPlan());
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
    expect(textPayloads()[0].messages[0].content).not.toContain('only correction attempt');
    expect(warnings).not.toHaveBeenCalled();
  });

  it.each([false, true])('sends coverage feedback with connectivity failures and keeps one correction: complete=%s', async complete => {
    const invalid = validPlan();
    invalid.parts.push({ ...invalid.parts[1], id: 'connector' }, { ...invalid.parts[1], id: 'end-piece' });
    invalid.joins.push({ ...invalid.joins[0], id: 'second-subassembly', partIds: ['connector', 'end-piece'] });
    invalid.assembly = [
      { step: 1, partIds: ['story-hero', 'connector'], instruction: 'Trial-fit the proposed subassembly.' },
      { step: 2, partIds: ['display-base'], instruction: 'Inspect this component.' },
    ];
    const corrected = structuredClone(invalid);
    corrected.joins.push({ ...corrected.joins[0], id: 'subassembly-link', partIds: ['display-base', 'connector'] });
    corrected.assembly = [
      { step: 1, partIds: ['story-hero', 'display-base'], instruction: 'Trial-fit the first declared join.' },
      { step: 2, partIds: ['connector', 'end-piece'], instruction: 'Trial-fit the second declared join.' },
      ...(complete ? [{ step: 3, partIds: ['display-base', 'connector'], instruction: 'Trial-fit the declared connection between subassemblies.' }] : []),
    ];
    const before = structuredClone({ invalid, corrected });
    state.output = { ...design, productPlan: invalid };
    state.repairOutput = { productPlan: corrected };
    const response = await post(worldRequest);
    expect(response.status).toBe(complete ? 200 : 502);
    const body = await response.json();
    expect(state.textCalls).toBe(2);
    expect(state.imageCalls).toBe(complete ? 1 : 0);
    expect(state.rows).toHaveLength(complete ? 1 : 0);
    const correction = JSON.parse(textPayloads()[1].messages[1].content);
    expect(correction.invalidProductPlan).toEqual(invalid);
    expect(correction.issues).toContainEqual({ path: 'productPlan.joins', code: 'disconnected-parts' });
    expect(correction.issues).toContainEqual({ path: 'productPlan.assembly[0].partIds', code: 'disconnected-assembly' });
    expect(correction.issues).toContainEqual({ path: 'productPlan.assembly', code: 'incomplete-assembly' });
    expect(correction.issues).toContainEqual({ path: 'productPlan.parts[3]', code: 'incomplete-assembly' });
    expect(correction.issues).toContainEqual({ path: 'productPlan.joins[0].partIds', code: 'incomplete-assembly' });
    expect(correction.issues).toContainEqual({ path: 'productPlan.joins[1].partIds', code: 'incomplete-assembly' });
    expect({ invalid, corrected }).toEqual(before);
    if (complete) expect(body.concept.productPlan).toEqual(corrected);
    else {
      expect(body.error).toContain('complete connected assembly');
      expect(body.error).toContain('No image was generated');
      expect(body).not.toHaveProperty('issues');
      expect(warnings).toHaveBeenLastCalledWith('ProductPlan validation failed', { stage: 'world', attempt: 2, issues: [
        { path: 'productPlan.assembly', code: 'incomplete-assembly' },
        { path: 'productPlan.joins[2].partIds', code: 'incomplete-assembly' },
      ] });
    }
  });

  it.each(['missing-plan', 'missing-mapping', 'wrong-hero', 'disconnected-assembly', 'display-only-action', 'supplier-claim'] as const)('can correct %s without weakening the final contract', async problem => {
    const plan = validPlan();
    if (problem === 'missing-mapping') plan.parts[0].storyElementIds.pop();
    if (problem === 'wrong-hero') plan.heroPartId = 'display-base';
    if (problem === 'disconnected-assembly') plan.assembly = plan.parts.map((part, index) => ({ step: index + 1, partIds: [part.id], instruction: 'Inspect' }));
    if (problem === 'display-only-action') {
      plan.actions = [{ action: 'Turn', response: 'Reveal', partIds: ['story-hero'], validation: { status: 'unverified', check: 'Prototype' } }];
      plan.verificationGates.push({ id: 'interaction-test', status: 'unverified' });
    }
    if (problem === 'supplier-claim') Object.assign(plan.joins[0].validation, { status: 'supplier-certified' });
    state.output = { ...design, ...(problem === 'missing-plan' ? {} : { productPlan: plan }) };
    state.repairOutput = { productPlan: validPlan() };
    const result = await generate(worldRequest);
    expect(result.productPlan).toEqual(validPlan());
    expect(result.productPlan!.actions).toEqual([]);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
  });

  it('corrects a coherent but oversized plan without losing selections or raising the accepted bound', async () => {
    const invalid = validPlan();
    invalid.parts = Array.from({ length: 10 }, (_, index) => ({ ...invalid.parts[0], id: index === 0 ? 'story-hero' : `piece-${index}`, storyElementIds: index === 0 ? selectedIds : [], form: 'f'.repeat(320), printStrategy: 'p'.repeat(320), finish: 'c'.repeat(240) }));
    invalid.joins = invalid.parts.slice(1).map((part, index) => ({ ...invalid.joins[0], id: `join-${index}`, partIds: ['story-hero', part.id] }));
    invalid.assembly[0].partIds = invalid.parts.map(part => part.id);
    expect(JSON.stringify(invalid).length).toBeGreaterThan(10000);
    state.output = { ...design, productPlan: invalid };
    state.repairOutput = { productPlan: validPlan() };
    await generate(worldRequest);
    const payload = JSON.parse(textPayloads()[1].messages[1].content);
    expect(payload.issues).toEqual([{ path: 'productPlan', code: 'plan-too-large' }]);
    expect(payload.invalidProductPlan).toEqual(invalid);
    expect(payload.authoritative.selectedElementIds).toEqual(selectedIds);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
  });

  it('keeps a failed revision out of storage and stops after one still-invalid correction', async () => {
    const { world, physical } = await pair();
    const accepted = structuredClone(state.rows);
    state.textCalls = 0; state.imageCalls = 0;
    const invalid = validPlan(); invalid.parts[0].storyElementIds = [];
    state.output = { ...design, productPlan: invalid };
    state.repairOutput = { productPlan: invalid };
    const result = await post({ ...physicalRequest(world), previousAssetId: physical.id, context: { ...worldRequest.context, revisionNotes: 'Keep every story meaning; refine the crest shape.' } });
    const body = await result.json();
    expect(result.status).toBe(502);
    expect(body.error).toContain('selected story elements and hero');
    expect(body.error).toContain('No image was generated');
    expect(body).not.toHaveProperty('issues');
    expect(body.error).not.toContain('productPlan');
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(state.rows).toEqual(accepted);
    expect(warnings).toHaveBeenLastCalledWith('ProductPlan validation failed', { stage: 'physical', attempt: 2, issues: expect.any(Array) });
  });

  it.each([null, [], {}, { productPlan: null }, { productPlan: validPlan(), extra: 'unrequested output' }])('rejects invalid correction envelopes without another provider call', async repaired => {
    state.output = design; state.repairOutput = repaired;
    expect((await post(worldRequest)).status).toBe(502);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(state.rows).toHaveLength(0);
  });

  it('stops before correction if cancellation arrives with the first text response', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { state.textCalls++; controller.abort(); return response({ choices: [{ message: { content: JSON.stringify(design) } }] }); }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0);
    expect(state.upload).not.toHaveBeenCalled();
  });

  it('stops before images if cancellation arrives during the correction', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      expect(url).toContain('/chat/completions'); state.textCalls++;
      if (state.textCalls === 2) controller.abort();
      return response({ choices: [{ message: { content: JSON.stringify(state.textCalls === 1 ? design : { productPlan: validPlan() }) } }] });
    }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(state.upload).not.toHaveBeenCalled(); expect(state.rows).toHaveLength(0);
  });

  it.each(['saved-source', 'invented'] as const)('rejects a %s UUID echo in corrected plan before images', async kind => {
    const world = await generate(worldRequest); state.textCalls = 0; state.imageCalls = 0; vi.mocked(fetch).mockClear();
    const leaked = kind === 'saved-source' ? world.id : 'b3a06249-4f68-496c-8d8b-cec758811f11';
    state.output = design;
    const repaired = validPlan(); repaired.productIntent = `Preserve reference ${leaked}`;
    state.repairOutput = { productPlan: repaired };
    const result = await post(physicalRequest(world));
    expect(result.status).toBe(502);
    expect((await result.json()).error).toContain('unexpected saved reference');
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(state.rows).toHaveLength(1);
    for (const payload of textPayloads()) expect(JSON.stringify(payload)).not.toContain(world.id);
    expect(JSON.stringify(warnings.mock.calls)).not.toContain(leaked);
  });

  it('rejects privacy leakage in the invalid original response before any correction transmission', async () => {
    const invalid = validPlan(); invalid.productIntent = 'Unknown reference b3a06249-4f68-496c-8d8b-cec758811f11';
    state.output = { ...design, productPlan: invalid };
    expect((await post(worldRequest)).status).toBe(502);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0); expect(warnings).not.toHaveBeenCalled();
  });

  it('does not truncate or transmit an invalid plan beyond the correction input ceiling', async () => {
    const invalid = validPlan(); invalid.productIntent = 'x'.repeat(33000);
    state.output = { ...design, productPlan: invalid };
    const result = await post(worldRequest);
    expect(result.status).toBe(502);
    expect((await result.json()).error).toContain('concise proposal');
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0);
    expect(invalid.productIntent).toHaveLength(33000);
  });

  it('preserves the historical spring-return QA context on the explicit legacy correction path', async () => {
    // Historical assistant-authored transport fixture only, not the reviewed rocker/gravity brief.
    // This legacy-path test does not assert deployed construction acceptance or fabrication evidence.
    const context: ProposalRequest['context'] = {
      "business": "Tesla develops electric vehicles, charging, solar power and battery energy storage. Create a compact physical desk collectible as a corporate gift for clients and partners. Its story is sunlight to home to storage to driving. Use one tapering three-tier silhouette, an oversized sun at upper left, one supported looping red road, one fixed red car, a solar-roof home, a battery-storage block and two small white companion figures. Keep generous gaps and a few bold, charming, deliberately disproportionate forms. Propose separate parts and an assembly sequence for later print and prototype review. Specifications are prototype proposals; exact scale is unresolved. Do not claim CAD readiness, verified printability or working hardware.",
      "audience": "Clients & partners",
      "angle": "Sunlight, home, storage and driving become one compact, playful gift. A simple mechanical sun press makes the clean-energy connection tangible.",
      "style": "Compact sculptural desk collectible; tapering three tiers, chunky separable forms, few parts, soft radii, supported red loop, oversized sun. Product photography with tactile matte surfaces.",
      "interaction": "Press the sun plunger; a proposed lever lifts an energy marker beside storage, then a return spring resets it. Keep the red car fixed. Mechanical only: no lights, electronics or working solar power.",
      "brandIdentifiers": "Recognizable TESLA wordmark and T on the base; red-and-white identity with cream body, red road and fixed car, charcoal solar panels, yellow sun and muted green trees. EV, solar, storage and charging motifs only. No slogans, rockets, SpaceX or Mars.",
      "exactWording": "TESLA",
      "mode": "mechanical"
};
    const corrected = validPlan();
    corrected.actions = [{ action: 'Press the sun plunger', response: 'A proposed lever lifts the energy marker; a return spring resets it.', partIds: ['story-hero', 'display-base'], validation: { status: 'unverified', check: 'Review the proposed linkage in CAD and test force, travel, retention and reset with a physical prototype.' } }];
    corrected.verificationGates.push({ id: 'interaction-test', status: 'unverified' });
    const invalid = structuredClone(corrected); invalid.assembly[0].step = 0;
    state.output = { ...design, productPlan: invalid };
    state.repairOutput = { productPlan: corrected };
    const result = await generate({ ...worldRequest, context });
    expect(result.productPlan).toEqual(corrected);
    const payload = JSON.parse(textPayloads()[1].messages[1].content);
    expect(payload.authoritative.context).toEqual(context);
    expect(payload.authoritative.displayOnly).toBe(false);
    expect(result.productPlan!.actions).toHaveLength(1);
    expect(result.productPlan!.verificationGates).toContainEqual({ id: 'interaction-test', status: 'unverified' });
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
  });

  it('does not retry a provider failure during correction', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      state.textCalls++;
      return state.textCalls === 1 ? response({ choices: [{ message: { content: JSON.stringify(design) } }] }) : new Response('Unavailable', { status: 503 });
    }));
    expect((await post(worldRequest)).status).toBe(503);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(state.rows).toHaveLength(0);
  });

  it('fails safely after malformed correction JSON without a third text call', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      state.textCalls++;
      return response({ choices: [{ message: { content: state.textCalls === 1 ? JSON.stringify(design) : '{"productPlan":' } }] });
    }));
    const result = await post(worldRequest);
    expect(result.status).toBe(502);
    expect((await result.json()).error).toContain('No image was generated');
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(warnings).toHaveBeenLastCalledWith('ProductPlan validation failed', { stage: 'world', attempt: 2, issues: [{ path: 'productPlan', code: 'invalid-object' }] });
  });
});

describe('legacy ProductPlan compatibility: proposal deadlines without real waits', () => {
  let elapsed: number;
  let clock: ReturnType<typeof vi.spyOn>;
  let timeouts: ReturnType<typeof vi.spyOn>;
  let warnings: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    elapsed = 0;
    clock = vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
    timeouts = vi.spyOn(AbortSignal, 'timeout');
    warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { clock.mockRestore(); timeouts.mockRestore(); warnings.mockRestore(); });
  const correctedPlan = () => ({ productPlan: makeProductPlan(elements.map(element => element.id)) });
  const timedProvider = (designMs: number, correctionMs: number, imageMs: number) => {
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const result = await original(url, init);
      elapsed += url.endsWith('/chat/completions') ? state.textCalls === 1 ? designMs : correctionMs : imageMs;
      return result;
    }));
  };

  it('keeps a slow valid design, correction and image within the shared stage window', async () => {
    state.output = design; state.repairOutput = correctedPlan();
    timedProvider(39_000, 24_000, 99_000);
    await generate(worldRequest);
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([40_000, 25_000, 100_000]);
    expect(elapsed).toBe(162_000);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
    expect(state.rows).toHaveLength(1);
  });

  it('clips both text budgets after source preparation without borrowing the image or save reserve', async () => {
    state.readWebsite.mockImplementation(async () => { elapsed += 50_000; return { url: 'https://studio-example.com/', title: 'Paper Studio', excerpt: 'Stationery' }; });
    state.output = design; state.repairOutput = correctedPlan();
    timedProvider(15_000, 4_000, 99_000);
    await generate({ ...worldRequest, brand: 'https://studio-example.com/' });
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([20_000, 5_000, 100_000]);
    expect(elapsed).toBe(168_000);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(1);
  });

  it('refuses even the first text call when preparation leaves no full image/save window', async () => {
    state.readWebsite.mockImplementation(async () => { elapsed += 71_000; return { url: 'https://studio-example.com/', title: 'Paper Studio', excerpt: 'Stationery' }; });
    const result = await post({ ...worldRequest, brand: 'https://studio-example.com/' });
    expect(result.status).toBe(504);
    expect((await result.json()).error).toContain('No image was generated');
    expect(state.textCalls).toBe(0); expect(state.imageCalls).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stops the old 80-second design/80-second correction/80-second image scenario before correction', async () => {
    state.output = design; state.repairOutput = correctedPlan();
    // Simulate a runtime returning after its allotted timeout to verify the elapsed-time guard too.
    timedProvider(80_000, 80_000, 80_000);
    const result = await post(worldRequest);
    expect(result.status).toBe(504);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0);
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([40_000]);
    expect(state.upload).not.toHaveBeenCalled();
  });

  it('refuses a paid image if a late correction consumes its full remaining window', async () => {
    state.output = design; state.repairOutput = correctedPlan();
    timedProvider(40_000, 31_000, 0);
    const result = await post(worldRequest);
    expect(result.status).toBe(504);
    expect((await result.json()).error).toContain('existing images are unchanged');
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([40_000, 25_000]);
    expect(state.rows).toHaveLength(0);
  });

  it('keeps request cancellation authoritative during a bounded correction', async () => {
    const controller = new AbortController();
    state.output = design; state.repairOutput = correctedPlan();
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      const result = await original(url, init);
      if (state.textCalls === 2) { controller.abort(); expect(init?.signal?.aborted).toBe(true); }
      return result;
    }));
    expect((await post(worldRequest, controller.signal)).status).toBe(499);
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([40_000, 25_000]);
    expect(state.textCalls).toBe(2); expect(state.imageCalls).toBe(0);
  });

  it('does not accept a client-supplied timeout override', async () => {
    expect((await post({ ...worldRequest, timeoutMs: 900_000 })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the v9 provider default for both text and image calls', async () => {
    state.output = design;
    const result = await post({ ...worldRequest, contractVersion: 'offkin-canvas-v9' });
    expect(result.status).toBe(200);
    expect(timeouts.mock.calls.map(([ms]) => ms)).toEqual([100_000, 100_000]);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
  });
});

describe('legacy ProductPlan compatibility: bounded conversational revision planning', () => {
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
