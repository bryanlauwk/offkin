import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandWorldShowcase } from './BrandWorldShowcase';

beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No provider calls are allowed for a static board'))); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const boards = [
  { brand: 'Airbnb', path: '/concept-worlds/airbnb-world.webp', title: 'A little world. A bigger welcome.' },
  { brand: 'A24', path: '/concept-worlds/a24-world.webp', title: 'One click. Another world.' },
  { brand: 'Tesla', path: '/concept-worlds/tesla-world.webp', title: 'Make the invisible feel tangible.' },
];

describe('BrandWorldShowcase', () => {
  it('uses the three selected art assets and exposes an accessible manual selector', () => {
    render(<BrandWorldShowcase />);
    const group = screen.getByRole('group', { name: 'Explore observation studies' });
    expect(within(group).getAllByRole('button')).toHaveLength(3);
    for (const [index, board] of boards.entries()) {
      const choice = within(group).getByRole('button', { name: new RegExp(board.brand) });
      fireEvent.click(choice);
      expect(choice).toHaveAttribute('aria-pressed', 'true');
      expect(within(group).getAllByRole('button').filter(button => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
      expect(screen.getByRole('img', { name: new RegExp(`${board.brand}-inspired`) })).toHaveAttribute('src', board.path);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(board.title);
      expect(screen.getByText(`0${index + 1} / 03`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByText(/No affiliation, commission or endorsement/)).toBeInTheDocument();
    expect(screen.getByText(/Visual concepts, not available products/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('cycles the next control repeatedly and resets expanded details when the world changes', () => {
    render(<BrandWorldShowcase />);
    const next = screen.getByRole('button', { name: 'Explore the next concept world' });
    const detail = screen.getByRole('button', { name: /What makes this a brand world/ });
    fireEvent.click(detail);
    expect(detail).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/interaction proposal, not a working prototype/)).toBeInTheDocument();
    fireEvent.click(next);
    expect(detail).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/interaction proposal, not a working prototype/)).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[1].path);
    fireEvent.click(next); fireEvent.click(next);
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[0].path);
    fireEvent.click(next); fireEvent.click(next); fireEvent.click(next);
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[0].path);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([false, true])('does not auto-rotate or animate the board when reduced motion is %s', reducedMotion => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: reducedMotion && query.includes('prefers-reduced-motion'), media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    const { container } = render(<BrandWorldShowcase />);
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[0].path);
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[0].path);
    expect(vi.getTimerCount()).toBe(0);
    expect(container.querySelector('video, canvas, animate, animateTransform, .concept-study__moving')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Tesla/ }));
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[2].path);
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[2].path);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the story available after an image error and permits choosing another board', () => {
    render(<BrandWorldShowcase />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('This concept image couldn’t load.')).toBeInTheDocument();
    expect(screen.getByText(/A winding yellow path/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /A24/ }));
    expect(screen.queryByText('This concept image couldn’t load.')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', boards[1].path);
    expect(fetch).not.toHaveBeenCalled();
  });
});
