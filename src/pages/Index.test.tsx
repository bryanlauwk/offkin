import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Index from './Index';
const settings = vi.hoisted(() => ({ title: 'form.' }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: async () => ({ data: [{ key: 'site_title', value: settings.title }] }) }) } }));
const concept = { id: 'saved', edition: 'icon', format: 'miniature', brand: 'Acme', title: 'The Packing Ritual', story: 'From a customer order to a carefully packed gift.', image: '/generated.png', sourceUrl: 'https://company.com', sourceTitle: 'Company' };
const evidence = { verified: true, website: { url: 'https://company.com/', title: 'Company home', excerpt: 'We personalise gifts from online orders.' } };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => { localStorage.clear(); vi.stubGlobal('scrollTo', vi.fn()); vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key'); settings.title = 'form.'; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function mount(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Index /></MemoryRouter>); }
async function start() { fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'company.com' } }); fireEvent.click(screen.getByRole('button', { name: 'Explore my business' })); await screen.findByLabelText('Your business story'); }
function answerToReview(wording = '') {
  fireEvent.change(screen.getByLabelText('Your business story'), { target: { value: 'We personalise online gift orders, then pack and ship them.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Small diorama' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText(/Exact wording/), { target: { value: wording } });
  fireEvent.click(screen.getByRole('button', { name: 'On the base' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Playful & sculptural' }));
  fireEvent.click(screen.getByRole('button', { name: 'Review my direction' }));
}
describe('Conversation-led miniature creation', () => {
  it('opens with one website composer, exact headline, price terms and no samples or internal notes', async () => {
    mount(); expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
    expect(screen.getByText(/From RM100 per piece/)).toBeInTheDocument();
    expect(screen.queryByText(/STIVE|Rimba|AI credits|internal brief|agency/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await screen.findByRole('link', { name: 'DIORAMINI home' });
  });
  it('preserves a configured custom studio title', async () => { settings.title = 'My Studio'; mount(); await screen.findByRole('link', { name: 'My Studio home' }); });
  it('retires old sample links', async () => { mount('/?brand=stive'); expect(screen.getByLabelText('Company website')).toHaveValue(''); expect(screen.queryByRole('img')).not.toBeInTheDocument(); await screen.findByRole('link', { name: 'DIORAMINI home' }); });
  it('reads the website without generating, asks questions, then passes exact wording and choices once', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({ concept })); vi.stubGlobal('fetch', fetchMock); mount(); await start();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ brand: 'https://company.com', inspectWebsite: true });
    expect(screen.getByText(/Here’s what I found/)).toBeInTheDocument();
    expect(screen.getByText('We personalise gifts from online orders.')).toBeInTheDocument();
    const wording = '  Made for YOU!\nSince 2020  ';
    answerToReview(wording); expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Create my miniature' }));
    await screen.findByRole('heading', { name: concept.title });
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body); const direction = JSON.parse(payload.context);
    expect(direction.exactWording).toBe(wording); expect(direction.item).toBe('Small diorama'); expect(direction.placement).toBe('On the base'); expect(direction.style).toBe('Playful & sculptural'); expect(direction.interaction).toBe('Display only');
    expect(payload.summaryOnly).toBe(false); expect(payload.edition).toBe('icon'); expect(payload.format).toBe('miniature');
    expect(screen.getByRole('heading', { name: 'Your business, in miniature' })).toBeInTheDocument();
    expect(screen.queryByText(/agency|internal brief|AI credits/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Let’s refine it' }));
    expect(screen.getByLabelText('Your business story')).toHaveValue(direction.business);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('uses a transparent summary-only fallback after an unreadable or unsafe redirect', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ error: 'Insecure redirect' }, 400)).mockResolvedValueOnce(reply({ capabilities: { summary_only: true } })).mockResolvedValueOnce(reply({ concept })); vi.stubGlobal('fetch', fetchMock); mount(); await start();
    expect(screen.getByText(/I couldn’t read enough/)).toBeInTheDocument();
    expect(screen.queryByText(/Here’s what I found/)).not.toBeInTheDocument();
    answerToReview(); fireEvent.click(screen.getByRole('button', { name: 'Create my miniature' })); await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).summaryOnly).toBe(true);
  });
  it('lets the customer edit earlier answers without a provider call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(evidence)); vi.stubGlobal('fetch', fetchMock); mount(); await start(); answerToReview('Keep EXACT');
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[2]);
    expect(screen.getByLabelText(/Exact wording/)).toHaveValue('Keep EXACT'); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('blocks duplicate generation and supports cancellation and retry', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(evidence)).mockImplementation(() => new Promise(() => {})); vi.stubGlobal('fetch', fetchMock); mount(); await start(); answerToReview();
    const button = screen.getByRole('button', { name: 'Create my miniature' }); fireEvent.click(button); fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Stop' })); expect(screen.getByRole('button', { name: 'Create my miniature' })).toBeEnabled();
    expect(screen.getByText(/Your answers are still here/)).toBeInTheDocument();
  });
  it('keeps answers when generation fails and allows retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(evidence)).mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({ concept }))); mount(); await start(); answerToReview('Keep me');
    fireEvent.click(screen.getByRole('button', { name: 'Create my miniature' })); await screen.findByText(/We couldn’t finish your concept/);
    fireEvent.click(screen.getByRole('button', { name: 'Create my miniature' })); await screen.findByRole('heading', { name: concept.title });
  });
  it('stops reading and ignores its late response after navigation', async () => {
    let complete: (response: Response) => void; const fetchMock = vi.fn(() => new Promise<Response>(resolve => { complete = resolve; })); vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter><Link to="/?fresh=1">New page</Link><Index /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'company.com' } }); fireEvent.click(screen.getByRole('button', { name: 'Explore my business' }));
    fireEvent.click(screen.getByRole('link', { name: 'New page' })); complete!(reply(evidence));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Explore my business' })).toBeEnabled());
    expect(screen.queryByLabelText('Your business story')).not.toBeInTheDocument();
  });
  it('restores shared concepts and retries failed retrieval without generating', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({ concept })); vi.stubGlobal('fetch', fetchMock); mount('/?concept=saved');
    fireEvent.click(await screen.findByRole('button', { name: 'Try loading again' })); await screen.findByRole('heading', { name: concept.title });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ id: 'saved' });
    fireEvent.click(screen.getByRole('button', { name: '← Start a new story' })); expect(screen.getByLabelText('Company website')).toHaveValue('');
  });
});


it('does not promise summary fallback for an unsafe address on the older deployed backend', async () => {
 const fetchMock=vi.fn().mockResolvedValueOnce(reply({error:'Insecure redirect'},400)).mockResolvedValueOnce(reply({ready:true}));vi.stubGlobal('fetch',fetchMock);mount();
 fireEvent.change(screen.getByLabelText('Company website'),{target:{value:'company.com'}});fireEvent.click(screen.getByRole('button',{name:'Explore my business'}));
 await screen.findByText('We couldn’t use that address. Try your public HTTPS homepage.');
 expect(screen.queryByLabelText('Your business story')).not.toBeInTheDocument();expect(screen.getByLabelText('Company website')).toBeEnabled();expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('rebrands the existing BRIQ2.0 settings without changing a custom studio title', async () => { settings.title='BRIQ2.0';mount();await screen.findByRole('link',{name:'DIORAMINI home'}); });


it('restores the exact saved direction on this device when refining a reloaded concept', async () => {
 const direction={website:'https://company.com',business:'Original confirmed story',item:'Small diorama',audience:'Customers & fans',wording:'  EXACT!  ',placement:'On the base',style:'Playful & sculptural',interaction:'Display only',summaryOnly:false};
 localStorage.setItem('dioramini:direction:saved',JSON.stringify(direction));vi.stubGlobal('fetch',vi.fn().mockResolvedValue(reply({concept})));mount('/?concept=saved');await screen.findByRole('heading',{name:concept.title});fireEvent.click(screen.getByRole('button',{name:'Let’s refine it'}));
 expect(screen.getByLabelText('Your business story')).toHaveValue(direction.business);fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.click(screen.getByRole('button',{name:'Continue'}));expect(screen.getByLabelText(/Exact wording/)).toHaveValue(direction.wording);
});
it('asks for original details when a shared concept has no direction on this device', async () => {
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(reply({concept})));mount('/?concept=saved');await screen.findByRole('heading',{name:concept.title});fireEvent.click(screen.getByRole('button',{name:'Let’s refine it'}));
 expect(screen.getByText(/earlier design details aren’t saved/)).toBeInTheDocument();expect(screen.getByLabelText('Your business story')).toHaveValue('');
});


it('does not accept a late generation response after its deadline', async () => {
 let complete: (response: Response) => void;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(reply(evidence)).mockImplementation(()=>new Promise<Response>(resolve=>{complete=resolve;})));
 mount();await start();answerToReview();vi.useFakeTimers();
 try {
  fireEvent.click(screen.getByRole('button',{name:'Create my miniature'}));
  await act(async()=>{vi.advanceTimersByTime(220001);complete!(reply({concept}));});
  expect(screen.queryByRole('heading',{name:concept.title})).not.toBeInTheDocument();
  expect(screen.getByText(/taking longer than expected/)).toBeInTheDocument();
 } finally {vi.useRealTimers();}
});
it('ignores a cancelled generation after a retry succeeds', async () => {
 let complete: (response: Response) => void;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(reply(evidence)).mockImplementationOnce(()=>new Promise<Response>(resolve=>{complete=resolve;})).mockResolvedValueOnce(reply({concept})));
 mount();await start();answerToReview();fireEvent.click(screen.getByRole('button',{name:'Create my miniature'}));fireEvent.click(screen.getByRole('button',{name:'Stop'}));fireEvent.click(screen.getByRole('button',{name:'Create my miniature'}));
 await screen.findByRole('heading',{name:concept.title});await act(async()=>{complete!(reply({concept:{...concept,id:'late',title:'Late result'}}));});
 expect(screen.queryByRole('heading',{name:'Late result'})).not.toBeInTheDocument();expect(screen.getByRole('heading',{name:concept.title})).toBeInTheDocument();
});
