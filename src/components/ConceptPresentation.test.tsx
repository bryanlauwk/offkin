import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConceptPresentation } from './ConceptPresentation';
import { homepageStudies } from '@/lib/homepage-studies';

afterEach(cleanup);
describe('homepage concept visuals', () => {
  it.each(homepageStudies)('uses the durable $brand image with an explicit visual-proposal label', study => {
    render(<ConceptPresentation study={study} />);
    expect(screen.getByRole('img', { name: study.imageAlt })).toHaveAttribute('src', study.image);
    expect(study.image).toMatch(/^\/concept-studies\/.*\.webp$/);
    expect(screen.getByText('Visual proposal · not production CAD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visual concept' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('keeps the mechanical illustration separate from the generated image', () => {
    render(<ConceptPresentation study={homepageStudies[0]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Interaction sketch' }));
    expect(screen.getByRole('img', { name: 'Off-screen: interactive concept study' })).toBeInTheDocument();
    expect(screen.getByText(/mechanism and construction may differ/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hold to reveal/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Visual concept' }));
    expect(screen.getByRole('img', { name: homepageStudies[0].imageAlt })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Interaction sketch' }));
    expect(screen.getByRole('button', { name: /Hold to reveal/ })).toHaveAttribute('aria-pressed', 'false');
  });
  it('clearly identifies Tesla as an electronic proposal with a simulated response', () => {
    render(<ConceptPresentation study={homepageStudies[2]} />);
    expect(screen.getByText('AI VISUAL / ELECTRONIC STUDY')).toBeInTheDocument();
    expect(screen.getByText(/circuitry, firmware and any AI response need validation/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Response sketch' }));
    expect(screen.getByText('A simulated display-and-light response. No live hardware or AI is connected.')).toBeInTheDocument();
  });
  it('offers the interactive illustration if an image fails without retrying generation', () => {
    render(<ConceptPresentation study={homepageStudies[1]} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('The visual couldn’t load.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Explore the illustration/ }));
    expect(screen.getByRole('img', { name: 'A place is made: interactive concept study' })).toBeInTheDocument();
  });
});
