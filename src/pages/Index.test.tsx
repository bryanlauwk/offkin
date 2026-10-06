import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter, Link, MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANVAS_CAPABILITIES, type CanvasConcept, type CanvasRequest } from '../../supabase/functions/generate-concept/canvas';
import { CANVAS_CONTRACT_VERSION } from '@/lib/canvas-api';
import { CANVAS_SESSION_KEY, canvasContext, decodeCanvasShare, emptyCanvasSession, encodeCanvasShare, saveCanvasSession, saveCanvasSnapshot, worldFingerprint, type CanvasSession } from '@/lib/canvas-session';
import { worldReferences } from '@/lib/world-references';
import Index from './Index';

const settings = vi.hoisted(() => ({ values: [{ key: 'site_title', value: 'OFFKIN' }] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: async () => ({ data: settings.values }) }) } }));
const worldId = '00000000-0000-4000-8000-000000000001';
const physicalId = '00000000-0000-4000-8000-000000000002';
const business = 'We fold personalised paper gifts and pack them with a ribbon.';
const wording = '  异趣伙伴\nCafé 🪁 EXACT!\t  ';
const ready = { ready: true, prompt_version: 'offkin-cocreation-v8', capabilities: { ...CANVAS_CAPABILITIES } };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const sourceElements: CanvasConcept['worldElements'] = [
  { id: 'fold', label: 'Paper fold', description: 'Our signature folding ritual.', kind: 'fact' },
  { id: 'ribbon', label: 'Ribbon loop', description: 'A proposed looping path.', kind: 'proposal' },
  { id: 'bird', label: 'Paper bird', description: 'A proposed bird above the town.', kind: 'proposal' },
];
function worldFor(body: Pick<CanvasRequest, 'context'>, overrides: Partial<CanvasConcept> = {}): CanvasConcept {
  return { id: worldId, contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', brand: 'Paper Studio', title: 'A town made of paper', story: 'Paper gifts connect a neighbourhood.', design: 'A rich connected illustrated neighbourhood.', interaction: 'Explore its proposed components.', image: 'https://images.example/world.png?token=private', sourceUrl: '', sourceTitle: '', context: body.context, worldElements: sourceElements, ...overrides };
}
function physicalFor(body: CanvasRequest, overrides: Partial<CanvasConcept> = {}): CanvasConcept {
  return worldFor(body, { id: physicalId, stage: 'physical', title: 'Paper town, made tangible', sourceWorldId: body.sourceWorldId, selectedElementIds: body.selectedElementIds, heroElementId: body.heroElementId, replacements: body.replacements,
    worldElements: body.selectedElementIds!.map(id => { const original = sourceElements.find(element => element.id === id)!; const replacement = body.replacements?.find(element => element.id === id); return replacement ? { ...replacement, kind: 'proposal' as const } : original; }), image: 'https://images.example/physical.png?token=private', ...overrides });
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function installFetch(posts: ReturnType<typeof vi.fn> = vi.fn(async (_url: string, init: RequestInit) => { const body = JSON.parse(String(init.body)) as CanvasRequest; return reply({ concept: body.stage === 'physical' ? physicalFor(body) : worldFor(body) }); }), readiness: ReturnType<typeof vi.fn> = vi.fn(async () => reply(ready))) {
  const fetchMock = vi.fn((url: string, init: RequestInit = {}) => init.method === 'POST' ? posts(url, init) : readiness(url, init));
  vi.stubGlobal('fetch', fetchMock); return { fetchMock, posts, readiness };
}
function posted(posts: ReturnType<typeof vi.fn>, index = 0): CanvasRequest { return JSON.parse(posts.mock.calls[index][1].body); }
function mount(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Index /></MemoryRouter>); }
function Navigation() { const navigate = useNavigate(); return <nav aria-label="Test navigation"><Link to="/?newer=1">Newer route</Link><button onClick={() => navigate(-1)}>Go back</button></nav>; }
function mountBrowser(path = '/') { window.history.replaceState({}, '', path); return render(<BrowserRouter><Navigation /><Index /></BrowserRouter>); }
function savedDirection(withImages = false): CanvasSession {
  const session = emptyCanvasSession(); session.brief = { ...session.brief, business, exactWording: wording };
  if (withImages) { session.worldId = worldId; session.selected = sourceElements.map(element => element.id); session.hero = 'fold'; session.worldFingerprint = worldFingerprint(session); }
  return session;
}
function writeBrief() { fireEvent.change(screen.getByLabelText('WHAT SHOULD WE KNOW?'), { target: { value: business } }); fireEvent.change(screen.getByLabelText('EXACT WORDING'), { target: { value: wording } }); }
async function clickWorld() { const button = screen.getByRole('button', { name: /^(Generate my brand world|Regenerate brand world)$/ }); await waitFor(() => expect(button).toBeEnabled()); fireEvent.click(button); }
async function generateWorld() { writeBrief(); await clickWorld(); await screen.findByRole('heading', { name: 'A town made of paper' }); }
function element(label: string) { return within(screen.getByLabelText('World story elements')).getByRole('button', { name: new RegExp(label) }); }
function mockClipboard() { const writeText = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } }); return writeText; }
function mockDownload() {
  const createObjectURL = vi.fn().mockReturnValue('blob:canvas-brief'); const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  const clicks: HTMLAnchorElement[] = []; vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clicks.push(this); });
  return { createObjectURL, revokeObjectURL, clicks };
}
async function readBlob(blob: Blob) { let text = ''; await act(async () => { text = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob); }); }); return text; }

beforeEach(() => {
  localStorage.clear(); window.history.replaceState({}, '', '/');
  vi.stubGlobal('scrollTo', vi.fn()); vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected request in test')));
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  settings.values = [{ key: 'site_title', value: 'OFFKIN' }];
});
afterEach(async () => { await act(async () => {}); cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); window.history.replaceState({}, '', '/'); });

describe('Canvas privacy defaults and authored references', () => {
  it('shows actual source art, real selected elements and only a bodyless readiness read', async () => {
    const { posts, readiness, fetchMock } = installFetch(); mount();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate my brand world' })).toBeEnabled());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
    const examples=screen.getByRole('region',{name:'Example concept boards'});
    expect(examples.querySelector('img')).toHaveAttribute('src',worldReferences[0].boardImage);
    expect(screen.getByText('Private on this device until you choose to generate or share')).toBeInTheDocument();
    expect(document.querySelector('.oc-edit-details')).not.toHaveAttribute('open');
    expect(screen.queryByRole('region',{name:'Brand world canvas'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate physical concept' })).toBeDisabled();
    expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBeNull(); expect(posts).not.toHaveBeenCalled(); expect(readiness).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body'); expect(fetchMock.mock.calls[0][1].method).not.toBe('POST');
  });

  it('uses current admin title, logo and safe logo destination', async () => {
    settings.values = [{ key: 'site_title', value: 'Studio by OFFKIN' }, { key: 'logo_url', value: 'https://assets.example/logo.png' }, { key: 'logo_link', value: '/about' }];
    installFetch(); mount();
    const logo = await screen.findByRole('link', { name: 'Studio by OFFKIN home' });
    expect(logo).toHaveAttribute('href', '/about'); expect(within(logo).getByRole('img')).toHaveAttribute('src', 'https://assets.example/logo.png');
    expect(document.title).toContain('Studio by OFFKIN');
  });

  it('opens examples without changing the draft, and keeps advanced element edits local', async () => {
    const { posts } = installFetch(); mount();
    fireEvent.click(screen.getByRole('button', { name: /Tesla/ }));
    expect(screen.getByRole('img', { name:'Tesla, complete original concept board' })).toHaveAttribute('src',worldReferences[2].boardImage);
    expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBeNull();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Close'}));
    const reference=worldReferences[0];
    fireEvent.click(element(reference.elements[1].label));
    fireEvent.click(screen.getByRole('button', { name: 'Make main character' }));
    fireEvent.change(screen.getByLabelText('OR REPLACE WITH ANOTHER IDEA'), { target: { value: 'Neighbourhood observatory' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply element replacement' }));
    fireEvent.change(screen.getByLabelText('DIRECTION NOTES'), { target: { value: 'Keep the bright path' } });
    const saved = JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!);
    expect(saved.referenceId).toBe('airbnb'); expect(saved.hero).toBe(reference.elements[1].id);
    expect(saved.replacements[0].label).toBe('Neighbourhood observatory'); expect(saved.brief.notes).toBe('Keep the bright path');
    expect(posts).not.toHaveBeenCalled();
  });

  it('does not read a website while typing and treats explicit retrieval as reviewable text only', async () => {
    const posts = vi.fn(async () => reply({ verified: true, website: { url: 'https://company.com/', title: 'Our public page', excerpt: 'We hand-fold gifts for celebrations.' } }));
    installFetch(posts); mount();
    fireEvent.change(screen.getByLabelText(/YOUR WEBSITE/), { target: { value: 'company.com' } });
    expect(posts).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Read public website' }));
    await screen.findByText('Website text is ready to review. Choose what belongs in your story.');
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue('');
    expect(posted(posts)).toMatchObject({ inspectWebsite: true }); expect(posted(posts)).not.toHaveProperty('stage');
    fireEvent.click(screen.getByRole('button', { name: 'Use excerpt as a starting point' }));
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue('We hand-fold gifts for celebrations.');
    expect(posts).toHaveBeenCalledOnce();
  });

  it('fails closed for an old backend while keeping local work, downloads and reviewed sharing usable', async () => {
    const { posts } = installFetch(undefined, vi.fn(async () => reply({ ready: true, prompt_version: 'offkin-cocreation-v8', capabilities: { cocreation: true, context_max_chars: 6000 } })));
    mount(); await screen.findByText(/Image generation is not connected to this canvas yet/); writeBrief();
    expect(screen.getByRole('button', { name: 'Generate my brand world' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download current brief' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Share a version' })); expect(screen.getByRole('dialog', { name: 'Share this version' })).toBeInTheDocument();
    expect(posts).not.toHaveBeenCalled();
  });
});

describe('Explicit two-stage generation and linked element decisions', () => {
  it('sends exact wording and later selected, removed, replaced and hero decisions to their correct stage', async () => {
    const { posts } = installFetch(); mount(); await generateWorld();
    expect(posts).toHaveBeenCalledOnce(); expect(posted(posts)).toMatchObject({ stage: 'world', contractVersion: CANVAS_CONTRACT_VERSION, brand: 'no-website', context: { business, exactWording: wording } });
    expect(posted(posts)).not.toHaveProperty('sourceWorldId');
    fireEvent.click(element('Paper bird')); fireEvent.click(screen.getByRole('button', { name: 'Included · remove' }));
    fireEvent.click(element('Ribbon loop')); fireEvent.click(screen.getByRole('button', { name: 'Make main character' }));
    fireEvent.click(element('Paper fold')); fireEvent.change(screen.getByLabelText('OR REPLACE WITH ANOTHER IDEA'), { target: { value: 'Paper garden' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply element replacement' }));
    expect(posts).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Generate physical concept' }));
    await screen.findByRole('heading', { name: 'Paper town, made tangible' });
    expect(posts).toHaveBeenCalledTimes(2);
    expect(posted(posts, 1)).toMatchObject({ stage: 'physical', sourceWorldId: worldId, selectedElementIds: ['fold', 'ribbon'], heroElementId: 'ribbon', replacements: [{ id: 'fold', label: 'Paper garden', description: 'Proposed replacement for Paper fold: Paper garden' }], context: { exactWording: wording } });
  });

  it('does not generate without a business or without remaining selected elements', async () => {
    const { posts } = installFetch(); mount(); await clickWorld();
    expect(screen.getByText(/Tell us a little about the business/)).toBeInTheDocument(); expect(posts).not.toHaveBeenCalled();
    await generateWorld();
    for (const item of sourceElements) { fireEvent.click(element(item.label)); fireEvent.click(screen.getByRole('button', { name: 'Included · remove' })); }
    expect(screen.getByText(/^0 selected/)).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Generate physical concept' })).toBeDisabled(); expect(posts).toHaveBeenCalledOnce();
  });

  it('allows physical interaction and direction edits while correctly marking an existing preview stale', async () => {
    const { posts } = installFetch(); mount(); await generateWorld();
    fireEvent.click(screen.getByRole('button', { name: 'Generate physical concept' })); await screen.findByRole('heading', { name: 'Paper town, made tangible' });
    fireEvent.click(screen.getByRole('button', { name: /Slide to discover/ }));
    expect(screen.getByText(/Your selections have changed. This preview is the previous version/)).toBeInTheDocument();
    expect(screen.queryByText(/Your story has changed/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate physical concept' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'), { target: { value: 'Make the garden stranger' } }); fireEvent.click(screen.getByRole('button', { name: 'Save direction note' }));
    expect(screen.getByRole('button', { name: 'Regenerate physical concept' })).toBeEnabled(); expect(posts).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByLabelText('WHAT SHOULD WE KNOW?'), { target: { value: 'Now we make wooden toys.' } });
    expect(screen.getByText(/Your story has changed/)).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Regenerate physical concept' })).not.toBeInTheDocument(); expect(screen.getByRole('button', {name:'Regenerate brand world'})).toBeEnabled(); expect(posts).toHaveBeenCalledTimes(2);
  });

  it('rechecks readiness at the explicit generation boundary without leaking a brief to a stale backend', async () => {
    const readiness = vi.fn().mockImplementationOnce(async () => reply(ready)).mockImplementation(async () => reply({ ...ready, ready: false }));
    const { posts } = installFetch(undefined, readiness); mount(); writeBrief(); await clickWorld();
    await screen.findByText(/World generation isn’t available on this backend yet/); expect(posts).not.toHaveBeenCalled(); expect(screen.getByLabelText('EXACT WORDING')).toHaveValue(wording);
  });

  it.each([
    ['wrong context', (body: CanvasRequest) => reply({ concept: worldFor(body, { context: { business: 'Someone else' } }) }), /does not match your current world direction/],
    ['old contract', (body: CanvasRequest) => reply({ concept: { ...worldFor(body), contractVersion: 'offkin-canvas-v8' } }), /incompatible world/],
    ['provider failure', () => reply({ error: 'Provider unavailable. Please retry.' }, 503), /Provider unavailable/],
    ['rate limit', () => reply({ error: 'limit' }, 429), /generation limit has been reached/],
    ['needs more context', () => reply({ needsContext: true, message: 'Tell us more' }), /more specific business description/],
  ])('keeps editable input after %s without showing a fabricated result', async (_label, response, error) => {
    const posts = vi.fn(async (_url: string, init: RequestInit) => response(JSON.parse(String(init.body)))); installFetch(posts); mount(); writeBrief(); await clickWorld();
    await screen.findByText(error); expect(screen.getByLabelText('EXACT WORDING')).toHaveValue(wording);
    expect(screen.queryByRole('heading', { name: 'A town made of paper' })).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Generate physical concept' })).toBeDisabled();
  });

  it('rejects a physical response that does not match the selected hero', async () => {
    const posts = vi.fn(async (_url: string, init: RequestInit) => { const body = JSON.parse(String(init.body)) as CanvasRequest; return reply({ concept: body.stage === 'physical' ? physicalFor(body, { heroElementId: 'ribbon' }) : worldFor(body) }); });
    installFetch(posts); mount(); await generateWorld(); fireEvent.click(screen.getByRole('button', { name: 'Generate physical concept' }));
    await screen.findByText(/does not match the elements you selected/); expect(screen.queryByRole('heading', { name: 'Paper town, made tangible' })).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Generate physical concept' })).toBeEnabled();
  });

  it('blocks repeated clicks while generation is pending and does not automatically regenerate', async () => {
    const pending = deferred<Response>(); const posts: ReturnType<typeof vi.fn> = vi.fn(() => pending.promise); installFetch(posts); mount(); writeBrief();
    await clickWorld(); await waitFor(() => expect(posts).toHaveBeenCalledOnce());
    const creating = screen.getByRole('button', { name: 'Creating your world…' }); expect(creating).toBeDisabled(); fireEvent.click(creating); fireEvent.click(creating);
    await act(async () => { pending.resolve(reply({ concept: worldFor(posted(posts)) })); });
    await screen.findByRole('heading', { name: 'A town made of paper' }); expect(posts).toHaveBeenCalledOnce();
  });

  it('allows an explicit retry after cancellation and ignores the first late response', async () => {
    const pending = deferred<Response>(); const posts = vi.fn().mockImplementationOnce(() => pending.promise).mockImplementation(async (_url: string, init: RequestInit) => reply({ concept: worldFor(JSON.parse(String(init.body)), { title: 'The current paper town' }) }));
    installFetch(posts); mount(); writeBrief(); await clickWorld(); await waitFor(() => expect(posts).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' })); expect(posts.mock.calls[0][1].signal.aborted).toBe(true); expect(screen.getByLabelText('EXACT WORDING')).toHaveValue(wording);
    await clickWorld(); await screen.findByRole('heading', { name: 'The current paper town' });
    await act(async () => { pending.resolve(reply({ concept: worldFor(posted(posts), { title: 'The stale paper town' }) })); });
    expect(screen.queryByRole('heading', { name: 'The stale paper town' })).not.toBeInTheDocument(); expect(screen.getByRole('heading', { name: 'The current paper town' })).toBeInTheDocument(); expect(posts.mock.calls[1][1].body).toBe(posts.mock.calls[0][1].body);
  });

  it('cancels generation on URL navigation and does not save its late result', async () => {
    const pending = deferred<Response>(); const posts: ReturnType<typeof vi.fn> = vi.fn(() => pending.promise); installFetch(posts); mountBrowser(); writeBrief(); await clickWorld(); await waitFor(() => expect(posts).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('link', { name: 'Newer route' })); expect(posts.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { pending.resolve(reply({ concept: worldFor(posted(posts)) })); });
    expect(screen.queryByRole('heading', { name: 'A town made of paper' })).not.toBeInTheDocument(); expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).worldId).toBe('');
  });

  it('aborts generation on unmount and does not write its late result into a new page', async () => {
    const pending = deferred<Response>(); const posts: ReturnType<typeof vi.fn> = vi.fn(() => pending.promise); installFetch(posts); const view = mount(); writeBrief(); await clickWorld(); await waitFor(() => expect(posts).toHaveBeenCalledOnce());
    view.unmount(); expect(posts.mock.calls[0][1].signal.aborted).toBe(true); const saved = localStorage.getItem(CANVAS_SESSION_KEY);
    await act(async () => { pending.resolve(reply({ concept: worldFor(posted(posts)) })); }); expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBe(saved);
  });
});

describe('Local resume, reviewed sharing and separate imported versions', () => {
  it('offers local resume without replacing the blank workspace until requested and performs no generation', async () => {
    const direction = savedDirection(); saveCanvasSession(direction); const { posts } = installFetch(); mount();
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue(''); fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' }));
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue(business); expect(screen.getByLabelText('EXACT WORDING')).toHaveValue(wording); expect(posts).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).version).toBe(direction.version);
  });

  it('restores saved image access with an ID-only read and no generation request', async () => {
    const direction = savedDirection(true); saveCanvasSession(direction);
    const posts = vi.fn(async () => reply({ concept: worldFor({ context: canvasContext(direction.brief) }) })); installFetch(posts); mount();
    expect(posts).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' }));
    await screen.findByRole('heading', { name: 'A town made of paper' }); expect(posts).toHaveBeenCalledOnce(); expect(posted(posts)).toEqual({ id: worldId });
    expect(screen.getByRole('button', { name: 'Generate physical concept' })).toBeEnabled();
  });

  it('never displays a cached or restored physical concept linked to a different source world', async () => {
    const direction = savedDirection(true); direction.physicalId = physicalId; saveCanvasSession(direction);
    const source = worldFor({ context: canvasContext(direction.brief) });
    const wrongPhysical = physicalFor({ contractVersion: CANVAS_CONTRACT_VERSION, stage: 'physical', brand: 'no-website', context: canvasContext(direction.brief), sourceWorldId: '00000000-0000-4000-8000-000000000009', selectedElementIds: ['fold'], heroElementId: 'fold', replacements: [] }, { title: 'An unrelated physical concept' });
    saveCanvasSnapshot(source); saveCanvasSnapshot(wrongPhysical);
    const { posts } = installFetch(vi.fn(async (_url: string, init: RequestInit) => reply({ concept: JSON.parse(String(init.body)).id === worldId ? source : wrongPhysical })));
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' }));
    expect(screen.queryByRole('heading', { name: 'An unrelated physical concept' })).not.toBeInTheDocument();
    await screen.findByText('World restored. The saved physical concept is unavailable.');
    expect(screen.queryByRole('heading', { name: 'An unrelated physical concept' })).not.toBeInTheDocument(); expect(posts).toHaveBeenCalledTimes(2);
  });

  it('never creates a sharing link or writes to clipboard until its complete review is confirmed', async () => {
    const writeText = mockClipboard(); const { posts } = installFetch(); mountBrowser('/?private=remove-me'); writeBrief();
    fireEvent.click(screen.getByRole('button', { name: 'Share a version' })); const dialog = screen.getByRole('dialog', { name: 'Share this version' });
    expect(dialog.querySelector('pre')!.textContent).toContain(JSON.stringify(wording)); expect(dialog).toHaveTextContent('Anyone you give it to can read and forward it'); expect(dialog).toHaveTextContent('There is no live shared editing'); expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create & copy this version link' })); await screen.findByText(/Link copied. Each person opens a separate editable version/);
    expect(writeText).toHaveBeenCalledOnce(); const url = new URL(writeText.mock.calls[0][0]); expect(url.search).toBe(''); expect(decodeCanvasShare(url.hash)?.brief.exactWording).toBe(wording); expect(posts).not.toHaveBeenCalled();
  });

  it('shares only reviewed current text by default and requires opt-in before exposing original generated briefs', async () => {
    const secret = 'CONFIDENTIAL ORIGINAL GENERATION WORDING'; const writeText = mockClipboard(); const { posts } = installFetch(); mount();
    writeBrief(); fireEvent.change(screen.getByLabelText('EXACT WORDING'), { target: { value: secret } }); await clickWorld(); await screen.findByRole('heading', { name: 'A town made of paper' });
    fireEvent.change(screen.getByLabelText('EXACT WORDING'), { target: { value: 'Public current wording' } });
    fireEvent.click(screen.getByRole('button', { name: 'Share a version' })); const dialog = screen.getByRole('dialog', { name: 'Share this version' });
    const includeImages = within(dialog).getByRole('checkbox', { name: 'Include generated images and their original briefs' });
    expect(includeImages).not.toBeChecked(); expect(dialog).toHaveTextContent('Generated image IDs and original generation briefs are excluded'); expect(dialog).toHaveTextContent('including details you later removed');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create & copy this version link' })); await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const defaultCopy = decodeCanvasShare(new URL(writeText.mock.calls[0][0]).hash)!;
    expect(defaultCopy.worldId).toBe(''); expect(defaultCopy.physicalId).toBe(''); expect(defaultCopy.sharedWorld?.title).toBe('A town made of paper'); expect(defaultCopy.sharedWorld?.worldElements).toEqual(sourceElements);
    expect(JSON.stringify(defaultCopy)).not.toContain(secret); expect(JSON.stringify(defaultCopy)).not.toContain('token=private'); expect(JSON.stringify(defaultCopy)).not.toContain(worldId);
    fireEvent.click(includeImages); expect(includeImages).toBeChecked(); expect(dialog).toHaveTextContent('Review original generated data shared through image access'); expect(dialog).toHaveTextContent(secret);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create & copy this version link' })); await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    const imageCopy = decodeCanvasShare(new URL(writeText.mock.calls[1][0]).hash)!; expect(imageCopy.worldId).toBe(worldId); expect(imageCopy.worldFingerprint).toBe('stale'); expect(posts).toHaveBeenCalledOnce();
  });

  it('imports a text-only generated direction with editable source cards and no image or original-brief retrieval', async () => {
    const incoming = savedDirection(true); const sharedWorld = { title: 'Detached paper town', story: 'A reviewed current story.', worldElements: sourceElements };
    const { posts } = installFetch(); mountBrowser('/' + encodeCanvasShare(incoming, { sharedWorld }));
    fireEvent.click(screen.getByRole('button', { name: 'Create my own version' }));
    expect(screen.getByRole('heading', { name: 'Detached paper town' })).toBeInTheDocument(); expect(element('Paper fold')).toBeEnabled();
    expect(screen.queryByRole('img', { name: /Airbnb/ })).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Generate physical concept' })).not.toBeInTheDocument(); expect(posts).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).sharedWorld).toEqual(sharedWorld);
  });

  it('keeps a failed clipboard copy available as a selectable link', async () => {
    const writeText = mockClipboard().mockRejectedValue(new Error('Denied')); installFetch(); mount(); writeBrief(); fireEvent.click(screen.getByRole('button', { name: 'Share a version' })); fireEvent.click(screen.getByRole('button', { name: 'Create & copy this version link' }));
    await screen.findByText('Select and copy the link below.'); expect((screen.getByLabelText('VERSION LINK') as HTMLInputElement).value).toContain('#world='); expect(writeText).toHaveBeenCalledOnce();
  });

  it('does not overwrite existing saved work or fetch shared images before explicit import confirmation', async () => {
    const local = savedDirection(); local.brief.business = 'The local studio'; saveCanvasSession(local); const originalStorage = localStorage.getItem(CANVAS_SESSION_KEY);
    const incoming = savedDirection(true); const { posts } = installFetch(vi.fn(async () => reply({ concept: worldFor({ context: canvasContext(incoming.brief) }) })));
    mountBrowser('/' + encodeCanvasShare(incoming, { includeGenerated: true })); const dialog = screen.getByRole('dialog', { name: 'Open a shared direction' });
    expect(dialog).toHaveTextContent(business); expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue(''); expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBe(originalStorage); expect(posts).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create my own version' })); await screen.findByRole('heading', { name: 'A town made of paper' });
    const branched = JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!); expect(branched.parentVersion).toBe(incoming.version); expect(branched.version).not.toBe(incoming.version); expect(branched.brief.exactWording).toBe(wording); expect(window.location.hash).toBe(''); expect(posted(posts)).toEqual({ id: worldId });
  });

  it('backs up the existing saved local draft from import review before creating a branch', async () => {
    const local = savedDirection(); local.brief.business = 'Our existing local studio'; local.brief.exactWording = '  Prior local wording!  '; saveCanvasSession(local);
    const incoming = savedDirection(); incoming.brief.business = 'An incoming shared studio';
    const download = mockDownload(); const { posts } = installFetch(); mountBrowser('/' + encodeCanvasShare(incoming, { includeGenerated: true }));
    const dialog = screen.getByRole('dialog', { name: 'Open a shared direction' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save current brief' }));
    const brief = await readBlob(download.createObjectURL.mock.calls[0][0]);
    expect(brief).toContain('Business: Our existing local studio'); expect(brief).toContain(JSON.stringify(local.brief.exactWording)); expect(brief).not.toContain('An incoming shared studio');
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).version).toBe(local.version);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create my own version' }));
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue('An incoming shared studio'); expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).parentVersion).toBe(incoming.version); expect(posts).not.toHaveBeenCalled();
    await waitFor(() => expect(download.revokeObjectURL).toHaveBeenCalledWith('blob:canvas-brief'), { timeout: 1500 });
  });

  it('retains generated world text and selected element descriptions when saved image restoration fails', async () => {
    const { posts } = installFetch(); const first = mount(); await generateWorld();
    fireEvent.click(element('Paper bird')); fireEvent.click(screen.getByRole('button', { name: 'Included · remove' }));
    first.unmount(); posts.mockImplementation(async () => reply({ error: 'Offline image access. Your direction is still here.' }, 503));
    const download = mockDownload(); mount(); fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' }));
    await screen.findByText('Offline image access. Your direction is still here.');
    expect(screen.getByRole('heading', { name: 'A town made of paper' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Airbnb original rich illustrated brand world' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download current brief' })); const brief = await readBlob(download.createObjectURL.mock.calls[0][0]);
    expect(brief).toContain('World: A town made of paper'); expect(brief).toContain('Paper gifts connect a neighbourhood.'); expect(brief).toContain('Paper fold: Our signature folding ritual.'); expect(brief).toContain('Ribbon loop: A proposed looping path.');
    expect(brief).not.toContain('Paper bird:'); expect(brief).not.toContain('Homes, hosts and journeys'); expect(posted(posts, 1)).toEqual({ id: worldId }); expect(posts).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(download.revokeObjectURL).toHaveBeenCalledWith('blob:canvas-brief'), { timeout: 1500 });
  });

  it('closing an import review leaves current saved work untouched', async () => {
    const local = savedDirection(); saveCanvasSession(local); const stored = localStorage.getItem(CANVAS_SESSION_KEY); const { posts } = installFetch(); mountBrowser('/' + encodeCanvasShare(savedDirection()));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBe(stored); expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue(''); expect(posts).not.toHaveBeenCalled();
  });

  it.each(['#world=not-json', '#world=' + 'A'.repeat(18000), '#world=' + btoa(JSON.stringify({ schema: 99 }))])('rejects malformed or unsupported shared input without touching local work (%#)', async hash => {
    const local = savedDirection(); saveCanvasSession(local); const stored = localStorage.getItem(CANVAS_SESSION_KEY); const { posts } = installFetch(); mountBrowser('/' + hash);
    expect(screen.getByRole('dialog')).toHaveTextContent('invalid or too long'); expect(screen.queryByRole('button', { name: 'Create my own version' })).not.toBeInTheDocument(); expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBe(stored); expect(posts).not.toHaveBeenCalled();
  });

  it('renders untrusted imported text literally rather than executing it', async () => {
    const incoming = savedDirection(); incoming.brief.business = '<img src="https://evil.example/pixel" onerror="alert(1)">'; const { posts } = installFetch(); mountBrowser('/' + encodeCanvasShare(incoming, { includeGenerated: true }));
    const dialog = screen.getByRole('dialog'); expect(dialog).toHaveTextContent(incoming.brief.business); expect(dialog.querySelector('img, script')).toBeNull(); expect(posts).not.toHaveBeenCalled();
  });

  it('shows storage failure while retaining exact wording and the downloadable brief', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); }); const download = mockDownload(); const { posts } = installFetch(); mount(); writeBrief();
    expect(screen.getByText('Not saved on this device')).toBeInTheDocument(); expect(screen.getByRole('status')).toHaveTextContent('Device storage is unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Download current brief' })); expect(await readBlob(download.createObjectURL.mock.calls[0][0])).toContain(JSON.stringify(wording)); expect(posts).not.toHaveBeenCalled(); await waitFor(() => expect(download.revokeObjectURL).toHaveBeenCalledWith('blob:canvas-brief'), { timeout: 1500 });
  });

  it('does not clear a generated-metadata storage failure when the smaller written session can still save', async () => {
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key.startsWith('offkin:canvas-image-metadata:')) throw new Error('Metadata quota'); setItem.call(this, key, value); });
    installFetch(); mount(); await generateWorld();
    expect(screen.getByRole('status')).toHaveTextContent(/storage|save|metadata/i);
    expect(screen.queryByText('Saved on this device')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).worldId).toBe(worldId);
  });

  it('keeps a failed active-world metadata warning after the physical snapshot saves successfully', async () => {
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === `offkin:canvas-image-metadata:${worldId}`) throw new Error('World metadata quota'); setItem.call(this, key, value); });
    installFetch(); mount(); await generateWorld();
    fireEvent.click(screen.getByRole('button', { name: 'Generate physical concept' }));
    await screen.findByRole('heading', { name: 'Paper town, made tangible' });
    expect(localStorage.getItem(`offkin:canvas-image-metadata:${physicalId}`)).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(/storage|save|metadata/i);
    expect(screen.queryByText('Saved on this device')).not.toBeInTheDocument();
  });

  it('keeps image failures recoverable and preserves source selection controls', async () => {
    const { posts } = installFetch(); mount(); await generateWorld();
    fireEvent.error(screen.getByRole('img', { name: /illustrated brand world/ })); expect(screen.getByText('The illustration couldn’t load')).toBeInTheDocument(); expect(element('Paper fold')).toBeEnabled(); expect(screen.getByRole('button', { name: 'Download current brief' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Try image again' })); expect(screen.getByRole('img', { name: /illustrated brand world/ })).toBeInTheDocument(); expect(posts).toHaveBeenCalledOnce();
  });

  it('downloads quantity, budget and purpose with explicit no-submission and no-purchase wording', async () => {
    const download = mockDownload(); const { posts } = installFetch(); mount(); writeBrief(); fireEvent.click(screen.getByRole('button', { name: 'Plan a real prototype' }));
    const dialog = screen.getByRole('dialog', { name: 'From world to working prototype' });
    fireEvent.change(within(dialog).getByLabelText('PLANNING QUANTITY'), { target: { value: '120 pieces' } }); fireEvent.change(within(dialog).getByLabelText('EXPLORATORY BUDGET'), { target: { value: 'RM250 exploratory' } }); fireEvent.change(within(dialog).getByLabelText('WHAT SHOULD THIS DO FOR THE BRAND?'), { target: { value: 'Thank our partners' } });
    expect(dialog).toHaveTextContent('does not submit a request, take payment or place an order');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Download prototype brief' })); const brief = await readBlob(download.createObjectURL.mock.calls[0][0]);
    expect(brief).toContain('Planning quantity: 120 pieces'); expect(brief).toContain('Exploratory budget: RM250 exploratory'); expect(brief).toContain('Purpose: Thank our partners'); expect(brief).toContain(JSON.stringify(wording)); expect(brief).toContain('This file has not been sent. No purchase, production booking or order has been placed.'); expect(download.clicks[0].download).toMatch(/^OFFKIN-.*-prototype-brief\.txt$/); expect(posts).not.toHaveBeenCalled(); await waitFor(() => expect(download.revokeObjectURL).toHaveBeenCalledWith('blob:canvas-brief'), { timeout: 1500 });
  });
});

describe('Restore lifecycle regressions', () => {
  it('aborts a saved-image restore on unmount and never applies its late result', async () => {
    const direction = savedDirection(true); saveCanvasSession(direction); const pending = deferred<Response>(); const { posts } = installFetch(vi.fn(() => pending.promise)); const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' }));
    await waitFor(() => expect(posts).toHaveBeenCalledOnce()); view.unmount();
    expect(posts.mock.calls[0][1].signal.aborted).toBe(true); const saved = localStorage.getItem(CANVAS_SESSION_KEY);
    await act(async () => { pending.resolve(reply({ concept: worldFor({ context: canvasContext(direction.brief) }) })); });
    expect(localStorage.getItem(CANVAS_SESSION_KEY)).toBe(saved); expect(posts).toHaveBeenCalledOnce();
  });

  it('aborts a saved-image restore on newer URL navigation and ignores its late result', async () => {
    const direction = savedDirection(true); saveCanvasSession(direction); const pending = deferred<Response>(); const { posts } = installFetch(vi.fn(() => pending.promise)); mountBrowser();
    fireEvent.click(screen.getByRole('button', { name: 'Resume my direction' })); await waitFor(() => expect(posts).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('link', { name: 'Newer route' })); expect(posts.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { pending.resolve(reply({ concept: worldFor({ context: canvasContext(direction.brief) }) })); });
    expect(screen.queryByRole('heading', { name: 'A town made of paper' })).not.toBeInTheDocument(); expect(posts).toHaveBeenCalledOnce();
  });

  it('does not start queued import image retrieval when a newer route wins the same navigation batch', async () => {
    const incoming = savedDirection(true); const pending = deferred<Response>(); const { posts } = installFetch(vi.fn(() => pending.promise));
    mountBrowser('/' + encodeCanvasShare(incoming, { includeGenerated: true }));
    const newerRoute = screen.getByText('Newer route'); const importButton = screen.getByRole('button', { name: 'Create my own version' });
    await act(async () => { fireEvent.click(importButton); fireEvent.click(newerRoute); });
    expect(window.location.search).toBe('?newer=1'); expect(posts).not.toHaveBeenCalled();
  });

  it('guards repeated Generate clicks within one React batch before a disabled button renders', async () => {
    const pending = deferred<Response>(); const { posts, readiness } = installFetch(vi.fn(() => pending.promise)); mount(); writeBrief();
    const button = screen.getByRole('button', { name: 'Generate my brand world' }); await waitFor(() => expect(button).toBeEnabled());
    act(() => { fireEvent.click(button); fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(posts).toHaveBeenCalledOnce()); expect(readiness).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }));
    await act(async () => { pending.resolve(reply({ concept: worldFor(posted(posts)) })); });
  });

  it('closes sharing review after navigation before stale content can be copied', async () => {
    const writeText = mockClipboard(); installFetch(); mountBrowser(); writeBrief();
    const navigation = screen.getByRole('link', { name: 'Newer route' });
    fireEvent.click(screen.getByRole('button', { name: 'Share a version' })); expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(navigation); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(writeText).not.toHaveBeenCalled();
  });

  it('keeps an imported world stale when its website changed since generation', async () => {
    const incoming = savedDirection(true); incoming.brief.website = 'https://new-company.example';
    const { posts } = installFetch(vi.fn(async () => reply({ concept: worldFor({ context: canvasContext(incoming.brief) }, { sourceUrl: 'https://original-company.example' }) })));
    mountBrowser('/' + encodeCanvasShare(incoming, { includeGenerated: true })); fireEvent.click(screen.getByRole('button', { name: 'Create my own version' }));
    await screen.findByRole('heading', { name: 'A town made of paper' });
    expect(screen.getByText(/Your story has changed/)).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Generate physical concept' })).not.toBeInTheDocument(); expect(screen.getByRole('button', {name:'Regenerate brand world'})).toBeEnabled(); expect(posted(posts)).toEqual({ id: worldId });
  });
});

describe('Responsive conversation accessibility', () => {
  it('has one composer and one optional details form on a narrow viewport, retaining answers after closing', async () => {
    vi.stubGlobal('innerWidth',390); const {posts}=installFetch(); mount();
    expect(document.querySelectorAll('#conversation-entry')).toHaveLength(1);
    const details=document.querySelector('.oc-edit-details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText('Edit details'));
    const field=screen.getByLabelText('WHAT SHOULD WE KNOW?');
    expect(document.querySelectorAll('#canvas-business')).toHaveLength(1);
    fireEvent.change(field,{target:{value:business}});
    fireEvent.click(screen.getByText('Edit details'));
    fireEvent.click(screen.getByText('Edit details'));
    expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue(business);
    expect(document.querySelectorAll('#canvas-business')).toHaveLength(1);
    expect(posts).not.toHaveBeenCalled();
  });
  it('keeps one element editor and preserved fields across a narrow-to-wide resize', async () => {
    vi.stubGlobal('innerWidth',390); installFetch(); mount();
    fireEvent.click(screen.getByText('Edit details'));
    fireEvent.click(element('Bélo landmark'));
    expect(screen.getByLabelText('OR REPLACE WITH ANOTHER IDEA')).toBeInTheDocument();
    expect(document.querySelectorAll('#replace-element')).toHaveLength(1);
    vi.stubGlobal('innerWidth',1280); fireEvent(window,new Event('resize'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelectorAll('#replace-element')).toHaveLength(1);
    expect(document.querySelectorAll('#canvas-business')).toHaveLength(1);
  });
});

describe('Simple guided conversation', () => {
  async function introduce(value=business){
    fireEvent.change(screen.getByLabelText('Your brand, website or story'),{target:{value}});
    fireEvent.click(screen.getByRole('button',{name:'Continue conversation'}));
  }
  it('reaches both real output stages through the composer without opening details', async () => {
    const {posts}=installFetch(); mount();
    await introduce();
    expect(screen.getByText('Who would you like to make this for?')).toBeInTheDocument();
    expect(posts).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Our team'}));
    expect(screen.queryByLabelText('Your audience')).not.toBeInTheDocument();
    await clickWorld(); await screen.findByRole('heading',{name:'A town made of paper'});
    expect(posted(posts).context).toMatchObject({business,audience:'Our team'});
    expect(document.querySelector('.oc-edit-details')).not.toHaveAttribute('open');
    fireEvent.click(screen.getByRole('button',{name:'Generate physical concept'}));
    await screen.findByRole('heading',{name:'Paper town, made tangible'});
    expect(posts).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('region',{name:'Refine your concept'})).toBeInTheDocument();
    expect(screen.queryByRole('img',{name:/Airbnb/})).not.toBeInTheDocument();
  });
  it('accepts a URL locally, asks one business question and never reads it while typing or continuing', async () => {
    const {posts}=installFetch(); mount(); await introduce('paper.example');
    expect(screen.getByText('What makes this brand special?')).toBeInTheDocument();
    expect(screen.getByLabelText(/YOUR WEBSITE/)).toHaveValue('https://paper.example');
    expect(posts).not.toHaveBeenCalled();
    await introduce('我们为社区做纸艺礼物 🪁');
    fireEvent.click(screen.getByRole('button',{name:'You choose'}));
    await clickWorld(); await screen.findByRole('heading',{name:'A town made of paper'});
    expect(posted(posts)).toMatchObject({brand:'https://paper.example',context:{business:'我们为社区做纸艺礼物 🪁'}});
    expect(posts).toHaveBeenCalledOnce();
  });
  it('preserves free-form audience text and ignores Enter during IME composition', async () => {
    const {posts}=installFetch(); mount();
    const entry=screen.getByLabelText('Your brand, website or story');
    fireEvent.change(entry,{target:{value:'礼物'}}); fireEvent.keyDown(entry,{key:'Enter',isComposing:true});
    expect(screen.queryByText('Who would you like to make this for?')).not.toBeInTheDocument();
    fireEvent.keyDown(entry,{key:'Enter'});
    const audience='  合作伙伴 / Kuala Lumpur ☀️  ';
    fireEvent.change(screen.getByLabelText('Your audience'),{target:{value:audience}});
    fireEvent.click(screen.getByRole('button',{name:'Continue conversation'}));
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).brief.audience).toBe(audience);
    expect(posts).not.toHaveBeenCalled();
  });
  it('includes an unsent refinement when the user explicitly generates and keeps earlier turns', async () => {
    const {posts}=installFetch(); mount(); await generateWorld();
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'),{target:{value:'Keep the yellow road'}});
    fireEvent.click(screen.getByRole('button',{name:'Save direction note'}));
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'),{target:{value:'  加一间咖啡馆 ☀️  '}});
    expect(posts).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Generate physical concept'}));
    await screen.findByRole('heading',{name:'Paper town, made tangible'});
    expect(posted(posts,1).context.revisionNotes).toBe('Keep the yellow road\n  加一间咖啡馆 ☀️  ');
    expect(screen.getByLabelText('Tell the next image where to go.')).toHaveValue('');
    expect(JSON.parse(localStorage.getItem(CANVAS_SESSION_KEY)!).brief.notes).toBe('Keep the yellow road\n  加一间咖啡馆 ☀️  ');
  });
  it('does not silently truncate a full direction or start a generation', async () => {
    const {posts}=installFetch(); mount(); await generateWorld();
    fireEvent.change(screen.getByLabelText('DIRECTION NOTES'),{target:{value:'x'.repeat(999)}});
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'),{target:{value:'More gardens'}});
    fireEvent.click(screen.getByRole('button',{name:'Generate physical concept'}));
    expect(screen.getByRole('status')).toHaveTextContent('This direction is full');
    expect(screen.getByLabelText('Tell the next image where to go.')).toHaveValue('More gardens');
    expect(posts).toHaveBeenCalledOnce();
  });
});


describe('Conversation draft boundaries', () => {
  it('preserves the pending refinement during same-version image refresh', async () => {
    const {posts}=installFetch(); mount(); await generateWorld();
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'),{target:{value:'Keep this unsent direction'}});
    fireEvent.error(screen.getByRole('img',{name:/illustrated brand world/}));
    fireEvent.click(screen.getByRole('button',{name:'Restore images again'}));
    await waitFor(()=>expect(posts).toHaveBeenCalledTimes(2));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Generate physical concept'})).toBeEnabled());
    expect(screen.getByLabelText('Tell the next image where to go.')).toHaveValue('Keep this unsent direction');
    expect(posted(posts,1)).toEqual({id:worldId});
  });
  it('opens and focuses element controls directly from the board', async () => {
    vi.stubGlobal('innerWidth',390); installFetch(); mount(); await generateWorld();
    fireEvent.click(screen.getByRole('button',{name:'Refine elements'}));
    await waitFor(()=>expect(screen.getByRole('region',{name:'Concept details'})).toHaveFocus());
    expect(document.querySelector('.oc-edit-details')).toHaveAttribute('open');
    expect(document.querySelectorAll('#canvas-business')).toHaveLength(1);
  });
  it('does not carry an unsent refinement into an imported branch', async () => {
    const incoming=savedDirection(); incoming.brief.business='A different business';
    const {posts}=installFetch(); mountBrowser(); await generateWorld();
    fireEvent.change(screen.getByLabelText('Tell the next image where to go.'),{target:{value:'Private idea from the first draft'}});
    await act(async()=>{window.history.pushState({},'', '/'+encodeCanvasShare(incoming));window.dispatchEvent(new PopStateEvent('popstate'));});
    fireEvent.click(screen.getByRole('button',{name:'Create my own version'}));
    await waitFor(()=>expect(screen.getByLabelText('WHAT SHOULD WE KNOW?')).toHaveValue('A different business'));
    await clickWorld(); await waitFor(()=>expect(posts).toHaveBeenCalledTimes(2));
    expect(posted(posts,1).context.business).toBe('A different business');
    expect(posted(posts,1).context.revisionNotes).not.toContain('Private idea from the first draft');
  });
});
