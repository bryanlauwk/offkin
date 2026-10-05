import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter, Link, MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft, type CreationDraft } from '@/lib/creation-journey';
import Index from './Index';

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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

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
function answerToReview(wording = '') {
  chooseStory();
  addHiddenDetail();
  fireEvent.click(screen.getByRole('button', { name: 'Small diorama' }));
  fireEvent.click(screen.getByRole('button', { name: 'Playful & sculptural' }));
  fireEvent.click(screen.getByRole('button', { name: 'Customers & fans' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display only' }));
  fireEvent.change(screen.getByLabelText(/Exact wording/), { target: { value: wording } });
  fireEvent.click(screen.getByRole('button', { name: 'On the base' }));
  fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
}
function generate() { fireEvent.click(screen.getByRole('button', { name: 'Generate my concept' })); }
function storedDirection(overrides: Partial<CreationDraft> = {}): CreationDraft {
  return {
    ...emptyDraft, website: 'https://company.com', business, angle: 'ritual', hiddenDetail,
    audience: 'Customers & fans', wording: '  EXACT!\nKeep This.  ', placement: 'On the base',
    style: 'Playful & sculptural', interaction: 'Display only', ...overrides,
  };
}

describe('Editorial creation entry', () => {
  it('opens with one website composer, the business-DNA headline, and honest price terms', async () => {
    mount();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByText('异趣伙伴')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
    expect(screen.getByText('Objects from RM100*')).toBeInTheDocument();
    expect(screen.getByText(/Design and prototyping priced separately/)).toBeInTheDocument();
    expect(screen.queryByText(/STIVE|Rimba|AI credits|internal brief|agency/i)).not.toBeInTheDocument();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('offers three clearly unofficial studies without starting a provider request', async () => {
    mount();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    const studies = screen.getByRole('group', { name: 'Explore observation studies' });
    expect(within(studies).getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Off-screen: interactive concept study' })).toBeInTheDocument();
    fireEvent.click(within(studies).getByRole('button', { name: /Airbnb/ }));
    expect(screen.getByRole('img', { name: 'A place is made: interactive concept study' })).toBeInTheDocument();
    fireEvent.click(within(studies).getByRole('button', { name: /Tesla/ }));
    expect(screen.getByRole('img', { name: 'Stored afternoon: interactive concept study' })).toBeInTheDocument();
    expect(screen.getByText(/No affiliation, commission or endorsement/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('explains the process on demand, including approval and physical prototyping', async () => {
    mount();
    await screen.findByRole('link', { name: 'OFFKIN home' });
    const toggle = screen.getByRole('button', { name: 'How it takes shape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/You approve the direction before AI creates/)).toBeInTheDocument();
    expect(screen.getByText(/a physical sample before production/)).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByRole('heading', { name: 'Make it real' })).not.toBeInTheDocument();
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

  it('retires old sample URL parameters instead of selecting or generating a client concept', async () => {
    mount('/?brand=stive');
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA.');
    await screen.findByRole('link', { name: 'OFFKIN home' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Four-step customer direction', () => {
  it('shows three distinct editorial lenses with relevant, attributable source evidence', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(evidence));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ brand: 'https://company.com', inspectWebsite: true });
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('requires a chosen lens, a factual business story, and a hidden detail', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(evidence));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    // Submit directly to verify the application guard in addition to native required fields.
    fireEvent.submit(screen.getByLabelText('In one line, what does the business do?').closest('form')!);
    expect(screen.getByText('Choose the story you’d like to explore.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /The unseen ritual/ }));
    fireEvent.submit(screen.getByLabelText('In one line, what does the business do?').closest('form')!);
    expect(screen.getByText('Add a short, factual description of the business.')).toBeInTheDocument();
    chooseStory();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What do customers not know that you do every day?');
    fireEvent.submit(screen.getByLabelText('The detail only you know').closest('form')!);
    expect(screen.getByText('Add one everyday detail. It can be small.')).toBeInTheDocument();
    expect(screen.getByLabelText('The detail only you know')).toHaveAttribute('maxlength', '120');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('waits for explicit generation and sends exact wording, chosen lens, hidden detail and object choices once', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    const wording = '  Made for YOU!\nSince 2020  ';
    answerToReview(wording);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('A small object. A very specific story.');
    expect(screen.getByText(hiddenDetail)).toBeInTheDocument();
    const letteringRow = screen.getByRole('button', { name: 'Edit Exact wording' }).parentElement!;
    expect(letteringRow.querySelector('dd')?.textContent).toBe(wording);
    generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(JSON.parse(payload.context)).toEqual({
      business, angle: 'The unseen ritual', hiddenDetail, item: 'Small diorama', audience: 'Customers & fans',
      exactWording: wording, placement: 'On the base', style: 'Playful & sculptural', interaction: 'Display only',
    });
    expect(payload).toMatchObject({ brand: 'https://company.com', summaryOnly: false, edition: 'icon', format: 'miniature' });
    expect(screen.getByRole('heading', { name: 'Why this represents your business' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What needs a physical prototype' })).toBeInTheDocument();
    expect(screen.getByText(/render doesn’t establish manufacturing readiness/)).toBeInTheDocument();
    expect(screen.queryByText(/agency|internal brief|AI credits/i)).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('dioramini:direction:saved')!)).toMatchObject({ wording, hiddenDetail, angle: 'ritual' });
    fireEvent.click(screen.getByRole('button', { name: 'Refine this direction' }));
    expect(screen.getByLabelText('In one line, what does the business do?')).toHaveValue(business);
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps the meaningful-click choice to the interactive edition', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({ concept: { ...concept, edition: 'inside' } }));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    chooseStory();
    addHiddenDetail();
    expect(screen.getByRole('button', { name: 'A meaningful click' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).edition).toBe('inside');
  });

  it('edits every earlier kind of answer without another provider call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(evidence));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    answerToReview('Keep EXACT');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exact wording' }));
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('Keep EXACT');
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Hidden detail' }));
    expect(screen.getByLabelText('The detail only you know')).toHaveValue(hiddenDetail);
    fireEvent.change(screen.getByLabelText('The detail only you know'), { target: { value: 'We tuck a handwritten note under each ribbon.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
    expect(screen.getByText('We tuck a handwritten note under each ribbon.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Story lens' }));
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: /The human trace/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('What small moment would your people recognise instantly?', { selector: '.direction-callout p' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses a transparent summary-only fallback when the current backend supports it', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ error: 'Insecure redirect' }, 400))
      .mockResolvedValueOnce(reply({ capabilities: { summary_only: true } })).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    expect(screen.getByText(/We couldn’t read enough from this website/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open public source/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('In one line, what does the business do?'), { target: { value: business } });
    expect(screen.getByRole('radio', { name: /The unseen ritual/ })).toHaveAccessibleName(expect.stringContaining(`Your description: “${business}”`));
    answerToReview();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).summaryOnly).toBe(true);
  });

  it('does not invent evidence from an unverified website response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ ...evidence, verified: false })));
    mount();
    await start();
    expect(screen.getByText(/We couldn’t read enough/)).toBeInTheDocument();
    expect(screen.queryByText('Text from Company home')).not.toBeInTheDocument();
    expect(screen.queryByText(/Source detail:/)).not.toBeInTheDocument();
  });

  it('does not promise unsafe-address fallback on an older deployed backend', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ error: 'Insecure redirect' }, 400)).mockResolvedValueOnce(reply({ ready: true }));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    beginReading();
    await screen.findByText('We couldn’t use that address. Try your public HTTPS homepage.');
    expect(screen.queryByLabelText('In one line, what does the business do?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('Interrupted requests and browser navigation', () => {
  it('blocks duplicate generation, cancels the active request and keeps the complete direction for retry', async () => {
    const pending = deferredResponse();
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockReturnValueOnce(pending.promise);
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    answerToReview('Keep me');
    const button = screen.getByRole('button', { name: 'Generate my concept' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Creating your concept' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.getByRole('button', { name: 'Generate my concept' })).toBeEnabled();
    expect(screen.getByText(/Your answers are still here/)).toBeInTheDocument();
    expect(screen.getByText(hiddenDetail)).toBeInTheDocument();
    await act(async () => { pending.resolve(reply({ concept })); });
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
  });

  it('keeps answers when generation fails and retries the same direction', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    answerToReview('Keep me');
    generate();
    await screen.findByText(/We couldn’t finish your concept/);
    expect(screen.getByText('Keep me')).toBeInTheDocument();
    expect(screen.getByText(hiddenDetail)).toBeInTheDocument();
    generate();
    await screen.findByRole('heading', { name: concept.title });
    expect(fetchMock.mock.calls[2][1].body).toBe(fetchMock.mock.calls[1][1].body);
  });

  it('ignores a cancelled generation response after a retry succeeds', async () => {
    const stale = deferredResponse();
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockReturnValueOnce(stale.promise).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    generate();
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
    generate();
    await screen.findByRole('heading', { name: concept.title });
    await act(async () => { stale.resolve(reply({ concept: { ...concept, id: 'late', title: 'Late result' } })); });
    expect(screen.queryByRole('heading', { name: 'Late result' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: concept.title })).toBeInTheDocument();
    expect(window.location.search).toBe('?concept=saved');
    expect(localStorage.getItem('dioramini:direction:late')).toBeNull();
  });

  it('does not accept a generation response after its deadline', async () => {
    const pending = deferredResponse();
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockReturnValueOnce(pending.promise);
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await start();
    answerToReview();
    vi.useFakeTimers();
    generate();
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
    vi.stubGlobal('fetch', fetchMock);
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
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(reply({ concept: otherConcept }));
    vi.stubGlobal('fetch', fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    generate();
    fireEvent.click(screen.getByRole('link', { name: 'Another concept' }));
    await screen.findByRole('heading', { name: otherConcept.title });
    await act(async () => { pending.resolve(reply({ concept })); });
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(screen.queryByRole('heading', { name: concept.title })).not.toBeInTheDocument();
    expect(window.location.search).toBe('?concept=newer');
    expect(localStorage.getItem('dioramini:direction:saved')).toBeNull();
  });

  it('puts the generated concept in the URL and supports browser back and forward without regeneration', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mountBrowser();
    await start();
    answerToReview();
    generate();
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
    vi.stubGlobal('fetch', fetchMock);
    mountBrowser('/?concept=saved');
    fireEvent.click(await screen.findByRole('button', { name: 'Try loading again' }));
    await screen.findByRole('heading', { name: concept.title });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mock.calls.forEach(call => expect(JSON.parse(call[1].body)).toEqual({ id: 'saved' }));
    fireEvent.click(screen.getByRole('button', { name: '← Start a new story' }));
    expect(screen.getByLabelText('START WITH YOUR WEBSITE')).toHaveValue('');
    expect(window.location.search).toBe('');
  });

  it('restores every saved detail, including exact lettering, when refining after reload', async () => {
    const direction = storedDirection();
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(direction));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
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
    [direction.item, direction.placement, direction.style, direction.interaction].forEach(name => {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
    });
    fireEvent.click(screen.getByRole('button', { name: '← Back to your concept' }));
    expect(screen.getByRole('heading', { name: concept.title })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loads a legacy saved direction without losing its wording and asks for the new story details', async () => {
    const { angle: _angle, hiddenDetail: _hiddenDetail, ...legacy } = storedDirection();
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(legacy));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('restores a loaded concept’s saved direction after Start new and browser Back', async () => {
    const direction = storedDirection();
    localStorage.setItem('dioramini:direction:saved', JSON.stringify(direction));
    const fetchMock = vi.fn().mockResolvedValue(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
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
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({ concept }));
    vi.stubGlobal('fetch', fetchMock);
    mountBrowser();
    await start();
    const wording = '  KEEP!  ';
    answerToReview(wording);
    generate();
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
