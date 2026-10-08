import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { requestBrandDiscovery, loadLookupDraft, saveLookupDraft } from './brand-discovery';
import { forgetPilotInvite, setPilotInvite } from './pilot-access';
const request = { contractVersion: 'offkin-brand-discovery-v1' as const, action: 'discover-brand' as const, query: 'Fable Finch' };
const result = { contractVersion: 'offkin-brand-discovery-v1', status: 'unavailable', message: 'Online research is paused.', reason: 'disabled', evidence: [], candidates: [] };
beforeEach(() => { localStorage.clear(); forgetPilotInvite(); vi.stubEnv('VITE_SUPABASE_URL', 'https://project.invalid'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public'); });
afterEach(() => { forgetPilotInvite(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('sends only the public brand query and header-only invitation to its own backend', async () => {
  setPilotInvite('a'.repeat(43)); const fetch = vi.fn(async (_url:string,_init:RequestInit) => new Response(JSON.stringify(result))); vi.stubGlobal('fetch', fetch);
  expect(await requestBrandDiscovery(request, new AbortController().signal)).toEqual(result);
  expect(fetch.mock.calls[0][0]).toBe('https://project.invalid/functions/v1/generate-concept'); const init = fetch.mock.calls[0][1] as RequestInit;
  expect(init.headers).toMatchObject({ 'x-offkin-invite': 'a'.repeat(43) }); expect(init.body).toBe(JSON.stringify(request)); expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' }); expect(localStorage.length).toBe(0);
});
it('fails without an invitation and rejects malformed or unsafe research sources', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); await expect(requestBrandDiscovery(request, new AbortController().signal)).rejects.toThrow('invitation'); expect(fetch).not.toHaveBeenCalled();
  setPilotInvite('a'.repeat(43)); fetch.mockResolvedValue(new Response(JSON.stringify({ ...result, evidence: [{ url: 'javascript:alert(1)', title: 'Bad', excerpt: 'Bad' }] })));
  await expect(requestBrandDiscovery(request, new AbortController().signal)).rejects.toThrow('safely');
});
it('rejects a late response from a changed invitation', async () => {
  setPilotInvite('a'.repeat(43)); vi.stubGlobal('fetch', vi.fn(async () => { setPilotInvite('b'.repeat(43)); return new Response(JSON.stringify(result)); }));
  await expect(requestBrandDiscovery(request, new AbortController().signal)).rejects.toThrow('Cancelled');
});
it('stores only a bounded query/research identifier and supports clear', () => {
  expect(saveLookupDraft({ query: 'Fable Finch' })).toBe(true); expect(loadLookupDraft()).toEqual({ query: 'Fable Finch' }); expect(saveLookupDraft(null)).toBe(true); expect(loadLookupDraft()).toBeNull();
});
