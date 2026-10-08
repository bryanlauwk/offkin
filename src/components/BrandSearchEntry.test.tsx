import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPilotInvite, setPilotInvite } from '@/lib/pilot-access';
import BrandSearchEntry from './BrandSearchEntry';
import { BRAND_LOOKUP_DRAFT_KEY, loadLookupDraft, type BrandDiscoveryResponse } from '@/lib/brand-discovery';
const request = vi.hoisted(() => vi.fn());
vi.mock('@/lib/brand-discovery', async original => ({ ...await original<object>(), requestBrandDiscovery: request }));
const id = '00000000-0000-4000-8000-000000000091';
const candidate = { id: '00000000-0000-4000-8000-000000000092', url: 'https://fable.example/', title: 'Fable Finch', excerpt: 'A paper studio making thoughtful gifts.' };
const ready: BrandDiscoveryResponse = { contractVersion: 'offkin-brand-discovery-v1', status: 'ready', researchId: id, brand: 'Fable Finch', website: candidate.url, summary: 'Fable Finch is a paper studio. It creates thoughtful gifts and illustrated stationery for celebrations and everyday moments.', evidence: [{ url: candidate.url, title: candidate.title, excerpt: candidate.excerpt }], candidates: [], message: 'Your brand story is ready.' };
const props = () => ({ available: true, disabled: false, navigationKey: 'one', sessionId: 'session-one', onReady: vi.fn(), onManual: vi.fn(), onAccessRequest: vi.fn() });
const enter = () => { fireEvent.change(screen.getByLabelText('Your brand name or website'), { target: { value: 'Fable Finch' } }); fireEvent.click(screen.getByRole('button', { name: 'See my concept' })); };
beforeEach(() => { forgetPilotInvite(); localStorage.clear(); vi.clearAllMocks(); request.mockResolvedValue(ready); });
afterEach(() => { cleanup(); forgetPilotInvite(); vi.useRealTimers(); });
describe('Single brand entry', () => {
  it('only researches on explicit submission and continues once with sourced identity', async () => {
    const p = props(); render(<BrandSearchEntry {...p}/>);
    fireEvent.change(screen.getByLabelText('Your brand name or website'), { target: { value: 'Fable Finch' } }); expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'See my concept' }));
    await waitFor(() => expect(p.onReady).toHaveBeenCalledExactlyOnceWith(ready, 'session-one'));
    expect(request.mock.calls[0][0]).toEqual({ contractVersion: 'offkin-brand-discovery-v1', action: 'discover-brand', query: 'Fable Finch' });
    expect(screen.queryByText('Who should this story connect with?')).not.toBeInTheDocument(); expect(screen.queryByLabelText('Exact brand name')).not.toBeInTheDocument(); expect(loadLookupDraft()).toBeNull();
  });
  it('asks one small candidate choice and uses its opaque ID rather than trusting a submitted URL', async () => {
    request.mockResolvedValueOnce({ ...ready, status: 'choose', candidates: [candidate], message: 'Choose your brand.' });
    const p = props(); render(<BrandSearchEntry {...p}/>); enter();
    await screen.findByRole('heading', { name: 'Which brand is yours?' }); expect(p.onReady).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'fable.example' })).toHaveAttribute('href', candidate.url);
    fireEvent.click(screen.getByRole('button', { name: 'Use this brand' })); await waitFor(() => expect(p.onReady).toHaveBeenCalledOnce());
    expect(request.mock.calls[1][0]).toEqual({ contractVersion: 'offkin-brand-discovery-v1', action: 'select-brand', researchId: id, candidateId: candidate.id });
  });
  it('does not dispatch anonymous lookup and keeps the buyer entry', async () => {
    const p = props(); render(<BrandSearchEntry {...p} available={false}/>); enter();
    expect(request).not.toHaveBeenCalled(); expect(p.onAccessRequest).toHaveBeenCalledOnce(); expect(screen.getByLabelText('Your brand name or website')).toHaveValue('Fable Finch');
  });
  it('stops, rejects late output, and recovers the exact query without a new discovery action', async () => {
    let resolve!: (value: BrandDiscoveryResponse) => void; request.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const p = props(); render(<BrandSearchEntry {...p}/>); enter(); fireEvent.click(screen.getByRole('button', { name: 'Stop lookup' }));
    expect(request.mock.calls[0][1].aborted).toBe(true); await act(async () => resolve(ready)); expect(p.onReady).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Check saved lookup' })); await screen.findByRole('button', { name: 'Create concept from saved research' }); expect(p.onReady).not.toHaveBeenCalled();
    expect(request.mock.calls[1][0]).toEqual({ contractVersion: 'offkin-brand-discovery-v1', action: 'recover-brand', query: 'Fable Finch' });
    fireEvent.click(screen.getByRole('button', { name: 'Create concept from saved research' })); expect(p.onReady).toHaveBeenCalledOnce();
  });
  it('ignores old navigation results and never repeats lookup on reload', async () => {
    let resolve!: (value: BrandDiscoveryResponse) => void; request.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const p = props(); const view = render(<BrandSearchEntry {...p}/>); enter(); view.rerender(<BrandSearchEntry {...p} navigationKey="two"/>);
    await act(async () => resolve(ready)); expect(p.onReady).not.toHaveBeenCalled(); view.unmount(); render(<BrandSearchEntry {...p}/>);
    expect(request).toHaveBeenCalledOnce(); expect(screen.getByLabelText('Your brand name or website')).toHaveValue('Fable Finch');
  });
  it('preserves a manual factual fallback without pretending it researched online', () => {
    const p = props(); render(<BrandSearchEntry {...p}/>); fireEvent.click(screen.getByText('Prefer to describe your idea?'));
    fireEvent.change(screen.getByLabelText('Brand or project name'), { target: { value: 'Fable Finch' } }); fireEvent.change(screen.getByLabelText('Your story'), { target: { value: 'We make thoughtful paper gifts.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create from my story' })); expect(p.onManual).toHaveBeenCalledWith('Fable Finch', 'We make thoughtful paper gifts.', 'session-one'); expect(request).not.toHaveBeenCalled();
  });
  it('clears only the local lookup draft with an honest allowance notice', () => {
    localStorage.setItem(BRAND_LOOKUP_DRAFT_KEY, JSON.stringify({ query: 'Fable Finch', researchId: id })); render(<BrandSearchEntry {...props()}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Clear lookup draft' })); expect(loadLookupDraft()).toBeNull(); expect(screen.getByRole('status')).toHaveTextContent('Used online allowance is unchanged'); expect(request).not.toHaveBeenCalled();
  });
});

it('keeps cached source choices usable after an insufficient first page without another search',async()=>{
  request.mockResolvedValueOnce({...ready,status:'needs-context',reason:'insufficient-evidence',candidates:[candidate],message:'Try another saved source.'});
  const p=props();render(<BrandSearchEntry {...p}/>);enter();await screen.findByRole('heading',{name:'Try another source for your brand'});fireEvent.click(screen.getByRole('button',{name:'Use this brand'}));await waitFor(()=>expect(p.onReady).toHaveBeenCalledOnce());
  expect(request.mock.calls.map(([body])=>body.action)).toEqual(['discover-brand','select-brand']);
});

it('invalidates a pending lookup when the parent restores a newer text direction',async()=>{
  let resolve!:(value:BrandDiscoveryResponse)=>void;request.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));const p=props();const view=render(<BrandSearchEntry {...p}/>);enter();
  view.rerender(<BrandSearchEntry {...p} sessionId="restored" initialName="Other Brand" initialStory="Our saved factual story"/>);await act(async()=>resolve(ready));expect(p.onReady).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Brand or project name')).toHaveValue('Other Brand');expect(screen.getByLabelText('Your story')).toHaveValue('Our saved factual story');expect(screen.queryByLabelText('Your brand name or website')).not.toBeInTheDocument();
});
it('removes a recovered ready result when the invitation changes',async()=>{
  setPilotInvite('a'.repeat(43));localStorage.setItem(BRAND_LOOKUP_DRAFT_KEY,JSON.stringify({query:'Fable Finch',researchId:id}));const p=props();render(<BrandSearchEntry {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Check saved lookup'}));await screen.findByRole('button',{name:'Create concept from saved research'});
  act(()=>{forgetPilotInvite();setPilotInvite('b'.repeat(43));});expect(screen.queryByRole('button',{name:'Create concept from saved research'})).not.toBeInTheDocument();expect(p.onReady).not.toHaveBeenCalled();
});
