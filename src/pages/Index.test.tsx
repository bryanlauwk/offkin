import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Index from './Index';

const settings = vi.hoisted(() => ({ title: 'form.' }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: async () => ({ data: [{ key: 'site_title', value: settings.title }] }) }) } }));

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.invalid');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  settings.title = 'form.';
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('BRIQ2.0 website-first creation', () => {
  it('shows the exact headline, website prompt and RM100 floor', async () => {
    render(<MemoryRouter><Index /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
    expect(screen.getByLabelText('Company website')).toBeInTheDocument();
    expect(screen.getByText(/Designs from RM100 per piece/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
  });
  it('preserves custom admin branding', async () => {
    settings.title = 'My Studio';
    render(<MemoryRouter><Index /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('link', { name: 'My Studio home' })).toBeInTheDocument());
  });
  it('restores saved business explanations and validates minimum budget', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ concept: { id: 'saved', edition: 'inside', format: 'miniature', brand: 'Saved business', title: 'Saved miniature', story: 'A real saved business story.', image: '/saved.png', sourceUrl: 'https://example.com', sourceTitle: 'Company website' } }))));
    render(<MemoryRouter initialEntries={['/?concept=saved']}><Index /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Saved miniature' });
    expect(screen.getByRole('link', { name: 'Company website' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByRole('heading', { name: 'How it captures your business DNA' })).toBeInTheDocument();
    const budget = screen.getByLabelText('Target per piece (RM)') as HTMLInputElement;
    fireEvent.change(budget, { target: { value: '50' } });
    expect(budget.checkValidity()).toBe(false);
    expect(screen.queryByText(/RM50/)).not.toBeInTheDocument();
    expect(screen.getByText(/Minimum RM100 per piece/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
  });
  it('submits a company website and displays its generated business story', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ concept: { id: 'fresh', edition: 'inside', format: 'miniature', brand: 'Example', title: 'The Packing Ritual', story: 'Parcel caps translate the company’s delivery business into a tactile sorting ritual.', image: '/example.png' } })));
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter><Index /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create collectible' }));
    await screen.findByRole('heading', { name: 'The Packing Ritual' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).brand).toBe('https://example.com');
    expect(screen.getByText(/Parcel caps translate/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it captures your business DNA' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← Create another edition' }));
    expect(screen.getByLabelText('Company website')).toHaveValue('example.com');
  });
  it('retires legacy example links without resurrecting curated content', async () => {
    render(<MemoryRouter initialEntries={['/?brand=stive']}><Index /></MemoryRouter>);
    expect(screen.queryByRole('heading', { name: 'The Order-to-Object Studio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Company website')).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
  });
  it('stops a pending request and lets the user edit and retry', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<MemoryRouter><Index /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create collectible' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(screen.getByLabelText('Company website')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Create collectible' })).toBeEnabled();
  });
});

it('starts with one website field and no upfront format or story selector', async () => {
  render(<MemoryRouter><Index /></MemoryRouter>);
  expect(screen.getAllByRole('textbox')).toHaveLength(1);
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
});

it('asks for business context only when generation needs it', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ needsContext: true, message: 'Please add a short business summary.' }))));
  render(<MemoryRouter><Index /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create collectible' }));
  await screen.findByLabelText('Tell us a little about the business');
  expect(screen.getByRole('button', { name: 'Try again with these details' })).toBeEnabled();
});

it('does not replace a newer navigation with an old generation response', async () => {
  let complete: (value: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { complete = resolve; })));
  render(<MemoryRouter><Link to="/?new=1">Start fresh</Link><Index /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create collectible' }));
  fireEvent.click(screen.getByRole('link', { name: 'Start fresh' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business DNA. Made collectible.');
  complete!(new Response(JSON.stringify({ concept: { id: 'late', edition: 'inside', format: 'miniature', brand: 'Late', title: 'Late result', story: 'Late story' } })));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Late result' })).not.toBeInTheDocument());
});

it('allows a failed shared concept to be loaded again', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Temporarily unavailable' }), { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ concept: { id: 'saved', edition: 'everyday', format: 'clicker', brand: 'Saved', title: 'Saved concept', story: 'A saved business story.' } }))));
  render(<MemoryRouter initialEntries={['/?concept=saved']}><Index /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Try loading again' }));
  await screen.findByRole('heading', { name: 'Saved concept' });
});

it('replaces the verified legacy quiz title with BRIQ2.0', async () => {
  settings.title = 'The Absurd Marshmallow Test';
  render(<MemoryRouter><Index /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
  expect(screen.queryByText('The Absurd Marshmallow Test')).not.toBeInTheDocument();
});


it('removes all curated examples, sample imagery and sample-referencing errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
  render(<MemoryRouter><Index /></MemoryRouter>);
  expect(screen.queryByText(/STIVE|Rimba|explore a sample/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getAllByRole('textbox')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Company website'), { target: { value: 'example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create collectible' }));
  await screen.findByText('Generation is not available right now. Please try again later.');
  expect(screen.queryByText(/Try an example/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create collectible' })).toBeEnabled();
});
