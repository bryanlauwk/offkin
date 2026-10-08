/** Explicitly configured search-only Firecrawl adapter. No scrape, retry or AI fallback. */
import { cleanText, readBoundedBody } from './website.ts';
export type SearchHit = { url: string; title: string; excerpt: string };
export type BrandSearchConfig = {
  provider: 'firecrawl-direct-v2' | 'firecrawl-gateway-v2';
  apiKey: string;
  lovableApiKey?: string;
  gatewayContractApproved?: boolean;
  fetch?: typeof fetch;
};
export function brandSearchConfigFromEnv(): BrandSearchConfig | null {
  const env = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  if (env?.get('BRICK_BRAND_SEARCH_ENABLED') !== 'true') return null;
  const provider = env.get('BRICK_BRAND_SEARCH_PROVIDER');
  const apiKey = env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return null;
  if (provider === 'firecrawl-direct-v2' && !apiKey.startsWith('lovc_')) return { provider, apiKey };
  if (provider === 'firecrawl-gateway-v2' && apiKey.startsWith('lovc_') && env.get('BRICK_BRAND_SEARCH_GATEWAY_APPROVED') === 'true') {
    const lovableApiKey = env.get('LOVABLE_API_KEY');
    if (lovableApiKey) return { provider, apiKey, lovableApiKey, gatewayContractApproved: true };
  }
  return null;
}
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
export const boundedDiscoveryText = (v: string, max: number) => cleanText(v.replace(/<[^>]*>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')).slice(0, max);
export async function searchBrand(name: string, config: BrandSearchConfig, signal: AbortSignal): Promise<SearchHit[]> {
  // This function receives only the validated public brand name, never a brief or credential.
  if (name.length < 2 || name.length > 120) throw new Error('Invalid public brand name');
  const gateway = config.provider === 'firecrawl-gateway-v2';
  if (!config.apiKey || (gateway ? (!config.gatewayContractApproved || !config.lovableApiKey || !config.apiKey.startsWith('lovc_')) : config.apiKey.startsWith('lovc_'))) throw new Error('Search is not configured');
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(10_000)]);
  const response = await (config.fetch ?? fetch)(gateway
    ? 'https://connector-gateway.lovable.dev/firecrawl/v2/search'
    : 'https://api.firecrawl.dev/v2/search', {
    method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', signal: deadline,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${gateway ? config.lovableApiKey : config.apiKey}`,
      ...(gateway ? { 'X-Connection-Api-Key': config.apiKey } : {}) },
    body: JSON.stringify({ query: `"${name}" official website`, limit: 5, sources: ['web'], timeout: 10000 }),
  });
  if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw new Error('Search unavailable'); }
  const parsed: unknown = JSON.parse(await readBoundedBody(response, 256_000, deadline));
  if (!record(parsed) || parsed.success !== true || !record(parsed.data) || !Array.isArray(parsed.data.web)) throw new Error('Unsupported search response');
  return parsed.data.web.slice(0, 5).flatMap(hit => record(hit) && typeof hit.url === 'string' && typeof hit.title === 'string' && typeof hit.description === 'string'
    ? [{ url: hit.url, title: boundedDiscoveryText(hit.title, 160), excerpt: boundedDiscoveryText(hit.description, 1200) }] : []);
}
