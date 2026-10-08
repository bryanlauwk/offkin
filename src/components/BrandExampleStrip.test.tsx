import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import BrandExampleStrip from './BrandExampleStrip';
import ProposalJourney from './ProposalJourney';
import { showcaseWorlds } from '@/lib/showcase-worlds';

afterEach(cleanup);

describe('Near-input brand inspiration', () => {
  it('links each example to its selected study using only approved board artwork', () => {
    render(<MemoryRouter><BrandExampleStrip /></MemoryRouter>);
    const region = screen.getByRole('region', { name: 'A little inspiration.' });
    expect(region).toHaveAttribute('id', 'proposal-worlds');
    expect(within(region).getAllByRole('img')).toHaveLength(3);
    for (const world of showcaseWorlds) {
      const card = within(region).getByRole('link', { name: `Explore the ${world.brand}-inspired concept study` });
      expect(card).toHaveAttribute('href', `/showcase?brand=${world.id}`);
      const image = within(card).getByRole('img', { name: `${world.brand}-inspired AI collectible concept` });
      expect(image.querySelector('image')).toHaveAttribute('href', world.board);
      expect(image).toHaveAttribute('viewBox', '0 0 980 680');
      expect(image).toHaveAttribute('focusable', 'false');
    }
    expect(within(region).getByRole('link', { name: /Explore the studies/ })).toHaveAttribute('href', '/showcase');
  });

  it('states the shared unofficial status once without suggesting products or client proof', () => {
    render(<MemoryRouter><BrandExampleStrip /></MemoryRouter>);
    expect(screen.getAllByText(/Unofficial AI studies/)).toHaveLength(1);
    expect(screen.getByText(/not client work or real products/)).toHaveTextContent('No affiliation or endorsement.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/Use this example|Buy now|Trusted by/)).not.toBeInTheDocument();
  });
});

describe('Concept preview contents', () => {
  it('describes deliverables rather than repeating buying steps or fabricated views', () => {
    const { rerender } = render(<ProposalJourney />);
    expect(screen.getByRole('region', { name: 'Inside your concept preview' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByText(/Prototype|Production|Step 1/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    rerender(<ProposalJourney compact />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByText('The story, characters and visual language.')).not.toBeInTheDocument();
  });
});
