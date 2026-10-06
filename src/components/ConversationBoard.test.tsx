import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CanvasConcept } from '@/lib/canvas-api';
import { CANVAS_CONTRACT_VERSION } from '@/lib/canvas-api';
import { canvasContext, emptyCanvasSession } from '@/lib/canvas-session';
import { worldReferences } from '@/lib/world-references';
import ConversationBoard, { type ConversationBoardProps } from './ConversationBoard';

const worldId = '00000000-0000-4000-8000-000000000001';
const world: CanvasConcept = {
  contractVersion: CANVAS_CONTRACT_VERSION, stage: 'world', id: worldId,
  brand: 'Paper Studio', title: 'A town made of paper',
  story: 'Paper gifts connect a neighbourhood.', design: 'Folded roofs and ribbon lanes form a connected illustrated town.',
  image: 'https://images.example/generated-world.png', interaction: 'An early world-stage interaction idea.',
  sourceUrl: '', sourceTitle: '', context: { ...canvasContext(emptyCanvasSession().brief), exactWording: '  Fold a little joy.\n异趣伙伴  ' },
  worldElements: [
    { id: 'fold', label: 'Paper fold', description: 'A signature folding ritual.', kind: 'fact' },
    { id: 'ribbon', label: 'Ribbon loop', description: 'A looping path connects the town.', kind: 'proposal' },
    { id: 'bird', label: 'Paper bird', description: 'A bird above the neighbourhood.', kind: 'proposal' },
  ],
};
const physical: CanvasConcept = {
  ...world, id: '00000000-0000-4000-8000-000000000002', stage: 'physical', sourceWorldId: worldId,
  title: 'Paper town, made tangible', story: 'The folded landmark anchors a miniature paper town.',
  image: 'https://images.example/generated-physical.png', interaction: 'Turn the ribbon wheel to reveal a paper garden.',
  design: 'The landmark sits above a proposed turning garden.', selectedElementIds: ['fold', 'ribbon'], heroElementId: 'fold',
};

function props(overrides: Partial<ConversationBoardProps> = {}): ConversationBoardProps {
  return {
    world, physical: null, hasOwnWorld: true,
    session: { ...emptyCanvasSession(), worldId, selected: ['fold', 'ribbon'], hero: 'fold' },
    reference: worldReferences[0], imageErrors: {}, onImageError: vi.fn(), onEnlarge: vi.fn(), onEditElements: vi.fn(),
    ...overrides,
  };
}

afterEach(cleanup);

describe('ConversationBoard', () => {
  it.each(worldReferences)('shows only the complete $name original board in the reference state', reference => {
    const input = props({ world: null, hasOwnWorld: false, reference, session: emptyCanvasSession() });
    render(<ConversationBoard {...input} />);
    expect(screen.getByText('Unofficial visual study')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAttribute('src', reference.boardImage);
    expect(screen.getByText(reference.disclosure)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `Enlarge the complete ${reference.name} example board` }));
    expect(input.onEnlarge).toHaveBeenCalledOnce();
  });

  it('builds a generated editorial board from story, complete world image and selected elements', () => {
    const input = props();
    render(<ConversationBoard {...input} />);
    expect(screen.getByRole('heading', { name: world.title })).toBeInTheDocument();
    expect(screen.getByText(world.brand)).toBeInTheDocument();
    expect(screen.getByText(world.story)).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAttribute('src', world.image);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Paper bird')).not.toBeInTheDocument();
    expect(screen.getByText('Main character')).toBeInTheDocument();
    expect(screen.getByText('Creative interpretation')).toBeInTheDocument();
    expect(screen.queryByText(world.interaction)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Proposed interaction' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: physical.title })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge your illustrated world' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refine elements' }));
    expect(input.onEnlarge).toHaveBeenCalledOnce();
    expect(input.onEditElements).toHaveBeenCalledOnce();
  });

  it('preserves exact wording and uses typographic replacement cards without invented image crops', () => {
    const input = props();
    input.session.replacements = [{ id: 'fold', label: 'Paper garden', description: 'Folded flowers arranged around a central path.' }];
    const { container } = render(<ConversationBoard {...input} />);
    expect(container.querySelector('.cb-brand-wording')?.textContent).toBe(world.context.exactWording);
    const card = screen.getByRole('heading', { name: 'Paper garden' }).closest('li')!;
    expect(within(card).getByText('Folded flowers arranged around a central path.')).toBeInTheDocument();
    expect(within(card).getByText('Proposed replacement for Paper fold')).toBeInTheDocument();
    expect(within(card).getByText('Main character')).toBeInTheDocument();
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[style*="background-image"]')).toHaveLength(0);
  });

  it('adds the real physical image and actual generated interaction while keeping design prose collapsed', () => {
    const input = props({ physical });
    input.session.brief.interaction = 'A different preference, not the generated proposal';
    const { container } = render(<ConversationBoard {...input} />);
    expect(screen.getAllByRole('img').map(image => image.getAttribute('src'))).toEqual([world.image, physical.image]);
    expect(screen.getByRole('heading', { name: physical.title })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Proposed interaction' })).getByText(physical.interaction)).toBeInTheDocument();
    expect(screen.queryByText(world.interaction)).not.toBeInTheDocument();
    expect(screen.queryByText(input.session.brief.interaction)).not.toBeInTheDocument();
    const details = container.querySelector('details')!;
    expect(details).not.toHaveAttribute('open');
    expect(within(details).getByText(world.design)).toBeInTheDocument();
    expect(within(details).getByText(physical.design)).toBeInTheDocument();
    for (const reference of worldReferences) {
      expect(container.querySelector(`img[src="${reference.physicalImage}"]`)).toBeNull();
      expect(container.querySelector(`img[src="${reference.boardImage}"]`)).toBeNull();
    }
    expect(screen.queryByRole('heading', { name: /product views|exploded view|packaging concept|collect the series/i })).not.toBeInTheDocument();
  });

  it('clearly distinguishes previous images and interactions from the next element choices', () => {
    render(<ConversationBoard {...props({ physical, worldIsCurrent: false, physicalIsCurrent: false })} />);
    expect(screen.getByText('Previous direction')).toBeInTheDocument();
    expect(screen.getByText('Previous concept')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elements for your next concept' })).toBeInTheDocument();
    expect(screen.getByText(/These choices haven’t been applied to the image above yet/)).toBeInTheDocument();
    expect(screen.getByText(/Proposed interaction from the previous version/)).toBeInTheDocument();
  });

  it('never substitutes a reference for an unavailable saved world or shared text-only story', () => {
    const input = props({ world: null, hasOwnWorld: false });
    const { rerender } = render(<ConversationBoard {...input} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your saved brand world' })).toBeInTheDocument();
    input.session = { ...input.session, worldId: '', sharedWorld: { title: world.title, story: world.story, worldElements: world.worldElements } };
    rerender(<ConversationBoard {...input} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: world.title })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('does not show a physical image belonging to a different source world', () => {
    render(<ConversationBoard {...props({ physical: { ...physical, sourceWorldId: '00000000-0000-4000-8000-000000000099' } })} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: physical.title })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Proposed interaction' })).not.toBeInTheDocument();
  });

  it('reports image failures and keeps the source story and interaction available', () => {
    const input = props({ physical, onRetryImage: vi.fn() });
    const { rerender } = render(<ConversationBoard {...input} />);
    for (const image of screen.getAllByRole('img')) fireEvent.error(image);
    expect(input.onImageError).toHaveBeenCalledWith(world.image);
    expect(input.onImageError).toHaveBeenCalledWith(physical.image);
    rerender(<ConversationBoard {...input} imageErrors={{ [world.image]: true, [physical.image]: true }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('The illustration couldn’t load')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try image again' }));
    expect(input.onRetryImage).toHaveBeenCalledWith(world.image);
    expect(screen.getByText(world.story)).toBeInTheDocument();
    expect(screen.getByText(physical.interaction)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enlarge your illustrated world' })).not.toBeInTheDocument();
  });

  it('handles an unavailable original board without substituting a different image', () => {
    const reference = worldReferences[0];
    const input = props({ world: null, hasOwnWorld: false, session: emptyCanvasSession() });
    const { rerender } = render(<ConversationBoard {...input} />);
    fireEvent.error(screen.getByRole('img'));
    expect(input.onImageError).toHaveBeenCalledWith(reference.boardImage);
    rerender(<ConversationBoard {...input} imageErrors={{ [reference.boardImage]: true }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(reference.story)).toBeInTheDocument();
  });
});
