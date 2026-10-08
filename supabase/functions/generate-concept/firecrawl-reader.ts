/**
 * Optional fallback reader through the linked Firecrawl connection.
 *
 * The same safety policy as the direct reader applies: the URL is validated and its
 * DNS must resolve only to public addresses BEFORE it is handed to Firecrawl, the
 * final page address Firecrawl reports is re-validated (including DNS), the
 * response body is read under the same 2 MB ceiling, and the excerpt is capped.
 * It runs only when the direct read failed because the page was blocked or
 * unreadable — never for unsafe addresses, DNS failures or oversized pages.
 * Output stays untrusted source material.
 */
import { WEBSITE_TIMEOUT_MS, WebsiteReadError, type WebsiteReadCode } from './website-contract.ts';

export interface FirecrawlReaderConfig {
  apiKey: string;
  /** Gateway connections (lovc_ keys) also need the Lovable key. */
  lovableApiKey?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface FirecrawlSafety {
  validateUrl: (input: string) => URL;
  validateDns: (url: URL) => Promise<string[]>;
  readBody: (response: Response, maxBytes: number, signal: AbortSignal) => Promise<string>;
  cleanText: (value: string) => string;
  maxBytes: number;
  maxExcerptChars: number;
}

const FALLBACK_CODES = new Set<WebsiteReadCode>(['blocked', 'unreadable', 'empty', 'secure', 'timeout']);
const FIRECRAWL_TIMEOUT_MS = 25_000;
const DIRECT_URL = 'https://api.firecrawl.dev/v2/scrape';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/firecrawl/v2/scrape';

export function firecrawlFallbackAllowed(code: WebsiteReadCode): boolean {
  return FALLBACK_CODES.has(code);
}

export function firecrawlConfigFromEnv(): FirecrawlReaderConfig | null {
  const env = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  const apiKey = env?.get('FIRECRAWL_API_KEY')?.trim();
  if (!apiKey) return null;
  return { apiKey, lovableApiKey: env?.get('LOVABLE_API_KEY')?.trim() || undefined };
}

function requestTarget(config: FirecrawlReaderConfig): { url: string; headers: Record<string, string> } | null {
  if (config.apiKey.startsWith('lovc_')) {
    if (!config.lovableApiKey) return null;
    return { url: GATEWAY_URL, headers: { Authorization: `Bearer ${config.lovableApiKey}`, 'X-Connection-Api-Key': config.apiKey } };
  }
  return { url: DIRECT_URL, headers: { Authorization: `Bearer ${config.apiKey}` } };
}

/** Removes markdown syntax so only readable prose reaches the prompt. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^[#>*\-+|\s]+/gm, ' ')
    .replace(/[*_`~|]+/g, ' ');
}

const unreadable = () => new WebsiteReadError(422, 'That page could not be read. Try another public company page, such as About, or describe the business.', 'unreadable');

export async function readWithFirecrawl(input: string, config: FirecrawlReaderConfig, safety: FirecrawlSafety): Promise<{ url: string; title: string; excerpt: string }> {
  const url = safety.validateUrl(input);
  await safety.validateDns(url);
  const target = requestTarget(config);
  if (!target) throw unreadable();
  const controller = new AbortController();
  const timeoutMs = Math.max(1, Math.min(FIRECRAWL_TIMEOUT_MS, config.timeoutMs ?? FIRECRAWL_TIMEOUT_MS));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await (config.fetch ?? fetch)(target.url, {
      method: 'POST',
      headers: { ...target.headers, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url: url.href, formats: ['markdown'], onlyMainContent: true, timeout: WEBSITE_TIMEOUT_MS * 2, blockAds: true }),
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      console.error(`Firecrawl reader failed [${response.status}]`);
      throw unreadable();
    }
    // Same wire ceiling as the direct reader (JSON wrapper included).
    const raw = await safety.readBody(response, safety.maxBytes, controller.signal);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw unreadable(); }
    const root = parsed as { success?: boolean; data?: Record<string, unknown> } & Record<string, unknown>;
    if (!root || root.success === false) throw unreadable();
    const doc = (root.data && typeof root.data === 'object' ? root.data : root) as { markdown?: unknown; metadata?: Record<string, unknown> };
    const metadata = doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {};
    const statusCode = Number(metadata.statusCode);
    if ([401, 403, 429, 451].includes(statusCode)) throw new WebsiteReadError(422, 'That page does not allow automated reading or requires login. Try another public page or describe the business.', 'blocked');
    if (Number.isFinite(statusCode) && (statusCode < 200 || statusCode >= 400)) throw unreadable();
    // Re-validate wherever Firecrawl ended up after redirects.
    let finalUrl = url;
    const reported = typeof metadata.url === 'string' ? metadata.url : typeof metadata.sourceURL === 'string' ? metadata.sourceURL : '';
    if (reported && reported !== url.href) {
      if (!/^https:\/\//i.test(reported)) throw new WebsiteReadError(400, 'That website redirects to an insecure address. Use its public HTTPS homepage.', 'unsafe_url');
      finalUrl = safety.validateUrl(reported);
      await safety.validateDns(finalUrl);
    }
    if (typeof doc.markdown !== 'string') throw unreadable();
    const excerpt = safety.cleanText(markdownToText(doc.markdown)).slice(0, safety.maxExcerptChars);
    if (excerpt.length < 20) throw new WebsiteReadError(422, 'That page has too little readable text. Try the company’s About page or another public page.', 'empty');
    const title = typeof metadata.title === 'string' ? safety.cleanText(metadata.title).slice(0, 200) : '';
    return { url: finalUrl.href, title: title || finalUrl.hostname, excerpt };
  } catch (error) {
    if (error instanceof WebsiteReadError) throw error;
    throw unreadable();
  } finally { clearTimeout(timer); }
}
