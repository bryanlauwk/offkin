import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Showcase from './Showcase';
import { showcaseWorlds, SHOWCASE_IMAGE_NOTE, SHOWCASE_PREVIEW_NOTE } from '@/lib/showcase-worlds';

const settings = vi.hoisted(() => ({ values: [] as { key: string; value: string }[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: async () => ({ data: settings.values }) }) } }));

function HistoryControls() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate(-1)}>Go back</button><button onClick={() => navigate(1)}>Go forward</button></>;
}
const renderShowcase = (entry = '/showcase') => render(<MemoryRouter initialEntries={[entry]}><Showcase /><HistoryControls /></MemoryRouter>);
beforeEach(() => {
  settings.values = [];
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('A showcase must not generate concepts or submit an inquiry')));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Showcase concept previews', () => {
  it('uses concise concept language and a preview-first journey without inventing a submission', async () => {
    renderShowcase();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Brand stories.Made collectible.');
    expect(screen.getByRole('link', { name: /See my concept/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: 'What could yours become?' })).toBeInTheDocument();
    for (const name of ['Preview', 'Proposal', 'Prototype']) expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(screen.queryByText(/From IP to|Make It LIVE|Give People Something/)).not.toBeInTheDocument();
    expect(screen.getAllByText(SHOWCASE_PREVIEW_NOTE)).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Plan my project' })).toBeEnabled();
    expect(screen.queryByText(/inquiry sent|request submitted|production.ready/i)).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Example worlds · OFFKIN'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['airbnb', 'a24', 'tesla'])('opens a validated %s inspiration deep link', id => {
    renderShowcase(`/showcase?brand=${id}`);
    const world = showcaseWorlds.find(item => item.id === id)!;
    expect(screen.getByRole('tab', { name: new RegExp(`^${world.brand}`) })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', `sc-${id}`);
    expect(screen.getByRole('img', { name: world.boardAlt })).toHaveAttribute('src', world.board);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['/showcase', '/showcase?brand=unknown', '/showcase?brand=%3Cscript%3E', '/showcase?brand=TESLA'])('falls back safely for %s', entry => {
    renderShowcase(entry);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'sc-airbnb');
    expect(screen.getByRole('tab', { name: /^Airbnb/ })).toHaveAttribute('tabindex', '0');
  });

  it('restores selected studies on Back and Forward without duplicate history for repeated clicks', () => {
    renderShowcase('/showcase?brand=airbnb');
    fireEvent.click(screen.getByRole('tab', { name: /^A24/ }));
    fireEvent.click(screen.getByRole('tab', { name: /^Tesla/ }));
    fireEvent.click(screen.getByRole('tab', { name: /^Tesla/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'sc-a24');
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'sc-airbnb');
    fireEvent.click(screen.getByRole('button', { name: 'Go forward' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'sc-a24');
    expect(screen.getAllByRole('tab').filter(tab => tab.tabIndex === 0)).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows one actual uncropped concept board per brand, with explicit visual-study caveats', () => {
    renderShowcase();
    const tabs = screen.getByRole('tablist', { name: 'Choose an example world' });
    for (const world of showcaseWorlds) {
      const tab = within(tabs).getByRole('tab', { name: new RegExp(`^${world.brand}`) });
      fireEvent.click(tab);
      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab.id);
      expect(screen.getAllByRole('img')).toHaveLength(world.illustration ? 2 : 1);
      expect(screen.getByRole('img', { name: world.boardAlt })).toHaveAttribute('src', world.board);
      expect(screen.getByRole('img', { name: world.boardAlt })).toHaveAttribute('loading', 'lazy');
      expect(screen.getByRole('img', { name: world.boardAlt })).toHaveAttribute('width', '1536');
      expect(screen.getByRole('img', { name: world.boardAlt })).toHaveAttribute('height', '1024');
      if (world.illustration) expect(screen.getByRole('img', { name: world.illustrationAlt })).toHaveAttribute('src', world.illustration);
      expect(screen.getByText(SHOWCASE_IMAGE_NOTE)).toBeInTheDocument();
      expect(screen.getByText('One small interaction to explore in the build proposal.')).toBeInTheDocument();
      expect(screen.getByText(/No affiliation, commission or endorsement/)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Mars|Beyond Earth|SpaceX|rocket/i)).not.toBeInTheDocument();
    expect(screen.getByText('Home storage')).toBeInTheDocument();
    expect(screen.getByText('A place to charge')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supports keyboard tab selection, wraparound and repeated choices', () => {
    renderShowcase();
    const airbnb = screen.getByRole('tab', { name: /^Airbnb/ });
    fireEvent.keyDown(airbnb, { key: 'ArrowRight' });
    const a24 = screen.getByRole('tab', { name: /^A24/ });
    expect(a24).toHaveFocus();
    expect(a24).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(a24, { key: 'End' });
    const tesla = screen.getByRole('tab', { name: /^Tesla/ });
    expect(tesla).toHaveFocus();
    fireEvent.keyDown(tesla, { key: 'ArrowRight' });
    expect(airbnb).toHaveFocus();
    fireEvent.keyDown(airbnb, { key: 'ArrowLeft' });
    expect(tesla).toHaveFocus();
    fireEvent.keyDown(tesla, { key: 'Home' });
    expect(airbnb).toHaveFocus();
    fireEvent.click(airbnb); fireEvent.click(airbnb);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'sc-airbnb');
    expect(screen.getAllByRole('tab').filter(tab => tab.tabIndex === 0)).toHaveLength(1);
  });

  it('opens the same whole board, zooms, closes by Escape and resets zoom when reopened', async () => {
    renderShowcase();
    const open = screen.getByRole('button', { name: 'Explore the details' });
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Airbnb · unofficial concept study' });
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', showcaseWorlds[0].board);
    const zoom = within(dialog).getByRole('button', { name: 'See finer details' });
    fireEvent.click(zoom);
    expect(zoom).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).getByRole('region')).toHaveClass('is-zoomed');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(open).toHaveFocus();
    fireEvent.click(open);
    expect(screen.getByRole('button', { name: 'See finer details' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps story details after an image error and resets when choosing a new study', () => {
    renderShowcase();
    fireEvent.error(screen.getByRole('img', { name: showcaseWorlds[0].boardAlt }));
    expect(screen.getByRole('status')).toHaveTextContent('This concept image couldn’t load.');
    expect(screen.getByText('A world of stays')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Explore the details' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^A24/ }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: showcaseWorlds[1].boardAlt })).toHaveAttribute('src', showcaseWorlds[1].board);
    fireEvent.click(screen.getByRole('tab', { name: /^Airbnb/ }));
    expect(screen.getByRole('img', { name: showcaseWorlds[0].boardAlt })).toHaveAttribute('src', showcaseWorlds[0].board);
  });

  it('keeps the full concept board in a keyboard-scrollable region with an explore hint', () => {
    renderShowcase();
    const viewport = screen.getByRole('region', { name: 'Airbnb concept board; scroll horizontally to explore' });
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(within(viewport).getByRole('img')).toHaveAttribute('src', showcaseWorlds[0].board);
    expect(screen.getByText('Scroll across to explore the full concept board ↔')).toBeInTheDocument();
  });

  it('keeps the collectible accessible if the separate world illustration cannot load', () => {
    renderShowcase();
    fireEvent.error(screen.getByRole('img', { name: showcaseWorlds[0].illustrationAlt }));
    expect(screen.getByRole('status')).toHaveTextContent('This world illustration couldn’t load.');
    expect(screen.getByRole('img', { name: showcaseWorlds[0].boardAlt })).toHaveAttribute('src', showcaseWorlds[0].board);
    expect(screen.getByRole('button', { name: 'Explore the details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^A24/ }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('continues to respect admin-managed site identity and rejects an unsafe logo link', async () => {
    settings.values = [{ key: 'site_title', value: 'Custom Studio' }, { key: 'logo_url', value: 'https://images.example/studio.png' }, { key: 'logo_link', value: 'javascript:alert(1)' }];
    renderShowcase();
    const home = await screen.findByRole('link', { name: 'Custom Studio home' });
    expect(home).toHaveAttribute('href', '/');
    expect(within(home).getByAltText('')).toHaveAttribute('src', 'https://images.example/studio.png');
    expect(document.title).toBe('Example worlds · Custom Studio');
  });
});
