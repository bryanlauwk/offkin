import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter, Link, MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft, type CreationDraft } from '@/lib/creation-journey';
import { BRIEF_SESSION_KEY, encodeBriefHash, decodeBriefHash, saveBriefSession } from '@/lib/brief-handoff';
import Index from './LegacyConcept';

const settings = vi.hoisted(() => ({ title: 'form.' }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: async () => ({ data: [{ key: 'site_title', value: settings.title }] }) }) },
}));

const concept = {
  id: 'saved', edition: 'icon', format: 'miniature', brand: 'Acme', title: 'The Packing Ritual',
  story: 'From a customer order to a carefully packed gift.', image: '/generated.png',
  sourceUrl: 'https://company.com', sourceTitle: 'Company',
};
const sourceDetails = [
  'We pack personalised gifts by hand.',
  'Our service transforms a simple idea into a lasting keepsake.',
  'Our customers share their favourite memories with family.',
];
const evidence = {
  verified: true,
  website: { url: 'https://company.com/', title: 'Company home', excerpt: sourceDetails.join(' ') },
};
const capability = {
  ready: true, prompt_version: 'offkin-cocreation-v8',
  capabilities: { cocreation: true, context_max_chars: 6000, electronic_story_scene: true, summary_only: true },
};
const legacyCapability = {
  ready: true, prompt_version: 'dioramini-story-led-miniatures-v7',
  capabilities: { electronic_story_scene: true, summary_only: true },
};
const business = 'We personalise online gift orders, then pack and ship them.';
const hiddenDetail = 'We turn every ribbon twice so the recipient sees the knot first.';
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>(complete => { resolve = complete; });
  return { promise, resolve };
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request in test')));
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  settings.title = 'form.';
});
afterEach(async () => {
  await act(async () => {});
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

// Provider/retrieval assertions use a dedicated POST mock; capability GETs are
// stubbed separately and never consume queued generation responses.
function installFetch(posts: ReturnType<typeof vi.fn>, readiness: ReturnType<typeof vi.fn> = vi.fn(() => Promise.resolve(reply(capability)))) {
  const fetchMock = vi.fn((url: string, init: RequestInit = {}) => init.method === 'POST' ? posts(url, init) : readiness(url, init));
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, posts, readiness };
}
function mockPosts(...responses: (Response | Promise<Response>)[]) {
  const posts = vi.fn().mockRejectedValue(new Error('Unexpected POST in test'));
  responses.forEach(response => posts.mockImplementationOnce(() => Promise.resolve(response)));
  return posts;
}
function mount(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><Index /></MemoryRouter>);
}
function NavigationControls() {
  const navigate = useNavigate();
  return <nav aria-label="Test navigation">
    <button onClick={() => navigate(-1)}>Browser back</button>
    <button onClick={() => navigate(1)}>Browser forward</button>
    <Link to="/?fresh=1">New page</Link>
    <Link to="/?concept=newer">Another concept</Link>
  </nav>;
}
function mountBrowser(path = '/') {
  window.history.replaceState({}, '', path);
  return render(<BrowserRouter><NavigationControls /><Index /></BrowserRouter>);
}
function beginReading() {
  fireEvent.change(screen.getByLabelText('START WITH YOUR WEBSITE'), { target: { value: 'company.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Explore my business' }));
}
async function start() {
  beginReading();
  await screen.findByLabelText('In one line, what does the business do?');
}
function chooseStory() {
  fireEvent.change(screen.getByLabelText('In one line, what does the business do?'), { target: { value: business } });
  fireEvent.click(screen.getByRole('radio', { name: /The unseen ritual/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}
function addHiddenDetail() {
  fireEvent.change(screen.getByLabelText('The detail only you know'), { target: { value: hiddenDetail } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}
function answerToReview(wording = '', mode: CreationDraft['mode'] = 'mechanical') {
  chooseStory();
  addHiddenDetail();
  if (mode === 'electronic') fireEvent.click(screen.getByRole('button', { name: 'Electronic story scene (concept study)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Small diorama' }));
  fireEvent.click(screen.getByRole('button', { name: 'Playful & sculptural' }));
  fireEvent.click(screen.getByRole('button', { name: 'Customers & fans' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display only' }));
  fireEvent.change(screen.getByLabelText(/Exact wording/), { target: { value: wording } });
  fireEvent.click(screen.getByRole('button', { name: 'On the base' }));
  fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
}
async function readyToGenerate() {
  const button = screen.getByRole('button', { name: 'Generate my concept' });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}
async function generate() {
  const button = await readyToGenerate();
  await act(async () => { fireEvent.click(button); });
}
function storedDirection(overrides: Partial<CreationDraft> = {}): CreationDraft {
  return {
    ...emptyDraft, website: 'https://company.com', business, angle: 'ritual', hiddenDetail,
    audience: 'Customers & fans', wording: '  EXACT!\nKeep This.  ', placement: 'On the base',
    style: 'Playful & sculptural', interaction: 'Display only', ...overrides,
  };
}
function reviewValue(label: string) {
  return screen.getByRole('button', { name: `Edit ${label}` }).parentElement!.querySelector('dd')!.textContent;
}
function mockDownload() {
  const createObjectURL = vi.fn().mockReturnValue('blob:creative-brief');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createObjectURL;
    static revokeObjectURL = revokeObjectURL;
  });
  const clicks: HTMLAnchorElement[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clicks.push(this); });
  return { createObjectURL, revokeObjectURL, clicks };
}
async function readBlob(blob: Blob) {
  let contents = '';
  await act(async () => {
    contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  });
  return contents;
}
function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return writeText;
}

describe('Commercial co-creation entry', () => {
  it('opens with one website composer, the business-DNA headline and an explicit no-order path', async () => {
    mount();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByText('异趣伙伴')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
    expect(screen.getByText('ART × TECHNOLOGY × YOUR BRAND')).toBeInTheDocument();
    expect(screen.getByText('No account needed to shape a brief. No order is placed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start without a website/ })).toBeEnabled();
    expect(screen.queryByText(/hardware available|order your AI|STIVE|Rimba|AI credits|internal brief|agency/i)).not.toBeInTheDocument();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows the three chosen art boards instead of the previous generic SVG studies', async () => {
    const { container } = mount();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    const studies = screen.getByRole('group', { name: 'Explore observation studies' });
    expect(within(studies).getAllByRole('button')).toHaveLength(3);
    const boards = [['Airbnb', '/concept-worlds/airbnb-world.webp'], ['A24', '/concept-worlds/a24-world.webp'], ['Tesla', '/concept-worlds/tesla-world.webp']];
    for (const [brand, path] of boards) {
      fireEvent.click(within(studies).getByRole('button', { name: new RegExp(brand) }));
      expect(screen.getByRole('img', { name: new RegExp(`${brand}-inspired`) })).toHaveAttribute('src', path);
    }
    expect(container.querySelector('.concept-study')).toBeNull();
    expect(screen.getByText(/No affiliation, commission or endorsement/)).toBeInTheDocument();
    expect(screen.getByText(/Visual concepts, not available products/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('explains approval, physical prototyping and exploratory pricing on demand', async () => {
    mount();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    const toggle = screen.getByRole('button', { name: 'How it takes shape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/You approve the direction before AI creates/)).toHaveTextContent('outsource a few printed samples');
    expect(screen.getByText(/Exploring RM100–500 budgets/)).toHaveTextContent('not a quote or price guarantee');
    fireEvent.click(toggle);
    expect(screen.queryByText(/You approve the direction before AI creates/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves a custom studio title in the header and browser title', async () => {
    settings.title = 'My Studio';
    mount();
    await screen.findByRole('link', { name: 'My Studio home' });
    await waitFor(() => expect(document.title).toBe('My Studio — Your business DNA. Made collectible.'));
  });

  it.each(['DIORAMINI', 'BRIQ2.0', 'form.', 'STIVE'])('rebrands the legacy %s setting', async title => {
    settings.title = title;
    await act(async () => { mount(); });
    expect(screen.getByRole('link', { name: 'OFFKIN home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: `${title} home` })).not.toBeInTheDocument();
    expect(document.title).toBe('OFFKIN｜异趣伙伴 — Your business DNA. Made collectible.');
  });

  it('retires old sample URL parameters without selecting or generating a client concept', async () => {
    mount('/?brand=stive');
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    await screen.findByRole('link', { name: 'OFFKIN home' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Editable customer direction', () => {
  it('shows three editorial lenses with attributable public-source evidence', async () => {
    const posts = mockPosts(reply(evidence));
    const { readiness } = installFetch(posts);
    mount();
    await start();
    expect(JSON.parse(posts.mock.calls[0][1].body)).toEqual({ brand: 'https://company.com', inspectWebsite: true });
    expect(screen.getByText('Text from Company home')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open public source/ })).toHaveAttribute('href', evidence.website.url);
    expect(screen.getByText(/editorial prompts to explore, not AI findings or verified claims/)).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    ['The unseen ritual', 'The turning point', 'The human trace'].forEach((title, index) => {
      expect(radios[index]).toHaveAccessibleName(expect.stringContaining(title));
      expect(radios[index]).toHaveAccessibleName(expect.stringContaining(`Source detail: “${sourceDetails[index]}”`));
      expect(radios[index]).not.toBeChecked();
    });
    expect(posts).toHaveBeenCalledTimes(1);
    expect(readiness).not.toHaveBeenCalled();
  });

  it('requires a chosen lens, factual business description and inside detail', async () => {
    const posts = mockPosts(reply(evidence)); installFetch(posts);
    mount(); await start();
    fireEvent.submit(screen.getByLabelText('In one line, what does the business do?').closest('form')!);
    expect(screen.getByText('Choose the story you’d like to explore.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /The unseen ritual/ }));
    fireEvent.submit(screen.getByLabelText('In one line, what does the business do?').closest('form')!);
    expect(screen.getByText('Add a short, factual description of the business.')).toBeInTheDocument();
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveAttribute('maxlength', '500');
    chooseStory();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What do customers not know that you do every day?');
    fireEvent.submit(screen.getByLabelText('The detail only you know').closest('form')!);
    expect(screen.getByText('Add one everyday detail. It can be small.')).toBeInTheDocument();
    expect(screen.getByLabelText('The detail only you know')).toHaveAttribute('maxlength', '500');
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('sends exact wording, story choices and rich fields only after explicit generation and v8 preflight', async () => {
    const posts = mockPosts(reply(evidence), reply({ concept }));
    const { readiness } = installFetch(posts);
    mount(); await start();
    const wording = '  Made for YOU!\nSince 2020  ';
    answerToReview(wording);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Scale' }));
    fireEvent.change(screen.getByLabelText('Scale or display setting'), { target: { value: 'A reception-desk centrepiece' } });
    fireEvent.change(screen.getByLabelText(/Recognisable brand details/), { target: { value: 'Coral ribbon, curved box, pale paper' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    await readyToGenerate();
    expect(reviewValue('Exact wording')).toBe(wording);
    expect(reviewValue('Scale')).toBe('A reception-desk centrepiece');
    expect(reviewValue('Brand details')).toBe('Coral ribbon, curved box, pale paper');
    expect(posts).toHaveBeenCalledTimes(1);
    const readinessBefore = readiness.mock.calls.length;
    await generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(posts).toHaveBeenCalledTimes(2);
    expect(readiness).toHaveBeenCalledTimes(readinessBefore + 1);
    const payload = JSON.parse(posts.mock.calls[1][1].body);
    expect(payload).toMatchObject({ brand: 'https://company.com', summaryOnly: false, edition: 'icon', format: 'miniature', contractVersion: 'offkin-cocreation-v8' });
    expect(JSON.parse(payload.context)).toEqual({
      mode: 'mechanical', business, angle: 'The unseen ritual', hiddenDetail,
      item: 'Small diorama', audience: 'Customers & fans', exactWording: wording,
      placement: 'On the base', style: 'Playful & sculptural', interaction: 'Display only',
      scale: 'A reception-desk centrepiece', brandIdentifiers: 'Coral ribbon, curved box, pale paper',
    });
    expect(screen.getByRole('heading', { name: 'Why this represents your business' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Take this toward a prototype' })).toBeInTheDocument();
    expect(screen.getByText(/render doesn’t establish manufacturing readiness/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('dioramini:direction:saved')!)).toMatchObject({ wording, hiddenDetail, angle: 'ritual' });
    expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    expect(posts).toHaveBeenCalledTimes(2);
  });

  it.each(['A meaningful click', 'Turn to reveal', 'Slide to discover'])('maps %s to the interactive edition without changing its chosen action', async interaction => {
    const posts = mockPosts(reply(evidence), reply({ concept: { ...concept, edition: 'inside' } })); installFetch(posts);
    mount(); await start(); chooseStory(); addHiddenDetail();
    fireEvent.click(screen.getByRole('button', { name: interaction }));
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    await generate(); await screen.findByRole('heading', { name: concept.title });
    const payload = JSON.parse(posts.mock.calls[1][1].body);
    expect(payload.edition).toBe('inside');
    expect(JSON.parse(payload.context).interaction).toBe(interaction);
  });

  it('edits every kind of answer without any generation request or rereading the website', async () => {
    const posts = mockPosts(reply(evidence)); installFetch(posts);
    mount(); await start(); answerToReview('Keep EXACT');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exact wording' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('Keep EXACT');
    fireEvent.click(screen.getByRole('button', { name: 'Scene in a frame' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cinematic & atmospheric' }));
    fireEvent.click(screen.getByRole('button', { name: 'Your team' }));
    fireEvent.click(screen.getByRole('button', { name: 'Slide to discover' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    expect(reviewValue('Object & audience')).toBe('Scene in a frame · Your team');
    expect(reviewValue('Look & action')).toBe('Cinematic & atmospheric · Slide to discover');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Hidden detail' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(hiddenDetail);
    fireEvent.change(screen.getByLabelText('The detail only you know'), { target: { value: 'We tuck a handwritten note under each ribbon.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    expect(reviewValue('Hidden detail')).toBe('We tuck a handwritten note under each ribbon.');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Story lens' }));
    fireEvent.click(screen.getByRole('radio', { name: /The human trace/ }));
    fireEvent.change(screen.getByLabelText('In one line, what does the business do?'), { target: { value: 'We wrap keepsakes with handwritten stories.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('What small moment would your people recognise instantly?', { selector: '.direction-callout p' })).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('uses transparent summary-only fallback when the backend supports it', async () => {
    const posts = mockPosts(reply({ error: 'Insecure redirect' }, 400), reply({ concept })); installFetch(posts);
    mount(); await start();
    expect(screen.getByText(/We couldn’t read enough from this website/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open public source/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('In one line, what does the business do?'), { target: { value: business } });
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toHaveAccessibleName(expect.stringContaining(`Your description: “${business}”`));
    answerToReview(); await generate(); await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(posts.mock.calls[1][1].body).summaryOnly).toBe(true);
  });

  it('can finish a no-website brief without any website inspection request', async () => {
    const posts = mockPosts(reply({ concept })); const { readiness } = installFetch(posts);
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Start without a website/ }));
    expect(posts).not.toHaveBeenCalled();
    answerToReview('From our team'); await readyToGenerate();
    expect(posts).not.toHaveBeenCalled(); expect(readiness).toHaveBeenCalledTimes(1);
    await generate(); await screen.findByRole('heading', { name: concept.title });
    expect(posts).toHaveBeenCalledTimes(1);
    expect(JSON.parse(posts.mock.calls[0][1].body)).toMatchObject({ brand: 'no-website', summaryOnly: true, contractVersion: 'offkin-cocreation-v8' });
  });

  it('does not invent source evidence from an unverified website response', async () => {
    installFetch(mockPosts(reply({ ...evidence, verified: false })));
    mount(); await start();
    expect(screen.getByText(/We couldn’t read enough/)).toBeInTheDocument();
    expect(screen.queryByText('Text from Company home')).not.toBeInTheDocument();
    expect(screen.queryByText(/Source detail:/)).not.toBeInTheDocument();
  });

  it('does not promise unsafe-address fallback on an older deployment', async () => {
    const posts = mockPosts(reply({ error: 'Insecure redirect' }, 400));
    const { readiness } = installFetch(posts, vi.fn().mockResolvedValue(reply({ ready: true })));
    mount(); beginReading();
    await screen.findByText('We couldn’t use that address. Try your public HTTPS homepage.');
    expect(screen.queryByLabelText('In one line, what does the business do?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toBeEnabled();
    expect(posts).toHaveBeenCalledTimes(1); expect(readiness).toHaveBeenCalledTimes(1);
  });
});

describe('Co-creation contract and electronic capability gating', () => {
  it.each([
    ['the live v7 deployment', legacyCapability, 200],
    ['an unspecified deployment', { ready: true }, 200],
    ['missing co-creation capability', { ...capability, capabilities: { context_max_chars: 6000 } }, 200],
    ['a smaller context limit', { ...capability, capabilities: { ...capability.capabilities, context_max_chars: 600 } }, 200],
    ['a mismatched prompt version', { ...capability, prompt_version: 'future-v9' }, 200],
    ['an unready backend', { ...capability, ready: false }, 200],
    ['a failed response', capability, 503],
  ])('keeps %s in brief-only mode and never sends a generation POST', async (_description, response, status) => {
    const posts = mockPosts(reply(evidence));
    const { readiness } = installFetch(posts, vi.fn(() => Promise.resolve(reply(response, status))));
    mount(); await start(); answerToReview('KEEP exactly!');
    await screen.findByText(/The updated image service is not available yet/);
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Generate my concept' }));
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Review & share a copy' })).toBeEnabled();
    expect(posts).toHaveBeenCalledTimes(1); expect(readiness).toHaveBeenCalledTimes(1);
    expect(readiness.mock.calls[0][0]).toBe('https://test.invalid/functions/v1/generate-concept');
    expect(readiness.mock.calls[0][1].body).toBeUndefined();
  });

  it('fails closed when readiness rejects', async () => {
    const posts = mockPosts(reply(evidence)); installFetch(posts, vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    mount(); await start(); answerToReview();
    await screen.findByText(/The updated image service is not available yet/);
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('rechecks the contract before generation and prevents POST if the endpoint rolls back to v7', async () => {
    const posts = mockPosts(reply(evidence));
    const readiness = vi.fn().mockResolvedValueOnce(reply(capability)).mockResolvedValueOnce(reply(legacyCapability));
    installFetch(posts, readiness);
    mount(); await start(); answerToReview('  Never truncate this  '); await generate();
    await screen.findByText(/We couldn’t finish your concept|not available yet/);
    expect(posts).toHaveBeenCalledTimes(1); expect(readiness).toHaveBeenCalledTimes(2);
    expect(reviewValue('Exact wording')).toBe('  Never truncate this  ');
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
  });

  it('keeps electronic study brief-only when its additional capability is missing', async () => {
    const posts = mockPosts(reply(evidence));
    installFetch(posts, vi.fn(() => Promise.resolve(reply({ ...capability, capabilities: { ...capability.capabilities, electronic_story_scene: false } }))));
    mount(); await start(); answerToReview('Exact', 'electronic');
    await screen.findByText(/The updated image service is not available yet/);
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('waits for explicit compatible electronic generation and preserves a display-only action', async () => {
    const pending = deferredResponse();
    const posts = mockPosts(reply(evidence), reply({ concept: { ...concept, edition: 'inside' } }));
    const readiness = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(reply(capability));
    installFetch(posts, readiness);
    mount(); await start(); answerToReview('  This stays!\nEXACT  ', 'electronic');
    expect(screen.getByText('Checking the updated image service…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
    expect(posts).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(reply(capability)); });
    const button = await readyToGenerate();
    await act(async () => { fireEvent.click(button); fireEvent.click(button); });
    await screen.findByRole('heading', { name: concept.title });
    expect(posts).toHaveBeenCalledTimes(2); expect(readiness).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(posts.mock.calls[1][1].body);
    expect(payload).toMatchObject({ edition: 'inside', format: 'miniature', contractVersion: 'offkin-cocreation-v8' });
    expect(JSON.parse(payload.context)).toMatchObject({ mode: 'electronic', exactWording: '  This stays!\nEXACT  ', interaction: 'Display only' });
  });

  it('times out a hanging readiness check and ignores a late compatible response', async () => {
    const pending = deferredResponse(); const posts = mockPosts(reply(evidence));
    const readiness = vi.fn().mockReturnValueOnce(pending.promise); installFetch(posts, readiness);
    mount(); await start(); vi.useFakeTimers(); answerToReview('  Keep after timeout  ');
    expect(screen.getByText('Checking the updated image service…')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(10001); });
    expect(readiness.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.getByText(/The updated image service is not available yet/)).toBeInTheDocument();
    await act(async () => { pending.resolve(reply(capability)); });
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    expect(reviewValue('Exact wording')).toBe('  Keep after timeout  ');
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('aborts checks on Back and ignores an old success while a newer check is pending', async () => {
    const stale = deferredResponse(); const current = deferredResponse(); const posts = mockPosts(reply(evidence));
    const readiness = vi.fn().mockReturnValueOnce(stale.promise).mockReturnValueOnce(current.promise); installFetch(posts, readiness);
    mount(); await start(); answerToReview('  Still here!  ');
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(readiness.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('  Still here!  ');
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    await act(async () => { stale.resolve(reply(capability)); });
    expect(screen.getByText('Checking the updated image service…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    await act(async () => { current.resolve(reply(legacyCapability)); });
    expect(screen.getByText(/The updated image service is not available yet/)).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1); expect(readiness).toHaveBeenCalledTimes(2);
  });

  it('preserves the action when switching modes and aborts stale capability checks', async () => {
    const stale = deferredResponse(); const posts = mockPosts(reply(evidence), reply({ concept }));
    const readiness = vi.fn().mockReturnValueOnce(stale.promise).mockImplementation(() => Promise.resolve(reply(capability))); installFetch(posts, readiness);
    mount(); await start(); answerToReview('Retain my words', 'electronic');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Direction' }));
    expect(readiness.mock.calls[0][1].signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Physical story object' }));
    expect(screen.getByRole('button', { name: 'Display only' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    await act(async () => { stale.resolve(reply(legacyCapability)); });
    await generate(); await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(JSON.parse(posts.mock.calls[1][1].body).context)).toMatchObject({ mode: 'mechanical', interaction: 'Display only', exactWording: 'Retain my words' });
  });

  it('aborts a capability check on navigation and ignores its late success', async () => {
    const stale = deferredResponse(); const otherConcept = { ...concept, id: 'newer', title: 'The Newer Direction' };
    const posts = mockPosts(reply(evidence), reply({ concept: otherConcept }));
    const readiness = vi.fn().mockReturnValueOnce(stale.promise); installFetch(posts, readiness);
    mountBrowser(); await start(); answerToReview();
    fireEvent.click(screen.getByRole('link', { name: 'Another concept' }));
    await screen.findByRole('heading', { name: otherConcept.title });
    expect(readiness.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { stale.resolve(reply(capability)); });
    expect(screen.getByRole('heading', { name: otherConcept.title })).toBeInTheDocument();
    expect(window.location.search).toBe('?concept=newer');
    expect(posts).toHaveBeenCalledTimes(2);
    expect(JSON.parse(posts.mock.calls[1][1].body)).toEqual({ id: 'newer' });
  });
});
describe('Interrupted requests and browser navigation', () => {
  it('blocks duplicate generation, cancels the active request and keeps the complete direction for retry', async () => {
    const pending = deferredResponse();
    const fetchMock = mockPosts(reply(evidence), pending.promise);
    installFetch(fetchMock);
    mount();
    await start();
    answerToReview('Keep me');
    const button = await readyToGenerate();
    await act(async () => { fireEvent.click(button); fireEvent.click(button); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Creating your concept' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeEnabled();
    expect(screen.getByText(/Your answers are still here/)).toBeInTheDocument();
    expect(screen.getAllByText(hiddenDetail).length).toBeGreaterThan(0);
    await act(async () => { pending.resolve(reply({ concept })); });
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
  });

  it('keeps answers when generation fails and retries the same direction', async () => {
    const fetchMock = mockPosts(reply(evidence), reply({}, 503), reply({ concept }));
    installFetch(fetchMock);
    mount();
    await start();
    answerToReview('Keep me');
    await generate();
    await screen.findByText(/We couldn’t finish your concept/);
    expect(screen.getByText('Keep me')).toBeInTheDocument();
    expect(screen.getAllByText(hiddenDetail).length).toBeGreaterThan(0);
    await generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(fetchMock.mock.calls[2][1].body).toBe(fetchMock.mock.calls[1][1].body);
  });

  it('ignores a cancelled generation response after a retry succeeds', async () => {
    const stale = deferredResponse();
    const fetchMock = mockPosts(reply(evidence), stale.promise, reply({ concept }));
    installFetch(fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    await generate();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    await generate();
    await screen.findByRole('heading', { name: concept.title });
    await act(async () => { stale.resolve(reply({ concept: { ...concept, id: 'late', title: 'Late result' } })); });
    expect(screen.queryByRole('heading', { name: 'Late result' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: concept.title })).toBeInTheDocument();
    expect(window.location.search).toBe('?concept=saved');
    expect(localStorage.getItem('dioramini:direction:late')).toBeNull();
  });

  it('does not accept a generation response after its deadline', async () => {
    const pending = deferredResponse();
    const fetchMock = mockPosts(reply(evidence), pending.promise);
    installFetch(fetchMock);
    mount();
    await start();
    answerToReview();
    await readyToGenerate();
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Generate my concept' })); });
    await act(async () => {
      vi.advanceTimersByTime(220001);
      pending.resolve(reply({ concept }));
    });
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
    expect(screen.getByText(/taking longer than expected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeEnabled();
  });

  it('stops reading and ignores a late inspection response after URL navigation', async () => {
    const pending = deferredResponse();
    const fetchMock = vi.fn().mockReturnValue(pending.promise);
    installFetch(fetchMock);
    mountBrowser();
    beginReading();
    fireEvent.click(screen.getByRole('link', { name: 'New page' }));
    await act(async () => { pending.resolve(reply(evidence)); });
    expect(window.location.search).toBe('?fresh=1');
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.getByRole('button', { name: 'Explore my business' })).toBeEnabled();
    expect(screen.queryByLabelText('In one line, what does the business do?')).not.toBeInTheDocument();
  });

  it('cancels generation when navigating to another shared concept and ignores its late result', async () => {
    const pending = deferredResponse();
    const otherConcept = { ...concept, id: 'newer', title: 'The Newer Direction' };
    const fetchMock = mockPosts(reply(evidence), pending.promise).mockResolvedValueOnce(reply({ concept: otherConcept }));
    installFetch(fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    await generate();
    fireEvent.click(screen.getByRole('link', { name: 'Another concept' }));
    await screen.findByRole('heading', { name: otherConcept.title });
    await act(async () => { pending.resolve(reply({ concept })); });
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
    expect(window.location.search).toBe('?concept=newer');
    expect(localStorage.getItem('dioramini:direction:saved')).toBeNull();
  });

  it('puts the generated concept in the URL and supports browser back and forward without regeneration', async () => {
    const fetchMock = mockPosts(reply(evidence), reply({ concept }));
    installFetch(fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    await generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(window.location.search).toBe('?concept=saved');
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    await screen.findByLabelText('START WITH YOUR WEBSITE');
    expect(window.location.search).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Browser forward' }));
    await screen.findByRole('heading', { name: concept.title });
    expect(window.location.search).toBe('?concept=saved');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('Reloading and refining saved concepts', () => {
  it('restores a shared concept and retries failed retrieval without generation', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({ concept }));
    installFetch(fetchMock);
    mountBrowser('/?concept=saved');
    fireEvent.click(await screen.findByRole('button', { name: 'Try loading again' }));
    await screen.findByRole('heading', { name: concept.title });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mock.calls.forEach(call => expect(JSON.parse(call[1].body)).toEqual({ id: 'saved' }));
    fireEvent.click(screen.getByRole('button', { name: '← Start a new story' }));
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(window.location.search).toBe('');
  });

  it.each(['mechanical', 'electronic'] as const)('restores every saved %s detail, including exact lettering, when refining after reload', async mode => {
    const direction = storedDirection({ mode });
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(direction));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    installFetch(fetchMock);
    mount('/?concept=saved');
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(direction.business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(direction.hiddenDetail);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
    expect(screen.getByLabelText('Audience')).toHaveValue(direction.audience);
    expect(screen.getByRole('button', { name: mode === 'electronic' ? 'Electronic story scene (concept study)' : 'Physical story object' })).toHaveAttribute('aria-pressed', 'true');
    [direction.item, direction.placement, direction.style, direction.interaction].forEach(name => {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
    });
    fireEvent.click(screen.getByRole('button', { name: '← Back to your concept' }));
    expect(screen.getByRole('heading', { name: concept.title })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loads a legacy saved direction without losing its wording and asks for the new story details', async () => {
    const { angle: _angle, hiddenDetail: _hiddenDetail, mode: _mode, ...legacy } = storedDirection();
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(legacy));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    installFetch(fetchMock);
    mount('/?concept=saved');
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(legacy.business);
    screen.getAllByRole('radio').forEach(radio => expect(radio).not.toBeChecked());
    fireEvent.click(screen.getByRole('radio', { name: /The turning point/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue('');
    addHiddenDetail();
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(legacy.wording);
    expect(screen.getByRole('button', { name: 'Physical story object' })).toHaveAttribute('aria-pressed', 'true');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('restores a loaded concept’s saved direction after Start new and browser Back', async () => {
    const direction = storedDirection();
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(direction));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    installFetch(fetchMock);
    mountBrowser('/?concept=saved');
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: '← Start a new story' }));
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.queryByText(/earlier design details aren’t saved/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(direction.business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(direction.hiddenDetail);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('retains newly generated answers when storage is unavailable, including browser Back: %s', async viaBack => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage quota exceeded'); });
    const fetchMock = mockPosts(reply(evidence), reply({ concept }));
    installFetch(fetchMock);
    mountBrowser();
    await start();
    const wording = '  KEEP!  ';
    answerToReview(wording);
    await generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(localStorage.getItem('dioramini:direction:saved')).toBeNull();
    if (viaBack) {
      fireEvent.click(screen.getByRole('button', { name: '← Start a new story' }));
      expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
      fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
      await screen.findByRole('heading', { name: concept.title });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.queryByText(/earlier design details aren’t saved/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(hiddenDetail);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(wording);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('asks for original details when a shared concept has no local direction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ concept })));
    mount('/?concept=saved');
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.getByText(/earlier design details aren’t saved/)).toBeInTheDocument();
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue('');
    screen.getAllByRole('radio').forEach(radio => expect(radio).not.toBeChecked());
  });
});


describe('Download and privacy-reviewed brief copies', () => {
  it.each(['mechanical', 'electronic'] as const)('downloads the entire %s brief with exact wording without a generation POST', async mode => {
    const posts = mockPosts(reply(evidence)); installFetch(posts, vi.fn(() => Promise.resolve(reply(legacyCapability))));
    const { createObjectURL, revokeObjectURL, clicks } = mockDownload();
    mount(); await start();
    const wording = '  KEEP this™!\nExactly.  ';
    answerToReview(wording, mode);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Brand details' }));
    fireEvent.change(screen.getByLabelText('Scale or display setting'), { target: { value: 'A shelf in our workshop' } });
    fireEvent.change(screen.getByLabelText(/Recognisable brand details/), { target: { value: 'A yellow ribbon and coral arch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download creative brief' }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob: Blob = createObjectURL.mock.calls[0][0];
    const text = await readBlob(blob);
    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(text).toContain(`Business: ${business}`);
    expect(text).toContain(`Hidden detail: ${hiddenDetail}`);
    expect(text).toContain('Story lens: The unseen ritual');
    expect(text).toContain(`Exact wording: ${JSON.stringify(wording)}`);
    expect(text).toContain('Wording placement: On the base');
    expect(text).toContain('Scale: A shelf in our workshop');
    expect(text).toContain('Brand identifiers: A yellow ribbon and coral arch');
    expect(text).toContain('Preferred interaction: Display only');
    expect(text).toContain('Not a tested product, quotation or order');
    if (mode === 'electronic') { expect(text).toContain('ESP32-class controller'); expect(text).toContain('No Muse integration is assumed'); }
    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('offkin-creative-direction.txt');
    expect(clicks[0].href).toBe('blob:creative-brief');
    expect(screen.getByText(/Your brief has been downloaded/)).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('dioramini:direction:saved')).toBeNull();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:creative-brief'), { timeout: 1500 });
  });

  it('exports and submits full supported field lengths without the legacy 600-character truncation', async () => {
    const direction = storedDirection({
      business: 'B'.repeat(500), hiddenDetail: 'D'.repeat(500), audience: 'A'.repeat(100),
      wording: `  ${'X'.repeat(194)}\n!  `, scale: 'S'.repeat(120), brandIdentifiers: 'I'.repeat(300),
    });
    saveBriefSession({ draft: direction, step: 3, started: true });
    const posts = mockPosts(reply({ concept })); installFetch(posts);
    const { createObjectURL, revokeObjectURL } = mockDownload();
    mount(); fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(reviewValue('Exact wording')).toBe(direction.wording);
    fireEvent.click(screen.getByRole('button', { name: 'Download creative brief' }));
    const text = await readBlob(createObjectURL.mock.calls[0][0]);
    expect(text).toContain(`Business: ${direction.business}`);
    expect(text).toContain(`Hidden detail: ${direction.hiddenDetail}`);
    expect(text).toContain(`Exact wording: ${JSON.stringify(direction.wording)}`);
    expect(posts).not.toHaveBeenCalled();
    await generate(); await screen.findByRole('heading', { name: concept.title });
    expect(posts).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(posts.mock.calls[0][1].body);
    expect(payload.context.length).toBeGreaterThan(600);
    expect(payload.context.length).toBeLessThanOrEqual(6000);
    expect(JSON.parse(payload.context)).toMatchObject({ business: direction.business, hiddenDetail: direction.hiddenDetail, exactWording: direction.wording, scale: direction.scale, brandIdentifiers: direction.brandIdentifiers });
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:creative-brief'), { timeout: 1500 });
  });

  it('reviews all private details and copies only after the explicit share confirmation', async () => {
    const writeText = mockClipboard(); const posts = mockPosts(reply(evidence)); installFetch(posts);
    mount(); await start(); answerToReview('  Private draft\nExact!  ');
    fireEvent.click(screen.getByRole('button', { name: 'Review & share a copy' }));
    const dialog = screen.getByRole('dialog', { name: 'Review before sharing' });
    expect(dialog).toHaveTextContent('including your website and inside detail');
    expect(dialog).toHaveTextContent('Anyone with it can read or remix the copy');
    expect(dialog).toHaveTextContent('no live collaboration or access control');
    const brief = dialog.querySelector('pre')!.textContent;
    expect(brief).toContain(`Business: ${business}`);
    expect(brief).toContain(`Hidden detail: ${hiddenDetail}`);
    expect(brief).toContain('Exact wording: "  Private draft\\nExact!  "');
    expect(writeText).not.toHaveBeenCalled(); expect(posts).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy link with these details' }));
    await screen.findByText(/Brief link copied/);
    expect(writeText).toHaveBeenCalledTimes(1);
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.search).toBe('');
    expect(url.origin).toBe(window.location.origin);
    expect(decodeBriefHash(url.hash)).toMatchObject({ business, hiddenDetail, wording: '  Private draft\nExact!  ' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it.each(['Keep editing', 'Close'])('dismisses share review with %s without copying or losing the brief', async close => {
    const writeText = mockClipboard(); const posts = mockPosts(reply(evidence)); installFetch(posts);
    mount(); await start(); answerToReview('Keep this exact');
    const share = screen.getByRole('button', { name: 'Review & share a copy' });
    fireEvent.click(share);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: close }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
    expect(reviewValue('Exact wording')).toBe('Keep this exact');
    fireEvent.click(share);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keep editing' }));
    expect(writeText).not.toHaveBeenCalled(); expect(posts).toHaveBeenCalledTimes(1);
  });

  it('keeps a failed clipboard copy reviewable and offers a download', async () => {
    const writeText = mockClipboard().mockRejectedValue(new Error('Clipboard permission denied'));
    const posts = mockPosts(reply(evidence)); installFetch(posts);
    mount(); await start(); answerToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Review & share a copy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy link with these details' }));
    await screen.findByText('The link could not be copied. Download the brief instead.');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('button', { name: 'Download creative brief' })).toBeEnabled();
    expect(posts).toHaveBeenCalledTimes(1);
  });
});

describe('Explicit shared-brief import and device-local resume', () => {
  it('shows an import review, then restores editable answers without automatically fetching or generating', async () => {
    const direction = storedDirection({ scale: 'Lobby shelf', brandIdentifiers: 'Our coral arch' });
    mountBrowser(`/${encodeBriefHash(direction)}`);
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull(); expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Review shared brief/ }));
    const dialog = screen.getByRole('dialog', { name: 'Review this shared direction' });
    expect(dialog).toHaveTextContent('Importing won’t contact its website or generate an image');
    expect(dialog.querySelector('pre')!.textContent).toContain(`Exact wording: ${JSON.stringify(direction.wording)}`);
    expect(fetch).not.toHaveBeenCalled(); expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Use as my starting point' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(direction.business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    expect(window.location.hash).toBe('');
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(direction.hiddenDetail);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
    expect(screen.getByLabelText('Scale or display setting')).toHaveValue(direction.scale);
    expect(screen.getByLabelText(/Recognisable brand details/)).toHaveValue(direction.brandIdentifiers);
    expect(JSON.parse(localStorage.getItem(BRIEF_SESSION_KEY)!).draft.summaryOnly).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('closing import review leaves the homepage untouched and permits a fresh review', async () => {
    mountBrowser(`/${encodeBriefHash(storedDirection())}`);
    const review = screen.getByRole('button', { name: /Review shared brief/ });
    fireEvent.click(review); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull();
    fireEvent.click(review); expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    '#offkin-brief=not-json',
    `#offkin-brief=${'A'.repeat(17000)}`,
    `#offkin-brief=${btoa(JSON.stringify({ version: 99, draft: {} }))}`,
    `#offkin-brief=${btoa(JSON.stringify({ version: 1, draft: { ...storedDirection(), injectedInstruction: 'fetch a website' } })).replace(/=/g, '')}`,
    `#offkin-brief=${btoa(JSON.stringify({ version: 1, draft: { ...storedDirection(), mode: 'unbounded' } })).replace(/=/g, '')}`,
  ])('rejects malformed, oversized or unsupported shared data without side effects (%#)', async hash => {
    mountBrowser(`/${hash}`);
    await screen.findByRole('link', { name: 'OFFKIN home' });
    expect(screen.queryByRole('button', { name: /Review shared brief/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });

  it('renders imported markup as literal review text without executing or contacting the source', () => {
    const direction = storedDirection({ hiddenDetail: '<img src="https://untrusted.invalid/pixel" onerror="alert(1)">', wording: '<script>fetch("/leak")</script>' });
    mountBrowser(`/${encodeBriefHash(direction)}`);
    fireEvent.click(screen.getByRole('button', { name: /Review shared brief/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('pre')!.textContent).toContain(direction.hiddenDetail);
    expect(dialog.querySelector('img, script')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('saves progress locally and resumes the last step only on request without rereading its site', async () => {
    const posts = mockPosts(reply(evidence)); const { readiness } = installFetch(posts);
    const first = mount(); await start(); chooseStory(); addHiddenDetail();
    fireEvent.change(screen.getByLabelText(/Exact wording/), { target: { value: '  Save ME!\nPrecisely  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bold & graphic' }));
    const saved = JSON.parse(localStorage.getItem(BRIEF_SESSION_KEY)!);
    expect(saved).toMatchObject({ version: 1, step: 2, started: true, draft: { business, hiddenDetail, wording: '  Save ME!\nPrecisely  ', style: 'Bold & graphic' } });
    first.unmount(); mount();
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Resume my brief/ })).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('  Save ME!\nPrecisely  ');
    expect(screen.getByRole('button', { name: 'Bold & graphic' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Website evidence is not re-fetched automatically/)).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1); expect(readiness).not.toHaveBeenCalled();
  });

  it('rechecks current readiness when resuming review and never resumes generation automatically', async () => {
    saveBriefSession({ draft: storedDirection({ mode: 'electronic' }), step: 3, started: true });
    const posts = mockPosts(); const { readiness } = installFetch(posts, vi.fn(() => Promise.resolve(reply(legacyCapability))));
    mount(); expect(readiness).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    await screen.findByText(/The updated image service is not available yet/);
    expect(reviewValue('Direction')).toBe('Electronic story scene (concept study)');
    expect(reviewValue('Exact wording')).toBe(storedDirection().wording);
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeDisabled();
    expect(posts).not.toHaveBeenCalled(); expect(readiness).toHaveBeenCalledTimes(1);
  });

  it('disables resume and import while reading and ignores the late read after cancellation', async () => {
    const direction = storedDirection(); saveBriefSession({ draft: direction, step: 2, started: true });
    const pending = deferredResponse(); const posts = mockPosts(pending.promise); installFetch(posts);
    mountBrowser(`/${encodeBriefHash(direction)}`); beginReading();
    expect(screen.getByRole('button', { name: /Resume my brief/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Review shared brief/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(screen.queryByLabelText(/Exact wording/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    expect(posts.mock.calls[0][1].signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
    await act(async () => { pending.resolve(reply(evidence)); });
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
    expect(screen.queryByText('Text from Company home')).not.toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('warns about unavailable storage while retaining editable progress and downloads', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage quota exceeded'); });
    const posts = mockPosts(reply(evidence)); installFetch(posts);
    const { createObjectURL, revokeObjectURL } = mockDownload();
    mount(); await start(); answerToReview('  Not lost  ');
    expect(screen.getByText(/This browser could not save your progress/)).toBeInTheDocument();
    expect(reviewValue('Exact wording')).toBe('  Not lost  ');
    fireEvent.click(screen.getByRole('button', { name: 'Download creative brief' }));
    expect(await readBlob(createObjectURL.mock.calls[0][0])).toContain('Exact wording: "  Not lost  "');
    expect(posts).toHaveBeenCalledTimes(1); expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:creative-brief'), { timeout: 1500 });
  });

  it('handles unreadable local storage without breaking the entry or import', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    mountBrowser(`/${encodeBriefHash(storedDirection())}`);
    expect(screen.queryByRole('button', { name: /Resume my brief/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Review shared brief/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Use as my starting point' }));
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(business);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Result handoff and repeated header navigation', () => {
  it('shares only the selected concept ID, stripping private brief hashes and unrelated query data', async () => {
    const writeText = mockClipboard(); const posts = mockPosts(reply({ concept })); installFetch(posts);
    mountBrowser(`/?concept=saved&private=do-not-share${encodeBriefHash(storedDirection())}`);
    await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Share concept' }));
    await screen.findByText(/Link copied. Anyone with this link can view the concept/);
    expect(writeText).toHaveBeenCalledTimes(1);
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.search).toBe('?concept=saved'); expect(url.hash).toBe('');
    expect(url.origin).toBe(window.location.origin);
    expect(writeText.mock.calls[0][0]).not.toContain('offkin-brief');
    expect(writeText.mock.calls[0][0]).not.toContain('private');
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('downloads saved rich direction and exact wording from a generated result', async () => {
    const direction = storedDirection({ scale: 'Across a reception shelf', brandIdentifiers: 'The coral arch', interaction: 'Slide to discover' });
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(direction));
    const posts = mockPosts(reply({ concept })); installFetch(posts);
    const { createObjectURL, revokeObjectURL, clicks } = mockDownload();
    mount('/?concept=saved'); await screen.findByRole('heading', { name: concept.title });
    fireEvent.click(screen.getByRole('button', { name: 'Save concept brief' }));
    const text = await readBlob(createObjectURL.mock.calls[0][0]);
    expect(text).toContain(concept.title); expect(text).toContain(concept.story);
    expect(text).toContain(`Exact wording: ${JSON.stringify(direction.wording)}`);
    expect(text).toContain('Scale: Across a reception shelf');
    expect(text).toContain('Brand identifiers: The coral arch');
    expect(text).toContain('Preferred interaction: Slide to discover');
    expect(text).toContain('does not place an order');
    expect(clicks[0].download).toBe('saved-concept-brief.txt');
    expect(posts).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:creative-brief'), { timeout: 1500 });
  });

  it('retains download and refinement when the generated image fails', async () => {
    installFetch(mockPosts(reply({ concept })));
    mount('/?concept=saved'); await screen.findByRole('heading', { name: concept.title });
    fireEvent.error(screen.getByRole('img', { name: /a brand-world design concept/ }));
    expect(screen.getByText(/The image couldn’t load/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save concept brief' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Refine this direction' })).toBeEnabled();
    expect(screen.getByText(concept.story)).toBeInTheDocument();
  });

  it('uses the header CTA to return home repeatedly while preserving unfinished local answers', async () => {
    const posts = mockPosts(reply(evidence)); installFetch(posts);
    mountBrowser(); await start(); chooseStory(); addHiddenDetail();
    fireEvent.change(screen.getByLabelText(/Exact wording/), { target: { value: '  Resume from header  ' } });
    const header = screen.getByRole('button', { name: 'CO-CREATE YOUR WORLD ↗' });
    fireEvent.click(header);
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toBeInTheDocument();
    expect(window.location.search).toBe('');
    fireEvent.click(header);
    expect(screen.getAllByRole('button', { name: /Resume my brief/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('  Resume from header  ');
    expect(posts).toHaveBeenCalledTimes(1);
  });

  it('cancels pending generation from the header and ignores its late response after resume', async () => {
    const pending = deferredResponse(); const posts = mockPosts(reply(evidence), pending.promise); installFetch(posts);
    mountBrowser(); await start(); answerToReview('  Still mine  '); await generate();
    fireEvent.click(screen.getByRole('button', { name: 'CO-CREATE YOUR WORLD ↗' }));
    expect(posts.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Resume my brief/ }));
    expect(reviewValue('Exact wording')).toBe('  Still mine  ');
    await act(async () => { pending.resolve(reply({ concept })); });
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
    expect(window.location.search).toBe('');
    expect(localStorage.getItem('dioramini:direction:saved')).toBeNull();
  });

  it('cancels a loading shared concept and cannot overwrite a newer result with its late response', async () => {
    const stale = deferredResponse(); const newer = { ...concept, id: 'newer', title: 'The Newer Direction' };
    const posts = mockPosts(stale.promise, reply({ concept: newer })); installFetch(posts);
    mountBrowser('/?concept=saved');
    expect(screen.getByText('Opening your concept…')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Another concept' }));
    await screen.findByRole('heading', { name: newer.title });
    expect(posts.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { stale.resolve(reply({ concept })); });
    expect(screen.getByRole('heading', { name: newer.title })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
    expect(window.location.search).toBe('?concept=newer');
    posts.mock.calls.forEach(call => expect(JSON.parse(call[1].body)).not.toHaveProperty('context'));
  });
});

describe('Modal navigation boundaries', () => {
  it('dismisses share review after newer URL navigation without copying its content', async () => {
    const writeText = mockClipboard(); const posts = mockPosts(reply(evidence)); installFetch(posts);
    mountBrowser(); await start(); answerToReview('Do not share after leaving');
    const newPage = screen.getByRole('link', { name: 'New page' });
    fireEvent.click(screen.getByRole('button', { name: 'Review & share a copy' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(newPage);
    expect(window.location.search).toBe('?fresh=1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('dismisses an import review after newer URL navigation without importing its content', () => {
    mountBrowser(`/${encodeBriefHash(storedDirection())}`);
    const newPage = screen.getByRole('link', { name: 'New page' });
    fireEvent.click(screen.getByRole('button', { name: /Review shared brief/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(newPage);
    expect(window.location.search).toBe('?fresh=1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Review shared brief/ })).not.toBeInTheDocument();
    expect(localStorage.getItem(BRIEF_SESSION_KEY)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Interrupted electronic study generation', () => {
  it('retries exact electronic answers after cancellation and ignores the first response', async () => {
    const stale = deferredResponse(); const electronic = { ...concept, edition: 'inside' };
    const posts = mockPosts(reply(evidence), stale.promise, reply({ concept: electronic }));
    const { readiness } = installFetch(posts);
    mountBrowser(); await start(); answerToReview('  Retry EXACT!  ', 'electronic');
    await generate();
    expect(screen.getByRole('button', { name: 'Creating your concept' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    expect(posts.mock.calls[1][1].signal.aborted).toBe(true);
    expect(reviewValue('Exact wording')).toBe('  Retry EXACT!  ');
    await generate(); await screen.findByRole('heading', { name: concept.title });
    expect(posts).toHaveBeenCalledTimes(3); expect(readiness).toHaveBeenCalledTimes(3);
    expect(posts.mock.calls[2][1].body).toBe(posts.mock.calls[1][1].body);
    expect(JSON.parse(JSON.parse(posts.mock.calls[2][1].body).context)).toMatchObject({ mode: 'electronic', interaction: 'Display only', exactWording: '  Retry EXACT!  ' });
    await act(async () => { stale.resolve(reply({ concept: { ...electronic, id: 'late', title: 'Late electronic result' } })); });
    expect(screen.queryByRole('heading', { name: 'Late electronic result' })).not.toBeInTheDocument();
    expect(window.location.search).toBe('?concept=saved');
    expect(localStorage.getItem('dioramini:direction:late')).toBeNull();
  });
});
