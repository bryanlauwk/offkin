import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportFixture, exportIds, EXPORT_PNG } from '@/test/proposal-export-fixture';
import { pendingProposal, saveProposalSession, loadProposalSession, saveProposalSnapshot, loadProposalSnapshot } from './proposal-session';
import { EXPORT_IMAGE_LIMIT, EXPORT_IMAGE_TIMEOUT, prepareCollectibleImage, prepareProposalRequest, proposalExportSnapshot } from './proposal-export';
import { makeProductPlan } from '@/test/product-plan-fixture';
const notes = { quantity: '50 gifts', timing: 'Spring', budget: 'To discuss in MYR', notes: 'Keep the silhouette' };
const png = Uint8Array.from(atob(EXPORT_PNG.split(',')[1]), c => c.charCodeAt(0));
const run = (fixture = exportFixture(), signal = new AbortController().signal) => prepareProposalRequest(proposalExportSnapshot(fixture.session, fixture.all), '', notes, signal);
const signed = (id: string) => `https://saved.supabase.co/storage/v1/object/sign/brick-concepts/${id}.png?token=private-secret`;
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('createImageBitmap', vi.fn(async()=>({width:1,height:1,close:vi.fn()})));  vi.stubEnv('VITE_SUPABASE_URL', 'https://saved.supabase.co'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); });
describe('Self-contained concept request export', () => {
  it('embeds four actual images, exact original direction, selected hero/replacements and quote notes without capabilities', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch'); const result = await run(); const doc = new DOMParser().parseFromString(result.html, 'text/html');
    expect(result.missing).toEqual([]); expect(result.embedded).toBe(4); expect(doc.images).toHaveLength(4);
    expect(Array.from(doc.images).every(image => image.getAttribute('src') === EXPORT_PNG)).toBe(true);
    for (const text of ['Paper Finch 字', '  字 Keep me  ', 'moon (HERO)', 'Moon dial', 'Keep the dial attached', '50 gifts', 'Spring', 'To discuss in MYR', 'Keep the silhouette', 'not been sent', 'No order', 'Image SHA-256:', 'Visual revision reference:']) expect(doc.body.textContent).toContain(text);
    for (const secret of [...Object.values(exportIds), 'accepted-visual-revision', 'unused-source.example']) expect(result.html).not.toContain(secret);
    expect(fetch).not.toHaveBeenCalled(); expect(doc.querySelector('script,a,iframe,form')).toBeNull();
    expect(doc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')).toContain("default-src 'none'");
  });
  it('uses the accepted version during unfinished revisions and switches atomically to the chosen refined version', async () => {
    const f = exportFixture(); f.session.pending = pendingProposal(f.session, 'physical', { ...f.session.context, business: 'Unfinished new story' });
    f.session.context = { ...f.session.context, business: 'Unrelated editable draft' }; f.session.customerIdentity = { version: 'customer-brand-v1', name: 'Unrelated brand' };
    const old = await run(f); expect(old.html).toContain('unfinished revision is excluded'); expect(old.html).not.toContain('Unfinished new story'); expect(old.html).not.toContain('Unrelated');
    const nextId = '00000000-0000-4000-8000-000000000022'; const physical = { ...f.all[exportIds.physical], id: nextId, title: 'Chosen refined object' }; f.all[nextId] = physical;
    f.session.accepted = { ...f.session.accepted!, id: 'refined', assets: { ...f.session.accepted!.assets, physical: nextId } }; f.session.pending = null;
    for (const stage of ['details', 'packaging'] as const) f.all[exportIds[stage]] = { ...f.all[exportIds[stage]], sourcePhysicalId: nextId, sourceImageIds: stage === 'details' ? [nextId] : [nextId, exportIds.world] };
    const next = await run(f); expect(next.missing).toEqual([]); expect(next.html).toContain('Chosen refined object'); expect(next.html).not.toContain('Paper physical');
    expect(next.html.match(/Visual revision reference: ([^<]+)/)?.[1]).not.toEqual(old.html.match(/Visual revision reference: ([^<]+)/)?.[1]);
  });
  it('supports restored metadata and legacy saved plans without modifying saved records or pretending images are present', async () => {
    const f = exportFixture(); delete f.session.customerIdentity; delete f.session.accepted!.customerIdentity; f.all[exportIds.physical].productPlan = makeProductPlan(['moon']);
    expect(saveProposalSession(f.session)).toBe(true); for (const asset of Object.values(f.all)) { asset.image=signed(asset.id); expect(saveProposalSnapshot(asset)).toBe(true); }
    const saved = localStorage.getItem('offkin:proposal:v10'); const all = Object.fromEntries(Object.keys(f.all).map(id => [id, loadProposalSnapshot(id)!]));
    const result = await run({ session: loadProposalSession()!, all }); expect(result.embedded).toBe(0); expect(result.missing).toHaveLength(4); expect(result.html).toContain('PARTIAL REQUEST'); expect(result.html).toContain('Proposed joins (unverified)'); expect(localStorage.getItem('offkin:proposal:v10')).toBe(saved);
  });
  it('labels text-only/showcase-only directions honestly with no example substitution or image fetch', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch'); const result = await prepareProposalRequest(undefined, 'Unofficial showcase-only brief', notes, new AbortController().signal);
    expect(result.html).toContain('Unofficial showcase-only brief'); expect(result.html).toContain('No saved visual revision'); expect(result.html).toContain('PARTIAL REQUEST'); expect(result.embedded).toBe(0); expect(fetch).not.toHaveBeenCalled();
  });
  it('excludes mismatched identity, IDs and source-image lineage rather than taking other cached images', async () => {
    for (const change of [{ id: 'wrong' }, { sourceWorldId: 'wrong' }, { sourceImageIds: [] }, { brand: 'Unrelated brand' }]) {
      const f = exportFixture(); Object.assign(f.all[exportIds.physical], change, { title: 'Should never appear' });
      const result = await run(f); expect(result.missing.join(' ')).toContain('Collectible hero'); expect(result.html).not.toContain('Should never appear');
    }
  });
  it('escapes all user and generated text, including script, image and attribute payloads', async () => {
    const f = exportFixture(); const attack = '<script>alert(1)</script><img src=x onerror="alert(2)">';
    f.session.accepted!.context.business = attack; f.all[exportIds.physical].title = attack; f.all[exportIds.physical].design = attack;
    const result = await prepareProposalRequest(proposalExportSnapshot(f.session, f.all), '', { ...notes, notes: attack }, new AbortController().signal);
    const doc = new DOMParser().parseFromString(result.html, 'text/html'); expect(doc.querySelector('script,[onerror]')).toBeNull(); expect(doc.images).toHaveLength(4); expect(doc.body.textContent).toContain(attack);
  });
  it('fetches only saved private images as credential-free GETs and never writes their URLs into the file', async () => {
    const f = exportFixture(); for (const asset of Object.values(f.all)) asset.image = signed(asset.id);
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(png, { headers: { 'content-type': 'image/png' } }));
    const result = await run(f); expect(result.embedded).toBe(4); expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.every(([, options]) => options?.credentials === 'omit' && options.redirect === 'error' && !options.body && !options.method)).toBe(true);
    expect(result.html).not.toMatch(/private-secret|supabase.co|storage\/v1/);
  });
  it.each(['https://evil.example/image.png', 'http://127.0.0.1/image.png', 'file:///etc/passwd', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'https://saved.supabase.co/storage/v1/object/sign/other-bucket/image.png', 'https://saved.supabase.co/storage/v1/object/sign/brick-concepts/wrong.png'])('does not fetch unsafe source %s', async image => {
    const f = exportFixture(); f.all[exportIds.world].image = image; const fetch = vi.spyOn(globalThis, 'fetch'); const result = await run(f);
    expect(fetch).not.toHaveBeenCalled(); expect(result.missing).toHaveLength(1); expect(result.html).not.toContain(image);
  });
  it.each(['expired', 'html', 'svg', 'magic', 'oversized'])('discloses %s images rather than reporting a complete request', async kind => {
    const f = exportFixture(); f.all[exportIds.world].image = signed(exportIds.world);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(kind === 'magic' ? '<html>unsafe</html>' : png, { status: kind === 'expired' ? 403 : 200, headers: { 'content-type': kind === 'html' ? 'text/html' : kind === 'svg' ? 'image/svg+xml' : 'image/png', ...(kind === 'oversized' ? { 'content-length': String(EXPORT_IMAGE_LIMIT + 1) } : {}) } }));
    const result = await run(f); expect(result.embedded).toBe(3); expect(result.missing).toHaveLength(1); expect(result.html).toContain('PARTIAL REQUEST');
  });
  it('bounds streamed bodies even without content-length and cancels the reader', async () => {
    const f = exportFixture(); f.all[exportIds.world].image = signed(exportIds.world); const cancel = vi.fn();
    const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(EXPORT_IMAGE_LIMIT + 1)); }, cancel });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { headers: { 'content-type': 'image/png' } }));
    const result = await run(f); expect(result.missing.join(' ')).toContain('8 MiB'); expect(cancel).toHaveBeenCalled();
  });
  it('bounds the total embedded image size', async () => {
    const f = exportFixture(); for (const asset of Object.values(f.all)) asset.image = signed(asset.id);
    const bytes = new Uint8Array(EXPORT_IMAGE_LIMIT); bytes.set(png);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(bytes, { headers: { 'content-type': 'image/png' } }));
    const result = await run(f); expect(result.embedded).toBe(3); expect(result.missing.join(' ')).toContain('24 MiB');
  });
  it('times out an image read and can still prepare the remaining available sections', async () => {
    vi.useFakeTimers(); const f = exportFixture(); f.all[exportIds.world].image = signed(exportIds.world);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => new Promise((_resolve, reject) => options!.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
    const result = run(f); await vi.advanceTimersByTimeAsync(EXPORT_IMAGE_TIMEOUT); expect((await result).missing.join(' ')).toContain('timed out');
  });
  it('aborts the whole preparation without producing a misleading partial result', async () => {
    const controller = new AbortController(); controller.abort(); await expect(run(exportFixture(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it.each(['data:image/png;base64,iVBORw0KGgo=', 'data:image/jpeg;base64,/9j/', 'data:image/webp;base64,UklGRgAAAABXRUJQ'])('does not count signature-only raster %s as embedded',async image=>{
    const f=exportFixture();f.all[exportIds.world].image=image;const result=await run(f);expect(result.embedded).toBe(3);expect(result.missing.join(' ')).toContain('dimensions');expect(result.html).toContain('PARTIAL REQUEST');
  });
  it('rejects a corrupt image even when its magic and dimension header look valid',async()=>{
    vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error('decode failed'));const result=await run();expect(result.embedded).toBe(3);expect(result.missing.join(' ')).toContain('could not be decoded');
  });
  it('limits dimensions before allocating a decoded image',async()=>{
    const f=exportFixture();const bytes=new Uint8Array(png);new DataView(bytes.buffer).setUint32(16,20000);f.all[exportIds.world].image='data:image/png;base64,'+btoa(String.fromCharCode(...bytes));const result=await run(f);expect(result.embedded).toBe(3);expect(result.missing.join(' ')).toContain('dimensions exceed');expect(createImageBitmap).toHaveBeenCalledTimes(3);
  });
  it('times out decoding and closes a bitmap that finishes late',async()=>{
    vi.useFakeTimers();let resolve!:(bitmap:ImageBitmap)=>void;vi.mocked(createImageBitmap).mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));const result=run();await vi.advanceTimersByTimeAsync(5000);expect((await result).missing.join(' ')).toContain('validation timed out');const close=vi.fn();resolve({width:1,height:1,close} as unknown as ImageBitmap);await Promise.resolve();expect(close).toHaveBeenCalledOnce();
  });

  it.each([true,false])('validates the Image fallback when bitmap decoding is absent (success=%s)',async success=>{
    vi.stubGlobal('createImageBitmap',undefined);const sources:string[]=[];
    class FallbackImage { naturalWidth=1;naturalHeight=1;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(value:string){sources.push(value);if(value)queueMicrotask(()=>success?this.onload?.():this.onerror?.());} }
    vi.stubGlobal('Image',FallbackImage);const result=await run();expect(result.embedded).toBe(success?4:0);expect(result.missing).toHaveLength(success?0:4);expect(sources.filter(value=>!value)).toHaveLength(4);
  });

});


describe('Ordinary collectible-image handoff',()=>{
  it('preserves the exact chosen hero bytes and source hash',async()=>{
    const fixture=exportFixture();const fetch=vi.spyOn(globalThis,'fetch');const result=await prepareCollectibleImage(proposalExportSnapshot(fixture.session,fixture.all),new AbortController().signal);
    expect(result.bytes).toEqual(png);expect(result.mime).toBe('image/png');expect(result.filename).toBe('OFFKIN-collectible-concept.png');expect(result.sourceHash).toHaveLength(64);expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects missing/mismatched hero metadata and unsafe image sources',async()=>{
    const f=exportFixture();const snapshot=proposalExportSnapshot(f.session,f.all);
    await expect(prepareCollectibleImage(undefined,new AbortController().signal)).rejects.toThrow(/unavailable/);
    const hero=snapshot.stages.find(item=>item.stage==='physical')!;hero.asset={...hero.asset!,image:'https://attacker.example/private.png'};const fetch=vi.spyOn(globalThis,'fetch');
    await expect(prepareCollectibleImage(snapshot,new AbortController().signal)).rejects.toThrow(/saved private image/);expect(fetch).not.toHaveBeenCalled();
  });
  it('cancels before opening any saved image',async()=>{
    const abort=new AbortController();abort.abort();const fetch=vi.spyOn(globalThis,'fetch');await expect(prepareCollectibleImage(proposalExportSnapshot(exportFixture().session,exportFixture().all),abort.signal)).rejects.toThrow(/Cancelled/);expect(fetch).not.toHaveBeenCalled();
  });
});
