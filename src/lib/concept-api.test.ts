import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CO_CREATION_CONTRACT_VERSION, MAX_CONTEXT_CHARS, CoCreationUnavailableError, requestConcept, supportsCoCreation, supportsElectronicStoryScenes, supportsSummaryOnly } from './concept-api';

const compatible = {
  ready: true,
  capabilities: { electronic_story_scene: true, summary_only: true, cocreation: true, context_max_chars: 6000 },
  prompt_version: CO_CREATION_CONTRACT_VERSION,
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const request = {
  brand: 'no-website', summaryOnly: true, edition: 'inside', format: 'miniature',
  contractVersion: CO_CREATION_CONTRACT_VERSION,
  context: JSON.stringify({ business: 'A print studio.', mode: 'mechanical', exactWording: '  Made for YOU!\n异趣伙伴  ', scale: 'Let the story decide', brandIdentifiers: 'A folding gesture' }),
};
const concept = { id: 'concept-id', brand: 'Studio', title: 'Fold', story: 'A folding ritual.', edition: 'inside', format: 'miniature' };

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request in test')));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('v8 co-creation capability negotiation', () => {
  it('accepts only the ready, versioned 6000-character co-creation contract in a read-only check', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(compatible));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    expect(await supportsCoCreation(controller.signal)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://test.invalid/functions/v1/generate-concept');
    expect(options.method || 'GET').toBe('GET');
    expect(options.body).toBeUndefined();
    expect(options.headers).toMatchObject({ apikey: 'test-key' });
    expect(options.signal).toBe(controller.signal);
  });

  it.each([
    ['legacy backend', { ready: true }],
    ['live v7 backend', { ready: true, prompt_version: 'dioramini-story-led-miniatures-v7', capabilities: { electronic_story_scene: true, summary_only: true } }],
    ['missing capability', { ...compatible, capabilities: {} }],
    ['disabled capability', { ...compatible, capabilities: { ...compatible.capabilities, cocreation: false } }],
    ['non-boolean capability', { ...compatible, capabilities: { ...compatible.capabilities, cocreation: 'true' } }],
    ['missing limit', { ...compatible, capabilities: { cocreation: true } }],
    ['legacy limit', { ...compatible, capabilities: { cocreation: true, context_max_chars: 600 } }],
    ['string limit', { ...compatible, capabilities: { cocreation: true, context_max_chars: '6000' } }],
    ['different limit', { ...compatible, capabilities: { cocreation: true, context_max_chars: 12000 } }],
    ['missing readiness', { capabilities: compatible.capabilities, prompt_version: compatible.prompt_version }],
    ['unready backend', { ...compatible, ready: false }],
    ['non-boolean readiness', { ...compatible, ready: 'true' }],
    ['missing prompt version', { ready: true, capabilities: compatible.capabilities }],
    ['old prompt version with new flags', { ...compatible, prompt_version: 'dioramini-story-led-miniatures-v7' }],
    ['unknown future prompt version', { ...compatible, prompt_version: 'offkin-cocreation-v9' }],
    ['null response', null], ['array response', []], ['string response', 'ready'],
  ])('fails closed for %s without a generation POST', async (_description, data) => {
    const fetchMock = vi.fn().mockImplementation(async () => reply(data));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsCoCreation(new AbortController().signal)).toBe(false);
    await expect(requestConcept(request, new AbortController().signal)).rejects.toBeInstanceOf(CoCreationUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, options] of fetchMock.mock.calls) expect(options.body).toBeUndefined();
  });

  it.each([400, 401, 429, 500, 503])('fails closed for HTTP %i even with compatible JSON', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(compatible, status)));
    expect(await supportsCoCreation(new AbortController().signal)).toBe(false);
  });

  it('fails closed for malformed JSON and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })));
    expect(await supportsCoCreation(new AbortController().signal)).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await supportsCoCreation(new AbortController().signal)).toBe(false);
  });

  it('makes no request if already aborted and rejects a response cancelled in flight', async () => {
    const cancelled = new AbortController(); cancelled.abort();
    expect(await supportsCoCreation(cancelled.signal)).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(async () => { controller.abort(); return reply(compatible); });
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestConcept(request, controller.signal)).rejects.toBeInstanceOf(CoCreationUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it.each(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'])('does not call a backend when %s is missing', async key => {
    vi.stubEnv(key, '');
    expect(await supportsCoCreation(new AbortController().signal)).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires the electronic capability as well as the v8 contract for electronic briefs', async () => {
    const noElectronic = { ...compatible, capabilities: { ...compatible.capabilities, electronic_story_scene: false } };
    const fetchMock = vi.fn().mockImplementation(async () => reply(noElectronic));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsCoCreation(new AbortController().signal)).toBe(true);
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
    await expect(requestConcept({ ...request, context: JSON.stringify({ mode: 'electronic', business: 'A print studio.' }) }, new AbortController().signal)).rejects.toBeInstanceOf(CoCreationUnavailableError);
    for (const [, options] of fetchMock.mock.calls) expect(options.body).toBeUndefined();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(compatible)));
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(true);
  });

  it('retains the independent summary-only capability', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ capabilities: { summary_only: true } })));
    expect(await supportsSummaryOnly(new AbortController().signal)).toBe(true);
  });
});

describe('generation request boundary', () => {
  it('negotiates immediately before POST and preserves the entire exact context', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const data = await requestConcept(request, controller.signal);
    expect(data.concept).toEqual(concept);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(request);
    expect(JSON.parse(JSON.parse(fetchMock.mock.calls[1][1].body).context).exactWording).toBe('  Made for YOU!\n异趣伙伴  ');
  });

  it('does not reuse a stale successful capability check', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ ...compatible, prompt_version: 'dioramini-story-led-miniatures-v7' }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsCoCreation(new AbortController().signal)).toBe(true);
    await expect(requestConcept(request, new AbortController().signal)).rejects.toBeInstanceOf(CoCreationUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, options] of fetchMock.mock.calls) expect(options.body).toBeUndefined();
  });

  it.each([
    { ...request, contractVersion: 'offkin-cocreation-v9' },
    { ...request, contractVersion: null },
    { ...request, contractVersion: undefined, context: 'x'.repeat(601) },
    { ...request, contractVersion: undefined },
    { ...request, context: JSON.stringify({ business: 'x'.repeat(MAX_CONTEXT_CHARS) }) },
    { ...request, context: { business: 'A print studio.' } },
    { ...request, context: '{"business":"A studio.","uploadedLogo":"logo.png"}' },
  ])('rejects invalid or unversioned rich requests locally', async body => {
    await expect(requestConcept(body, new AbortController().signal)).rejects.toBeInstanceOf(Error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('accepts 6000 context characters without shortening or silently downgrading', async () => {
    const context = JSON.stringify({ business: 'x'.repeat(MAX_CONTEXT_CHARS - JSON.stringify({ business: '' }).length) });
    expect(context).toHaveLength(MAX_CONTEXT_CHARS);
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(compatible)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    await requestConcept({ ...request, context }, new AbortController().signal);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).context).toBe(context);
  });

  it.each([{ brand: 'https://studio.example', inspectWebsite: true }, { id: 'saved-id' }, { brand: 'https://studio.example', context: 'A studio.' }])('keeps legacy inspection, saved links and short legacy briefs callable', async body => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ needsContext: true }));
    vi.stubGlobal('fetch', fetchMock);
    await requestConcept(body, new AbortController().signal);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });
});
