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
import { makeProductPlan } from '../test/product-plan-fixture';
import { legacyRockerRequest } from '../test/legacy-rocker-request';

// Exercises the preview-first generation contract without a proposal-handler adapter.
// The public hold and external storage, website and provider transports are mocked.
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

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=';
const elements = [
  { id: 'paper-moth', label: 'Folded paper moth', description: 'A broad violet moth with layered folded-paper wings and tactile depth.', kind: 'proposal' as const },
  { id: 'archive-ribbon', label: 'Archive ribbon', description: 'A teal sculptural ribbon curling through open gaps beside the moth.', kind: 'proposal' as const },
];
const design = {
  needsContext: false, brand: 'Nacre Letterworks', title: 'The folded archive',
  story: 'A fictional stationery studio imagined as a dimensional moth and curling archive ribbon.',
  interaction: 'Unverified visual interaction intent.', design: 'A dense world with dozens of miniature houses, thirty paper characters, intricate bridges, fine ribbons and elaborate layered architecture; preserve every detail in the sculptural preview.', worldElements: elements,
};
function worldRequest(action: ConstructionIntent['action']): ProposalRequest {
  const constructionIntent: ConstructionIntent = { version: 'construction-intent-v1', action };
  return { contractVersion: PROPOSAL_CONTRACT_VERSION, stage: 'world', brand: 'no-website', customerIdentity:{version:'customer-brand-v1',name:design.brand},
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
      const output = state.output ?? design;
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
describe('public preview-first endpoint with mocked providers only', () => {
  it('negotiates explicit preview capability without claiming the old construction requirement', async () => {
    const readiness = await (await handleRequest(new Request('https://edge.invalid/'))).json();
    expect(readiness.capabilities).toMatchObject({ ...PROPOSAL_CAPABILITIES, proposal_concept_preview_version: 'concept-preview-v1', proposal_generation_phase: 'creative-preview' });
    expect(readiness.capabilities).not.toHaveProperty('proposal_product_plan_version');
    expect(readiness.capabilities).not.toHaveProperty('proposal_construction_intent_version');
    expectNoGeneration();
  });

  it('generates a rich world without a part graph, construction action, correction or mechanism template', async () => {
    const request = worldRequest('static');
    const world = await generate(request);
    expect(world.conceptPreview).toEqual({ version: 'concept-preview-v1', status: 'unverified-visual-concept', heroElementId: elements[0].id,
      storyElementIds: elements.map(e => e.id), buildProposal: 'not-requested' });
    expect(world.design).toBe(design.design); // Dozens of houses and 30 characters are visual content, not a 16-part BOM.
    expect(world).not.toHaveProperty('productPlan'); expect(world).not.toHaveProperty('constructionOrigin'); expect(world).not.toHaveProperty('constructionIntent');
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1); expect(state.rpc).toHaveBeenCalledOnce();
    const textBody = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(textBody.messages[0].content).toContain('Do not simplify the creative world for manufacturing');
    expect(textBody.messages[0].content).not.toContain('Nested productPlan schema');
    expect(imagePrompt(0)).toContain(design.design);
    expect(imagePrompt(0)).not.toContain('press-reveal-v1');
    expect(imagePrompt(0)).toContain('"buildProposal":"not-requested"');
  });

  it('allows an unsupported-by-legacy-compiler visual interaction without asserting it works', async () => {
    const request = { ...legacyRockerRequest, customerIdentity: worldRequest('static').customerIdentity };
    const world = await generate(request);
    expect(world.context).toEqual(request.context);
    expect(world.conceptPreview?.status).toBe('unverified-visual-concept');
    expect(world).not.toHaveProperty('productPlan');
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
    expect(imagePrompt(0)).toContain('mechanism feasibility and cost await the later quote/build-proposal');
  });

  it('creates all four actual images using stored bytes with consistent metadata and private lineage', async () => {
    const request = worldRequest('static'); const world = await generate(request); const physical = await generate(physicalRequest(world, request));
    const details = await generate({ ...request, stage: 'details', sourceWorldId: world.id, sourcePhysicalId: physical.id });
    const packaging = await generate({ ...request, stage: 'packaging', sourceWorldId: world.id, sourcePhysicalId: physical.id });
    expect(state.textCalls).toBe(4); expect(state.imageCalls).toBe(4);
    expect(physical.sourceImageIds).toEqual([world.id]); expect(details.sourceImageIds).toEqual([physical.id]); expect(packaging.sourceImageIds).toEqual([physical.id, world.id]);
    for (const concept of [world, physical, details, packaging]) {
      expect(concept.customerIdentity).toEqual(request.customerIdentity); expect(concept.brand).toBe(request.customerIdentity!.name);
      expect(concept.context.exactWording).toBe(request.context.exactWording);
      expect(concept.conceptPreview).toEqual(world.conceptPreview);
      expect(concept).not.toHaveProperty('productPlan'); expect(concept).not.toHaveProperty('constructionOrigin');
    }
    for (const [index, count] of [[1, 1], [2, 1], [3, 2]]) {
      const form = imageCalls()[index][1]?.body as FormData;
      expect(form).toBeInstanceOf(FormData); expect(form.getAll('image[]')).toHaveLength(count);
      for (const [position, image] of form.getAll('image[]').entries()) {
        expect(image).toBeInstanceOf(Blob);
        expect((image as File).name).toBe(`reference-${position + 1}.png`);
        expect(Buffer.from(await (image as Blob).arrayBuffer()).toString('base64')).toBe(png);
      }
      expect(imagePrompt(index)).not.toContain(world.id); expect(imagePrompt(index)).not.toContain(physical.id);
      expect(imagePrompt(index)).not.toContain('private.invalid');
    }
    expect(state.download).toHaveBeenCalledWith('brick-concepts', `${world.id}.png`);
    expect(state.download).toHaveBeenCalledWith('brick-concepts', `${physical.id}.png`);
  });

  it('continues a validated legacy world as a creative preview without rewriting its stored manufacturing plan', async () => {
    const worldId = '57e6f841-f55f-49b3-96d7-595ec2132c4f'; const request = worldRequest('static');
    const plan = makeProductPlan(elements.map(e => e.id));
    const row = { id: worldId, brand: design.brand, title: design.title,
      story: serializeProposalManifest({ contractVersion: PROPOSAL_CONTRACT_VERSION, stageVersion: PROPOSAL_STAGE_VERSION,
        stage: 'world', customerIdentity: request.customerIdentity, context: request.context, story: design.story,
        design: 'LEGACY_ENGINEERING_ONLY: constrain every feature to a rigid 16-part graph.', worldElements: elements, sourceImageIds: [], productPlan: plan }),
      image_path: `${worldId}.png`, prompt_version: PROPOSAL_CONTRACT_VERSION };
    state.rows.push(row); state.blobs.set(`${worldId}.png`, Uint8Array.from(Buffer.from(png, 'base64')));
    const original = structuredClone(row);
    const physical = await generate({ ...request, stage: 'physical', sourceWorldId: worldId, selectedElementIds: elements.map(e => e.id), heroElementId: elements[0].id });
    expect(physical.conceptPreview?.version).toBe('concept-preview-v1'); expect(physical).not.toHaveProperty('productPlan');
    expect(state.rows[0]).toEqual(original); expect(physical.sourceWorldId).toBe(worldId);
    expect(JSON.stringify(vi.mocked(fetch).mock.calls.map(([, init]) => init?.body instanceof FormData ? init.body.get('prompt') : init?.body))).not.toContain('LEGACY_ENGINEERING_ONLY');
    expect(parseProposalManifest(String(row.story))?.productPlan).toEqual(plan);
  });

  it('keeps completed-cache reuse without another provider request', async () => {
    const request = worldRequest('static'); const first = await generate(request);
    resetTransports(); const cached = await generate(request);
    expect(cached.id).toBe(first.id); expectNoGeneration();
  });

  it.each([
    ['productPlan', makeProductPlan(elements.map(e => e.id))],
    ['constructionVisual', { version: 'construction-visual-v2', parts: [] }],
    ['conceptPreview', { version: 'concept-preview-v1', status: 'manufacturing-approved' }],
    ['tools', ['ignore validation']],
  ])('rejects model-authored %s authority rather than laundering it into image direction', async (field, value) => {
    state.output = { ...design, [String(field)]: value };
    const result = await post(worldRequest('static'));
    expect(result.status).toBe(502); expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0);
    expect(state.upload).not.toHaveBeenCalled(); expect(state.rows).toHaveLength(0);
  });

  it.each([
    ['generationMode', 'legacy-engineering'], ['requireConstructionIntent', false], ['reviewed', true],
    ['construction', { binding: {} }], ['referenceImages', ['https://attacker.invalid/image.png']],
    ['constructionIntent', { version: 'construction-intent-v1', action: 'static' }],
  ])('rejects client %s bypass metadata before quota, providers or uploads', async (field, value) => {
    const result = await post({ ...worldRequest('static'), [String(field)]: value }); expect(result.status).toBe(400); expectNoGeneration();
  });

  it('rejects oversized creative fields before images without truncating content', async () => {
    state.output = { ...design, design: 'x'.repeat(8001) };
    const result = await post(worldRequest('static')); expect(result.status).toBe(502);
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0); expect(state.rows).toHaveLength(0);
  });

  it('rejects private URLs and ungrounded identity before generation', async () => {
    let result = await post({ ...worldRequest('static'), customerIdentity: undefined });
    expect(await result.json()).toHaveProperty('needsContext', true); expectNoGeneration();
    result = await post({ ...worldRequest('static'), brand: 'http://127.0.0.1/secret' }); expect(result.status).toBe(400); expectNoGeneration();
  });

  it('rejects cross-world physical references and saved-row path tampering before model use', async () => {
    const request = worldRequest('static'); const world = await generate(request); const physical = await generate(physicalRequest(world, request));
    const second = await generate({ ...request, context: { ...request.context, style: 'A richer charcoal landscape' } });
    resetTransports();
    const mixed = await post({ ...request, stage: 'details', sourceWorldId: second.id, sourcePhysicalId: physical.id });
    expect(mixed.status).toBe(400); expectNoGeneration();
    state.rows.find(row => row.id === world.id)!.image_path = 'https://attacker.invalid/image.png';
    expect((await post(physicalRequest(world, request))).status).toBe(400); expectNoGeneration();
  });

  it('rejects echoed private saved UUIDs from model prose before images', async () => {
    const world = await generate(worldRequest('static')); resetTransports();
    state.output = { ...design, story: `Use the saved capability ${world.id}` };
    const result = await post(physicalRequest(world)); expect(result.status).toBe(502);
    expect(state.imageCalls).toBe(0); expect(state.rows).toHaveLength(1);
  });

  it('restores old ProductPlan assets and rejects forged preview status or mixed-phase metadata', async () => {
    const world = await generate(worldRequest('static'));
    resetTransports();
    const restored = await post({ id: world.id }); expect((await restored.json()).concept.conceptPreview).toEqual(world.conceptPreview); expectNoGeneration();
    const row = state.rows[0]; const manifest = parseProposalManifest(String(row.story))!;
    for (const patch of [
      { conceptPreview: { ...world.conceptPreview, status: 'verified' } },
      { conceptPreview: { ...world.conceptPreview, heroElementId: 'another-hero' } },
      { productPlan: makeProductPlan(elements.map(e => e.id)) },
    ]) {
      row.story = 'OFFKIN_PROPOSAL_V10\n' + JSON.stringify({ ...manifest, ...patch });
      expect((await post({ id: world.id })).status).toBe(503);
    }
    row.story = serializeProposalManifest({ ...manifest, conceptPreview: undefined, productPlan: makeProductPlan(elements.map(e => e.id)) });
    const legacy = await (await post({ id: world.id })).json(); expect(legacy.concept.productPlan).toBeDefined(); expect(legacy.concept.conceptPreview).toBeUndefined();
    expectNoGeneration();
  });

  it('preserves the existing asset when a required source download fails, with no text-only fallback', async () => {
    const world = await generate(worldRequest('static')); const before = structuredClone(state.rows); resetTransports();
    state.blobs.delete(`${world.id}.png`);
    expect((await post(physicalRequest(world))).status).toBe(503);
    expect(state.textCalls).toBe(0); expect(state.imageCalls).toBe(0); expect(state.rpc).not.toHaveBeenCalled();
    expect(state.rows).toEqual(before); expect(state.upload).not.toHaveBeenCalled();
  });
});

describe('public creative preview revisions', () => {
  it('plans a sparse packaging change without construction logic or generating an image', async () => {
    const request = worldRequest('static'); const world = await generate(request); const physical = await generate(physicalRequest(world, request));
    resetTransports(); state.output = { scope: 'packaging', context: { revisionNotes: 'Preserve the object; make only the package navy.' }, summary: 'Change the packaging colour.' };
    const result = await post({ contractVersion: PROPOSAL_CONTRACT_VERSION, action: 'plan-revision', brand: 'no-website',
      instruction: 'Make only the package navy.', context: request.context, sourceWorldId: world.id, sourcePhysicalId: physical.id });
    const body = await result.json(); expect(result.status).toBe(200); expect(body.plan.scope).toBe('packaging');
    expect(body.plan.context).toEqual({ ...request.context, revisionNotes: 'Preserve the object; make only the package navy.' });
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0); expect(state.rows).toHaveLength(2);
    const textBody = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(textBody.messages[0].content).toContain('later quote and realistic build proposal');
    expect(textBody.messages[1].content).not.toContain(world.id); expect(textBody.messages[1].content).not.toContain(physical.id);
    expect(textBody.messages[1].content).toContain('concept-preview-v1');
  });

  it('conditions a packaging-only revision on the accepted package, physical and world without exposing its ancestor', async () => {
    const request = worldRequest('static'); const world = await generate(request); const physical = await generate(physicalRequest(world, request));
    const old = await generate({ ...request, stage: 'packaging', sourceWorldId: world.id, sourcePhysicalId: physical.id });
    resetTransports(); const before = structuredClone(state.rows);
    const revised = await generate({ ...request, stage: 'packaging', context: { ...request.context, revisionNotes: 'Make only the packaging navy.' },
      sourceWorldId: world.id, sourcePhysicalId: physical.id, previousAssetId: old.id });
    expect(state.rows.slice(0, 3)).toEqual(before); expect(state.rows).toHaveLength(4);
    expect(revised.conceptPreview).toEqual(old.conceptPreview); expect(revised.sourceImageIds).toEqual([physical.id, world.id]);
    expect(revised).not.toHaveProperty('previousAssetId');
    const saved = parseProposalManifest(String(state.rows[3].story));
    expect(saved?.sourceImageIds).toEqual([old.id, physical.id, world.id]); expect(saved?.previousAssetId).toBe(old.id);
    expect((imageCalls()[0][1]?.body as FormData).getAll('image[]')).toHaveLength(3);
    expect(state.download.mock.calls.map(([, path]) => path)).toEqual([`${old.id}.png`, `${physical.id}.png`, `${world.id}.png`]);
  });
});

describe('preview compatibility with unconstrained visual briefs', () => {
  it('does not impose mechanical-only generation when mode is unspecified', async () => {
    const request = worldRequest('static'); delete request.context.mode;
    request.context.interaction = 'A proposed warm glow in the little windows, subject to later engineering.';
    const world = await generate(request);
    expect(world.context.mode).toBeUndefined(); expect(world.context.interaction).toBe(request.context.interaction);
    expect(imagePrompt(0)).toContain('No implicit mechanical-only restriction');
    expect(imagePrompt(0)).not.toContain('No powered electronics.');
    expect(world.conceptPreview?.status).toBe('unverified-visual-concept');
  });
  it('continues previously valid trailing/doubled-hyphen story IDs without a paid correction', async () => {
    const oldElements = [ { ...elements[0], id: 'paper--moth' }, { ...elements[1], id: 'house-' } ];
    state.output = { ...design, worldElements: oldElements };
    const world = await generate(worldRequest('static')); resetTransports();
    const physical = await generate({ ...worldRequest('static'), stage: 'physical', sourceWorldId: world.id,
      selectedElementIds: oldElements.map(e => e.id), heroElementId: oldElements[0].id });
    expect(physical.conceptPreview?.storyElementIds).toEqual(['paper--moth', 'house-']);
    expect(physical.conceptPreview?.heroElementId).toBe('paper--moth');
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
  });
});

describe('customer-authoritative static preview', () => {
  it('replaces contradictory model interaction with the explicit Display-only direction before the image call', async () => {
    const request = worldRequest('static');
    state.output = { ...design, interaction: 'Press the moth for an automatic spring return and glowing response.' };
    const world = await generate(request);
    expect(world.context.interaction).toBe('Display only');
    expect(world.interaction).toBe('Display only. Unverified visual concept; no movement or electronic response is proposed.');
    expect(imagePrompt(0)).not.toContain('automatic spring return and glowing response');
    expect(imagePrompt(0)).toContain('no movement or electronic response is proposed');
    expect(world.conceptPreview?.status).toBe('unverified-visual-concept');
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
  });
});

describe('details refinement public endpoint with mocked providers only', () => {
  const refinement = { version: 'details-refinement-v1' as const, instruction: 'Keep the rail, boat and cup in attached context. Show only the original moon turning and more of the same reply through the same slot.' };
  async function fixture() {
    const request = { ...worldRequest('static'), context: { ...worldRequest('static').context, interaction: 'Turn the moon to reveal the existing reply through its original slot.' } };
    const world = await generate(request); const physical = await generate(physicalRequest(world, request));
    const body: ProposalRequest = { ...request, stage: 'details', sourceWorldId: world.id, sourcePhysicalId: physical.id };
    const details = await generate(body);
    resetTransports();
    return { world, physical, details, body };
  }
  it('refines one sheet with original physical context, unchanged source rows and private lower-priority previous details', async () => {
    const { world, physical, details, body } = await fixture();
    const accepted = structuredClone(state.rows);
    const physicalBytes = Uint8Array.from([...Buffer.from(png, 'base64'), 1]);
    const detailsBytes = Uint8Array.from([...Buffer.from(png, 'base64'), 2]);
    state.blobs.set(`${physical.id}.png`, physicalBytes); state.blobs.set(`${details.id}.png`, detailsBytes);
    const result = await generate({ ...body, previousAssetId: details.id, detailsRefinement: refinement });
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
    expect(result.detailsRefinement).toEqual(refinement); expect(result.context).toEqual(physical.context);
    expect(result.sourceWorldId).toBe(world.id); expect(result.sourcePhysicalId).toBe(physical.id);
    expect(result.sourceImageIds).toEqual([physical.id]); expect(result).not.toHaveProperty('previousAssetId');
    expect(result.worldElements).toEqual(physical.worldElements); expect(result.selectedElementIds).toEqual(physical.selectedElementIds);
    expect(state.rows.slice(0, 3)).toEqual(accepted);
    const saved = parseProposalManifest(String(state.rows.at(-1)!.story));
    expect(saved?.sourceImageIds).toEqual([physical.id, details.id]); expect(saved?.previousAssetId).toBe(details.id);
    const textBody = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    const direction = JSON.parse(textBody.messages[1].content);
    expect(direction.context).toEqual(physical.context); expect(direction.detailsRefinement).toEqual(refinement);
    expect(direction.references).toEqual([{ index: 1, role: 'approved-physical-identity' }, { index: 2, role: 'previous-details-layout-only-lower-priority' }]);
    const form = imageCalls()[0][1]?.body as FormData;
    const images = form.getAll('image[]') as File[];
    expect(Array.from(new Uint8Array(await images[0].arrayBuffer()))).toEqual(Array.from(physicalBytes));
    expect(Array.from(new Uint8Array(await images[1].arrayBuffer()))).toEqual(Array.from(detailsBytes));
    expect(imagePrompt(0)).toContain(JSON.stringify(refinement));
    for (const id of [world.id, physical.id, details.id]) {
      expect(JSON.stringify(direction)).not.toContain(id); expect(imagePrompt(0)).not.toContain(id);
    }
    resetTransports();
    const restored = await (await post({ id: result.id })).json();
    expect(restored.concept.detailsRefinement).toEqual(refinement);
    expect(restored.concept.sourceImageIds).toEqual([physical.id]); expect(restored.concept).not.toHaveProperty('previousAssetId');
    expectNoGeneration();
  });
  it('allows no previous details, keys cache by exact instruction, and reuses the same completed refinement', async () => {
    const { body } = await fixture();
    const first = await generate({ ...body, detailsRefinement: refinement });
    resetTransports();
    expect((await generate({ ...body, detailsRefinement: refinement })).id).toBe(first.id);
    expect(state.textCalls).toBe(0); expect(state.imageCalls).toBe(0); expect(state.rpc).not.toHaveBeenCalled();
    const changed = await generate({ ...body, detailsRefinement: { ...refinement, instruction: refinement.instruction + ' Keep the camera lower.' } });
    expect(changed.id).not.toBe(first.id); expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(1);
    expect(new Set(state.rows.map(row => row.cache_key)).size).toBe(state.rows.length);
  });
  it('retains the exact-context guard even when a refinement is supplied', async () => {
    const { body } = await fixture();
    const response = await post({ ...body, context: { ...body.context, revisionNotes: refinement.instruction }, detailsRefinement: refinement });
    expect(response.status).toBe(400); expect((await response.json()).error).toContain('current physical direction');
    expectNoGeneration();
  });
  it('retains lineage checks for an unrelated previous detail sheet', async () => {
    const { world, details, body } = await fixture();
    const otherPhysical = await generate({ ...physicalRequest(world), context: { ...world.context, materials: 'A different proposed finish' } });
    const otherDetails = await generate({ ...body, context: otherPhysical.context, sourcePhysicalId: otherPhysical.id });
    resetTransports();
    const response = await post({ ...body, previousAssetId: otherDetails.id, detailsRefinement: refinement });
    expect(response.status).toBe(400); expect((await response.json()).error).toContain('unrelated physical');
    expectNoGeneration(); expect(details.sourcePhysicalId).toBe(body.sourcePhysicalId);
  });
  it('rejects capability identifiers in the instruction before text or image work', async () => {
    const { physical, body } = await fixture();
    const response = await post({ ...body, detailsRefinement: { ...refinement, instruction: `Use ${physical.id} in the caption.` } });
    expect(response.status).toBe(400); expect((await response.json()).error).toContain('Remove saved-image identifiers');
    expectNoGeneration();
  });
  it('plans details against an accepted packaging-only context without changing its physical authority', async () => {
    const { world, physical, details, body } = await fixture();
    const acceptedContext = { ...body.context, revisionNotes: 'Packaging-only navy sleeve.' };
    const packaging = await generate({ ...body, stage: 'packaging', context: acceptedContext });
    resetTransports(); state.output = { scope: 'details', context: {}, summary: 'Clarify the original reply reveal.' };
    const response = await post({ contractVersion: PROPOSAL_CONTRACT_VERSION, action: 'plan-revision', brand: body.brand,
      context: acceptedContext, instruction: refinement.instruction, sourceWorldId: world.id, sourcePhysicalId: physical.id, detailsId: details.id, packagingId: packaging.id });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.plan).toEqual({ scope: 'details', context: acceptedContext, summary: 'Clarify the original reply reveal.', detailsRefinement: refinement });
    expect(state.textCalls).toBe(1); expect(state.imageCalls).toBe(0); expect(state.download).not.toHaveBeenCalled();
    state.output = undefined;
    const revised = await generate({ ...body, detailsRefinement: result.plan.detailsRefinement, previousAssetId: details.id });
    expect(revised.context).toEqual(physical.context); expect(revised.sourcePhysicalId).toBe(physical.id);
  });
});
