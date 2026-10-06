import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANVAS_CAPABILITIES, type CanvasConcept, type CanvasRequest } from '../../supabase/functions/generate-concept/canvas';
import { CANVAS_CONTRACT_VERSION, CanvasUnavailableError, requestCanvasConcept, restoreCanvasConcept, supportsCanvasGeneration } from './canvas-api';
const id = '00000000-0000-4000-8000-000000000001';
const compatible = { ready: true, prompt_version: 'offkin-cocreation-v8', capabilities: { ...CANVAS_CAPABILITIES } };
const request: CanvasRequest = { contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'no-website', context: { business: 'Origami stationery', exactWording: '  Fold for YOU!\n异趣伙伴  ' } };
const concept: CanvasConcept = {
  id, contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'Studio', title: 'Paper world', story: 'A proposed layered world', design: 'Connected paper paths', interaction: 'Explore the elements', image: 'https://private.invalid/world.png?token=signed', sourceUrl: '', sourceTitle: '', context: request.context,
  worldElements: [{ id: 'fold', label: 'A fold', description: 'The supplied folding ritual', kind: 'fact' }],
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request in test')));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('exact canvas v9 capability negotiation', () => {
  it('checks readiness without sending context or starting generation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(compatible)));
    const controller = new AbortController();
    expect(await supportsCanvasGeneration(controller.signal)).toBe(true);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://test.invalid/functions/v1/generate-concept', { headers: { apikey: 'test-key' }, signal: controller.signal });
  });
  it.each([
    ['v8 only', { ready: true, prompt_version: 'offkin-cocreation-v8', capabilities: { cocreation: true, context_max_chars: 6000 } }],
    ['missing readiness', { capabilities: compatible.capabilities }],
    ['unready', { ...compatible, ready: false }],
    ['string readiness', { ...compatible, ready: 'true' }],
    ['missing canvas flag', { ...compatible, capabilities: { ...compatible.capabilities, canvas: undefined } }],
    ['string flag', { ...compatible, capabilities: { ...compatible.capabilities, canvas: 'true' } }],
    ['stale contract', { ...compatible, capabilities: { ...compatible.capabilities, canvas_contract_version: 'offkin-canvas-v8' } }],
    ['future contract', { ...compatible, capabilities: { ...compatible.capabilities, canvas_contract_version: 'offkin-canvas-v10' } }],
    ['missing limit', { ...compatible, capabilities: { ...compatible.capabilities, canvas_context_max_chars: undefined } }],
    ['string limit', { ...compatible, capabilities: { ...compatible.capabilities, canvas_context_max_chars: '6000' } }],
    ['changed limit', { ...compatible, capabilities: { ...compatible.capabilities, canvas_context_max_chars: 12000 } }],
    ['world only', { ...compatible, capabilities: { ...compatible.capabilities, canvas_stages: ['world'] } }],
    ['extra stage', { ...compatible, capabilities: { ...compatible.capabilities, canvas_stages: ['world', 'physical', 'final'] } }],
    ['object capabilities', { ...compatible, capabilities: [] }],
    ['null', null], ['array', []], ['string', 'ready'],
  ])('fails closed for %s without a generation POST', async (_label, data) => {
    const fetchMock = vi.fn().mockImplementation(async () => reply(data));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(false);
    await expect(requestCanvasConcept(request, new AbortController().signal)).rejects.toBeInstanceOf(CanvasUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, options] of fetchMock.mock.calls) expect(options.body).toBeUndefined();
  });
  it.each([400, 401, 429, 500, 503])('fails closed for HTTP %i even with compatible JSON', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(compatible, status)));
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(false);
  });
  it('rejects stale readiness between screen load and explicit Generate click', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ ...compatible, ready: false }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(true);
    await expect(requestCanvasConcept(request, new AbortController().signal)).rejects.toBeInstanceOf(CanvasUnavailableError);
    for (const [, options] of fetchMock.mock.calls) expect(options.body).toBeUndefined();
  });
  it('fails closed for malformed JSON, unavailable configuration and network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json')));
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(false);
    vi.mocked(fetch).mockClear(); vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(await supportsCanvasGeneration(new AbortController().signal)).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
describe('explicit canvas request and private restore boundary', () => {
  it('sends the full exact context unchanged only after an immediately preceding readiness check', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    expect(await requestCanvasConcept(request, controller.signal)).toEqual({ concept });
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(request);
    expect(fetchMock.mock.calls[1][1].signal).toBe(controller.signal);
  });
  it('carries selected, removed, replaced and hero elements into the physical request without rewriting', async () => {
    const physical: CanvasRequest = { ...request, stage: 'physical', sourceWorldId: id, selectedElementIds: ['fold'], heroElementId: 'fold', replacements: [{ id: 'fold', label: 'A new fold', description: 'An explicitly proposed new scene  ' }] };
    const result: CanvasConcept = { ...concept, id: '00000000-0000-4000-8000-000000000002', stage: 'physical', sourceWorldId: id, selectedElementIds: ['fold'], heroElementId: 'fold', replacements: physical.replacements, worldElements: [{ ...physical.replacements![0], kind: 'proposal' }] };
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ concept: result }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await requestCanvasConcept(physical, new AbortController().signal)).toEqual({ concept: result });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(physical);
  });
  it('restores with only the UUID capability, without readiness or generation input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await restoreCanvasConcept(id, new AbortController().signal)).toEqual({ concept });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id });
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });
  it('does not restore invalid IDs or accept an incompatible/private-link response', async () => {
    await expect(restoreCanvasConcept('../world', new AbortController().signal)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
    for (const output of [null, {}, [], { concept: { ...concept, id: '00000000-0000-4000-8000-000000000009' } }, { concept: { ...concept, contractVersion: 'offkin-canvas-v8' } }, { concept: { ...concept, image: 'javascript:alert(1)' } }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(output)));
      await expect(restoreCanvasConcept(id, new AbortController().signal)).rejects.toThrow();
    }
  });
  it('rejects mismatched stage, context or selected-source metadata even on HTTP success', async () => {
    for (const output of [{ ...concept, context: { business: 'different' } }, { ...concept, stage: 'physical' }, { ...concept, worldElements: [{ ...concept.worldElements[0], x: 0.4 }] }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ concept: output })));
      await expect(requestCanvasConcept(request, new AbortController().signal)).rejects.toThrow();
    }
  });
  it('rejects unversioned, stale and oversized requests locally without any network request', async () => {
    for (const body of [{ ...request, contractVersion: undefined }, { ...request, contractVersion: 'offkin-canvas-v8' }, { ...request, context: { business: 'x'.repeat(6000) } }, { ...request, context: { uploadedLogo: 'logo.png' } }]) await expect(requestCanvasConcept(body as CanvasRequest, new AbortController().signal)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('honors cancellation before readiness, after readiness and after the POST', async () => {
    const aborted = new AbortController(); aborted.abort();
    expect(await supportsCanvasGeneration(aborted.signal)).toBe(false);
    await expect(requestCanvasConcept(request, aborted.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { controller.abort(); return reply(compatible); }));
    await expect(requestCanvasConcept(request, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledOnce();
    const afterPost = new AbortController();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(compatible)).mockImplementationOnce(async () => { afterPost.abort(); return reply({ concept }); }));
    await expect(requestCanvasConcept(request, afterPost.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('returns honest factual-context follow-up without inventing a concept', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ needsContext: true, message: 'Tell us what the business does.' })));
    expect(await requestCanvasConcept(request, new AbortController().signal)).toEqual({ needsContext: true, message: 'Tell us what the business does.' });
  });
});
