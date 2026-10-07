import type { ProposalRequest } from '../../supabase/functions/generate-concept/proposal';

/** Synthetic unsupported-action regression only; contains no customer or reference narrative. */
export const legacyRockerRequest = {
  contractVersion: 'offkin-proposal-v10',
  stage: 'world',
  brand: 'no-website',
  context: {
    business: 'A fictional stationery studio wants a sculptural paper moth and archive ribbon.',
    interaction: 'Press the moth to drive a rocker lever that raises an archive marker. Release for a proposed gravity reset.',
    mode: 'mechanical',
  },
} satisfies ProposalRequest;
