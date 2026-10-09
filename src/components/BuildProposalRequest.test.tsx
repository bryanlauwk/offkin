import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BuildProposalRequest from './BuildProposalRequest';
import type { ExportSnapshot } from '@/lib/proposal-export';
import type { PairedConcept } from '../../supabase/functions/generate-concept/paired-design';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } } }));

const stages = ['world', 'physical', 'details', 'packaging'] as const;
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444'];
const pairIds = ids.slice(0, 2);
function snapshot(count = 4): ExportSnapshot {
  return { key: 'k', stages: stages.map((stage, i) => ({ stage, asset: i < count ? { id: ids[i], title: `T ${stage}`, brand: 'Fable Finch', story: `S ${stage}`, sourceUrl: '' } : undefined })) } as unknown as ExportSnapshot;
}
function fill() {
  fireEvent.change(screen.getByLabelText(/Your name/i), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText(/Company/i), { target: { value: 'Acme' } });
}
function pair(): [PairedConcept, PairedConcept] {
  const asset = (index: 0 | 1): PairedConcept => ({ id: pairIds[index], role: index ? 'story-card' : 'collectible', title: index ? 'Story card' : 'Collectible', brand: 'Fable Finch', story: 'A linked brand story.', sourceUrl: 'https://example.com' });
  return [asset(0), asset(1)];
}
beforeEach(() => invoke.mockReset());

describe('Proposal request handoff', () => {
  it('cannot be requested until all four concept images are complete', () => {
    render(<BuildProposalRequest brief="b" snapshot={snapshot(3)} />);
    expect(screen.getByRole('button', { name: /Request a Quote/ })).toBeDisabled();
  });
  it('submits exactly the four saved image IDs and shows the saved reference', async () => {
    invoke.mockResolvedValue({ data: { ok: true, reference: 'OFF-ABC123' }, error: null });
    render(<BuildProposalRequest brief="b" snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole('button', { name: /Request a Quote/ }));
    fill();
    fireEvent.submit(screen.getByLabelText(/Company/i).closest('form')!);
    await screen.findByText(/OFF-ABC123/);
    expect(invoke).toHaveBeenCalledOnce();
    expect(invoke.mock.calls[0][1].body.assetIds).toEqual(ids);
    expect(invoke.mock.calls[0][1].body.brandName).toBe('Fable Finch');
  });
  it('does not submit without a valid work email', async () => {
    render(<BuildProposalRequest brief="b" snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole('button', { name: /Request a Quote/ }));
    fill();
    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: 'nope' } });
    fireEvent.submit(screen.getByLabelText(/Company/i).closest('form')!);
    await waitFor(() => expect(screen.getByText(/valid work email/)).toBeInTheDocument());
    expect(invoke).not.toHaveBeenCalled();
  });
  it('submits exactly the two linked paired asset IDs', async () => {
    invoke.mockResolvedValue({ data: { ok: true, reference: 'OFF-PAIR12' }, error: null });
    render(<BuildProposalRequest brief="b" pairedAssets={pair()} />);
    fireEvent.click(screen.getByRole('button', { name: /Request a Quote/ }));
    fill();
    fireEvent.submit(screen.getByLabelText(/Company/i).closest('form') as HTMLFormElement);
    await screen.findByText(/OFF-PAIR12/);
    expect(invoke.mock.calls[0][1].body.assetIds).toEqual(pairIds);
    expect(invoke.mock.calls[0][1].body.conceptSummary.stages.map((stage: { stage: string }) => stage.stage)).toEqual(['collectible', 'story-card']);
  });
});
