/**
 * Finds likely official websites for a brand name through the linked Firecrawl search.
 * No model call. Every candidate URL is reduced to its origin and must pass the same
 * public-URL and public-DNS checks as the website reader before it is returned.
 * Results are untrusted suggestions the visitor must confirm.
 */
import type { FirecrawlReaderConfig } from './firecrawl-reader.ts';

export interface BrandCandidate { name: string; url: string; description: string }
export const MAX_BRAND_CANDIDATES = 3;
const MAX_RESPONSE_BYTES = 200_000;
const DIRECT = 'https://api.firecrawl.dev/v2/search';
const GATEWAY = 'https://connector-gateway.lovable.dev/firecrawl/v2/search';
// Directories and social sites are never the brand's own homepage.
const SKIP = /(^|\.)(wikipedia\.org|linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com|youtube\.com|tiktok\.com|crunchbase\.com|bloomberg\.com|glassdoor\.com|indeed\.com|reddit\.com|amazon\.[a-z.]+|apple\.com\/app-store)$/i;

export function validBrandName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 80 && !/[\r\n<>]/.test(value);
}

const clean = (v: unknown, max: number) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export async function findBrandCandidates(name: string, config: FirecrawlReaderConfig | null, validateSite: (url: string) => Promise<URL>): Promise<BrandCandidate[]> {
  if (!config) throw new Error('Brand lookup is not available right now. Enter the website or describe the brand instead.');
  const gateway = config.apiKey.startsWith('lovc_');
  if (gateway && !config.lovableApiKey) throw new Error('Brand lookup is not available right now.');
  const headers: Record<string, string> = gateway
    ? { Authorization: `Bearer ${config.lovableApiKey}`, 'X-Connection-Api-Key': config.apiKey }
    : { Authorization: `Bearer ${config.apiKey}` };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await (config.fetch ?? fetch)(gateway ? GATEWAY : DIRECT, {
      method: 'POST', signal: controller.signal, redirect: 'error',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${name.trim()} official website`, limit: 8 }),
    });
    const text = await response.text();
    if (!response.ok || text.length > MAX_RESPONSE_BYTES) { console.error(`Brand lookup failed [${response.status}]`); throw new Error('Brand lookup failed. Enter the website or describe the brand instead.'); }
    const root = JSON.parse(text) as { data?: unknown };
    const data = root.data as unknown;
    const items: unknown[] = Array.isArray(data) ? data : Array.isArray((data as { web?: unknown })?.web) ? (data as { web: unknown[] }).web : [];
    const seen = new Set<string>(); const out: BrandCandidate[] = [];
    for (const item of items) {
      if (out.length >= MAX_BRAND_CANDIDATES) break;
      const r = item as Record<string, unknown>;
      if (typeof r.url !== 'string') continue;
      let origin: URL;
      try { origin = new URL(new URL(r.url).origin); } catch { continue; }
      const host = origin.hostname.replace(/^www\./, '');
      if (seen.has(host) || SKIP.test(host)) continue;
      try { await validateSite(origin.href); } catch { continue; }
      seen.add(host);
      out.push({ name: clean(r.title, 100) || host, url: origin.href.replace(/\/$/, ''), description: clean(r.description, 240) });
    }
    return out;
  } finally { clearTimeout(timer); }
}
