// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// Offline generation/reader behavior only. The real, unmocked public hold is
// exercised in server-generation-hold.test.ts; this is not an activation switch.
vi.mock('../../supabase/functions/generate-concept/server-generation-hold', async original => ({
  ...(await original<typeof import('../../supabase/functions/generate-concept/server-generation-hold')>()),
  serverGenerationHeld: () => false,
}));
import {
  PROPOSAL_CAPABILITIES, PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGE_VERSION,
  isProposalConcept, parseProposalManifest, serializeProposalManifest,
  type ProposalConcept, type ProposalRequest,
} from '../../supabase/functions/generate-concept/proposal';
import { constructionInteraction, type ConstructionIntent } from '../../supabase/functions/generate-concept/construction-intent';
import { type BriefVisualChoice } from '../../supabase/functions/generate-concept/brief-construction';
import { legacyRockerRequest } from '../test/legacy-rocker-request';

// Historical construction compiler coverage through an explicit offline legacy adapter.
// Public preview-first behavior is covered without this adapter in proposal-intent-endpoint.test.ts.
const state = vi.hoisted(() => ({
  env: {} as Record<string, string>, rows: [] as Record<string, unknown>[],
  blobs: new Map<string, Uint8Array>(), stage: 'world', action: 'static' as ConstructionIntent['action'],
  output: undefined as unknown,
  textCalls: 0, imageCalls: 0, rpc: vi.fn(), upload: vi.fn(), download: vi.fn(), readWebsite: vi.fn(),
}));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: () => ({
  from: () => ({
    select: () => ({ limit: async () => ({ error: null }),
      eq: (field: string, value: unknown) => ({ maybeSingle: async () => ({ data: state.rows.find(row => row[field] === value) || null, error: null }) }),
    }),
    insert: async (row: Record<string, unknown>) => { state.rows.push(row); return { error: null }; },
  }),
  rpc: (...args: unknown[]) => { state.rpc(...args); return Promise.resolve({ data: true, error: null }); },
  storage: { from: (bucket: string) => ({
    upload: async (path: string, bytes: Uint8Array, options: unknown) => {
      state.upload(bucket, path, bytes, options); state.blobs.set(path, bytes); return { error: null };
    },
    download: async (path: string) => {
      state.download(bucket, path); const bytes = state.blobs.get(path);
      return { data: bytes ? { size: bytes.length, type: 'image/png', arrayBuffer: async () => Uint8Array.from(bytes).buffer } : null,
        error: bytes ? null : new Error('Missing mocked source image') };
    },
    remove: async (paths: string[]) => { paths.forEach(path => state.blobs.delete(path)); return { error: null }; },
    createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://private.invalid/${path}?token=test-only` }, error: null }),
  }) },
}) }));
vi.mock('../../supabase/functions/generate-concept/website', async importOriginal => {
  const original = await importOriginal<typeof import('../../supabase/functions/generate-concept/website')>();
  return { ...original, readCompanyWebsite: (...args: unknown[]) => state.readWebsite(...args) };
});

vi.mock('../../supabase/functions/generate-concept/proposal-handler', async importOriginal => {
  const original = await importOriginal<typeof import('../../supabase/functions/generate-concept/proposal-handler')>();
  return { ...original, handleProposal: (...[input, request, runtime]: Parameters<typeof original.handleProposal>) =>
    original.handleProposal(input, request, { ...runtime, generationMode: 'legacy-engineering', requireConstructionIntent: true }) };
});

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=';
const elements = [
  { id: 'paper-moth', label: 'Folded paper moth', description: 'A broad violet moth with layered folded-paper wings and tactile depth.', kind: 'proposal' as const },
  { id: 'archive-ribbon', label: 'Archive ribbon', description: 'A teal sculptural ribbon curling through open gaps beside the moth.', kind: 'proposal' as const },
];
const design = {
  needsContext: false, brand: 'Nacre Letterworks', title: 'The folded archive',
  story: 'A fictional stationery studio imagined as a dimensional moth and curling archive ribbon.',
  interaction: 'Server-derived', design: 'Server-derived', worldElements: elements,
};
function visual(action: ConstructionIntent['action']): BriefVisualChoice {
  return { version: 'construction-visual-v2', parts: [
    { role: 'body', representation:'single-form', storyElementIds: ['archive-ribbon'], geometry: 'ribbon', profile: 'asymmetric', finish: 'matte', colors: ['#198C86'] },
    { role: 'hero', representation:'single-form', storyElementIds: ['paper-moth'], geometry: 'organic', profile: 'layered', finish: 'selective-color', colors: ['#8156A8', '#DDD3EC'] },
    ...(action === 'press-reveal-manual-reset' ? [{ role: 'retainer' as const, representation:'support' as const, storyElementIds: [], geometry: 'sculpted' as const, profile: 'rounded' as const, finish: 'matte' as const, colors: ['#198C86'] }] : []),
  ] };
}
function worldRequest(action: ConstructionIntent['action']): ProposalRequest {
  const constructionIntent: ConstructionIntent = { version: 'construction-intent-v1', action };
  return { contractVersion: PROPOSAL_CONTRACT_VERSION, stage: 'world', brand: 'no-website', customerIdentity:{version:'customer-brand-v1',name:design.brand}, constructionIntent,
    context: {
      business: 'Nacre Letterworks is a fictional illustrated stationery studio. Create a violet folded-paper moth and a teal archive ribbon as dimensional sculptural forms.',
      style: 'A floating asymmetric folded-paper composition with dimensional fins, a sweeping ribbon and open gaps.',
      exactWording: '  Fold a little wonder\n纸间  ', mode: 'mechanical', interaction: constructionInteraction(constructionIntent),
    },
  };
}
let handleRequest: (request: Request) => Promise<Response>;
const post = (body: unknown) => {
  if (body && typeof body === 'object' && 'stage' in body) state.stage = String(body.stage);
  return handleRequest(new Request('https://edge.invalid/generate-concept', { method: 'POST', body: JSON.stringify(body) }));
};
function globals() {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('Deno', { env: { get: (key: string) => state.env[key] }, serve: vi.fn() });
}
beforeAll(async () => {
  globals();
  const path = '../../supabase/functions/generate-concept/index.ts';
  handleRequest = (await import(path)).handleRequest;
});
beforeEach(() => {
  globals();
  state.env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-server-only', LOVABLE_API_KEY: 'test-not-real',
    BRICK_GENERATION_ENABLED: 'true', BRICK_PROPOSAL_ENABLED: 'true', BRICK_ENFORCE_DAILY_LIMITS: 'true' };
  state.rows = []; state.blobs.clear(); state.stage = 'world'; state.action = 'static'; state.output = undefined; state.textCalls = 0; state.imageCalls = 0;
  for (const mock of [state.rpc, state.upload, state.download, state.readWebsite]) mock.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/chat/completions')) {
      state.textCalls++;
      const output = state.output ?? { ...design, ...(['world', 'physical'].includes(state.stage) ? { constructionVisual: visual(state.action) } : {}) };
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] }), { status: 200 });
    }
    if (url.endsWith('/images/generations') || url.endsWith('/images/edits')) {
      state.imageCalls++; return new Response(JSON.stringify({ data: [{ b64_json: png }] }), { status: 200 });
    }
    throw new Error(`Unexpected network target: ${url}`);
  }));
});
afterEach(() => vi.unstubAllGlobals());
async function generate(request: ProposalRequest): Promise<ProposalConcept> {
  const result = await post(request); const body = await result.json();
  expect(result.status, JSON.stringify(body)).toBe(200);
  expect(isProposalConcept(body.concept), JSON.stringify(body)).toBe(true);
  return body.concept;
}
const physicalRequest = (world: ProposalConcept, request = worldRequest(state.action)): ProposalRequest => ({
  ...request, stage: 'physical', sourceWorldId: world.id,
  selectedElementIds: elements.map(element => element.id), heroElementId: elements[0].id, replacements: [],
});
function resetTransports() {
  state.textCalls = 0; state.imageCalls = 0;
  vi.mocked(fetch).mockClear();
  for (const mock of [state.rpc, state.upload, state.download, state.readWebsite]) mock.mockClear();
}
const imageCalls = () => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/images/'));
const imagePrompt = (index: number) => {
  const body = imageCalls()[index][1]?.body;
  return body instanceof FormData ? String(body.get('prompt')) : String(JSON.parse(String(body)).prompt);
};
const expectNoGeneration = () => {
  expect(state.textCalls).toBe(0); expect(state.imageCalls).toBe(0);
  expect(state.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  expect(state.readWebsite).not.toHaveBeenCalled(); expect(state.download).not.toHaveBeenCalled(); expect(state.upload).not.toHaveBeenCalled();
};
async function expectClarification(request: unknown) {
  const result = await post(request); const body = await result.json();
  expect(result.status).toBe(200);
  expect(body).toEqual({ needsConstruction: true, clarification: expect.any(String) });
  expect(body.clarification.trim()).not.toBe('');
  expectNoGeneration();
}

describe('offline legacy construction adapter with explicit per-brief construction intent', () => {
  it.each(['static', 'press-reveal-manual-reset'] as const)('creates and restores all four fictional %s assets with compiled construction and exact reference bytes', async action => {
    state.action = action;
    const request = worldRequest(action);
    const world = await generate(request);
    const physical = await generate({ ...request, stage: 'physical', sourceWorldId: world.id,
      selectedElementIds: elements.map(element => element.id), heroElementId: elements[0].id, replacements: [] });
    const { constructionIntent: _intent, ...supplementRequest } = request;
    const details = await generate({ ...supplementRequest, stage: 'details', sourceWorldId: world.id, sourcePhysicalId: physical.id });
    const packaging = await generate({ ...supplementRequest, stage: 'packaging', sourceWorldId: world.id, sourcePhysicalId: physical.id });
    expect(state.textCalls).toBe(4); expect(state.imageCalls).toBe(4); expect(state.rows).toHaveLength(4);
    expect(state.rpc).toHaveBeenCalledTimes(4);
    for (const asset of [world, physical, details, packaging]) {
      expect(asset.productPlan?.status).toBe('unverified-prototype-plan');
      expect(asset.productPlan?.verificationGates.every(gate => gate.status === 'unverified')).toBe(true);
      expect(asset.constructionOrigin).toMatchObject({ version: 'construction-origin-v2', kind: 'compiled-visual-proposal', evidence: 'unverified-design-proposal', intent: request.constructionIntent });
      expect(asset.context).toEqual(request.context);
      expect(asset).toMatchObject({ brand: design.brand, title: design.title, story: design.story });
      expect(asset.worldElements).toEqual(elements);
      expect(JSON.stringify({ brand: asset.brand, title: asset.title, elements: asset.worldElements, plan: asset.productPlan })).not.toMatch(/\b(Tesla|sun|car|road|solar|charging)\b/i);
    }
    expect(physical.productPlan).toEqual(world.productPlan);
    for (const asset of [details, packaging]) {
      expect(asset.productPlan).toEqual(physical.productPlan);
      expect(asset.constructionOrigin).toEqual(physical.constructionOrigin);
    }
    if (action === 'static') {
      expect(world.productPlan!.parts.map(part => part.id)).toEqual(['body', 'hero']);
      expect(world.productPlan!.actions).toEqual([]);
      expect(world.productPlan!.verificationGates.map(gate => gate.id)).not.toContain('interaction-test');
      expect(world.productPlan!.joins).toHaveLength(1);
      expect(JSON.stringify(world.productPlan)).not.toMatch(/\b(translating|sliding|pressing|marker|retainer|reset|reveal)\b/i);
      expect(world.interaction).toBe('Static display. No mechanical or electronic response is proposed.');
    } else {
      expect(world.productPlan!.parts.map(part => part.id)).toEqual(['body', 'hero', 'retainer']);
      expect(world.productPlan!.actions).toHaveLength(1);
      expect(world.productPlan!.actions[0]).toMatchObject({ action: expect.stringMatching(/press.*lift.*manually.*reset/i),
        response: expect.stringMatching(/reveals.*marker.*lifting hides/i), partIds: ['body', 'hero', 'retainer'] });
      expect(world.productPlan!.verificationGates.map(gate => gate.id)).toContain('interaction-test');
      expect(world.productPlan!.joins).toHaveLength(3);
      expect(world.productPlan!.assembly).toHaveLength(2);
      expect(world.interaction).toMatch(/manually.*reset/i);
    }
    expect(world.sourceImageIds).toEqual([]); expect(physical.sourceImageIds).toEqual([world.id]);
    expect(details.sourceImageIds).toEqual([physical.id]); expect(packaging.sourceImageIds).toEqual([physical.id, world.id]);
    const calls = imageCalls();
    expect(calls.map(([url]) => String(url).split('/').at(-1))).toEqual(['generations', 'edits', 'edits', 'edits']);
    for (const [index, referenceCount] of [[1, 1], [2, 1], [3, 2]]) {
      const body = calls[index][1]?.body;
      expect(body).toBeInstanceOf(FormData);
      const parts = (body as FormData).getAll('image[]') as File[];
      expect(parts).toHaveLength(referenceCount);
      for (const [partIndex, file] of parts.entries()) {
        expect(file.name).toBe(`reference-${partIndex + 1}.png`);
        expect(file.type).toBe('image/png');
        expect(Buffer.from(await file.arrayBuffer()).toString('base64')).toBe(png);
      }
      expect(new Headers(calls[index][1]?.headers).has('content-type')).toBe(false);
      expect(imagePrompt(index)).toContain(JSON.stringify(physical.productPlan));
      expect(imagePrompt(index)).toContain(JSON.stringify(request.context.exactWording).slice(1, -1));
    }
    for (const row of state.rows) {
      const manifest = parseProposalManifest(String(row.story));
      expect(manifest?.constructionOrigin).toBeDefined();
      expect(manifest?.productPlan).toEqual(physical.productPlan);
    }
    for (const asset of [world, physical, details, packaging]) {
      const restored = await (await post({ id: asset.id })).json();
      expect(restored.concept).toEqual(asset);
    }
    expect((await generate(request)).id).toBe(world.id);
    expect(state.textCalls).toBe(4); expect(state.imageCalls).toBe(4); expect(state.rpc).toHaveBeenCalledTimes(4);
  });

  it('preserves distinctive fictional display narrative outside the compiled functional image JSON', async () => {
    const narrative = { brand: 'Nacre Letterworks', title: 'Letters sleeping under violet wings',
      story: 'An imagined paper moth keeps moonlit letters beneath layered violet wings and a teal archive ribbon.' };
    state.output = { ...design, ...narrative, interaction: 'MODEL_FUNCTION_AUTOMATIC_RESET',
      design: 'MODEL_FUNCTION_ADD_MOTOR_AND_LIGHTS', constructionVisual: visual('static') };
    const world = await generate(worldRequest('static'));
    expect(world).toMatchObject(narrative);
    const restored = await (await post({ id: world.id })).json();
    expect(restored.concept).toMatchObject(narrative);
    const prompt = imagePrompt(0);
    const functionalHeading = '\nCompiled unverified functional direction JSON:\n';
    const directionHeading = '\nAuthoritative current direction and ordered image references:\n';
    expect(prompt.split(functionalHeading)).toHaveLength(2);
    const [functionalJSON, directionJSON] = prompt.split(functionalHeading)[1].split(directionHeading);
    const functional = JSON.parse(functionalJSON);
    expect(Object.keys(functional).sort()).toEqual(['design', 'interaction', 'needsContext']);
    for (const key of ['brand', 'title', 'story', 'worldElements']) expect(functional).not.toHaveProperty(key);
    const direction = JSON.parse(directionJSON);
    expect(direction.narrativeData).toEqual({ status: 'unverified-proposed-artistic-narrative', ...narrative, elements });
    expect(direction.narrativeRule).toContain('visual subject data only');
    expect(direction.narrativeRule).toContain('Only the compiled plan defines function');
    const { narrativeData: _narrative, ...withoutNarrative } = direction;
    for (const value of [narrative.title, narrative.story]) {
      expect(functionalJSON).not.toContain(value);
      expect(prompt.split(functionalHeading)[0]).not.toContain(value);
      expect(JSON.stringify(withoutNarrative)).not.toContain(value);
      expect(directionJSON).toContain(value);
    }
    expect(prompt).not.toContain('MODEL_FUNCTION_');
    expect(world.productPlan!.actions).toEqual([]);
  });

  it.each(['no-website', 'https://ignored-brand.invalid/'])('rejects changed physical visual choices even with ignored request brand %s', async brand => {
    const world = await generate(worldRequest('static'));
    const saved = structuredClone(state.rows);
    const changed = visual('static'); changed.parts[1].profile = 'angular';
    state.output = { ...design, constructionVisual: changed };
    resetTransports();
    const result = await post({ ...physicalRequest(world), brand });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ needsConstruction: true, clarification: expect.stringContaining('saved visual choices') });
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0);
    expect(state.rpc).toHaveBeenCalledOnce(); expect(state.upload).not.toHaveBeenCalled();
    expect(state.rows).toEqual(saved);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const direction = JSON.parse(JSON.parse(String(init?.body)).messages[1].content);
    expect(direction.savedConstructionVisual).toEqual(visual('static'));
  });

  it('keeps failed-website fallback identity aligned with stored evidence and frozen physical construction', async () => {
    state.readWebsite.mockRejectedValue(new Error('Synthetic website transport failure'));
    const request={...worldRequest('static'),brand:'https://nacre.example.com/'};
    const world=await generate(request);
    expect(world.sourceUrl).toBe('');expect(world.sourceTitle).toBe('');
    state.output={...design};resetTransports();
    const physical=await generate(physicalRequest(world,request));
    expect(physical.productPlan).toEqual(world.productPlan);expect(physical.constructionOrigin).toEqual(world.constructionOrigin);
    expect(state.textCalls).toBe(1);expect(state.imageCalls).toBe(1);
    const direction=JSON.parse(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).messages[1].content);
    expect(direction.savedConstructionVisual).toEqual(visual('static'));
    const changed=visual('static');changed.parts[1].profile='angular';state.output={...design,constructionVisual:changed};
    // Different request identity forces an uncached check, without changing its saved source evidence.
    resetTransports();const response=await post({...physicalRequest(world,request),brand:'https://ignored.example.com/'});
    expect(await response.json()).toMatchObject({needsConstruction:true});expect(state.imageCalls).toBe(0);
  });

  it.each(['static', 'press-reveal-manual-reset'] as const)('inherits the frozen %s plan and origin when unchanged physical output omits visual choices', async action => {
    state.action = action;
    const world = await generate(worldRequest(action));
    const savedWorld = structuredClone(state.rows[0]);
    state.output = { ...design };
    resetTransports();
    const physical = await generate(physicalRequest(world));
    expect(physical.productPlan).toEqual(world.productPlan);
    expect(physical.constructionOrigin).toEqual(world.constructionOrigin);
    expect(physical.constructionIntent).toEqual(world.constructionIntent);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1); expect(state.rpc).toHaveBeenCalledOnce();
    expect(state.rows[0]).toEqual(savedWorld);
    expect(state.rows).toHaveLength(2);
  });

  it.each(['static', 'press-reveal-manual-reset'] as const)('refuses changing an unfinished %s world action during initial physical generation', async action => {
    state.action = action;
    const world = await generate(worldRequest(action));
    const saved = structuredClone(state.rows);
    const next = action === 'static' ? 'press-reveal-manual-reset' : 'static';
    resetTransports();
    await expectClarification(physicalRequest(world, worldRequest(next)));
    expect(state.rows).toEqual(saved);
  });

  it.each(['static', 'press-reveal-manual-reset'] as const)('allows a different action in an explicit physical revision of %s construction', async action => {
    state.action = action;
    const world = await generate(worldRequest(action));
    const physical = await generate(physicalRequest(world));
    const saved = structuredClone(state.rows);
    const next = action === 'static' ? 'press-reveal-manual-reset' : 'static';
    state.action = next;
    resetTransports();
    const revised = await generate({ ...physicalRequest(world, worldRequest(next)), previousAssetId: physical.id });
    expect(revised.constructionIntent).toEqual({ version: 'construction-intent-v1', action: next });
    expect(revised.constructionOrigin).toMatchObject({ version: 'construction-origin-v2', intent: revised.constructionIntent });
    expect(revised.productPlan!.actions).toHaveLength(next === 'static' ? 0 : 1);
    expect(revised.productPlan).not.toEqual(physical.productPlan);
    expect(revised.constructionOrigin).not.toEqual(physical.constructionOrigin);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1); expect(state.rpc).toHaveBeenCalledOnce();
    expect(state.rows.slice(0, 2)).toEqual(saved);
    expect(state.rows).toHaveLength(3);
  });

  it.each(['compilerVersion', 'compilerDigest', 'templateId', 'templateRevision'] as const)('restores frozen retired %s metadata but clarifies new physical generation before providers', async field => {
    const world = await generate(worldRequest('static'));
    const row = state.rows[0];
    const manifest = parseProposalManifest(String(row.story))!;
    const origin = manifest.constructionOrigin!;
    expect(origin.version).toBe('construction-origin-v2');
    origin[field] = field === 'compilerDigest' ? 'f'.repeat(64) : `retired-${field}`;
    row.story = serializeProposalManifest(manifest);
    const saved = structuredClone(state.rows);
    resetTransports();
    const restoredResult = await post({ id: world.id });
    expect(restoredResult.status).toBe(200);
    const restored = (await restoredResult.json()).concept;
    expect(restored.productPlan).toEqual(world.productPlan);
    expect(restored.constructionOrigin).toEqual(origin);
    expectNoGeneration();
    await expectClarification(physicalRequest(world));
    expect(state.rows).toEqual(saved);
  });

  it('advertises current public capabilities independently of offline engineering compatibility', async () => {
    const readiness = await (await handleRequest(new Request('https://edge.invalid/'))).json();
    expect(readiness.capabilities).toMatchObject(PROPOSAL_CAPABILITIES);
    expectNoGeneration();
  });

  it('requires explicit world intent before provider or quota reservation', async () => {
    const request = worldRequest('static'); delete request.constructionIntent;
    const before = structuredClone(request);
    await expectClarification(request);
    expect(request).toEqual(before); expect(state.rows).toHaveLength(0);
  });

  it('requires explicit physical intent before downloading or altering a legacy world', async () => {
    const request = worldRequest('static'); delete request.constructionIntent;
    const worldId = 'd401ae50-eb62-449c-bfdf-a7777ad94929';
    state.rows.push({ id: worldId, brand: design.brand, title: design.title,
      story: serializeProposalManifest({ contractVersion: PROPOSAL_CONTRACT_VERSION, stageVersion: PROPOSAL_STAGE_VERSION,
        stage: 'world', context: request.context, story: design.story, design: design.design, worldElements: elements, sourceImageIds: [] }),
      image_path: `${worldId}.png`, prompt_version: PROPOSAL_CONTRACT_VERSION,
    });
    const before = structuredClone(state.rows);
    await expectClarification({ ...request, stage: 'physical', sourceWorldId: worldId,
      selectedElementIds: elements.map(element => element.id), heroElementId: elements[0].id, replacements: [] });
    expect(state.rows).toEqual(before);
  });

  it('clarifies a synthetic unsupported rocker/gravity request without substituting another action', async () => {
    const before = structuredClone(legacyRockerRequest);
    await expectClarification(legacyRockerRequest);
    expect(legacyRockerRequest).toEqual(before); expect(state.rows).toHaveLength(0);
    expect(legacyRockerRequest.context.interaction).toContain('rocker lever');
    expect(legacyRockerRequest.context.interaction).toContain('gravity reset');
  });

  it.each(['static', 'press-reveal-manual-reset'] as const)('does not reinterpret a synthetic rocker/gravity request when %s intent is appended', async action => {
    const before = structuredClone(legacyRockerRequest);
    await expectClarification({ ...legacyRockerRequest, constructionIntent: { version: 'construction-intent-v1', action } });
    expect(legacyRockerRequest).toEqual(before); expect(state.rows).toHaveLength(0);
  });

  it.each([
    ['reviewed', true], ['constructionBinding', { reviewed: true }], ['construction', { reviewed: true, binding: {} }],
    ['requireConstructionIntent', false], ['constructionIntent', { version: 'construction-intent-v1', action: 'static', reviewed: true, binding: {} }],
  ])('rejects forged client %s authority before providers', async (field, value) => {
    const result = await post({ ...worldRequest('static'), [String(field)]: value });
    expect(result.status).toBe(400); expect(await result.json()).toHaveProperty('error');
    expectNoGeneration(); expect(state.rows).toHaveLength(0);
  });
});


describe('explicit customer identity in historical construction adapter',()=>{
 it.each(['OFFKIN Collective','',null])('pins the customer name instead of a model substitution %s',brand=>{
  return (async()=>{
   const request=worldRequest('static');request.customerIdentity={version:'customer-brand-v1',name:'月页 · Nacre'};
   state.output={...design,brand,constructionVisual:visual('static')};
   const world=await generate(request);expect(world.brand).toBe(request.customerIdentity.name);expect(world.customerIdentity).toEqual(request.customerIdentity);
   expect(parseProposalManifest(String(state.rows[0].story))?.customerIdentity).toEqual(request.customerIdentity);
   expect(imagePrompt(0)).toContain(request.customerIdentity.name);expect(imagePrompt(0)).not.toContain('OFFKIN Collective');
   state.output=undefined;const physical=await generate(physicalRequest(world,request));expect(physical.customerIdentity).toEqual(world.customerIdentity);expect(physical.brand).toBe(world.brand);
  })();
 });
 it('clarifies a prose-only new world before any provider, quota, download or save',async()=>{
  const request=worldRequest('static');delete request.customerIdentity;
  const before=structuredClone(request),response=await post(request);
  expect(await response.json()).toEqual({needsContext:true,message:expect.stringContaining('exact customer brand name')});expectNoGeneration();expect(state.rows).toHaveLength(0);expect(request).toEqual(before);
 });
 it.each([null,{}, {version:'invented',name:'Nacre'}, {version:'customer-brand-v1',name:''}, {version:'customer-brand-v1',name:' '.repeat(4)}, {version:'customer-brand-v1',name:'x'.repeat(121)}, {version:'customer-brand-v1',name:'Nacre\nRename'}, {version:'customer-brand-v1',name:'Nacre',reviewed:true}])('rejects an invalid explicit identity without providers %#',async customerIdentity=>{
  const response=await post({...worldRequest('static'),customerIdentity});expect(response.status).toBe(400);expectNoGeneration();
 });
 it('separates identity in cache and construction source binding and preserves cache hits',async()=>{
  const request=worldRequest('static'),first=await generate(request);const firstSource=first.constructionOrigin?.sourceDigest;
  resetTransports();expect((await generate(request)).id).toBe(first.id);expectNoGeneration();
  const second=await generate({...request,customerIdentity:{version:'customer-brand-v1',name:'Fictional Copperleaf'}});
  expect(second.id).not.toBe(first.id);expect(second.brand).toBe('Fictional Copperleaf');expect(second.constructionOrigin?.sourceDigest).not.toBe(firstSource);expect(state.rows).toHaveLength(2);
 });
 it('rejects a descendant brand change before paid work, and allows an explicit new-world revision',async()=>{
  const request=worldRequest('static'),world=await generate(request);const saved=structuredClone(state.rows);
  resetTransports();const changed={version:'customer-brand-v1' as const,name:'Fictional Copperleaf'};
  const result=await post({...physicalRequest(world,request),customerIdentity:changed});expect(result.status).toBe(400);expectNoGeneration();expect(state.rows).toEqual(saved);
  const revision=await generate({...request,previousAssetId:world.id,customerIdentity:changed});expect(revision.brand).toBe(changed.name);expect(state.rows[0]).toEqual(saved[0]);
 });
 it('inherits an explicitly saved name for a world revision and rejects a corrupt row/name on restore',async()=>{
  const request=worldRequest('static'),world=await generate(request);delete request.customerIdentity;
  const revision=await generate({...request,previousAssetId:world.id});expect(revision.brand).toBe(world.brand);expect(revision.customerIdentity).toEqual(world.customerIdentity);
  state.rows[0].brand='Model overwrite';resetTransports();const response=await post({id:world.id});expect(response.status).not.toBe(200);expectNoGeneration();
 });
 it('does not let model identity or fake request bypass flags become authority',async()=>{
  state.output={...design,customerIdentity:{version:'customer-brand-v1',name:'Model alias'},constructionVisual:visual('static')};
  const response=await post(worldRequest('static'));expect(await response.json()).toHaveProperty('needsConstruction',true);expect(state.imageCalls).toBe(0);
  resetTransports();const rejected=await post({...worldRequest('static'),requireCustomerIdentity:false});expect(rejected.status).toBe(400);expectNoGeneration();
 });
});
