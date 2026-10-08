import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PilotProcess from './PilotProcess';
afterEach(cleanup);
describe('Buyer-facing commercial process', () => {
  it('explains the four conditional buying steps with scope, prototype approval and separate costs', () => {
    render(<PilotProcess />);
    for (const name of ['Explore your concept', 'Agree a build proposal', 'Review a real prototype', 'Plan production together']) expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(screen.getByText(/Design and prototype fees are separate/)).toBeInTheDocument();
    expect(screen.getByText(/Approve the prototype and any changes before production/)).toBeInTheDocument();
    expect(screen.getByText(/An enquiry or preview does not place an order/)).toBeInTheDocument();
    for (const summary of screen.getAllByText(/\?$/)) if (summary.tagName === 'SUMMARY') fireEvent.click(summary);
    expect(screen.getByText(/Pricing and minimum quantities are not fixed yet/)).toBeInTheDocument();
    expect(screen.getByText(/No physical prototypes are shown/)).toBeInTheDocument();
    expect(screen.getByText(/one-off feasibility and availability need to be confirmed/)).toBeInTheDocument();
  });
});
