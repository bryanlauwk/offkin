import { describe, expect, it, vi } from 'vitest';
import { readCompanyWebsite, type WebsiteDnsResolver } from '../../supabase/functions/generate-concept/website';

const publicDns: WebsiteDnsResolver = async (_h, type) => (type === 'A' ? ['93.184.216.34'] : []);
const blockedPage = vi.fn(async () => new Response('denied', { status: 403, headers: { 'content-type': 'text/html' } }));
const scrape = (body: unknown) => vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));
const good = { success: true, data: { markdown: '# Acme\n\nWe make colourful reusable coffee cups for adventures.', metadata: { title: 'Acme', statusCode: 200, url: 'https://acme.com/' } } };

describe('Firecrawl fallback reader', () => {
  it('reads a blocked page through Firecrawl', async () => {
    const fc = scrape(good);
    const result = await readCompanyWebsite('acme.com', { fetch: blockedPage, resolveDns: publicDns, firecrawl: { apiKey: 'fc-test', fetch: fc } });
    expect(result.title).toBe('Acme');
    expect(result.excerpt).toContain('reusable coffee cups');
    expect(fc).toHaveBeenCalledOnce();
  });

  it('never sends private addresses to Firecrawl', async () => {
    const fc = scrape(good);
    const privateDns: WebsiteDnsResolver = async (_h, type) => (type === 'A' ? ['10.0.0.5'] : []);
    await expect(readCompanyWebsite('acme.com', { fetch: blockedPage, resolveDns: privateDns, firecrawl: { apiKey: 'fc-test', fetch: fc } })).rejects.toMatchObject({ code: 'unsafe_url' });
    expect(fc).not.toHaveBeenCalled();
  });

  it('rejects when Firecrawl lands on a private host', async () => {
    let calls = 0;
    const dns: WebsiteDnsResolver = async (h, type) => (type !== 'A' ? [] : h === 'internal-acme.com' ? ['192.168.1.2'] : (calls++, ['93.184.216.34']));
    const fc = scrape({ ...good, data: { ...good.data, metadata: { ...good.data.metadata, url: 'https://internal-acme.com/' } } });
    await expect(readCompanyWebsite('acme.com', { fetch: blockedPage, resolveDns: dns, firecrawl: { apiKey: 'fc-test', fetch: fc } })).rejects.toMatchObject({ code: 'unsafe_url' });
  });

  it('keeps the 2 MB page limit for Firecrawl responses', async () => {
    const huge = { ...good, data: { ...good.data, markdown: 'a'.repeat(2_100_000) } };
    await expect(readCompanyWebsite('acme.com', { fetch: blockedPage, resolveDns: publicDns, firecrawl: { apiKey: 'fc-test', fetch: scrape(huge) } })).rejects.toMatchObject({ code: 'blocked' });
  });

  it('does not use Firecrawl for oversized direct pages', async () => {
    const fc = scrape(good);
    const big = vi.fn(async () => new Response('x', { headers: { 'content-type': 'text/html', 'content-length': '3000000' } }));
    await expect(readCompanyWebsite('acme.com', { fetch: big, resolveDns: publicDns, firecrawl: { apiKey: 'fc-test', fetch: fc } })).rejects.toMatchObject({ code: 'too_large' });
    expect(fc).not.toHaveBeenCalled();
  });
});
