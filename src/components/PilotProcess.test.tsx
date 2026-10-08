import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PilotProcess from './PilotProcess';
import { SHOWCASE_PREVIEW_NOTE } from '@/lib/showcase-worlds';

afterEach(cleanup);

describe('Buyer-facing commercial process', () => {
  it('explains the three conditional steps with scope, real sample approval and separate costs', () => {
    render(<PilotProcess />);
    const process = screen.getByRole('region', { name: 'From concept to something real.' });
    expect(within(process).getAllByRole('listitem')).toHaveLength(3);
    for (const name of ['Preview', 'Proposal', 'Prototype']) expect(within(process).getByRole('heading', { name })).toBeInTheDocument();
    expect(screen.getByText(/Design and prototype costs are separate from production/)).toBeInTheDocument();
    expect(screen.getByText(/Approve its finish and functionality before agreeing production/)).toBeInTheDocument();
    expect(screen.getByText(SHOWCASE_PREVIEW_NOTE)).toBeInTheDocument();
    fireEvent.click(screen.getByText('What about price, quantity and timing?'));
    expect(screen.getByText(/A preview or enquiry does not place an order/)).toBeInTheDocument();
    expect(screen.queryByText(/\$|RM\s*\d|minimum order of|ships in|guaranteed/i)).not.toBeInTheDocument();
  });
});
