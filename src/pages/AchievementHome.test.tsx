import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Index from './Index';
import { ACHIEVEMENT_DRAFT_KEY } from '@/lib/achievement-draft';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: async () => ({ data: [{ key: 'site_title', value: 'OFFKIN' }] }) }) } }));
function mount(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Index /></MemoryRouter>); }
beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No provider requests allowed'))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });
describe('Achievement journey boundaries', () => {
  it('allows a completed milestone preview without signup, generation or proposal submission', async () => {
    mount(); fireEvent.click(screen.getAllByRole('button', { name: 'Create My Collectible' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText('Your achievement'), { target: { value: 'Finished my first marathon' } });
    fireEvent.click(screen.getByRole('button', { name: /Preview my direction/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save brief locally' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(ACHIEVEMENT_DRAFT_KEY) || '{}')).toMatchObject({ mode: 'achievement', milestone: 'Finished my first marathon' }));
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps future-goal planning local and resumable with no activity sync', async () => {
    mount('/?journey=quest'); fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText('Your future goal'), { target: { value: 'Learn ceramics' } });
    fireEvent.click(screen.getByRole('button', { name: /Preview my direction/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save goal locally' }));
    expect(JSON.parse(localStorage.getItem(ACHIEVEMENT_DRAFT_KEY) || '{}')).toMatchObject({ mode: 'quest', milestone: 'Learn ceramics' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('blocks a blank milestone but preserves business access without faking asset IDs', async () => {
    mount('/?journey=achievement&type=business'); fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));
    expect(screen.getByRole('button', { name: /Preview my direction/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Opened our first store' }));
    fireEvent.click(screen.getByRole('button', { name: /Preview my direction/ }));
    expect(screen.getAllByRole('link', { name: /Open brand studio/ }).some(link => link.getAttribute('href') === '/?studio=brand')).toBe(true);
    expect(screen.queryByRole('button', { name: /Submit|Pay|Order/ })).not.toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
  });
});