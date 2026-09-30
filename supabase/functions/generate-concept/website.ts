/**
 * Reads public company-page text, never executable content or trusted instructions.
 *
 * Connections use node:https to a validated IP literal with the original Host,
 * TLS SNI and certificate identity. Ordinary fetch is NEVER a fallback. Missing secure transport support fails closed.
 * Deno supports these Node built-ins; production still benefits from private-IP
 * egress blocking as defense in depth. See:
 * https://docs.deno.com/api/node/https/
 * https://supabase.com/docs/guides/functions/dependencies
 *
 * HTTP input is upgraded to HTTPS; HTTPS-to-HTTP redirects are refused. Only a
 * single page is read; links, scripts, styles, images and robots instructions are
 * never followed. The returned excerpt is untrusted source material: callers
 * must delimit it as data and forbid obeying any instructions it contains.
 */

export interface WebsiteSource {
  url: string;
  title: string;
  excerpt: string;
}

type RecordType = 'A' | 'AAAA';
export type WebsiteDnsResolver = (hostname: string, type: RecordType) => Promise<string[]>;

export type WebsiteTransport = (url: string, init: RequestInit, addresses: readonly string[]) => Promise<Response>;

export interface WebsiteReaderDependencies {
  /** Trusted test/transport injection. It must pin to one of the supplied IPs. */
  fetch?: WebsiteTransport;
  resolveDns?: WebsiteDnsResolver;
  /** Optional lower limits are useful for tests; hard ceilings cannot be raised. */
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

export class WebsiteReadError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'WebsiteReadError';
  }
}

const MAX_BYTES = 300_000;
const MAX_EXCERPT_CHARS = 6_000;
const TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const LOCAL_SUFFIXES = ['localhost', 'local', 'internal', 'intranet', 'lan', 'home', 'corp', 'test', 'invalid', 'example', 'onion', 'arpa'];

const unsafeUrl = () => new WebsiteReadError(400, 'Use a public company website with a domain name, without login details or a custom port.');

/** Pure URL validation; it does not replace DNS and transport-level validation. */
export function validatePublicWebsiteUrl(input: string): URL {
  if (typeof input !== 'string') throw unsafeUrl();
  const value = input.trim();
  // eslint-disable-next-line no-control-regex -- reject invisible URL separators
  if (!value || value.length > 2_048 || /[\s\\\u0000-\u001f\u007f]/.test(value)) throw unsafeUrl();
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  let url: URL;
  try {
    const absolute = hasScheme ? value : `https://${value}`;
    // URL normalizes default ports away, so check the original authority too.
    const authority = absolute.match(/^https?:\/\/([^/?#]+)/i)?.[1];
    if (!authority || /[:@]/.test(authority)) throw unsafeUrl();
    url = new URL(absolute);
  } catch {
    throw unsafeUrl();
  }
  const host = url.hostname.toLowerCase();
  const labels = host.split('.');
  if (
    !['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port ||
    host.length > 253 || labels.length < 2 || /^\d+(?:\.\d+){3}$/.test(host) ||
    labels.some(label => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label)) ||
    !/[a-z]/i.test(labels[labels.length - 1]) ||
    LOCAL_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`))
  ) throw unsafeUrl();
  url.protocol = 'https:';
  // Company facts never need tracking parameters, fragments, or query tokens.
  url.search = '';
  url.hash = '';
  return url;
}

/** Conservative public-address allowlist, including IPv6 transition exclusions. */
export function isPublicWebsiteAddress(address: string): boolean {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address)) {
    const octets = address.split('.').map(Number);
    if (octets.some(n => n > 255) || address.split('.').some(part => part.length > 1 && part.startsWith('0'))) return false;
    const [a, b, c] = octets;
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  // Only current IPv6 global unicast (2000::/3) is eligible. This excludes
  // loopback, mapped/compatible IPv4, NAT64, link-local, ULA and multicast.
  if (!address.includes(':') || /[%[\]\s]/.test(address)) return false;
  let normalized: string;
  try { normalized = new URL(`https://[${address}]/`).hostname.slice(1, -1); }
  catch { return false; }
  const [first, second = '0'] = normalized.split(':');
  const a = parseInt(first, 16);
  const b = parseInt(second || '0', 16);
  return a >= 0x2000 && a <= 0x3fff &&
    !(a === 0x2001 && (b <= 0x01ff || b === 0x0db8)) &&
    a !== 0x2002 && a !== 0x3ffe && !(a === 0x3fff && b <= 0x0fff);
}

async function defaultResolveDns(hostname: string, type: RecordType): Promise<string[]> {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { resolveDns?: WebsiteDnsResolver };
  };
  if (!runtime.Deno?.resolveDns) {
    throw new WebsiteReadError(503, 'Website reading is unavailable right now. Please try again shortly.');
  }
  return runtime.Deno.resolveDns(hostname, type);
}

async function validateDns(url: URL, resolveDns: WebsiteDnsResolver): Promise<string[]> {
  const lookup = async (type: RecordType) => {
    try { return await resolveDns(url.hostname, type); }
    catch (error) {
      // An absent A or AAAA record is normal; timeouts/permission failures are not.
      if (error instanceof Error && error.name === 'NotFound') return [];
      if (error instanceof WebsiteReadError) throw error;
      throw new WebsiteReadError(422, 'We could not verify that website address. Check the company URL and try again.');
    }
  };
  const records = await Promise.all([lookup('A'), lookup('AAAA')]);
  const addresses = records.flat();
  if (!addresses.length || addresses.some(address => typeof address !== 'string' || !isPublicWebsiteAddress(address))) {
    throw new WebsiteReadError(400, 'That address is not a public website. Please use the company’s public HTTPS homepage.');
  }
  return addresses;
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', copy: '©', reg: '®', trade: '™', bull: '•',
};

function cleanText(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return ENTITIES[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ' ';
  // eslint-disable-next-line no-control-regex -- strip non-printing text controls
  }).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/** Extracts plain, untrusted text; this is not an HTML sanitizer for rendering. */
export function extractWebsiteContent(content: string, contentType: string): { title: string; excerpt: string } {
  if (contentType === 'text/plain') return { title: '', excerpt: cleanText(content).slice(0, MAX_EXCERPT_CHARS) };
  const stripped = content
    .replace(/<!--[\s\S]*?(?:-->|$)/g, ' ')
    .replace(/<(script|style|noscript|template|svg|iframe|object)\b[^<>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ');
  const titleStart = stripped.search(/<title\b[^<>]*>/i);
  const titleText = titleStart < 0 ? '' : stripped.slice(titleStart).match(/^<title\b[^<>]*>([\s\S]*?)(?:<\/title\s*>|$)/i)?.[1] ?? '';
  const title = cleanText(titleText.replace(/<[^<>]*>/g, ' ')).slice(0, 160);
  const body = stripped.replace(/<head\b[^<>]*>[\s\S]*?(?:<\/head\s*>|$)/gi, ' ').replace(/<[^<>]*>/g, ' ');
  return { title, excerpt: cleanText(body).slice(0, MAX_EXCERPT_CHARS) };
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason ?? new Error('Aborted');
}

/** Pure request configuration, exported to verify pinning without network I/O. */
export function pinnedWebsiteRequestOptions(url: URL, addresses: readonly string[]): import('node:https').RequestOptions {
  if (url.protocol !== 'https:' || !addresses.length || addresses.some(address => !isPublicWebsiteAddress(address))) throw unsafeUrl();
  url = validatePublicWebsiteUrl(url.href);
  const address = addresses.find(ip => !ip.includes(':')) ?? addresses[0];
  const family = address.includes(':') ? 6 : 4;
  return {
    protocol: 'https:', hostname: address, port: 443, path: url.pathname + url.search,
    method: 'GET', agent: false, family,
    // A literal destination cannot re-resolve the domain. The transport below
    // verifies the original TLS identity and refuses runtimes that ignore it.
    servername: url.hostname, rejectUnauthorized: true,
    headers: {
      Host: url.hostname, Accept: 'text/html, text/plain;q=0.8',
      'Accept-Encoding': 'identity', 'User-Agent': 'BRIQ-CompanyReader/1.0',
    },
  };
}

/** Deno/Node secure transport. No global fetch or secondary DNS lookup is used. */
export const fetchPinnedWebsite: WebsiteTransport = async (input, init, addresses) => {
  const url = validatePublicWebsiteUrl(input);
  const options = pinnedWebsiteRequestOptions(url, addresses);
  const runtime = (globalThis as unknown as { Deno?: import('./native-https.ts').NativeTlsRuntime }).Deno;
  if (runtime) {
    if (typeof runtime.connect !== 'function' || typeof runtime.startTls !== 'function') throw new WebsiteReadError(503, 'Secure website reading is unavailable. Add a short company description to continue.');
    const { fetchNativePinnedWebsite } = await import('./native-https.ts');
    return fetchNativePinnedWebsite(url, String(options.hostname), init.signal ?? AbortSignal.timeout(6000), runtime);
  }
  let request: typeof import('node:https').request;
  let checkServerIdentity: typeof import('node:tls').checkServerIdentity;
  try {
    ({ request } = await import('node:https'));
    ({ checkServerIdentity } = await import('node:tls'));
    if (typeof request !== 'function' || typeof checkServerIdentity !== 'function') throw new Error('Unsupported transport');
  } catch {
    throw new WebsiteReadError(503, 'Secure website reading is unavailable. Add a short company description to continue.');
  }
  const signal = init.signal;
  if (signal) throwIfAborted(signal);
  return await new Promise<Response>((resolve, reject) => {
    let identityVerified = false;
    const req = request({
      ...options,
      checkServerIdentity: (_hostname, certificate) => {
        const error = checkServerIdentity(url.hostname, certificate);
        identityVerified = !error;
        return error;
      },
      maxHeaderSize: 16_384,
    }, incoming => {
      try {
      if (!identityVerified) throw new WebsiteReadError(503, 'Secure website reading is unavailable. Add a short company description to continue.');
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      const encoding = headers.get('content-encoding')?.trim().toLowerCase();
      if (encoding && encoding !== 'identity') {
        incoming.destroy();
        reject(new WebsiteReadError(422, 'That page could not be read as plain website content. Try another public company page or add a short description.'));
        return;
      }
      const status = incoming.statusCode ?? 502;
      if (status < 200 || status > 599) { incoming.destroy(); reject(new WebsiteReadError(422, 'That website returned an unsupported response. Try another public company page.')); return; }
      // Redirect bodies, failures and empty responses are never read.
      if (REDIRECT_STATUSES.has(status) || status < 200 || status >= 300 || status === 204 || status === 205) {
        incoming.destroy();
        resolve(new Response(null, { status, headers }));
        return;
      }
      incoming.pause();
      let completed = false;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          incoming.on('data', (chunk: Uint8Array) => {
            if (completed) return;
            controller.enqueue(new Uint8Array(chunk));
            if ((controller.desiredSize ?? 0) <= 0) incoming.pause();
          });
          incoming.once('end', () => { if (!completed) { completed = true; controller.close(); } });
          incoming.once('error', error => { if (!completed) { completed = true; controller.error(error); } });
          incoming.once('close', () => {
            if (!completed) { completed = true; controller.error(new Error('Website connection closed early')); }
          });
          incoming.pause();
        },
        pull() { incoming.resume(); },
        cancel() { completed = true; incoming.destroy(); req.destroy(); },
      });
      resolve(new Response(body, { status, headers }));
      } catch (error) { incoming.destroy(); reject(error); }
    });
    const abort = () => req.destroy(signal?.reason instanceof Error ? signal.reason : new Error('Website read aborted'));
    req.once('error', reject);
    req.once('close', () => signal?.removeEventListener('abort', abort));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    else req.end();
  });
};

function lowerLimit(value: number | undefined, maximum: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(maximum, Math.floor(value))) : maximum;
}

function discardBody(response: Response): void {
  // Cancellation is best-effort and must not extend the request deadline.
  void response.body?.cancel().catch(() => undefined);
}

async function readBoundedBody(response: Response, maxBytes: number, signal: AbortSignal): Promise<string> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    discardBody(response);
    throw new WebsiteReadError(422, 'That page is too large to read. Try the company’s homepage or a shorter About page.');
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      throwIfAborted(signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        cancel();
        throw new WebsiteReadError(422, 'That page is too large to read. Try the company’s homepage or a shorter About page.');
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

export async function readCompanyWebsite(input: string, dependencies: WebsiteReaderDependencies = {}): Promise<WebsiteSource> {
  let url = validatePublicWebsiteUrl(input);
  const fetchPage = dependencies.fetch ?? fetchPinnedWebsite;
  const resolveDns = dependencies.resolveDns ?? defaultResolveDns;
  const maxBytes = lowerLimit(dependencies.maxBytes, MAX_BYTES);
  const maxRedirects = dependencies.maxRedirects === 0 ? 0 : lowerLimit(dependencies.maxRedirects, MAX_REDIRECTS);
  const controller = new AbortController();
  const timeoutError = new WebsiteReadError(504, 'That website took too long to respond. Try again or use a faster company page.');
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(timeoutError); reject(timeoutError); }, lowerLimit(dependencies.timeoutMs, TIMEOUT_MS));
  });
  const read = async (): Promise<WebsiteSource> => {
    const visited = new Set<string>();
    for (let redirectCount = 0; ; redirectCount++) {
      throwIfAborted(controller.signal);
      if (visited.has(url.href)) throw new WebsiteReadError(422, 'That website has a redirect loop. Try its final public HTTPS address.');
      visited.add(url.href);
      const addresses = await validateDns(url, resolveDns);
      throwIfAborted(controller.signal);
      const response = await fetchPage(url.href, {
        method: 'GET', redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { Accept: 'text/html, text/plain;q=0.8', 'User-Agent': 'BRIQ-CompanyReader/1.0' },
        signal: controller.signal,
      }, addresses);
      if (controller.signal.aborted) { discardBody(response); throwIfAborted(controller.signal); }
      // The transport must honor manual redirects; never trust a silently followed response.
      if (response.redirected || (response.url && response.url !== url.href)) {
        discardBody(response);
        throw new WebsiteReadError(422, 'We could not safely follow that website. Try its final public HTTPS address.');
      }
      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers.get('location');
        discardBody(response);
        if (!location || redirectCount >= maxRedirects) throw new WebsiteReadError(422, 'That website redirects too many times. Try its final public HTTPS address.');
        let redirect: URL;
        try { redirect = new URL(location, url); }
        catch { throw unsafeUrl(); }
        if (redirect.protocol !== 'https:') throw new WebsiteReadError(400, 'That website redirects to an insecure address. Use its public HTTPS homepage.');
        // Validate original Location as well: URL() normalizes explicit default ports.
        if (/^https?:\/\//i.test(location) || location.startsWith('//')) {
          validatePublicWebsiteUrl(location.startsWith('//') ? `https:${location}` : location);
        }
        url = validatePublicWebsiteUrl(redirect.href);
        continue;
      }
      if (!response.ok) {
        discardBody(response);
        throw new WebsiteReadError(422, 'That website could not be read. Try a public page that does not require login or block automated visitors.');
      }
      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
      if (contentType !== 'text/html' && contentType !== 'text/plain') {
        discardBody(response);
        throw new WebsiteReadError(422, 'Use a company web page rather than a download, image, or document.');
      }
      const content = await readBoundedBody(response, maxBytes, controller.signal);
      const extracted = extractWebsiteContent(content, contentType);
      if (extracted.excerpt.length < 20) throw new WebsiteReadError(422, 'That page has too little readable text. Try the company’s About page or another public page.');
      return { url: url.href, title: extracted.title || url.hostname, excerpt: extracted.excerpt };
    }
  };
  try { return await Promise.race([read(), deadline]); }
  catch (error) {
    if (error instanceof WebsiteReadError) throw error;
    if (controller.signal.aborted) throw timeoutError;
    throw new WebsiteReadError(422, 'That website could not be read securely. Check its HTTPS address or try a different public company page.');
  } finally { clearTimeout(timer!); }
}
