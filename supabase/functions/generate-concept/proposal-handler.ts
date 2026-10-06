import {
  CANVAS_CONTRACT_VERSION, CanvasFailure, parseCanvasDesign, parseCanvasManifest,
  selectWorldElements, type CanvasContext, type CanvasManifest, type CanvasStoredRow,
} from './canvas.ts';
import {
  PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGE_VERSION, canonicalProposal,
  parseProposalManifest, parseRevisionPlan, proposalSourceImageIds, sameProposalContext, sameWorldDirection,
  serializeProposalManifest, validateProposalRequest, validateRevisionPlanRequest,
  type ProposalManifest, type ProposalRequest, type ProposalStage,
} from './proposal.ts';
import { proposalDesignPrompt, proposalImagePrompt, PROPOSAL_REVISION_PROMPT } from './proposal-prompt.ts';
import { readCompanyWebsite, validatePublicWebsiteUrl, WebsiteReadError } from './website.ts';

type StoredRow = CanvasStoredRow & { cache_key?: string; edition?: 'inside'; format?: 'miniature' };
type Result<T> = { data?: T; error?: unknown };
type Source = { row: StoredRow; manifest: CanvasManifest | ProposalManifest };
type ImageBlob = { size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> };
export type ProposalDatabase = {
  from(name: string): {
    select(fields: string): { eq(field: string, value: unknown): { maybeSingle(): PromiseLike<Result<StoredRow | null>> } };
    insert(row: StoredRow): PromiseLike<{ error?: unknown }>;
  };
  storage: { from(name: string): {
    download(path: string): PromiseLike<Result<ImageBlob>>;
    upload(path: string, bytes: Uint8Array, options: { contentType: string; upsert: boolean }): PromiseLike<{ error?: unknown }>;
    remove(paths: string[]): PromiseLike<{ error?: unknown }>;
  } };
};
export type ProposalRuntime = {
  db: ProposalDatabase;
  enabled: boolean;
  textModel: string;
  imageModel: string;
  ai(path: string, body: unknown): Promise<unknown>;
  reserve(): Promise<void>;
  hash(text: string): Promise<string>;
  respond(data: unknown, status?: number): Response;
  deliver(row: StoredRow): Promise<Response>;
};
const columns = 'id,cache_key,brand,title,story,image_path,interaction,source_url,source_title,prompt_version';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const imageModels = ['openai/gpt-image-2', 'openai/gpt-image-2-2026-04-21'];
export const supportsProposalModel = (model: string): boolean => imageModels.includes(model);
const uuidPattern = () => /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
function identifiers(value: unknown): Set<string> {
  return new Set((JSON.stringify(value).match(uuidPattern()) || []).map(id => id.toLowerCase()));
}
function modelBoundary(sources: (Source | null)[], customerText: unknown) {
  const privateIds = new Set<string>();
  for (const source of sources) if (source) {
    for (const id of identifiers({ id: source.row.id, sourceWorldId: source.manifest.sourceWorldId,
      ...('sourcePhysicalId' in source.manifest ? { sourcePhysicalId: source.manifest.sourcePhysicalId } : {}),
      ...('previousAssetId' in source.manifest ? { previousAssetId: source.manifest.previousAssetId, sourceImageIds: source.manifest.sourceImageIds } : {}),
    })) privateIds.add(id);
  }
  // Explicit user-authored identifiers (for example a business reference in exactWording) may
  // survive; saved-image capabilities are never put in prompts or permitted to be echoed.
  const allowed = identifiers(customerText);
  if ([...allowed].some(id => privateIds.has(id))) throw new CanvasFailure(400, 'Remove saved-image identifiers from the written direction; image references are handled separately.');
  const sanitize = (value: unknown): unknown => {
    if (typeof value === 'string') return value.replace(uuidPattern(), id => allowed.has(id.toLowerCase()) ? id : '[saved reference]');
    if (Array.isArray(value)) return value.map(sanitize);
    if (record(value)) return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitize(child)]));
    return value;
  };
  const source = (item: Source | null): unknown => item ? sanitize({
    stage: item.manifest.stage, brand: item.row.brand, title: item.row.title, story: item.manifest.story,
    design: item.manifest.design, context: item.manifest.context, worldElements: item.manifest.worldElements,
    selectedElementIds: item.manifest.selectedElementIds, heroElementId: item.manifest.heroElementId,
    replacements: item.manifest.replacements, interaction: item.row.interaction || '',
  }) : null;
  const inspect = (value: unknown): unknown => {
    if ([...identifiers(value)].some(id => privateIds.has(id) || !allowed.has(id))) throw new CanvasFailure(502, 'The generator included an unexpected saved reference. Your proposal is unchanged.');
    return value;
  };
  return { sanitize, source, inspect };
}
function imageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}
function base64(bytes: Uint8Array): string {
  let raw = '';
  for (let i = 0; i < bytes.length; i += 32768) raw += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(raw);
}
function textResult(result: unknown): unknown {
  try {
    if (!record(result) || !Array.isArray(result.choices)) throw new Error();
    const first = result.choices[0];
    if (!record(first) || !record(first.message) || typeof first.message.content !== 'string') throw new Error();
    return JSON.parse(first.message.content);
  } catch { throw new CanvasFailure(502, 'The proposal response was incomplete. Your existing images and brief are unchanged.'); }
}
function imageResult(result: unknown): { bytes: Uint8Array; mime: string } {
  const data = record(result) && Array.isArray(result.data) ? result.data : null;
  const b64 = data?.length === 1 && record(data[0]) ? data[0].b64_json : null;
  if (typeof b64 !== 'string' || b64.length === 0 || b64.length > 14000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) throw new CanvasFailure(502, 'The image provider returned no supported image.');
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); } catch { throw new CanvasFailure(502, 'The image provider returned an invalid image.'); }
  const mime = imageMime(bytes);
  if (!mime || bytes.length > MAX_IMAGE_BYTES) throw new CanvasFailure(502, 'The image is unsupported or too large to save.');
  return { bytes, mime };
}
/** One asset per request. Successful rows survive later-stage failure; no background-job claim. */
export async function handleProposal(input: unknown, req: Request, runtime: ProposalRuntime): Promise<Response> {
  const { db, respond, deliver } = runtime;
  const active = () => { if (req.signal.aborted) throw new CanvasFailure(499, 'The request was cancelled.'); };
  const isPlan = record(input) && input.action === 'plan-revision';
  const request = isPlan ? validateRevisionPlanRequest(input) : validateProposalRequest(input);
  active();
  if (!runtime.enabled || !supportsProposalModel(runtime.imageModel)) throw new CanvasFailure(503, 'Complete proposal generation is not enabled yet. Your brief is saved; no AI request was sent.');
  const load = async (id: string, stage: ProposalStage): Promise<Source> => {
    const { data: row, error } = await db.from('brick_concepts').select(columns).eq('id', id).maybeSingle();
    if (error) throw new CanvasFailure(503, 'The source proposal could not be loaded.');
    if (!row) throw new CanvasFailure(404, 'The source proposal could not be found.');
    const manifest = row.prompt_version === PROPOSAL_CONTRACT_VERSION ? parseProposalManifest(row.story) :
      row.prompt_version === CANVAS_CONTRACT_VERSION ? parseCanvasManifest(row.story) : null;
    if (!manifest || manifest.stage !== stage) throw new CanvasFailure(400, 'This image is not the required saved proposal stage.');
    if (!['png', 'jpeg', 'webp'].some(ext => row.image_path === `${row.id}.${ext}`)) throw new CanvasFailure(400, 'The saved image reference is invalid.');
    return { row, manifest };
  };
  const world = request.sourceWorldId ? await load(request.sourceWorldId, 'world') : null;
  const physical = request.sourcePhysicalId ? await load(request.sourcePhysicalId, 'physical') : null;
  if (physical && (!world || physical.manifest.sourceWorldId !== world.row.id)) throw new CanvasFailure(400, 'The physical concept belongs to a different world.');
  if (world && !sameWorldDirection(request.context, world.manifest.context)) throw new CanvasFailure(400, 'The world direction changed. Generate its updated world before continuing this proposal.');
  if (isPlan) {
    const planRequest = validateRevisionPlanRequest(input);
    const details = planRequest.detailsId ? await load(planRequest.detailsId, 'details') : null;
    const packaging = planRequest.packagingId ? await load(planRequest.packagingId, 'packaging') : null;
    for (const source of [details, packaging]) if (source &&
      (!('sourcePhysicalId' in source.manifest) || source.manifest.sourcePhysicalId !== physical!.row.id || source.manifest.sourceWorldId !== world!.row.id)) {
      throw new CanvasFailure(400, 'The proposal includes an image from a different physical version.');
    }
    // The accepted context must come from the current physical or its packaging-only revision.
    if (![physical, packaging].some(source => source && sameProposalContext(planRequest.context, source.manifest.context))) {
      throw new CanvasFailure(400, 'Open the current saved proposal before planning a revision.');
    }
    const boundary = modelBoundary([world, physical, details, packaging], { brand: planRequest.brand, context: planRequest.context, instruction: planRequest.instruction });
    active(); await runtime.reserve(); active();
    const result = await runtime.ai('chat/completions', {
      model: runtime.textModel,
      messages: [{ role: 'system', content: PROPOSAL_REVISION_PROMPT }, { role: 'user', content: JSON.stringify(boundary.sanitize({
        instruction: planRequest.instruction, brand: physical!.row.brand, currentContext: planRequest.context,
        currentProposal: { world: boundary.source(world), physical: boundary.source(physical), details: boundary.source(details), packaging: boundary.source(packaging) },
      })) }], response_format: { type: 'json_object' }, max_tokens: 4000,
    });
    active();
    return respond(parseRevisionPlan(boundary.inspect(textResult(result)), planRequest, { worldElements: world!.manifest.worldElements,
      selectedElementIds: physical!.manifest.selectedElementIds!, heroElementId: physical!.manifest.heroElementId!, replacements: physical!.manifest.replacements || [] }));
  }
  const generation = request as ProposalRequest;
  const previous = generation.previousAssetId ? await load(generation.previousAssetId, generation.stage) : null;
  if (previous && generation.stage !== 'world') {
    const priorWorldId = world && 'previousAssetId' in world.manifest ? world.manifest.previousAssetId : undefined;
    const sameWorldLineage = previous.manifest.sourceWorldId === world?.row.id || Boolean(priorWorldId && previous.manifest.sourceWorldId === priorWorldId);
    if (!sameWorldLineage) throw new CanvasFailure(400, 'The previous image belongs to an unrelated world.');
    if (generation.stage === 'details' || generation.stage === 'packaging') {
      const priorPhysicalId = physical && 'previousAssetId' in physical.manifest ? physical.manifest.previousAssetId : undefined;
      const previousPhysicalId = 'sourcePhysicalId' in previous.manifest ? previous.manifest.sourcePhysicalId : undefined;
      if (previousPhysicalId !== physical?.row.id && (!priorPhysicalId || previousPhysicalId !== priorPhysicalId)) {
        throw new CanvasFailure(400, 'The previous image belongs to an unrelated physical proposal.');
      }
    }
  }
  if (physical && generation.stage === 'details' && !sameProposalContext(generation.context, physical.manifest.context)) {
    throw new CanvasFailure(400, 'The component study must use the current physical direction.');
  }
  if (physical && generation.stage === 'packaging' && ['mode', 'interaction', 'scale', 'materials'].some(k =>
    (generation.context[k] ?? '') !== (physical.manifest.context[k] ?? ''))) {
    throw new CanvasFailure(400, 'The physical direction changed. Update the physical concept before its packaging.');
  }
  const selectedElements = generation.stage === 'physical' ? selectWorldElements({ ...generation, contractVersion: CANVAS_CONTRACT_VERSION, stage: 'physical' }, world!.manifest as CanvasManifest) :
    physical ? physical.manifest.worldElements : null;
  const sourceImageIds = proposalSourceImageIds(generation);
  const sources = new Map([world, physical, previous].filter((s): s is Source => Boolean(s)).map(s => [s.row.id, s]));
  const boundary = modelBoundary([world, physical, previous], { brand: generation.brand, context: generation.context });
  // Download only paths held in validated rows from the project-managed private bucket.
  const images: { image_url: string }[] = [];
  const imageIdentities: { id: string; contentHash: string; path: string }[] = [];
  for (const id of sourceImageIds) {
    active();
    const source = sources.get(id)!;
    const { data: blob, error } = await db.storage.from('brick-concepts').download(source.row.image_path);
    if (error || !blob) throw new CanvasFailure(503, 'The saved reference image is temporarily unavailable. No image generation was started.');
    if (blob.size > MAX_IMAGE_BYTES || blob.size < 12) throw new CanvasFailure(400, 'The saved reference image is unsupported or too large.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mime = imageMime(bytes);
    if (!mime || bytes.length > MAX_IMAGE_BYTES) throw new CanvasFailure(400, 'The saved reference image is unsupported or too large.');
    const encoded = base64(bytes);
    images.push({ image_url: `data:${mime};base64,${encoded}` });
    imageIdentities.push({ id, path: source.row.image_path, contentHash: await runtime.hash(encoded) });
  }
  let websiteUrl = world?.row.source_url || '';
  if (generation.stage === 'world' && generation.brand !== 'no-website') {
    try { websiteUrl = validatePublicWebsiteUrl(generation.brand.trim()).href; }
    catch (error) { throw new CanvasFailure(400, error instanceof Error ? error.message : 'Enter a public company website.'); }
  }
  if (generation.stage === 'world' && !websiteUrl && !generation.context.business?.trim()) return respond({ needsContext: true, message: 'Tell us what the business does so this proposal starts with real facts.' });
  const cacheKey = await runtime.hash(canonicalProposal({ contractVersion: PROPOSAL_CONTRACT_VERSION, stageVersion: PROPOSAL_STAGE_VERSION,
    request: generation, websiteUrl, sourceManifests: Array.from(sources.values()).map(s => ({ id: s.row.id, manifest: s.manifest })),
    imageIdentities, model: runtime.imageModel, textModel: runtime.textModel, size: '1536x1024', quality: 'medium', transport: images.length ? 'openai-json-edits-v1' : 'openai-generations-v1' }));
  const { data: cached, error: cacheError } = await db.from('brick_concepts').select(columns).eq('cache_key', cacheKey).maybeSingle();
  if (cacheError) throw new CanvasFailure(503, 'Proposal storage is temporarily unavailable.');
  active();
  if (cached) return deliver(cached);
  let website: { url: string; title: string; excerpt: string } | null = null;
  if (generation.stage === 'world' && websiteUrl) {
    try { website = await readCompanyWebsite(websiteUrl); }
    catch (error) {
      if (error instanceof WebsiteReadError && error.status === 400) throw new CanvasFailure(400, error.message);
      if (!generation.context.business?.trim()) return respond({ needsContext: true, message: 'We could not read that website. Add factual business details instead of guessing.' });
    }
  }
  active(); await runtime.reserve(); active();
  const direction = { brand: world?.row.brand || generation.brand, context: generation.context, websiteEvidence: website,
    sourceWorld: boundary.source(world), sourcePhysical: boundary.source(physical), previousAsset: boundary.source(previous),
    selectedElements, heroElementId: generation.heroElementId || physical?.manifest.heroElementId || null,
    references: sourceImageIds.map((id, index) => ({ index: index + 1, role: id === previous?.row.id ? 'previous-same-role-image' : id === physical?.row.id ? 'approved-physical-identity' : 'approved-world-artwork' })) };
  const text = await runtime.ai('chat/completions', { model: runtime.textModel,
    messages: [{ role: 'system', content: proposalDesignPrompt(generation.stage) }, { role: 'user', content: JSON.stringify(boundary.sanitize(direction)) }],
    response_format: { type: 'json_object' }, max_tokens: 6500 });
  active();
  const output = boundary.inspect(textResult(text));
  if (record(output) && output.needsContext === true) return respond({ needsContext: true, message: 'Add a little more factual business detail before generating the proposal.' });
  const design = parseCanvasDesign(output);
  if (selectedElements) design.worldElements = selectedElements;
  if (world) design.brand = world.row.brand;
  boundary.inspect(design);
  const inherited = physical?.manifest;
  const manifest: ProposalManifest = {
    contractVersion: PROPOSAL_CONTRACT_VERSION, stageVersion: PROPOSAL_STAGE_VERSION, stage: generation.stage,
    context: generation.context, story: design.story, design: design.design, worldElements: design.worldElements, sourceImageIds,
    ...(generation.sourceWorldId ? { sourceWorldId: generation.sourceWorldId } : {}),
    ...(generation.sourcePhysicalId ? { sourcePhysicalId: generation.sourcePhysicalId } : {}),
    ...(generation.previousAssetId ? { previousAssetId: generation.previousAssetId } : {}),
    ...(generation.stage === 'physical' ? { selectedElementIds: generation.selectedElementIds, heroElementId: generation.heroElementId, replacements: generation.replacements || [] } :
      inherited ? { selectedElementIds: inherited.selectedElementIds, heroElementId: inherited.heroElementId, replacements: inherited.replacements || [] } : {}),
  };
  const serialized = serializeProposalManifest(manifest);
  // Avoid repeating whole source manifests: their actual images are attached, while all current
  // customer fields and every selected element remain in this bounded, untruncated prompt.
  const imageDirection = { context: generation.context, heroElementId: direction.heroElementId, references: direction.references };
  const prompt = proposalImagePrompt(generation.stage, generation.context.mode || 'mechanical') + '\nApproved design JSON:\n' + JSON.stringify(design) + '\nAuthoritative current direction and ordered image references:\n' + JSON.stringify(imageDirection);
  if (prompt.length > 32000) throw new CanvasFailure(400, 'This proposal direction is too long for the image model. Please shorten it; no wording was truncated.');
  const body = { model: runtime.imageModel, prompt, n: 1, size: '1536x1024', quality: 'medium', ...(images.length ? { images } : {}) };
  // Upstream-supported route. BRICK_PROPOSAL_ENABLED remains off until the gateway is verified.
  const result = await runtime.ai(images.length ? 'images/edits' : 'images/generations', body);
  active();
  const { bytes, mime } = imageResult(result);
  const id = crypto.randomUUID(); const imagePath = `${id}.${mime.split('/')[1]}`;
  const { error: uploadError } = await db.storage.from('brick-concepts').upload(imagePath, bytes, { contentType: mime, upsert: false });
  if (uploadError) throw new CanvasFailure(503, 'The proposal image could not be saved. Other completed sections are safe.');
  if (req.signal.aborted) { await db.storage.from('brick-concepts').remove([imagePath]); active(); }
  const row: StoredRow = { id, cache_key: cacheKey, brand: design.brand, title: design.title, story: serialized,
    image_path: imagePath, prompt_version: PROPOSAL_CONTRACT_VERSION, edition: 'inside', format: 'miniature', interaction: design.interaction,
    source_url: website?.url || world?.row.source_url || '', source_title: website?.title || world?.row.source_title || '' };
  const { error: saveError } = await db.from('brick_concepts').insert(row);
  if (saveError) {
    await db.storage.from('brick-concepts').remove([imagePath]);
    const { data: existing } = await db.from('brick_concepts').select(columns).eq('cache_key', cacheKey).maybeSingle();
    if (existing) return deliver(existing);
    throw new CanvasFailure(503, 'The proposal image could not be saved. Other completed sections are safe.');
  }
  return deliver(row);
}
