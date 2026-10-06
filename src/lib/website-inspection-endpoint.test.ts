// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { WebsiteReadError } from '../../supabase/functions/generate-concept/website-contract';
const state = vi.hoisted(() => ({ readWebsite: vi.fn() }));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }),
}));
vi.mock('../../supabase/functions/generate-concept/website', async original => ({
  ...(await original<typeof import('../../supabase/functions/generate-concept/website')>()), readCompanyWebsite: (...args: unknown[]) => state.readWebsite(...args),
}));
let handleRequest: (request: Request) => Promise<Response>;
function install() {
  vi.stubGlobal('crypto', webcrypto);
  const env: Record<string, string> = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock-only', BRICK_ENFORCE_DAILY_LIMITS: 'false' };
  vi.stubGlobal('Deno', { serve: vi.fn(), env: { get: (key: string) => env[key] } });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Provider generation is forbidden in this test')));
}
beforeAll(async () => { install(); const modulePath = '../../supabase/functions/generate-concept/index.ts'; handleRequest = (await import(modulePath)).handleRequest; });
beforeEach(() => { install(); state.readWebsite.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
const inspect = () => handleRequest(new Request('https://edge.invalid/', { method: 'POST', body: JSON.stringify({ brand: 'https://company.com/', context: '', edition: 'icon', format: 'miniature', inspectWebsite: true }) }));
describe('website inspection endpoint without AI generation', () => {
  it('returns actual source evidence on success even when AI generation is disabled', async () => {
    const website = { url: 'https://company.com/', title: 'Company', excerpt: 'We make stationery for creative studios.' };
    state.readWebsite.mockResolvedValue(website);
    const response = await inspect();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ website, verified: true });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    [422, 'too_large'], [504, 'timeout'], [422, 'blocked'], [400, 'unsafe_url'], [503, 'unavailable'],
  ] as const)('returns safe %s / %s diagnostics instead of needsContext', async (status, code) => {
    state.readWebsite.mockRejectedValue(new WebsiteReadError(status, 'Diagnostic detail never returned to the client', code));
    const response = await inspect();
    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body).toMatchObject({ website: null, verified: false, code, message: expect.any(String) });
    expect(body.needsContext).toBeUndefined();
    expect(body.message).not.toContain('Diagnostic detail');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not expose unexpected exception details', async () => {
    state.readWebsite.mockRejectedValue(new Error('Internal provider detail'));
    const response = await inspect();
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'unreadable', verified: false });
    expect(fetch).not.toHaveBeenCalled();
  });
});
