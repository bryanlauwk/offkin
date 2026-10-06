// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { brokeredPreviewStorage } from './previewAuthStorage';

type Request = { type: string; requestId: string; projectId: string; key: string; value?: string };
type Reply = { origin: string; data: { type: string; requestId: string; ok: boolean; value?: string | null } };
const projectId = 'cecfbbf4-68b9-4b30-913e-320f26d0feb7';

function setup(options: { hostname?: string; ancestor?: string; topLevel?: boolean; synchronousReply?: string } = {}) {
  const values = new Map<string, string>();
  const listeners = new Set<(event: Reply) => void>();
  const sent: { message: Request; origin: string }[] = [];
  const local = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  const reply = (message: Request, value: string | null, origin = 'https://lovable.dev', requestId = message.requestId) => {
    const event = { origin, data: { type: 'lovable-preview-auth:result', requestId, ok: true, value } };
    for (const listener of [...listeners]) listener(event);
  };
  const frame = {
    parent: null as unknown,
    addEventListener: (_type: string, listener: (event: Reply) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: Reply) => void) => listeners.delete(listener),
  };
  frame.parent = options.topLevel ? frame : {
    postMessage: (message: Request, origin: string) => {
      sent.push({ message, origin });
      if (options.synchronousReply !== undefined) reply(message, options.synchronousReply);
    },
  };
  vi.stubGlobal('window', frame);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('location', {
    hostname: options.hostname ?? `id-preview--${projectId}.lovable.app`,
    ancestorOrigins: [options.ancestor ?? 'https://lovable.dev'],
  });
  vi.stubGlobal('document', { referrer: '' });
  const storage = brokeredPreviewStorage()!;
  return { storage, values, listeners, sent, local, reply };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('preview auth broker lifecycle', () => {
  it('is absent during server-side rendering', () => {
    vi.stubGlobal('window', undefined);
    expect(brokeredPreviewStorage()).toBeUndefined();
  });

  it.each([
    ['custom domain', { hostname: 'offkin.example' }],
    ['top-level preview', { topLevel: true }],
    ['user-named preview host', { hostname: `preview--${projectId}.lovable.app` }],
  ])('uses local storage on a %s', (_name, options) => {
    const state = setup(options);
    expect(state.storage).toBe(state.local);
    expect(state.sent).toHaveLength(0);
  });

  it('sends only to a trusted editor origin even when embedded elsewhere', async () => {
    const state = setup({ ancestor: 'https://untrusted.example' });
    const pending = state.storage.setItem('session', 'test-value');
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]).toMatchObject({ origin: 'https://lovable.dev', message: { projectId, key: 'session', value: 'test-value' } });
    state.reply(state.sent[0].message, 'test-value');
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses an allowlisted editor subdomain without broadening the target', async () => {
    const state = setup({ ancestor: 'https://editor.lovable.dev' });
    const pending = state.storage.getItem('session');
    expect(state.sent[0].origin).toBe('https://editor.lovable.dev');
    state.reply(state.sent[0].message, 'broker', 'https://editor.lovable.dev');
    expect(await pending).toBe('broker');
  });

  it.each(['origin', 'request ID'])('ignores a reply with the wrong %s', async mismatch => {
    const state = setup();
    let settled = false;
    const pending = Promise.resolve(state.storage.getItem('session')).then(value => { settled = true; return value; });
    const message = state.sent[0].message;
    state.reply(message, 'wrong', mismatch === 'origin' ? 'https://untrusted.example' : 'https://lovable.dev', mismatch === 'request ID' ? 'wrong-id' : message.requestId);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    state.reply(message, 'broker');
    expect(await pending).toBe('broker');
    expect(state.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timer and listener after an ordinary asynchronous response', async () => {
    const state = setup();
    const pending = state.storage.getItem('session');
    expect(vi.getTimerCount()).toBe(1);
    await Promise.resolve();
    state.reply(state.sent[0].message, 'broker');
    expect(await pending).toBe('broker');
    expect(vi.getTimerCount()).toBe(0);
    expect(state.listeners.size).toBe(0);
    await vi.advanceTimersByTimeAsync(3000);
    expect(state.sent).toHaveLength(1);
  });

  it('retries the first timed-out read once, then falls back; later reads do not retry', async () => {
    const state = setup();
    state.values.set('session', 'local');
    const first = state.storage.getItem('session');
    await vi.advanceTimersByTimeAsync(4250);
    expect(await first).toBe('local');
    expect(state.sent).toHaveLength(2);
    expect(state.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    const second = state.storage.getItem('session');
    await vi.advanceTimersByTimeAsync(2000);
    expect(await second).toBe('local');
    expect(state.sent).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves a local value when the broker has never synchronized it', async () => {
    const state = setup();
    state.values.set('session', 'local');
    const pending = state.storage.getItem('session');
    state.reply(state.sent[0].message, null);
    expect(await pending).toBe('local');
  });

  it('removes the local copy when a logout tombstone arrives', async () => {
    const state = setup();
    state.values.set('session', 'old');
    const pending = state.storage.getItem('session');
    state.reply(state.sent[0].message, '');
    expect(await pending).toBeNull();
    expect(state.values.has('session')).toBe(false);
  });

  it('preserves newer local writes when an older set response arrives', async () => {
    const state = setup();
    const first = state.storage.setItem('session', 'first');
    const second = state.storage.setItem('session', 'second');
    state.reply(state.sent[0].message, 'older-response');
    await first;
    expect(state.values.get('session')).toBe('second');
    state.reply(state.sent[1].message, 'canonical-second');
    await second;
    expect(state.values.get('session')).toBe('canonical-second');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears local storage and cleans up after remove', async () => {
    const state = setup();
    state.values.set('session', 'old');
    const pending = state.storage.removeItem('session');
    expect(state.values.has('session')).toBe(false);
    state.reply(state.sent[0].message, '');
    await pending;
    expect(state.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not access an uninitialized timer or schedule one after a synchronous response', async () => {
    const state = setup({ synchronousReply: 'broker' });
    expect(await state.storage.getItem('session')).toBe('broker');
    expect(state.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(3000);
    expect(state.sent).toHaveLength(1);
  });

  it('ignores duplicate responses after completion', async () => {
    const state = setup();
    const pending = state.storage.setItem('session', 'initial');
    const message = state.sent[0].message;
    state.reply(message, 'accepted');
    await pending;
    state.reply(message, 'late');
    expect(state.values.get('session')).toBe('accepted');
    expect(state.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
