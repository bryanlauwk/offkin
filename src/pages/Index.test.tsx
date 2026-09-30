import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  it('labels sample-company explanations and validates minimum budget', async () => {
    render(<MemoryRouter initialEntries={['/?brand=stive']}><Index /></MemoryRouter>);
    expect(screen.getByText(/Curated example concept/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it captures your business DNA' })).toBeInTheDocument();
    const budget = screen.getByLabelText('Target per piece (RM)') as HTMLInputElement;
    fireEvent.change(budget, { target: { value: '50' } });
    expect(budget.checkValidity()).toBe(false);
    expect(screen.queryByText(/RM50/)).not.toBeInTheDocument();
    expect(screen.getByText(/Minimum RM100 per piece/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'BRIQ2.0 home' })).toBeInTheDocument());
  });
  it('submits a company website and displays its generated business story', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ concept: { id: 'fresh', edition: 'everyday', format: 'clicker', brand: 'Example', title: 'The Packing Ritual', story: 'Parcel caps translate the company’s delivery business into a tactile sorting ritual.', image: '/example.png' } })));
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
  it('starts with an empty website when returning from a curated example', async () => {
    render(<MemoryRouter initialEntries={['/?brand=stive']}><Index /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '← Create another edition' }));
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
