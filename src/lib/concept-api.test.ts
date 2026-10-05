import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supportsElectronicStoryScenes } from './concept-api';

const compatible = {
  ready: true,
  capabilities: { electronic_story_scene: true },
  prompt_version: 'dioramini-story-led-miniatures-v7',
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request in test')));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Electronic story-scene capability gate', () => {
  it('accepts only a ready backend explicitly advertising the matching electronic prompt contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(compatible));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    expect(await supportsElectronicStoryScenes(controller.signal)).toBe(true);

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
    ['missing capability', { ...compatible, capabilities: {} }],
    ['disabled capability', { ...compatible, capabilities: { electronic_story_scene: false } }],
    ['non-boolean capability', { ...compatible, capabilities: { electronic_story_scene: 'true' } }],
    ['missing readiness', { capabilities: compatible.capabilities, prompt_version: compatible.prompt_version }],
    ['unready backend', { ...compatible, ready: false }],
    ['non-boolean readiness', { ...compatible, ready: 'true' }],
    ['missing prompt version', { ready: true, capabilities: compatible.capabilities }],
    ['old prompt version', { ...compatible, prompt_version: 'dioramini-story-led-miniatures-v6' }],
    ['unknown future prompt version', { ...compatible, prompt_version: 'dioramini-story-led-miniatures-v8' }],
    ['null response', null],
    ['array response', []],
    ['string response', 'ready'],
  ])('fails closed for %s', async (_description, data) => {
    const fetchMock = vi.fn().mockResolvedValue(reply(data));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it.each([400, 401, 429, 500, 503])('fails closed for HTTP %i even if the body advertises support', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(compatible, status)));
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
  });

  it('fails closed for malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })));
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
  });

  it('fails closed for a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
  });

  it('fails closed when the read-only check is aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsElectronicStoryScenes(controller.signal)).toBe(false);
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('rejects a compatible response when its signal was cancelled before completion', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(async () => {
      controller.abort();
      return reply(compatible);
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await supportsElectronicStoryScenes(controller.signal)).toBe(false);
  });

  it.each(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'])('does not call any backend when %s is missing', async key => {
    vi.stubEnv(key, '');
    expect(await supportsElectronicStoryScenes(new AbortController().signal)).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
